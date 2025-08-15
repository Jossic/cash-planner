#!/bin/bash
# Test script to initialize the app and create database

echo "🚀 Testing application initialization..."

# Start the Tauri dev server in background for a few seconds
cd apps/desktop/src-tauri
echo "Starting Tauri app to initialize database..."

# Use a timeout to kill the process after a few seconds
# This should be enough to initialize the database
cargo run &
CARGO_PID=$!

echo "App PID: $CARGO_PID"
echo "Waiting 10 seconds for initialization..."
sleep 10

echo "Stopping application..."
kill $CARGO_PID 2>/dev/null || true
wait $CARGO_PID 2>/dev/null || true

echo ""
echo "🔍 Checking for database files..."
cd ../../..

if [ -f "data.sqlite" ]; then
    echo "✅ Database created at workspace root"
    sqlite3 "data.sqlite" ".tables"
else
    echo "❌ No database at workspace root"
    echo "Checking other locations:"
    find . -name "*.sqlite" -type f 2>/dev/null
fi