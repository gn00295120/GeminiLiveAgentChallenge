#!/bin/bash
set -euo pipefail

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project)}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="vision-tutor"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# API key is optional — users provide their own via the browser UI
if [[ -n "${GOOGLE_API_KEY:-}" ]]; then
  echo "Note: GOOGLE_API_KEY set — will be used as fallback for users who don't provide their own."
  ENV_VARS="--set-env-vars GOOGLE_API_KEY=${GOOGLE_API_KEY}"
else
  echo "Note: No GOOGLE_API_KEY set — users must provide their own key in the browser."
  ENV_VARS=""
fi

echo "=== Deploying Vision Tutor to Cloud Run ==="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Image: ${IMAGE}"

# Build and push container
echo ""
echo ">>> Building container image..."
gcloud builds submit --tag "${IMAGE}" .

# Deploy to Cloud Run
echo ""
echo ">>> Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --timeout 3600 \
  --min-instances 1 \
  --max-instances 5 \
  --cpu 2 \
  --memory 1Gi \
  --cpu-boost \
  --session-affinity \
  ${ENV_VARS} \
  --port 8000

# Get the service URL
echo ""
echo ">>> Deployment complete!"
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format 'value(status.url)')
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "Visit ${SERVICE_URL} to start tutoring!"
