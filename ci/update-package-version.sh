#!/usr/bin/env bash
# Script to update the version in package.json
# To be run after set-version.sh has set the SPEECHSDK_SEMVER2NOMETA variable

# Fail on errors
set -e

# Check for SPEECHSDK_SEMVER2NOMETA variable
if [ -z "$SPEECHSDK_SEMVER2NOMETA" ]; then
  echo "Error: SPEECHSDK_SEMVER2NOMETA is not set. Run set-version.sh first."
  exit 1
fi

echo "Updating package.json version to $SPEECHSDK_SEMVER2NOMETA"

# Use npm to update the version in package.json
npm version "$SPEECHSDK_SEMVER2NOMETA" --no-git-tag-version --allow-same-version

echo "Successfully updated package.json version to $SPEECHSDK_SEMVER2NOMETA"