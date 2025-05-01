#!/bin/bash
# Script to run all tests except the connection type tests

# Ensure the environment variable is not set to enable connection type tests
export RUN_CONNECTION_TYPE_TESTS=false

# Run Jest with a test name pattern that excludes "Connection Tests"
echo "Running all non-connection type tests..."
npx jest --testNamePattern="^(?!.*Connection Tests).*$"