// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.

import _Base = require("./Core/_Base");

// Public APIs
//

// Enum values align with the colors array indices
export enum ColorTypes {
    accent = 0,
    listSelectRest = 1,
    listSelectHover = 2,
    listSelectPress = 3,
    _listSelectRestInverse = 4,
    _listSelectHoverInverse = 5,
    _listSelectPressInverse = 6,
}

export function createAccentRule(selector: string, props: { name: string; value: ColorTypes; }[]) { }

// Publish to WinJS namespace
var toPublish = {
    ColorTypes: ColorTypes,
    createAccentRule: createAccentRule,
};
_Base.Namespace.define("WinJS.UI._Accents", toPublish);
