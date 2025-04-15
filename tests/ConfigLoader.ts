// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as path from "path";
import { SubscriptionRegion } from "./SubscriptionRegion";

/**
 * Config loader that matches the C# implementation for loading subscription and region information.
 */
export class ConfigLoader {
    private static _instance: ConfigLoader;
    private _subscriptionsRegionsMap: Record<string, SubscriptionRegion> = {};
    private _initialized: boolean = false;

    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor() { }

    /**
     * Gets the singleton instance of the ConfigLoader.
     */
    public static get instance(): ConfigLoader {
        if (!this._instance) {
            this._instance = new ConfigLoader();
        }
        return this._instance;
    }

    /**
     * Gets the map of subscription regions.
     */
    public get subscriptionsRegionsMap(): Record<string, SubscriptionRegion> {
        this.ensureInitialized();
        return this._subscriptionsRegionsMap;
    }

    /**
     * Initializes the config loader by reading the subscriptions and regions file.
     * @param filePath Optional path to the subscriptions regions JSON file.
     * @returns True if initialization was successful, false otherwise.
     */
    public initialize(filePath?: string): boolean {
        if (this._initialized) {
            return true;
        }

        const fileName = filePath || "./secrets/test.subscriptions.regions.json";

        // Try to find the file in the current directory or parent directories
        try {
            const resolvedPath = this.findFile(fileName);
            if (!resolvedPath) {
                console.error(`Could not find ${fileName}`);
                return false;
            }

            const fileContent = fs.readFileSync(resolvedPath, 'utf8');
            this._subscriptionsRegionsMap = JSON.parse(fileContent);
            this._initialized = true;
            return true;
        } catch (error) {
            console.error(`Error loading ${fileName}: ${error.message}`);
            return false;
        }
    }

    /**
     * Ensures that the config loader is initialized.
     */
    private ensureInitialized(): void {
        if (!this._initialized) {
            const success = this.initialize();
            if (!success) {
                console.warn("Failed to initialize ConfigLoader. Using empty configuration.");
            }
        }
    }

    /**
     * Tries to find a file by searching in the current directory and parent directories.
     * @param fileName The name of the file to find.
     * @param maxDepth Maximum number of parent directories to search.
     * @returns The resolved path to the file or undefined if not found.
     */
    private findFile(fileName: string, maxDepth: number = 5): string | undefined {
        let currentDir = process.cwd();
        let depth = 0;

        while (depth < maxDepth) {
            const filePath = path.join(currentDir, fileName);
            console.info(`Searching for ${fileName} in ${currentDir}`);
            if (fs.existsSync(filePath)) {
                return filePath;
            }

            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                // We've reached the root directory
                break;
            }

            currentDir = parentDir;
            depth++;
        }

        return undefined;
    }

    /**
     * Gets a subscription region by key.
     * @param key The key of the subscription region to get.
     * @returns The subscription region or undefined if not found.
     */
    public getSubscriptionRegion(key: string): SubscriptionRegion | undefined {
        return this.subscriptionsRegionsMap[key];
    }
}