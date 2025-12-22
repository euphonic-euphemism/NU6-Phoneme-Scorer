#!/bin/bash

# 1. Install dependencies (Electron and Builder)
echo "Installing dependencies..."
npm install

# 2. Run the distribution build
# This uses the 'dist' script defined in package.json to generate the .deb
echo "Building .deb package..."
npm run dist

echo "Build complete! Check the 'dist' folder for your .deb file."
