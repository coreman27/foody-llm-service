variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Cloud Run deployment region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "foody-llm-service"
}

variable "secret_name" {
  description = "Secret Manager secret name containing ANTHROPIC_API_KEY"
  type        = string
  default     = "anthropic-api-key"
}

variable "repository_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "repository_name" {
  description = "GitHub repository name"
  type        = string
}

variable "branch_regex" {
  description = "Branch regex for Cloud Build trigger"
  type        = string
  default     = "^dev$"
}

variable "runtime_service_account_id" {
  description = "Cloud Run runtime service account ID"
  type        = string
  default     = "foody-llm-runtime"
}

variable "trigger_name" {
  description = "Cloud Build trigger name"
  type        = string
  default     = "foody-llm-deploy-on-push"
}
