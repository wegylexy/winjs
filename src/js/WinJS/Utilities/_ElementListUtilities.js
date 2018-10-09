// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
define([
    'exports',
    '../Core/_Global',
    '../Core/_Base',
    '../ControlProcessor',
    '../Promise',
    '../Utilities/_Control',
    '../Utilities/_ElementUtilities'
    ], function elementListUtilities(exports, _Global, _Base, ControlProcessor, Promise, _Control, _ElementUtilities) {
    "use strict";

    // not supported in WebWorker
    if (!_Global.document) {
        return;
    }

    _Base.Namespace._moduleDefine(exports, "WinJS.Utilities", {
        QueryCollection: _Base.Class.derive(Array, function (items) {
            /// <signature helpKeyword="WinJS.Utilities.QueryCollection">
            /// <summary locid="WinJS.Utilities.QueryCollection">
            /// Represents the result of a query selector, and provides
            /// various operations that perform actions over the elements of
            /// the collection.
            /// </summary>
            /// <param name="items" locid="WinJS.Utilities.QueryCollection_p:items">
            /// The items resulting from the query.
            /// </param>
            /// </signature>
            if (items) {
                this.include(items);
            }
        }, {
            forEach: function (callbackFn, thisArg) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.forEach">
                /// <summary locid="WinJS.Utilities.QueryCollection.forEach">
                /// Performs an action on each item in the QueryCollection
                /// </summary>
                /// <param name="callbackFn" type="function(value, Number index, traversedObject)" locid="WinJS.Utilities.QueryCollection.forEach_p:callbackFn">
                /// Action to perform on each item.
                /// </param>
                /// <param name="thisArg" isOptional="true" type="function(value, Number index, traversedObject)" locid="WinJS.Utilities.QueryCollection.forEach_p:thisArg">
                /// Argument to bind to callbackFn
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.forEach_returnValue">
                /// Returns the QueryCollection
                /// </returns>
                /// </signature>
                Array.prototype.forEach.apply(this, [callbackFn, thisArg]);
                return this;
            },
            get: function (index) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.get">
                /// <summary locid="WinJS.Utilities.QueryCollection.get">
                /// Gets an item from the QueryCollection.
                /// </summary>
                /// <param name="index" type="Number" locid="WinJS.Utilities.QueryCollection.get_p:index">
                /// The index of the item to return.
                /// </param>
                /// <returns type="Object" locid="WinJS.Utilities.QueryCollection.get_returnValue">
                /// A single item from the collection.
                /// </returns>
                /// </signature>
                return this[index];
            },
            setAttribute: function (name, value) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.setAttribute">
                /// <summary locid="WinJS.Utilities.QueryCollection.setAttribute">
                /// Sets an attribute value on all the items in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.setAttribute_p:name">
                /// The name of the attribute to be set.
                /// </param>
                /// <param name="value" type="String" locid="WinJS.Utilities.QueryCollection.setAttribute_p:value">
                /// The value of the attribute to be set.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.setAttribute_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    item.setAttribute(name, value);
                });
                return this;
            },
            getAttribute: function (name) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.getAttribute">
                /// <summary locid="WinJS.Utilities.QueryCollection.getAttribute">
                /// Gets an attribute value from the first element in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.getAttribute_p:name">
                /// The name of the attribute.
                /// </param>
                /// <returns type="String" locid="WinJS.Utilities.QueryCollection.getAttribute_returnValue">
                /// The value of the attribute.
                /// </returns>
                /// </signature>
                if (this.length > 0) {
                    return this[0].getAttribute(name);
                }
            },
            addClass: function (name) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.addClass">
                /// <summary locid="WinJS.Utilities.QueryCollection.addClass">
                /// Adds the specified class to all the elements in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.addClass_p:name">
                /// The name of the class to add.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.addClass_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    _ElementUtilities.addClass(item, name);
                });
                return this;
            },
            hasClass: function (name) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.hasClass">
                /// <summary locid="WinJS.Utilities.QueryCollection.hasClass">
                /// Determines whether the specified class exists on the first element of the collection.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.hasClass_p:name">
                /// The name of the class.
                /// </param>
                /// <returns type="Boolean" locid="WinJS.Utilities.QueryCollection.hasClass_returnValue">
                /// true if the element has the specified class; otherwise, false.
                /// </returns>
                /// </signature>
                if (this.length > 0) {
                    return _ElementUtilities.hasClass(this[0], name);
                }
                return false;
            },
            removeClass: function (name) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.removeClass">
                /// <summary locid="WinJS.Utilities.QueryCollection.removeClass">
                /// Removes the specified class from all the elements in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.removeClass_p:name">
                /// The name of the class to be removed.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.removeClass_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    _ElementUtilities.removeClass(item, name);
                });
                return this;
            },
            toggleClass: function (name) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.toggleClass">
                /// <summary locid="WinJS.Utilities.QueryCollection.toggleClass">
                /// Toggles (adds or removes) the specified class on all the elements in the collection.
                /// If the class is present, it is removed; if it is absent, it is added.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.toggleClass_p:name">
                /// The name of the class to be toggled.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.toggleClass_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    _ElementUtilities.toggleClass(item, name);
                });
                return this;
            },
            listen: function (eventType, listener, capture) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.listen">
                /// <summary locid="WinJS.Utilities.QueryCollection.listen">
                /// Registers the listener for the specified event on all the elements in the collection.
                /// </summary>
                /// <param name="eventType" type="String" locid="WinJS.Utilities.QueryCollection.listen_p:eventType">
                /// The name of the event.
                /// </param>
                /// <param name="listener" type="Function" locid="WinJS.Utilities.QueryCollection.listen_p:listener">
                /// The event handler function to be called when the event occurs.
                /// </param>
                /// <param name="capture" type="Boolean" locid="WinJS.Utilities.QueryCollection.listen_p:capture">
                /// true if capture == true is to be passed to addEventListener; otherwise, false.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.listen_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    item.addEventListener(eventType, listener, capture);
                });
                return this;
            },
            removeEventListener: function (eventType, listener, capture) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.removeEventListener">
                /// <summary locid="WinJS.Utilities.QueryCollection.removeEventListener">
                /// Unregisters the listener for the specified event on all the elements in the collection.
                /// </summary>
                /// <param name="eventType" type="String" locid="WinJS.Utilities.QueryCollection.removeEventListener_p:eventType">
                /// The name of the event.
                /// </param>
                /// <param name="listener" type="Function" locid="WinJS.Utilities.QueryCollection.removeEventListener_p:listener">
                /// The event handler function.
                /// </param>
                /// <param name="capture" type="Boolean" locid="WinJS.Utilities.QueryCollection.removeEventListener_p:capture">
                /// true if capture == true; otherwise, false.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.removeEventListener_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    item.removeEventListener(eventType, listener, capture);
                });
                return this;
            },
            setStyle: function (name, value) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.setStyle">
                /// <summary locid="WinJS.Utilities.QueryCollection.setStyle">
                /// Sets the specified style property for all the elements in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.setStyle_p:name">
                /// The name of the style property.
                /// </param>
                /// <param name="value" type="String" locid="WinJS.Utilities.QueryCollection.setStyle_p:value">
                /// The value for the property.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.setStyle_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    item.style[name] = value;
                });
                return this;
            },
            clearStyle: function (name) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.clearStyle">
                /// <summary locid="WinJS.Utilities.QueryCollection.clearStyle">
                /// Clears the specified style property for all the elements in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="WinJS.Utilities.QueryCollection.clearStyle_p:name">
                /// The name of the style property to be cleared.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.clearStyle_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                this.forEach(function (item) {
                    item.style[name] = "";
                });
                return this;
            },
            query: function (query) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.query">
                /// <summary locid="WinJS.Utilities.QueryCollection.query">
                /// Executes a query selector on all the elements in the collection
                /// and aggregates the result into a QueryCollection.
                /// </summary>
                /// <param name="query" type="String" locid="WinJS.Utilities.QueryCollection.query_p:query">
                /// The query selector string.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.query_returnValue">
                /// A QueryCollection object containing the aggregate results of
                /// executing the query on all the elements in the collection.
                /// </returns>
                /// </signature>
                var newCollection = new exports.QueryCollection();
                this.forEach(function (item) {
                    newCollection.include(item.querySelectorAll(query));
                });
                return newCollection;
            },
            include: function (items) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.include">
                /// <summary locid="WinJS.Utilities.QueryCollection.include">
                /// Adds a set of items to this QueryCollection.
                /// </summary>
                /// <param name="items" locid="WinJS.Utilities.QueryCollection.include_p:items">
                /// The items to add to the QueryCollection. This may be an
                /// array-like object, a document fragment, or a single item.
                /// </param>
                /// </signature>
                if (typeof items.length === "number") {
                    for (var i = 0; i < items.length; i++) {
                        this.push(items[i]);
                    }
                } else if (items.DOCUMENT_FRAGMENT_NODE && items.nodeType === items.DOCUMENT_FRAGMENT_NODE) {
                    this.include(items.childNodes);
                } else {
                    this.push(items);
                }
            },
            control: function (Ctor, options) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.control">
                /// <summary locid="WinJS.Utilities.QueryCollection.control">
                /// Creates controls that are attached to the elements in this QueryCollection.
                /// </summary>
                /// <param name='Ctor' locid="WinJS.Utilities.QueryCollection.control_p:ctor">
                /// A constructor function that is used to create controls to attach to the elements.
                /// </param>
                /// <param name='options' locid="WinJS.Utilities.QueryCollection.control_p:options">
                /// The options passed to the newly-created controls.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.control_returnValue">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>
                /// <signature>
                /// <summary locid="WinJS.Utilities.QueryCollection.control2">
                /// Configures the controls that are attached to the elements in this QueryCollection.
                /// </summary>
                /// <param name='ctor' locid="WinJS.Utilities.QueryCollection.control_p:ctor2">
                /// The options passed to the controls.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.control_returnValue2">
                /// This QueryCollection object.
                /// </returns>
                /// </signature>

                if (Ctor && typeof (Ctor) === "function") {
                    this.forEach(function (element) {
                        element.winControl = new Ctor(element, options);
                    });
                } else {
                    options = Ctor;
                    this.forEach(function (element) {
                        ControlProcessor.process(element).done(function (control) {
                            control && _Control.setOptions(control, options);
                        });
                    });
                }
                return this;
            },
            template: function (templateElement, data, renderDonePromiseCallback) {
                /// <signature helpKeyword="WinJS.Utilities.QueryCollection.template">
                /// <summary locid="WinJS.Utilities.QueryCollection.template">
                /// Renders a template that is bound to the given data
                /// and parented to the elements included in the QueryCollection.
                /// If the QueryCollection contains multiple elements, the template
                /// is rendered multiple times, once at each element in the QueryCollection
                /// per item of data passed.
                /// </summary>
                /// <param name="templateElement" type="DOMElement" locid="WinJS.Utilities.QueryCollection.template_p:templateElement">
                /// The DOM element to which the template control is attached to.
                /// </param>
                /// <param name="data" type="Object" locid="WinJS.Utilities.QueryCollection.template_p:data">
                /// The data to render. If the data is an array (or any other object
                /// that has a forEach method) then the template is rendered
                /// multiple times, once for each item in the collection.
                /// </param>
                /// <param name="renderDonePromiseCallback" type="Function" locid="WinJS.Utilities.QueryCollection.template_p:renderDonePromiseCallback">
                /// If supplied, this function is called
                /// each time the template gets rendered, and is passed a promise
                /// that is fulfilled when the template rendering is complete.
                /// </param>
                /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.QueryCollection.template_returnValue">
                /// The QueryCollection.
                /// </returns>
                /// </signature>
                if (templateElement instanceof exports.QueryCollection) {
                    templateElement = templateElement[0];
                }
                var template = templateElement.winControl;

                if (data === null || data === undefined || !data.forEach) {
                    data = [data];
                }

                renderDonePromiseCallback = renderDonePromiseCallback || function () { };

                var that = this;
                var donePromises = [];
                data.forEach(function (datum) {
                    that.forEach(function (element) {
                        donePromises.push(template.render(datum, element));
                    });
                });
                renderDonePromiseCallback(Promise.join(donePromises));

                return this;
            }
        }, {
            supportedForProcessing: false,
        }),

        query: function (query, element) {
            /// <signature helpKeyword="WinJS.Utilities.query">
            /// <summary locid="WinJS.Utilities.query">
            /// Executes a query selector on the specified element or the entire document.
            /// </summary>
            /// <param name="query" type="String" locid="WinJS.Utilities.query_p:query">
            /// The query selector to be executed.
            /// </param>
            /// <param name="element" optional="true" type="HTMLElement" locid="WinJS.Utilities.query_p:element">
            /// The element on which to execute the query. If this parameter is not specified, the
            /// query is executed on the entire document.
            /// </param>
            /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.query_returnValue">
            /// The QueryCollection that contains the results of the query.
            /// </returns>
            /// </signature>
            return new exports.QueryCollection((element || _Global.document).querySelectorAll(query));
        },

        id: function (id) {
            /// <signature helpKeyword="WinJS.Utilities.id">
            /// <summary locid="WinJS.Utilities.id">
            /// Looks up an element by ID and wraps the result in a QueryCollection.
            /// </summary>
            /// <param name="id" type="String" locid="WinJS.Utilities.id_p:id">
            /// The ID of the element.
            /// </param>
            /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.id_returnValue">
            /// A QueryCollection that contains the element, if it is found.
            /// </returns>
            /// </signature>
            var e = _Global.document.getElementById(id);
            return new exports.QueryCollection(e ? [e] : []);
        },

        children: function (element) {
            /// <signature helpKeyword="WinJS.Utilities.children">
            /// <summary locid="WinJS.Utilities.children">
            /// Creates a QueryCollection that contains the children of the specified parent element.
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="WinJS.Utilities.children_p:element">
            /// The parent element.
            /// </param>
            /// <returns type="WinJS.Utilities.QueryCollection" locid="WinJS.Utilities.children_returnValue">
            /// The QueryCollection that contains the children of the element.
            /// </returns>
            /// </signature>
            return new exports.QueryCollection(element.children);
        }
    });
});
