//
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
//

(function () {
    'use strict';
    var semver = require("semver");
    var exec = require("child_process").exec;

    if (!process.env.npm_package_version) {
        throw "npm_package_version not set; run this via 'npm run'"
    }

    var givenVersion = process.env.npm_package_version;

    if (!semver.valid(givenVersion)) {
        throw "Invalid version " + givenVersion;
    }

    var baseVersion = semver.major(givenVersion) + "." + semver.minor(givenVersion) + "." + semver.patch(givenVersion);
    var prerelease = semver.prerelease(givenVersion) || []

    var buildId = process.env.BUILD_BUILDID || "1"

    var buildType = "dev"
    var inAzureDevOps = false

    if (process.env.SYSTEM_COLLECTIONID === "26f8e8b1-373f-4f65-96fc-d17a59b38306" &&
         process.env.SYSTEM_DEFINITIONID === "198") {
        
        console.log("Running in Azure DevOps build pipeline")
        inAzureDevOps = true

        if (process.env.BUILD_SOURCEBRANCH.match("^refs/heads/release/")) {
            buildType = "prod"
        } else if (process.env.BUILD_SOURCEBRANCH === "refs/heads/master" &&
            (process.env.BUILD_REASON === "Schedule" ||
             process.env.BUILD_REASON === "Manual")) {
            buildType = "int"
        }
    } else if (process.env.CI === "true") {
        console.log("Running in GitHub Actions")

    } else if (process.env.CI === "false") {
        console.log("Running in local dev environment")
        buildType = "dev"
    }

    // Check our version constraints
    if (buildType === "prod") {
        // Full version give in package.json
        if (prerelease.length != 0 &&
            (prerelease.length != 2 ||
            !prerelease[0].match("^(?:alpha|beta|rc)$") ||
            prerelease[1] < 1)) {
            throw "For prod build types, version must have no pre-release tag, or alpha / beta / rc with a positive number."
        }
    } else if (prerelease.length != 3 ||
        (prerelease[0] !== "alpha" || prerelease[1] !== 0 || prerelease[2] !== 1)) {
        throw "For non-prod build types, checked-in version must end in -alpha.0.1"
    }

    var versionToUse

    if (buildType === "dev") {
        versionToUse = baseVersion + "-alpha.0." + buildId
    } else if (buildType === "int") {
        versionToUse = baseVersion + "-beta.0." + buildId
    } else if (buildType === "prod") {
        versionToUse = givenVersion
    } else {
        throw "Internal error. Unexpected build type: " + buildType
    }

    if (inAzureDevOps) {
        console.log("Setting Azure DevOps build variable SPEECHSDK_SEMVER2NOMETA to " + versionToUse);
        console.log("##vso[task.setvariable variable=SPEECHSDK_SEMVER2NOMETA]" + versionToUse);
    }

    if (givenVersion !== versionToUse) {
        console.log("Setting version to " + versionToUse);
        exec("npm version --no-git-tag-version " + versionToUse, { cwd: __dirname + "/.." },
            function (error) {
                if (error) {
                    throw error;
                }
            }
        );
    }
}());
