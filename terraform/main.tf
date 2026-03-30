terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "current" {
  project_id = var.project_id
}

locals {
  cloudbuild_service_account = "${data.google_project.current.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com"
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_service_account" "runtime" {
  account_id   = var.runtime_service_account_id
  display_name = "Foody LLM Cloud Run runtime"
  project      = var.project_id
}

resource "google_project_iam_member" "cloudbuild_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${local.cloudbuild_service_account}"
}

resource "google_service_account_iam_member" "cloudbuild_act_as_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.cloudbuild_service_account}"
}

resource "google_project_iam_member" "runtime_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_cloudbuild_trigger" "deploy_on_push" {
  name        = var.trigger_name
  description = "Build and deploy foody-llm-service on branch push"
  project     = var.project_id

  github {
    owner = var.repository_owner
    name  = var.repository_name

    push {
      branch = var.branch_regex
    }
  }

  filename = "cloudbuild.yaml"

  substitutions = {
    _DEPLOY_REGION           = var.region
    _SERVICE_NAME            = var.service_name
    _SECRET_NAME             = var.secret_name
    _RUNTIME_SERVICE_ACCOUNT = google_service_account.runtime.email
  }

  depends_on = [
    google_project_service.required_apis
  ]
}
