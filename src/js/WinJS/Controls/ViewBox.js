// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
// ViewBox control
define([
    '../Core/_Global',
    '../Core/_Base',
    '../Core/_BaseUtils',
    '../Core/_ErrorFromName',
    '../Core/_Resources',
    '../Scheduler',
    '../Utilities/_Control',
    '../Utilities/_Dispose',
    '../Utilities/_ElementUtilities',
    '../Utilities/_Hoverable',
    './ElementResizeInstrument',
    'require-style!less/styles-viewbox'
], function viewboxInit(_Global, _Base, _BaseUtils, _ErrorFromName, _Resources, Scheduler, _Control, _Dispose, _ElementUtilities, _Hoverable, _ElementResizeInstrument) {
    "use strict";

    _Base.Namespace.define("WinJS.UI", {
        /// <field>
        /// <summary locid="WinJS.UI.ViewBox">
        /// Scales a single child element to fill the available space without
        /// resizing it. This control reacts to changes in the size of the container as well as
        /// changes in size of the child element. For example, a media query may result in
        /// a change in aspect ratio.
        /// </summary>
        /// </field>
        /// <name locid="WinJS.UI.ViewBox_name">View Box</name>
        /// <icon src="ui_winjs.ui.viewbox.12x12.png" width="12" height="12" />
        /// <icon src="ui_winjs.ui.viewbox.16x16.png" width="16" height="16" />
        /// <htmlSnippet supportsContent="true"><![CDATA[<div data-win-control="WinJS.UI.ViewBox"><div>ViewBox</div></div>]]></htmlSnippet>
        /// <resource type="javascript" src="//$(TARGET_DESTINATION)/js/WinJS.js" shared="true" />
        /// <resource type="css" src="//$(TARGET_DESTINATION)/css/ui-dark.css" shared="true" />
        ViewBox: _Base.Namespace._lazy(function () {

            var strings = {
                get invalidViewBoxChildren() { return "ViewBox expects to be provided with only one child element"; },
            };

            var ViewBox = _Base.Class.define(function ViewBox_ctor(element) {
                /// <signature helpKeyword="WinJS.UI.ViewBox.ViewBox">
                /// <summary locid="WinJS.UI.ViewBox.constructor">Initializes a new instance of the ViewBox control</summary>
                /// <param name="element" type="HTMLElement" domElement="true" mayBeNull="true" locid="WinJS.UI.ViewBox.constructor_p:element">
                /// The DOM element that functions as the scaling box. This element fills 100% of the width and height allotted to it.
                /// </param>
                /// <param name="options" type="Object" optional="true" locid="WinJS.UI.ViewBox.constructor_p:options">
                /// The set of options to be applied initially to the ViewBox control.
                /// </param>
                /// <returns type="WinJS.UI.ViewBox" locid="WinJS.UI.ViewBox.constructor_returnValue">A constructed ViewBox control.</returns>
                /// </signature>
                this._disposed = false;

                this._element = element || _Global.document.createElement("div");
                var box = this.element;
                box.winControl = this;
                _ElementUtilities.addClass(box, "win-disposable");
                _ElementUtilities.addClass(box, "win-viewbox");

                // Sign up for resize events.
                this._handleResizeBound = this._handleResize.bind(this);
                _ElementUtilities._resizeNotifier.subscribe(box, this._handleResizeBound);
                this._elementResizeInstrument = new _ElementResizeInstrument._ElementResizeInstrument();
                box.appendChild(this._elementResizeInstrument.element);
                this._elementResizeInstrument.addEventListener("resize", this._handleResizeBound);
                var that = this;
                _ElementUtilities._inDom(box).then(function () {
                    if (!that._disposed) {
                        that._elementResizeInstrument.addedToDom();
                    }
                });

                this.forceLayout();
            }, {
                _sizer: null,
                _element: null,

                /// <field type="HTMLElement" domElement="true" hidden="true" locid="WinJS.UI.ViewBox.element" helpKeyword="WinJS.UI.ViewBox.element">
                /// Gets the DOM element that functions as the scaling box.
                /// </field>
                element: {
                    get: function () { return this._element; }
                },

                _rtl: {
                    get: function () {
                        return _ElementUtilities._getComputedStyle(this.element).direction === "rtl";
                    }
                },

                _initialize: function () {
                    var box = this.element;
                    var children = Array.prototype.slice.call(box.children);

                    // Make sure we contain our elementResizeInstrument. 
                    if (children.indexOf(this._elementResizeInstrument.element) === -1) {
                        box.appendChild(this._elementResizeInstrument.element);
                    }

                    // Make sure we contain a single sizer
                    var that = this;
                    if (children.indexOf(this._sizer) === -1) {
                        var sizers = children.filter(function (element) {
                            return (element !== that._elementResizeInstrument.element);
                        });

                        if (_BaseUtils.validation) {
                            if (sizers.length !== 1) {
                                throw new _ErrorFromName("WinJS.UI.ViewBox.InvalidChildren", strings.invalidViewBoxChildren);
                            }
                        }
                        if (this._sizer) {
                            this._sizer.onresize = null;
                        }
                        var sizer = sizers[0];
                        this._sizer = sizer;

                        if (box.clientWidth === 0 && box.clientHeight === 0) {
                            var that = this;
                            // Wait for the viewbox to get added to the DOM. It should be added
                            // in the synchronous block in which _initialize was called.
                            Scheduler.schedule(function ViewBox_async_initialize() {
                                that._updateLayout();
                            }, Scheduler.Priority.normal, null, "WinJS.UI.ViewBox._updateLayout");
                        }
                    }
                },
                _updateLayout: function () {
                    var sizer = this._sizer;
                    if (sizer) {
                        var box = this.element;
                        var w = sizer.clientWidth;
                        var h = sizer.clientHeight;
                        var bw = box.clientWidth;
                        var bh = box.clientHeight;
                        var wRatio = bw / w;
                        var hRatio = bh / h;
                        var mRatio = Math.min(wRatio, hRatio);
                        var transX = Math.abs(bw - (w * mRatio)) / 2;
                        var transY = Math.abs(bh - (h * mRatio)) / 2;
                        var rtl = this._rtl;
                        this._sizer.style[_BaseUtils._browserStyleEquivalents["transform"].scriptName] = "translate(" + (rtl ? "-" : "") + transX + "px," + transY + "px) scale(" + mRatio + ")";
                        this._sizer.style[_BaseUtils._browserStyleEquivalents["transform-origin"].scriptName] = rtl ? "top right" : "top left";
                    }

                    this._layoutCompleteCallback();
                },

                _handleResize: function () {
                    if (!this._resizing) {
                        this._resizing = this._resizing || 0;
                        this._resizing++;
                        try {
                            this._updateLayout();
                        } finally {
                            this._resizing--;
                        }
                    }
                },

                _layoutCompleteCallback: function () {
                    // Overwritten by unit tests.
                },

                dispose: function () {
                    /// <signature helpKeyword="WinJS.UI.ViewBox.dispose">
                    /// <summary locid="WinJS.UI.ViewBox.dispose">
                    /// Disposes this ViewBox.
                    /// </summary>
                    /// </signature>
                    if (this._disposed) {
                        return;
                    }

                    if (this.element) {
                        _ElementUtilities._resizeNotifier.unsubscribe(this.element, this._handleResizeBound);
                    }

                    this._elementResizeInstrument.dispose();

                    this._disposed = true;
                    _Dispose.disposeSubTree(this._element);
                },

                forceLayout: function () {
                    this._initialize();
                    this._updateLayout();
                }
            });
            _Base.Class.mix(ViewBox, _Control.DOMEventMixin);
            return ViewBox;
        })
    });

});
