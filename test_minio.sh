#!/bin/bash

# Test script for MinIO connection
# This script sets the environment variables and runs the MinIO connection test

echo "🔧 Setting up MinIO environment variables..."

export MINIO_ENDPOINT="minio.jla-dev.com"
export MINIO_PORT="443"
export MINIO_ACCESS_KEY="yOV6ceBtGNt99h1yqSvW"
export MINIO_SECRET_KEY="dxn0LFYgzJaSmoEUXkCpUBc3f6FSWpzFjiQG4QG2"
export MINIO_BUCKET_NAME="cash-planner"
export MINIO_PUBLIC_URL="https://minio.jla-dev.com"

echo "📊 MinIO Configuration:"
echo "  Endpoint: $MINIO_ENDPOINT:$MINIO_PORT"
echo "  Access Key: ${MINIO_ACCESS_KEY:0:8}***"
echo "  Bucket: $MINIO_BUCKET_NAME"
echo "  Public URL: $MINIO_PUBLIC_URL"
echo ""

echo "🧪 Running MinIO connection test..."
cargo test test_minio_connection -- --ignored --nocapture

echo ""
echo "✅ Test completed!"