# =====================================================
# FILE: terraform/variables.tf
# PURPOSE: Defines all variables used in main.tf
#
# Why separate variables file?
# → Keeps main.tf clean
# → Easy to see all configurable values
# → SOLID: Single Responsibility Principle
#   variables.tf only defines variables
# =====================================================

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
  default     = "westeurope"
}

variable "prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "tinyurl"
}

variable "suffix" {
  description = "Unique suffix to avoid name conflicts"
  type        = string
  default     = "dhamo"
}
