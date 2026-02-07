#!/bin/bash
set -o pipefail

echo "Starting Civicverse development environment..."
echo "Building and starting containers..."

docker-compose up --build
