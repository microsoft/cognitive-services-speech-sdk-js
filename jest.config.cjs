// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
const fs = require('fs');
const path = require('path');

// Default configuration file
const defaultConfigFile = './secrets/TestConfiguration.ts';
const configJsonFile = './secrets/test.subscriptions.regions.json';

// Determine which configuration file to use
const getConfigFile = () => {
    if (configJsonFile && fs.existsSync(path.resolve(configJsonFile))) {
        console.log(`Using JSON configuration: ${configJsonFile}`);
        return configJsonFile;
    }
    console.log(`Using default configuration: ${defaultConfigFile}`);
    return defaultConfigFile;
};

const configFile = getConfigFile();

module.exports = {
    projects: [
        {
            displayName: "jsdom",
            moduleNameMapper: {
                "(.+)\\.js": "$1"
            },
            transform: {
                "^.+\\.ts$": ["ts-jest", {
                    // Match source map configuration with project's tsconfig and gulp build
                    sourceMap: true, 
                    inlineSourceMap: false,
                    // Ensure ts-jest respects the project's tsconfig settings
                    tsconfig: 'tsconfig.test.json',
                    diagnostics: {
                        // Improve error reporting
                        warnOnly: false,
                        pretty: true
                    }
                }]
            },
            testRegex: "tests/.*Tests\\.ts$",
            testPathIgnorePatterns: ["/lib/", "/node_modules/", "/src/"],
            moduleFileExtensions: ["ts", "js", "jsx", "json", "node"],
            testEnvironment: "jsdom",
            testEnvironmentOptions: {
                customExportConditions: ["node", "node-addons"]
            },
            setupFilesAfterEnv: [configFile, './jest.setup.js']
        },
        {
            displayName: "node",
            moduleNameMapper: {
                "(.+)\\.js": "$1"
            },
            transform: {
                "^.+\\.ts$": ["ts-jest", {
                    // Match source map configuration with project's tsconfig and gulp build
                    sourceMap: true, 
                    inlineSourceMap: false,
                    // Ensure ts-jest respects the project's tsconfig settings
                    tsconfig: 'tsconfig.test.json',
                    diagnostics: {
                        // Improve error reporting
                        warnOnly: false,
                        pretty: true
                    }
                }]
            },
            testRegex: "tests/.*Tests\\.ts$",
            testPathIgnorePatterns: ["/lib/", "/node_modules/", "/src/"],
            moduleFileExtensions: ["ts", "js", "jsx", "json", "node"],
            testEnvironment: "node",
            setupFilesAfterEnv: [configFile, './jest.setup.js']
        }
    ],
    collectCoverage: false,
    testTimeout: 30000,
    reporters: [ "default", "jest-junit" ],
    testEnvironment: "node"
};