#!/usr/bin/env bash
#
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.
#
# To be sourced from depending scripts.

find_free_port() {  
  local port=1024  
  while : ; do  
      # Check if the port is in use using netstat  
      if ! netstat -tuln | grep -q ":$port "; then  
          echo $port  
          return  
      fi  
      port=$((port + 1))  
  done  
}

# Ensure now logging of commands to not confuse the agent...
vsts_setvar() {
  set +x
  echo Setting Build Variable $1=$2
  echo "##vso[task.setvariable variable=$1]$2"
  export "$1"="$2"
}

# Set output variable in ADO
vsts_setoutvar() {
  set +x
  echo "Setting Build Output Variable $1=$2"
  echo "##vso[task.setvariable variable=$1;isOutput=true]${2}"
  export "$1"="$2"
}

# Update build number in ADO
vsts_updatebuildnumber() {
  set +x
  echo "Updating build number to $1"
  echo "##vso[build.updatebuildnumber]$1"
}

# Add build tag in ADO
vsts_addbuildtag() {
  set +x
  echo "Adding build tag $1"
  echo "##vso[build.addbuildtag]$1"
}