#!/bin/bash

# scripts/diagnose-build.sh
# Diagnostic script to clean environment, reinstall dependencies, and build the project.
# Usage: ./scripts/diagnose-build.sh

set -e

echo "🔍 Diagnosing build error..."
echo ""

# Step 1: Clear all caches
echo "Step 1: Clearing caches..."
# Remove common cache and dependency directories
rm -rf node_modules
rm -rf .next
rm -rf dist
rm -rf build
rm -rf .vite
# Remove lock files to ensure fresh install
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml
rm -f bun.lockb
echo "✅ Caches cleared"
echo ""

# Step 2: Reinstall dependencies
echo "Step 2: Reinstalling dependencies..."
if command -v bun &> /dev/null; then
    echo "Using bun..."
    bun install
elif command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
elif command -v yarn &> /dev/null; then
    echo "Using yarn..."
    yarn install
else
    echo "Using npm..."
    npm install
fi
echo "✅ Dependencies reinstalled"
echo ""

# Step 3: Check for circular dependencies
echo "Step 3: Checking for circular dependencies..."
if command -v npx &> /dev/null; then
    # Only run madge if we can
    echo "Running madge check..."
    # Check if src exists
    if [ -d "src" ]; then
        npx madge --circular --extensions js,jsx,ts,tsx src/ || echo "⚠️  Circular dependencies detected above (non-fatal)"
    else
        echo "⚠️  src directory not found! Cannot check for circular dependencies."
    fi
else
    echo "ℹ️  npx not available, skipping circular dependency check"
fi
echo ""

# Step 4: Rebuild
echo "Step 4: Rebuilding project..."
# Detect build script from package.json or fallback
BUILD_CMD="npm run build"

# Verify if package.json has a build script
if grep -q '"build":' package.json; then
    echo "Found build script in package.json"
else
    echo "⚠️  No 'build' script found in package.json. Defaulting to 'vite build'..."
    BUILD_CMD="npx vite build"
fi

echo "Running: $BUILD_CMD"

if $BUILD_CMD; then
    echo ""
    echo "✅ Build successful!"
    echo "Your environment is clean and the project builds correctly."
else
    echo ""
    echo "❌ Build failed."
    echo "Please check the error logs above."
    echo "Common issues:"
    echo "  • Circular imports"
    echo "  • Missing dependencies"
    echo "  • TypeScript errors"
    echo "  • Missing src/ directory"
    exit 1
fi
