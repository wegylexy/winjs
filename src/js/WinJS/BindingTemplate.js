// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
define([
    'exports',
    './Core/_Global',
    './Core/_WinRT',
    './Core/_Base',
    './Core/_BaseUtils',
    './Core/_Log',
    './Core/_WriteProfilerMark',
    './Binding/_Declarative',
    './BindingTemplate/_DataTemplateCompiler',
    './ControlProcessor',
    './Fragments',
    './Promise',
    './Utilities/_Dispose',
    './Utilities/_ElementUtilities'
    ], function dataTemplateInit(exports, _Global, _WinRT, _Base, _BaseUtils, _Log, _WriteProfilerMark, _Declarative, _DataTemplateCompiler, ControlProcessor, Fragments, Promise, _Dispose, _ElementUtilities) {
    "use strict";

    // not supported in WebWorker
    if (!_Global.document) {
        return;
    }

    var cancelBlocker = Promise._cancelBlocker;

    _Base.Namespace._moduleDefine(exports, "WinJS.Binding", {

        /// <field>
        /// <summary locid="WinJS.Binding.Template">
        /// Provides a reusable declarative binding element.
        /// </summary>
        /// </field>
        /// <name locid="WinJS.Binding.Template_name">Template</name>
        /// <htmlSnippet supportsContent="true"><![CDATA[<div data-win-control="WinJS.Binding.Template"><div>Place content here</div></div>]]></htmlSnippet>
        /// <icon src="base_winjs.ui.template.12x12.png" width="12" height="12" />
        /// <icon src="base_winjs.ui.template.16x16.png" width="16" height="16" />
        /// <resource type="javascript" src="//$(TARGET_DESTINATION)/js/WinJS.js" shared="true" />
        /// <resource type="css" src="//$(TARGET_DESTINATION)/css/ui-dark.css" shared="true" />
        Template: _Base.Namespace._lazy(function () {
            function interpretedRender(template, dataContext, container) {
                _WriteProfilerMark("WinJS.Binding:templateRender" + template._profilerMarkIdentifier + ",StartTM");

                if (++template._counter === 1 && (template.debugBreakOnRender || Template._debugBreakOnRender)) {
                    debugger; // jshint ignore:line
                }

                var workPromise = Promise.wrap();
                var d = container || _Global.document.createElement(template.element.tagName);

                _ElementUtilities.addClass(d, "win-template");
                _ElementUtilities.addClass(d, "win-loading");
                var that = template;
                function done() {
                    _ElementUtilities.removeClass(d, "win-loading");
                    _WriteProfilerMark("WinJS.Binding:templateRender" + template._profilerMarkIdentifier + ",StopTM");
                    return extractedChild || d;
                }
                var initial = d.children.length;
                var element;
                var extractedChild;
                var dispose = function () {
                    var bindings = _ElementUtilities.data(d).winBindings;
                    if (bindings) {
                        bindings.forEach(function (item) {
                            item.cancel();
                        });
                    }
                    workPromise.cancel();
                };
                if (template.extractChild) {
                    element = Fragments.renderCopy(that.href || that.element, _Global.document.createElement(that.element.tagName)).then(function (frag) {
                        var child = frag.firstElementChild;
                        extractedChild = child;
                        _Dispose.markDisposable(child, dispose);
                        d.appendChild(child);
                        return child;
                    });
                } else {
                    _Dispose.markDisposable(d, dispose);
                    element = Fragments.renderCopy(that.href || that.element, d);
                }
                var renderComplete = element.
                    then(function Template_renderImpl_renderComplete_then() {
                        var work;
                        // If no existing children, we can do the faster path of just calling
                        // on the root element...
                        //
                        if (initial === 0) {
                            work = function (f, a, b, c) { return f(extractedChild || d, a, b, c); };
                        } else {
                            // We only grab the newly added nodes (always at the end)
                            // and in the common case of only adding a single new element
                            // we avoid the "join" overhead
                            //
                            var all = d.children;
                            if (all.length === initial + 1) {
                                work = function (f, a, b, c) { return f(all[initial], a, b, c); };
                            } else {
                                // we have to capture the elements first, in case
                                // doing the work affects the children order/content
                                //
                                var elements = [];
                                for (var i = initial, l = all.length; i < l; i++) {
                                    elements.push(all[i]);
                                }
                                work = function (f, a, b, c) {
                                    var join = [];
                                    elements.forEach(function (e) {
                                        join.push(f(e, a, b, c));
                                    });
                                    return Promise.join(join);
                                };
                            }
                        }

                        var child = d.firstElementChild;
                        while (child) {
                            child.msParentSelectorScope = true;
                            child = child.nextElementSibling;
                        }

                        // This allows "0" to mean no timeout (at all) and negative values
                        // mean setImmediate (no setTimeout). Since Promise.timeout uses
                        // zero to mean setImmediate, we have to coerce.
                        //
                        var timeout = that.processTimeout;
                        function complete() {
                            return work(ControlProcessor.processAll).
                                then(function () { return cancelBlocker(dataContext); }).
                                then(function Template_renderImpl_Binding_processAll(data) {
                                    return work(_Declarative.processAll, data, !extractedChild && !initial, that.bindingCache);
                                }).
                                then(null, function (e) {
                                    if (typeof e === "object" && e.name === "Canceled") {
                                        (extractedChild || d).dispose();
                                    }
                                    return Promise.wrapError(e);
                                });
                        }
                        if (timeout) {
                            if (timeout < 0) { timeout = 0; }
                            return Promise.timeout(timeout).then(function () {
                                workPromise = complete();
                                return workPromise;
                            });
                        } else {
                            workPromise = complete();
                            return workPromise;
                        }
                    }).then(done, function (err) { done(); return Promise.wrapError(err); });

                return { element: element, renderComplete: renderComplete };
            }

            var Template = _Base.Class.define(function Template_ctor(element, options) {
                /// <signature helpKeyword="WinJS.Binding.Template.Template">
                /// <summary locid="WinJS.Binding.Template.constructor">
                /// Creates a template that provides a reusable declarative binding element.
                /// </summary>
                /// <param name="element" type="DOMElement" locid="WinJS.Binding.Template.constructor_p:element">
                /// The DOM element to convert to a template.
                /// </param>
                /// <param name="options" type="{href:String}" optional="true" locid="WinJS.Binding.Template.constructor_p:options">
                /// If this parameter is supplied, the template is loaded from the URI and
                /// the content of the element parameter is ignored.
                /// </param>
                /// </signature>

                this._element = element || _Global.document.createElement("div");
                this._element.winControl = this;

                this._profilerMarkIdentifier = _BaseUtils._getProfilerMarkIdentifier(this._element);
                _WriteProfilerMark("WinJS.Binding:newTemplate" + this._profilerMarkIdentifier + ",StartTM");

                var that = this;
                this._element.renderItem = function (itemPromise, recycled) { return that._renderItemImpl(itemPromise, recycled); };

                options = options || {};
                this.href = options.href;
                this.enableRecycling = !!options.enableRecycling;
                this.processTimeout = options.processTimeout || 0;
                this.bindingInitializer = options.bindingInitializer;
                this.debugBreakOnRender = options.debugBreakOnRender;
                this.disableOptimizedProcessing = options.disableOptimizedProcessing;
                this.extractChild = options.extractChild;
                this._counter = 0;

                // This will eventually change name and reverse polarity, starting opt-in.
                //
                this._compile = !!options._compile;

                if (!this.href) {
                    this.element.style.display = "none";
                }
                this.bindingCache = { expressions: {} };

                _WriteProfilerMark("WinJS.Binding:newTemplate" + this._profilerMarkIdentifier + ",StopTM");
            }, {
                _shouldCompile: {
                    get: function () {
                        // This is the temporary switch to opt-in to compilation, eventually replaced
                        //  by default opt-in with an opt-out switch.
                        //
                        var shouldCompile = true;
                        shouldCompile = shouldCompile && !Template._interpretAll;
                        shouldCompile = shouldCompile && !this.disableOptimizedProcessing;

                        if (shouldCompile) {
                            shouldCompile = shouldCompile && this.processTimeout === 0;
                            shouldCompile = shouldCompile && (!this.href || this.href instanceof _Global.HTMLElement);

                            if (!shouldCompile) {
                                _Log.log && _Log.log("Cannot compile templates which use processTimeout or href properties", "winjs binding", "warn");
                            }
                        }

                        return shouldCompile;
                    }
                },

                /// <field type="Function" locid="WinJS.Binding.Template.bindingInitializer" helpKeyword="WinJS.Binding.Template.bindingInitializer">
                /// If specified this function is used as the default initializer for any data bindings which do not explicitly specify one. The
                /// provided function must be marked as supported for processing.
                /// </field>
                bindingInitializer: {
                    get: function () { return this._bindingInitializer; },
                    set: function (value) {
                        this._bindingInitializer = value;
                        this._reset();
                    }
                },

                /// <field type="Boolean" locid="WinJS.Binding.Template.debugBreakOnRender" helpKeyword="WinJS.Binding.Template.debugBreakOnRender">
                /// Indicates whether a templates should break in the debugger on first render
                /// </field>
                debugBreakOnRender: {
                    get: function () { return this._debugBreakOnRender; },
                    set: function (value) {
                        this._debugBreakOnRender = !!value;
                        this._reset();
                    }
                },

                /// <field type="Boolean" locid="WinJS.Binding.Template.disableOptimizedProcessing" helpKeyword="WinJS.Binding.Template.disableOptimizedProcessing">
                /// Set this property to true to resotre classic template processing and data binding and disable template compilation.
                /// </field>
                disableOptimizedProcessing: {
                    get: function () { return this._disableOptimizedProcessing; },
                    set: function (value) {
                        this._disableOptimizedProcessing = !!value;
                        this._reset();
                    }
                },

                /// <field type="HTMLElement" domElement="true" hidden="true" locid="WinJS.Binding.Template.element" helpKeyword="WinJS.Binding.Template.element">
                /// Gets the DOM element that is used as the template.
                /// </field>
                element: {
                    get: function () { return this._element; },
                },

                /// <field type="Boolean" locid="WinJS.Binding.Template.extractChild" helpKeyword="WinJS.Binding.Template.extractChild">
                /// Return the first element child of the template instead of a wrapper element hosting all the template content.
                /// </field>
                extractChild: {
                    get: function () { return this._extractChild; },
                    set: function (value) {
                        this._extractChild = !!value;
                        this._reset();
                    }
                },

                /// <field type="Number" integer="true" locid="WinJS.Binding.Template.processTimeout" helpKeyword="WinJS.Binding.Template.processTimeout">
                /// Number of milliseconds to delay instantiating declarative controls. Zero (0) will result in no delay, any negative number
                /// will result in a setImmediate delay, any positive number will be treated as the number of milliseconds.
                /// </field>
                processTimeout: {
                    get: function () { return this._processTimeout || 0; },
                    set: function (value) {
                        this._processTimeout = value;
                        this._reset();
                    }
                },

                render: _BaseUtils.markSupportedForProcessing(function (dataContext, container) {
                    /// <signature helpKeyword="WinJS.Binding.Template.render">
                    /// <summary locid="WinJS.Binding.Template.render">
                    /// Binds values from the specified data context to elements that are descendents of the specified root element
                    /// and have the declarative binding attributes (data-win-bind).
                    /// </summary>
                    /// <param name="dataContext" type="Object" optional="true" locid="WinJS.Binding.Template.render_p:dataContext">
                    /// The object to use for default data binding.
                    /// </param>
                    /// <param name="container" type="DOMElement" optional="true" locid="WinJS.Binding.Template.render_p:container">
                    /// The element to which to add this rendered template. If this parameter is omitted, a new DIV is created.
                    /// </param>
                    /// <returns type="WinJS.Promise" locid="WinJS.Binding.Template.render_returnValue">
                    /// A promise that is completed after binding has finished. The value is
                    /// either the element specified in the container parameter or the created DIV.
                    /// </returns>
                    /// </signature>

                    return this._renderImpl(dataContext, container);
                }),

                // Hook point for compiled template
                //
                _renderImpl: function (dataContext, container) {
                    if (this._shouldCompile) {
                        try {
                            this._renderImpl = this._compileTemplate({ target: "render" });
                            return this._renderImpl(dataContext, container);
                        } catch (e) {
                            return Promise.wrapError(e);
                        }
                    }

                    var render = interpretedRender(this, dataContext, container);
                    return render.element.then(function () { return render.renderComplete; });
                },

                _renderInterpreted: function (dataContext, container) {
                    return interpretedRender(this, dataContext, container);
                },

                renderItem: function (item, recycled) {
                    /// <signature helpKeyword="WinJS.Binding.Template.renderItem">
                    /// <summary locid="WinJS.Binding.Template.renderItem">
                    /// Renders an instance of this template bound to the data contained in item. If
                    /// the recycled parameter is present, and enableRecycling is true, then the template attempts
                    /// to reuse the DOM elements from the recycled parameter.
                    /// </summary>
                    /// <param name="item" type="Object" optional="false" locid="WinJS.Binding.Template.renderItem_p:item">
                    /// The object that contains the data to bind to. Only item.data is required.
                    /// </param>
                    /// <param name="recycled" type="DOMElement" optional="true" locid="WinJS.Binding.Template.renderItem_p:recycled">
                    /// A previously-generated template instance.
                    /// </param>
                    /// <returns type="DOMElement" locid="WinJS.Binding.Template.renderItem_returnValue">
                    /// The DOM element.
                    /// </returns>
                    /// </signature>
                    return this._renderItemImpl(item, recycled);
                },

                // Hook point for compiled template
                //
                _renderItemImpl: function (item, recycled) {
                    if (this._shouldCompile) {
                        try {
                            this._renderItemImpl = this._compileTemplate({ target: "renderItem" });
                            return this._renderItemImpl(item);
                        } catch (e) {
                            return {
                                element: Promise.wrapError(e),
                                renderComplete: Promise.wrapError(e),
                            };
                        }
                    }

                    var that = this;

                    // we only enable element cache when we are trying
                    // to recycle. Otherwise our element cache would
                    // grow unbounded.
                    //
                    if (this.enableRecycling && !this.bindingCache.elements) {
                        this.bindingCache.elements = {};
                    }

                    if (this.enableRecycling
                        && recycled
                        && recycled.msOriginalTemplate === this) {

                        // If we are asked to recycle, we cleanup any old work no matter what
                        //
                        var cacheEntry = this.bindingCache.elements[recycled.id];
                        var okToReuse = true;
                        if (cacheEntry) {
                            cacheEntry.bindings.forEach(function (v) { v(); });
                            cacheEntry.bindings = [];
                            okToReuse = !cacheEntry.nocache;
                        }

                        // If our cache indicates that we hit a non-cancelable thing, then we are
                        // in an unknown state, so we actually can't recycle the tree. We have
                        // cleaned up what we can, but at this point we need to reset and create
                        // a new tree.
                        //
                        if (okToReuse) {
                            // Element recycling requires that there be no other content in "recycled" other than this
                            // templates' output.
                            //
                            return {
                                element: recycled,
                                renderComplete: item.then(function (item) {
                                    return _Declarative.processAll(recycled, item.data, true, that.bindingCache);
                                }),
                            };
                        }
                    }

                    var render = interpretedRender(this, item.then(function (item) { return item.data; }));
                    render.element = render.element.then(function (e) { e.msOriginalTemplate = that; return e; });
                    return render;
                },

                _compileTemplate: function (options) {

                    var that = this;

                    var result = _DataTemplateCompiler._TemplateCompiler.compile(this, this.href || this.element, {
                        debugBreakOnRender: this.debugBreakOnRender || Template._debugBreakOnRender,
                        defaultInitializer: this.bindingInitializer || options.defaultInitializer,
                        disableTextBindingOptimization: options.disableTextBindingOptimization || false,
                        target: options.target,
                        extractChild: this.extractChild,
                        profilerMarkIdentifier: this._profilerMarkIdentifier
                    });

                    var resetOnFragmentChange = options.resetOnFragmentChange || _WinRT.Windows.ApplicationModel.DesignMode.designModeEnabled;
                    if (resetOnFragmentChange) {
                        // For platforms that don't support MutationObserver the shim
                        // currently will never fire. This is OK because only MutationObserver
                        // can monitor DocFragments and this feature is only for
                        // assisting authoring tools.
                        var mo = new _ElementUtilities._MutationObserver(function () {
                            that._reset();
                            mo.disconnect();
                        });
                        mo.observe(_ElementUtilities.data(this.element).docFragment, {
                            childList: true,
                            attributes: true,
                            characterData: true,
                            subtree: true,
                        });
                    }

                    return result;

                },

                _reset: function () {
                    // Reset the template to being not compiled. In design mode this triggers on a mutation
                    //  of the original document fragment.
                    delete this._renderImpl;
                    delete this._renderItemImpl;
                },

            }, {
                isDeclarativeControlContainer: { value: true, writable: false, configurable: false },
                render: {
                    value: function (href, dataContext, container) {
                        /// <signature helpKeyword="WinJS.Binding.Template.render.value">
                        /// <summary locid="WinJS.Binding.Template.render.value">
                        /// Renders a template based on a URI.
                        /// </summary>
                        /// <param name="href" type="String" locid="WinJS.Binding.Template.render.value_p:href">
                        /// The URI from which to load the template.
                        /// </param>
                        /// <param name="dataContext" type="Object" optional="true" locid="WinJS.Binding.Template.render.value_p:dataContext">
                        /// The object to use for default data binding.
                        /// </param>
                        /// <param name="container" type="DOMElement" optional="true" locid="WinJS.Binding.Template.render.value_p:container">
                        /// The element to which to add this rendered template. If this parameter is omitted, a new DIV is created.
                        /// </param>
                        /// <returns type="WinJS.Promise" locid="WinJS.Binding.Template.render.value_returnValue">
                        /// A promise that is completed after binding has finished. The value is
                        /// either the object in the container parameter or the created DIV.
                        /// </returns>
                        /// </signature>
                        return new Template(null, { href: href }).render(dataContext, container);
                    }
                }
            });

            return Template;
        })
    });

});