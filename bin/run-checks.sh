#!/bin/bash

# EchoDash - Local development check runner
# Run this script to perform the same checks that run in CI

set -e

echo "🚀 Running EchoDash quality checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "${YELLOW}ℹ️  $message${NC}"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "echodash.php" ]; then
    print_status "error" "Please run this script from the EchoDash plugin root directory"
    exit 1
fi

# Install dependencies if needed
print_status "info" "Checking dependencies..."

if [ ! -d "vendor" ]; then
    print_status "info" "Installing Composer dependencies..."
    composer install
fi

if [ ! -d "node_modules" ]; then
    print_status "info" "Installing npm dependencies..."
    npm install
fi

# PHP Checks
print_status "info" "Running PHP CodeSniffer..."
if composer run-script phpcs; then
    print_status "success" "PHP CodeSniffer passed"
else
    print_status "error" "PHP CodeSniffer failed"
    echo "💡 Run 'composer run-script phpcbf' to auto-fix some issues"
    exit 1
fi

print_status "info" "Running PHPStan..."
if composer run-script phpstan; then
    print_status "success" "PHPStan passed"
else
    print_status "error" "PHPStan failed"
    exit 1
fi

# JavaScript/CSS Checks
print_status "info" "Running ESLint..."
if npm run lint:js; then
    print_status "success" "ESLint passed"
else
    print_status "error" "ESLint failed"
    echo "💡 Run 'npm run lint:js -- --fix' to auto-fix some issues"
    exit 1
fi

print_status "info" "Running Stylelint..."
if npm run lint:css; then
    print_status "success" "Stylelint passed"
else
    print_status "error" "Stylelint failed"
    echo "💡 Run 'npm run lint:css -- --fix' to auto-fix some issues"
    exit 1
fi

print_status "info" "Checking code formatting..."
if npm run format -- --check; then
    print_status "success" "Code formatting is correct"
else
    print_status "error" "Code formatting issues found"
    echo "💡 Run 'npm run format' to auto-fix formatting"
    exit 1
fi

# Build check
print_status "info" "Testing build process..."
if npm run build; then
    print_status "success" "Build completed successfully"
else
    print_status "error" "Build failed"
    exit 1
fi

# Check for uncommitted build changes
if [ -n "$(git status --porcelain assets/dist/)" ]; then
    print_status "warning" "Build created uncommitted changes in assets/dist/"
    echo "Please commit the built assets or add them to .gitignore"
fi

# Tests
print_status "info" "Running JavaScript tests..."
if npm run test:ci; then
    print_status "success" "JavaScript tests passed"
else
    print_status "error" "JavaScript tests failed"
    exit 1
fi

# Check if PHP tests exist and run them
if grep -q '"test"' composer.json; then
    print_status "info" "Running PHP tests..."
    if composer run-script test; then
        print_status "success" "PHP tests passed"
    else
        print_status "error" "PHP tests failed"
        exit 1
    fi
else
    print_status "warning" "No PHP tests configured"
fi

# Security checks
print_status "info" "Running security audits..."
if composer audit --format=plain; then
    print_status "success" "Composer security audit passed"
else
    print_status "warning" "Composer security audit found issues"
fi

if npm audit --audit-level=moderate; then
    print_status "success" "npm security audit passed"
else
    print_status "warning" "npm security audit found issues"
fi

print_status "success" "All checks completed successfully! 🎉"
print_status "info" "Your code is ready for pull request submission."
