// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const WaitForConditionImpl = (condition: () => boolean, resolve: () => void) => {
    if (condition() === true) {
        resolve();
    } else {
        setTimeout(() => WaitForConditionImpl(condition, resolve), 500);
    }
}

const WaitForCondition = (condition: () => boolean): Promise<void> => {
    return new Promise<void>((resolve: () => void, reject: () => void): void => {
        WaitForConditionImpl(condition, resolve);
    });

};

export default WaitForCondition;
