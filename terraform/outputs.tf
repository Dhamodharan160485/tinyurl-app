# =====================================================
# FILE: terraform/outputs.tf
# PURPOSE: Defines output values shown after apply
#
# Outputs are like return values of Terraform.
# After running terraform apply, these values
# are displayed so you know your resource URLs.
# =====================================================

# Backend API URL
output "api_url" {
  description = "URL of the backend API"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

# Frontend URL
output "frontend_url" {
  description = "URL of the frontend app"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

# Function App URL
output "function_url" {
  description = "URL of the Azure Function App"
  value       = "https://${azurerm_windows_function_app.func.default_hostname}"
}

# Storage Account Name
output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.storage.name
}

# Resource Group Name
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.rg.name
}