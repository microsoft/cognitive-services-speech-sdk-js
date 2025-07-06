#!/usr/bin/env bash
# Script to update the version in the source code file
# To replace the npm run civersion command

# Fail on errors
set -e

# Check for SPEECHSDK_SEMVER2NOMETA variable
if [ -z "$SPEECHSDK_SEMVER2NOMETA" ]; then
  echo "Error: SPEECHSDK_SEMVER2NOMETA is not set. Run set-version.sh first."
  exit 1
fi

# Update version in SpeechServiceConfig.ts
F=src/common.speech/SpeechServiceConfig.ts

if [ ! -f "$F" ]; then
  echo "Error: File $F not found."
  exit 1
fi

# Use perl to update the version in the file
perl -i.bak -p -e 'BEGIN { $c = 0 } 
  $c += s/(?<=const SPEECHSDK_CLIENTSDK_VERSION = ")[^"]*/'$SPEECHSDK_SEMVER2NOMETA'/g; 
  END { 
    if ($c != 1) { 
      print STDERR "Patched SPEECHSDK_CLIENTSDK_VERSION $c time(s), expected 1.\n";
      exit 1; 
    } 
  }' "$F"

E=$?
rm -f "$F.bak"

# Only try to use git diff if we're in a git repository
if git rev-parse --is-inside-work-tree 2>/dev/null; then
  git diff
fi

echo "Successfully updated version in $F to $SPEECHSDK_SEMVER2NOMETA"
exit $E