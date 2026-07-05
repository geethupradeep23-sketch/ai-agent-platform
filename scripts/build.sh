#!/bin/bash

# Build and push Docker image
echo "Building Docker image..."
docker build -t secure-ai-agent:latest .

echo "Tagging image..."
docker tag secure-ai-agent:latest geethupradeep23-sketch/secure-ai-agent:latest

echo "Pushing to registry..."
docker push geethupradeep23-sketch/secure-ai-agent:latest

echo "✓ Done!"
