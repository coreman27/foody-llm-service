output "cloudbuild_trigger_id" {
  description = "Cloud Build trigger ID"
  value       = google_cloudbuild_trigger.deploy_on_push.trigger_id
}

output "runtime_service_account_email" {
  description = "Cloud Run runtime service account email"
  value       = google_service_account.runtime.email
}
