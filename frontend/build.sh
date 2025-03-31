#!/bin/bash
# build.sh

# Print commands for debugging
set -x

# Exit on error
set -e

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
npm install

# Create production build
npm run build

# Ensure the build directory exists
if [ ! -d "build" ]; then
  echo "Error: Build failed - build directory not created"
  exit 1
fi

echo "Build completed successfully!"
