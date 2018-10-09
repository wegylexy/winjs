// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
define([
    'exports',
    '../Core/_Global',
    '../Core/_Base',
    './_Control',
    './_ElementUtilities',
    './_TabContainer'
], function KeyboardBehaviorInit(exports, _Global, _Base, _Control, _ElementUtilities, _TabContainer) {
    "use strict";

    // not supported in WebWorker
    if (!_Global.document) {
        return;
    }
    
    var InputTypes = {
        touch: "touch",
        pen: "pen",
        mouse: "mouse",
        keyboard: "keyboard"
    };
    var _lastInputType = InputTypes.mouse;
    
    // Keys should be the same as the values for a PointerEvent's pointerType.
    var pointerTypeToInputType = {
        // IE 10 uses numbers for its pointerType
        2: InputTypes.touch,
        3: InputTypes.pen,
        4: InputTypes.mouse,
        
        // Others use strings for their pointerTypes
        touch: InputTypes.touch,
        pen: InputTypes.pen,
        mouse: InputTypes.mouse
    };

    _ElementUtilities._addEventListener(_Global, "pointerdown", function (eventObject) {
        _lastInputType = pointerTypeToInputType[eventObject.pointerType] || InputTypes.mouse;
    }, true);

    _Global.addEventListener("keydown", function () {
        _lastInputType = InputTypes.keyboard;
    }, true);

    _Base.Namespace._moduleDefine(exports, "WinJS.UI", {
        _keyboardSeenLast: {
            get: function _keyboardSeenLast_get() {
                return _lastInputType === InputTypes.keyboard;
            },
            set: function _keyboardSeenLast_set(value) {
                _lastInputType = (value ? InputTypes.keyboard : InputTypes.mouse);
            }
        },
        _lastInputType: {
            get: function _lastInputType_get() {
                return _lastInputType;
            },
            set: function _lastInputType_set(value) {
                if (InputTypes[value]) {
                    _lastInputType = value;
                }
            }
        },
        _InputTypes: InputTypes,
        _WinKeyboard: function (element) {
            // Win Keyboard behavior is a solution that would be similar to -ms-keyboard-focus.
            // It monitors the last input (keyboard/mouse) and adds/removes a win-keyboard class
            // so that you can style .foo.win-keyboard:focus vs .foo:focus to add a keyboard rect
            // on an item only when the last input method was keyboard.
            // Reminder: Touch edgy does not count as an input method.
            _ElementUtilities._addEventListener(element, "pointerdown", function (ev) {
                // In case pointer down came on the active element.
                _ElementUtilities.removeClass(ev.target, "win-keyboard");
            }, true);
            element.addEventListener("keydown", function (ev) {
                _ElementUtilities.addClass(ev.target, "win-keyboard");
            }, true);
            _ElementUtilities._addEventListener(element, "focusin", function (ev) {
                exports._keyboardSeenLast && _ElementUtilities.addClass(ev.target, "win-keyboard");
            }, false);
            _ElementUtilities._addEventListener(element, "focusout", function (ev) {
                _ElementUtilities.removeClass(ev.target, "win-keyboard");
            }, false);
        },
        _KeyboardBehavior: _Base.Namespace._lazy(function () {
            var Key = _ElementUtilities.Key;

            var _KeyboardBehavior = _Base.Class.define(function KeyboardBehavior_ctor(element, options) {
                // KeyboardBehavior allows you to easily convert a bunch of tabable elements into a single tab stop with
                // navigation replaced by keyboard arrow (Up/Down/Left/Right) + Home + End + Custom keys.
                //
                // Example use cases:
                //
                // 1 Dimensional list: FixedDirection = height and FixedSize = 1;
                // [1] [ 2 ] [  3  ] [4] [  5  ]...
                //
                // 2 Dimensional list: FixedDirection = height and FixedSize = 2;
                // [1] [3] [5] [7] ...
                // [2] [4] [6] [8]
                //
                // 1 Dimensional list: FixedDirection = width and FixedSize = 1;
                // [ 1 ]
                // -   -
                // |   |
                // | 2 |
                // |   |
                // -   -
                // [ 3 ]
                // [ 4 ]
                //  ...
                //
                // 2 Dimensional list: FixedDirection = width and FixedSize = 2;
                // [1][2]
                // [3][4]
                // [5][6]
                // ...
                //
                // Currently it is a "behavior" instead of a "control" so it can be attached to the same element as a
                // winControl. The main scenario for this would be to attach it to the same element as a repeater.
                //
                // It also blocks "Portaling" where you go off the end of one column and wrap around to the other
                // column. It also blocks "Carousel" where you go from the end of the list to the beginning.
                //
                // Keyboarding behavior supports nesting. It supports your tab stops having sub tab stops. If you want
                // an interactive element within the tab stop you need to use the win-interactive classname or during the
                // keydown event stop propogation so that the event is skipped.
                //
                // If you have custom keyboarding the getAdjacent API is provided. This can be used to enable keyboarding
                // in multisize 2d lists or custom keyboard commands. PageDown and PageUp are the most common since this
                // behavior does not detect scrollers.
                //
                // It also allows developers to show/hide keyboard focus rectangles themselves.
                //
                // It has an API called currentIndex so that Tab (or Shift+Tab) or a developer imitating Tab will result in
                // the correct item having focus.
                //
                // It also allows an element to be represented as 2 arrow stops (commonly used for a split button) by calling
                // the _getFocusInto API on the child element's winControl if it exists.

                element = element || _Global.document.createElement("DIV");
                options = options || {};

                element._keyboardBehavior = this;
                this._element = element;

                this._fixedDirection = _KeyboardBehavior.FixedDirection.width;
                this._fixedSize = 1;
                this._currentIndex = 0;

                _Control.setOptions(this, options);

                // If there's a scroller, the TabContainer can't be inside of the scroller. Otherwise, tabbing into the
                // TabContainer will cause the scroller to scroll.
                this._tabContainer = new _TabContainer.TabContainer(this.scroller || this._element);
                this._tabContainer.tabIndex = 0;
                if (this._element.children.length > 0) {
                    this._tabContainer.childFocus = this._getFocusInto(this._element.children[0]);
                }

                this._element.addEventListener('keydown', this._keyDownHandler.bind(this));
                _ElementUtilities._addEventListener(this._element, 'pointerdown', this._MSPointerDownHandler.bind(this));
            }, {
                element: {
                    get: function () {
                        return this._element;
                    }
                },

                fixedDirection: {
                    get: function () {
                        return this._fixedDirection;
                    },
                    set: function (value) {
                        this._fixedDirection = value;
                    }
                },

                fixedSize: {
                    get: function () {
                        return this._fixedSize;
                    },
                    set: function (value) {
                        if (+value === value) {
                            value = Math.max(1, value);
                            this._fixedSize = value;
                        }
                    }
                },

                currentIndex: {
                    get: function () {
                        if (this._element.children.length > 0) {
                            return this._currentIndex;
                        }
                        return -1;
                    },
                    set: function (value) {
                        if (+value === value) {
                            var length = this._element.children.length;
                            value = Math.max(0, Math.min(length - 1, value));
                            this._currentIndex = value;
                            this._tabContainer.childFocus = this._getFocusInto(this._element.children[value]);
                        }
                    }
                },

                getAdjacent: {
                    get: function () {
                        return this._getAdjacent;
                    },
                    set: function (value) {
                        this._getAdjacent = value;
                    }
                },

                // If set, KeyboardBehavior will prevent *scroller* from scrolling when moving focus
                scroller: {
                    get: function () {
                        return this._scroller;
                    },
                    set: function (value) {
                        this._scroller = value;
                    }
                },

                _keyDownHandler: function _KeyboardBehavior_keyDownHandler(ev) {
                    if (!ev.altKey) {
                        if (_ElementUtilities._matchesSelector(ev.target, ".win-interactive, .win-interactive *")) {
                            return;
                        }
                        var newIndex = this.currentIndex;
                        var maxIndex = this._element.children.length - 1;

                        var rtl = _ElementUtilities._getComputedStyle(this._element).direction === "rtl";
                        var leftStr = rtl ? Key.rightArrow : Key.leftArrow;
                        var rightStr = rtl ? Key.leftArrow : Key.rightArrow;

                        var targetIndex = this.getAdjacent && this.getAdjacent(newIndex, ev.keyCode);
                        if (+targetIndex === targetIndex) {
                            newIndex = targetIndex;
                        } else {
                            var modFixedSize = newIndex % this.fixedSize;

                            if (ev.keyCode === leftStr) {
                                if (this.fixedDirection === _KeyboardBehavior.FixedDirection.width) {
                                    if (modFixedSize !== 0) {
                                        newIndex--;
                                    }
                                } else {
                                    if (newIndex >= this.fixedSize) {
                                        newIndex -= this.fixedSize;
                                    }
                                }
                            } else if (ev.keyCode === rightStr) {
                                if (this.fixedDirection === _KeyboardBehavior.FixedDirection.width) {
                                    if (modFixedSize !== this.fixedSize - 1) {
                                        newIndex++;
                                    }
                                } else {
                                    if (newIndex + this.fixedSize - modFixedSize <= maxIndex) {
                                        newIndex += this.fixedSize;
                                    }
                                }
                            } else if (ev.keyCode === Key.upArrow) {
                                if (this.fixedDirection === _KeyboardBehavior.FixedDirection.height) {
                                    if (modFixedSize !== 0) {
                                        newIndex--;
                                    }
                                } else {
                                    if (newIndex >= this.fixedSize) {
                                        newIndex -= this.fixedSize;
                                    }
                                }
                            } else if (ev.keyCode === Key.downArrow) {
                                if (this.fixedDirection === _KeyboardBehavior.FixedDirection.height) {
                                    if (modFixedSize !== this.fixedSize - 1) {
                                        newIndex++;
                                    }
                                } else {
                                    if (newIndex + this.fixedSize - modFixedSize <= maxIndex) {
                                        newIndex += this.fixedSize;
                                    }
                                }
                            } else if (ev.keyCode === Key.home) {
                                newIndex = 0;
                            } else if (ev.keyCode === Key.end) {
                                newIndex = this._element.children.length - 1;
                            }
                        }

                        newIndex = Math.max(0, Math.min(this._element.children.length - 1, newIndex));

                        if (newIndex !== this.currentIndex) {
                            this._focus(newIndex, ev.keyCode);

                            // Allow KeyboardBehavior to be nested
                            if (ev.keyCode === leftStr || ev.keyCode === rightStr || ev.keyCode === Key.upArrow || ev.keyCode === Key.downArrow) {
                                ev.stopPropagation();
                            }

                            ev.preventDefault();
                        }
                    }
                },

                _getFocusInto: function _KeyboardBehavior_getFocusInto(elementToFocus, keyCode) {
                    return elementToFocus && elementToFocus.winControl && elementToFocus.winControl._getFocusInto ?
                        elementToFocus.winControl._getFocusInto(keyCode) :
                        elementToFocus;
                },

                _focus: function _KeyboardBehavior_focus(index, keyCode) {
                    index = (+index === index) ? index : this.currentIndex;

                    var elementToFocus = this._element.children[index];
                    if (elementToFocus) {
                        elementToFocus = this._getFocusInto(elementToFocus, keyCode);

                        this.currentIndex = index;

                        _ElementUtilities._setActive(elementToFocus, this.scroller);
                    }
                },

                _MSPointerDownHandler: function _KeyboardBehavior_MSPointerDownHandler(ev) {
                    var srcElement = ev.target;
                    if (srcElement === this.element) {
                        return;
                    }

                    while (srcElement.parentNode !== this.element) {
                        srcElement = srcElement.parentNode;
                    }

                    var index = -1;
                    while (srcElement) {
                        index++;
                        srcElement = srcElement.previousElementSibling;
                    }

                    this.currentIndex = index;
                }
            }, {
                FixedDirection: {
                    height: "height",
                    width: "width"
                }
            });

            return _KeyboardBehavior;
        })
    });

});