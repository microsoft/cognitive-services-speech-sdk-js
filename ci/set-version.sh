#!/usr/bin/env bash
# Script to read version from package.json and set the Azure DevOps build number
# Similar to how Carbon3 uses version.txt but adapted for package.json

# Fail on errors
set -e

# Get script directory
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"

# Source functions from existing functions.sh file
source "$SCRIPT_DIR/functions.sh"

# Determine if we're running in ADO
IN_ADO=$([[ -n $SYSTEM_DEFINITIONID && -n $SYSTEM_COLLECTIONID ]] && echo true || echo false)

# Determine build type (dev, int, prod) based on branch and trigger
CARBONSDK_BUILD_TYPE="dev"

if $IN_ADO; then
  # Define main build definition ID - already defined in version.cjs
  MAIN_BUILD_DEFS=",26f8e8b1-373f-4f65-96fc-d17a59b38306/198,"

  SPEECHSDK_MAIN_BUILD=$([[ $MAIN_BUILD_DEFS == *,$SYSTEM_COLLECTIONID/$SYSTEM_DEFINITIONID,* ]] && echo true || echo false)

  if $SPEECHSDK_MAIN_BUILD; then
    if [[ $BUILD_SOURCEBRANCH == refs/heads/release/* ]]; then
      CARBONSDK_BUILD_TYPE="prod"
    elif [[ $BUILD_SOURCEBRANCH == refs/heads/master && ( $BUILD_REASON == Schedule || $BUILD_REASON == Manual || $BUILD_REASON == BuildCompletion ) ]]; then
      CARBONSDK_BUILD_TYPE="int"
    fi
  fi
fi

# Extract version from package.json
VERSION=$(node -e "console.log(require(process.cwd() + '/package.json').version)")
echo "Package.json version: $VERSION"

# Parse major.minor.patch version
if [[ $VERSION =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-(alpha|beta|rc)\.([0-9]+)(\.([0-9]+))?)?$ ]]; then
  MAJOR_VERSION="${BASH_REMATCH[1]}"
  MINOR_VERSION="${BASH_REMATCH[2]}"
  PATCH_VERSION="${BASH_REMATCH[3]}"
  ORIGINAL_PRERELEASE="${BASH_REMATCH[4]}"  # e.g., "-rc.1" or "-alpha.0.1"
  
  # Base version without prerelease tags
  SPEECHSDK_MAJOR_MINOR_PATCH_VERSION="$MAJOR_VERSION.$MINOR_VERSION.$PATCH_VERSION"
else
  echo "Invalid version format in package.json: $VERSION"
  exit 1
fi

# Get build ID for tagging versions
_BUILD_ID=${BUILD_BUILDID:-$(date -u +%Y%m%d%H%M%S)}
_BUILD_COMMIT=${BUILD_SOURCEVERSION:0:8}

# Add pre-release tag and meta-data based on build type
case $CARBONSDK_BUILD_TYPE in
  dev)
    PRERELEASE_VERSION="-alpha.0.$_BUILD_ID"
    META="+$_BUILD_COMMIT"
    ;;
  int)
    PRERELEASE_VERSION="-beta.0.$_BUILD_ID"
    META="+$_BUILD_COMMIT"
    ;;
  prod)
    # For prod builds, use exactly what's in package.json (including any prerelease tag)
    PRERELEASE_VERSION="$ORIGINAL_PRERELEASE"
    META=""
    ;;
esac

# Set the version variables
SPEECHSDK_SEMVER2NOMETA="$SPEECHSDK_MAJOR_MINOR_PATCH_VERSION$PRERELEASE_VERSION"
SPEECHSDK_SEMVER2="$SPEECHSDK_SEMVER2NOMETA$META"

# Set the variables for ADO
vsts_setvar SPEECHSDK_SEMVER2NOMETA "$SPEECHSDK_SEMVER2NOMETA"
vsts_setvar SPEECHSDK_SEMVER2 "$SPEECHSDK_SEMVER2"
vsts_setvar CARBONSDK_BUILD_TYPE "$CARBONSDK_BUILD_TYPE"
vsts_setvar SPEECHSDK_MAJOR_MINOR_PATCH_VERSION "$SPEECHSDK_MAJOR_MINOR_PATCH_VERSION"

# Set output variables - add if not already in functions.sh
if ! type vsts_setoutvar > /dev/null 2>&1; then
  function vsts_setoutvar() {
    set +x
    echo "Setting Build Output Variable $1=$2"
    echo "##vso[task.setvariable variable=$1;isOutput=true]${2}"
    export "$1"="$2"
  }
fi

vsts_setoutvar SPEECHSDK_SEMVER2NOMETA "$SPEECHSDK_SEMVER2NOMETA"
vsts_setoutvar SPEECHSDK_SEMVER2 "$SPEECHSDK_SEMVER2"
vsts_setoutvar CARBONSDK_BUILD_TYPE "$CARBONSDK_BUILD_TYPE"

# Update the build number in ADO
if $IN_ADO; then
  echo "Updating build number to $SPEECHSDK_SEMVER2NOMETA"
  echo "##vso[build.updatebuildnumber]$SPEECHSDK_SEMVER2NOMETA"
  echo "Adding build tag $CARBONSDK_BUILD_TYPE"
  echo "##vso[build.addbuildtag]$CARBONSDK_BUILD_TYPE"
fi

echo "Build type: $CARBONSDK_BUILD_TYPE"
echo "Version without metadata: $SPEECHSDK_SEMVER2NOMETA"
echo "Full version: $SPEECHSDK_SEMVER2"