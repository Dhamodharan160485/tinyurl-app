# =====================================================
# FILE: terraform/main.tf
# PURPOSE: Main Terraform configuration
#          Defines all Azure resources for TinyURL app
#
# What is Terraform?
# Terraform is Infrastructure as Code (IaC) tool.
# Instead of manually creating resources in Azure Portal
# or running CLI commands, we define everything in code.
#
# Benefits:
# → Reproducible - same infrastructure every time
# → Version controlled - tracked in GitHub
# → Easy to destroy and recreate
# → Documents what infrastructure exists
#
# DESIGN PATTERN: Infrastructure as Code
# → Infrastructure is treated like application code
# → Can be reviewed, tested, and versioned
# =====================================================

# -------------------------------------------------------
# Terraform Configuration Block
# Defines which providers we need
# Provider = plugin that talks to a cloud platform
# -------------------------------------------------------
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# -------------------------------------------------------
# Azure Provider Configuration
# Tells Terraform to use Azure
# features {} is required even if empty
# -------------------------------------------------------
provider "azurerm" {
  features {}
}

# -------------------------------------------------------
# Variables
# These are like function parameters for Terraform
# Values come from terraform.tfvars file
# or passed via command line
# -------------------------------------------------------

variable "location" {
  description = "Azure region where resources will be created"
  default     = "westeurope"
}

variable "prefix" {
  description = "Prefix for all resource names"
  default     = "tinyurl"
}

variable "suffix" {
  description = "Unique suffix to avoid name conflicts"
  default     = "dhamo"
}

# -------------------------------------------------------
# Resource Group
# Container for all Azure resources
# Like a folder that holds everything together
# -------------------------------------------------------
resource "azurerm_resource_group" "rg" {
  # Name uses prefix variable: "tinyurl-rg"
  name     = "${var.prefix}-rg"
  location = var.location

  tags = {
    project     = "TinyURL"
    environment = "production"
  }
}

# -------------------------------------------------------
# Storage Account
# Used by Azure Function to store its state
# Also used for blob storage (logs)
#
# Rules for storage account name:
# → Must be 3-24 characters
# → Only lowercase letters and numbers
# → Must be globally unique
# -------------------------------------------------------
resource "azurerm_storage_account" "storage" {
  name                     = "${var.prefix}storage${var.suffix}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"  # Locally Redundant Storage

  tags = {
    project = "TinyURL"
  }
}

# -------------------------------------------------------
# Storage Container for Logs
# Blob container inside the storage account
# Used to store application logs
# -------------------------------------------------------
resource "azurerm_storage_container" "logs" {
  name                  = "logs"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"  # not publicly accessible
}

# -------------------------------------------------------
# App Service Plan
# The server that runs our web apps
# Free tier (F1) = no cost
#
# os_type = "Linux" for .NET and Node.js apps
# sku_name = "F1" = Free tier
# -------------------------------------------------------
resource "azurerm_service_plan" "plan" {
  name                = "${var.prefix}-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "F1"  # Free tier

  tags = {
    project = "TinyURL"
  }
}

# -------------------------------------------------------
# Backend Web App (.NET API)
# Runs our ASP.NET Core Minimal API
#
# application_stack defines runtime:
# dotnet_version = "8.0" means .NET 8
# -------------------------------------------------------
resource "azurerm_linux_web_app" "api" {
  name                = "${var.prefix}-api-${var.suffix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      dotnet_version = "8.0"
    }
    # Allow requests from anywhere (CORS)
    cors {
      allowed_origins = ["*"]
    }
  }

  # Environment variables / App Settings
  # These are like appsettings.json but stored in Azure
  # More secure than storing in code
  app_settings = {
    "ASPNETCORE_ENVIRONMENT" = "Production"
  }

  tags = {
    project = "TinyURL"
  }
}

# -------------------------------------------------------
# Frontend Web App (Angular)
# Runs our Angular application
#
# node_version = "20-lts" means Node.js 20
# -------------------------------------------------------
resource "azurerm_linux_web_app" "frontend" {
  name                = "${var.prefix}-frontend-${var.suffix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      node_version = "20-lts"
    }
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = "20-lts"
  }

  tags = {
    project = "TinyURL"
  }
}

# -------------------------------------------------------
# Azure Function App (Cron Job)
# Runs our DeleteAllUrls function every hour
#
# storage_account_name = links to storage account above
# functions_extension_version = "~4" means Functions v4
# -------------------------------------------------------
resource "azurerm_windows_function_app" "func" {
  name                       = "${var.prefix}-func-${var.suffix}"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = azurerm_resource_group.rg.location
  storage_account_name       = azurerm_storage_account.storage.name
  storage_account_access_key = azurerm_storage_account.storage.primary_access_key
  service_plan_id            = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      dotnet_version              = "v8.0"
      use_dotnet_isolated_runtime = true
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "dotnet-isolated"
    "ApiBaseUrl"               = "https://${var.prefix}-api-${var.suffix}.azurewebsites.net"
  }

  tags = {
    project = "TinyURL"
  }
}