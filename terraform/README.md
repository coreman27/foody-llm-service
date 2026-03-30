# Foody LLM Terraform

This Terraform module sets up:
- Required Google APIs for build and deploy
- Cloud Run runtime service account
- IAM bindings for Cloud Build deployment and secret access
- Cloud Build trigger to deploy on branch push

## Prerequisites

- Terraform 1.5+
- Google provider credentials configured (for example: `gcloud auth application-default login`)
- GitHub repository connected to Cloud Build (GitHub App integration)
- Secret already created in Secret Manager (default: `anthropic-api-key`)

## Usage

1. Create a tfvars file (example in `environments/dev.tfvars`).
2. Initialize and apply:

```bash
cd terraform
terraform init
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

## Notes

- Default trigger branch regex is `^dev$`.
- Trigger uses `cloudbuild.yaml` from repo root.
- Cloud Build passes substitutions for region, service name, secret name, and runtime service account.
