#!/bin/bash
# Скрипт для создания Jenkins job

JENKINS_URL="http://localhost:8080"
USER="admin"
PASS="admin123"
JOB_NAME="meetify"

# Получаем crumb
CRUMB=$(curl -s "${JENKINS_URL}/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)" --user "${USER}:${PASS}")

# Создаем job
curl -s -X POST "${JENKINS_URL}/createItem?name=${JOB_NAME}" \
  -H "${CRUMB}" \
  -H "Content-Type:application/xml" \
  --data-binary @/tmp/job-config.xml \
  --user "${USER}:${PASS}"

echo "Job ${JOB_NAME} created"