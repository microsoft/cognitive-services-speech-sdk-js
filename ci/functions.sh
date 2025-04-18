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