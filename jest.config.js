// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
module.exports = {
    projects: [
        {
            displayName: "jsdom",
            transform: {
                "^.+\\.ts$": "ts-jest",
            },
            testRegex: "tests/.*Tests\\.ts$",
            testPathIgnorePatterns: ["/lib/", "/es2018/", "/node_modules/", "/src/"],
            moduleFileExtensions: ["ts", "js", "jsx", "json", "node"],
            testEnvironment: "jsdom",
            collectCoverage: false,
            setupFilesAfterEnv: ["./secrets/TestConfiguration.ts"],
            testTimeout : 20000
        },
        {
            displayName: "node",
            transform: {
                "^.+\\.ts$": "ts-jest",
            },
            testRegex: "tests/.*Tests\\.ts$",
            testPathIgnorePatterns: ["/lib/", "/es2015/", "/node_modules/", "/src/"],
            moduleFileExtensions: ["ts", "js", "jsx", "json", "node"],
            testEnvironment: "node",
            collectCoverage: false,
            setupFilesAfterEnv: ["./secrets/TestConfiguration.ts"],
            testTimeout : 30000
        }
    ],
    reporters: [ "default", "jest-junit" ],
};
