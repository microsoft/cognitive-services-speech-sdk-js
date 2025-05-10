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
                    // Enable pathMapping to ensure correct line number reporting
                    pathMapping: {
                        '^(.*)\\.js$': '$1.ts'
                    }
                }]
            },
            testRegex: "tests/.*Tests\\.ts$",
            testPathIgnorePatterns: ["/lib/", "/node_modules/", "/src/"],
            moduleFileExtensions: ["ts", "js", "jsx", "json", "node"],
            testEnvironment: "jsdom",
            collectCoverage: false,
            setupFilesAfterEnv: [configFile, './jest.setup.js'],
            testTimeout : 20000,
            globals: {
                'ts-jest': {
                    // Ensure ts-jest respects the project's tsconfig settings
                    tsconfig: 'tsconfig.json',
                    diagnostics: {
                        // Improve error reporting
                        warnOnly: true,
                        pretty: true
                    }
                }
            }
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
                    // Enable pathMapping to ensure correct line number reporting
                    pathMapping: {
                        '^(.*)\\.js$': '$1.ts'
                    }
                }]
            },
            testRegex: "tests/.*Tests\\.ts$",
            testPathIgnorePatterns: ["/lib/", "/node_modules/", "/src/"],
            moduleFileExtensions: ["ts", "js", "jsx", "json", "node"],
            testEnvironment: "node",
            collectCoverage: false,
            setupFilesAfterEnv: [configFile, './jest.setup.js'],
            testTimeout : 30000,
            globals: {
                'ts-jest': {
                    // Ensure ts-jest respects the project's tsconfig settings
                    tsconfig: 'tsconfig.json',
                    diagnostics: {
                        // Improve error reporting
                        warnOnly: true,
                        pretty: true
                    }
                }
            }
        }
    ],
    reporters: [ "default", "jest-junit" ],
    testEnvironment: "node"
};