// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
define([
    '../Core/_Global',
    '../Core/_Base',
    '../Promise',
    '../Scheduler'
    ], function xhrInit(_Global, _Base, Promise, Scheduler) {
    "use strict";

    function schedule(f, arg, priority) {
        Scheduler.schedule(function xhr_callback() {
            f(arg);
        }, priority, null, "WinJS.xhr");
    }

    function noop() {
    }

    var schemeRegex = /^(\w+)\:\/\//;

    function xhr(options) {
        /// <signature helpKeyword="WinJS.xhr">
        /// <summary locid="WinJS.xhr">
        /// Wraps calls to XMLHttpRequest in a promise.
        /// </summary>
        /// <param name="options" type="Object" locid="WinJS.xhr_p:options">
        /// The options that are applied to the XMLHttpRequest object. They are: type,
        /// url, user, password, headers, responseType, data, and customRequestInitializer.
        /// </param>
        /// <returns type="WinJS.Promise" locid="WinJS.xhr_returnValue">
        /// A promise that returns the XMLHttpRequest object when it completes.
        /// </returns>
        /// </signature>
        var req;
        return new Promise(
            function (c, e, p) {
                /// <returns value="c(new XMLHttpRequest())" locid="WinJS.xhr.constructor._returnValue" />
                var priority = Scheduler.currentPriority;
                req = new _Global.XMLHttpRequest();

                var isLocalRequest = false;
                var schemeMatch = schemeRegex.exec(options.url.toLowerCase());
                if (schemeMatch) {
                    if (schemeMatch[1] === 'file') {
                        isLocalRequest = true;
                    }
                } else if (_Global.location.protocol === 'file:'){
                    isLocalRequest = true;
                }


                req.onreadystatechange = function () {
                    if (req._canceled) {
                        req.onreadystatechange = noop;
                        return;
                    }

                    if (req.readyState === 4) {
                        if ((req.status >= 200 && req.status < 300) || (isLocalRequest && req.status === 0)) {
                            schedule(c, req, priority);
                        } else {
                            schedule(e, req, priority);
                        }
                        req.onreadystatechange = noop;
                    } else {
                        schedule(p, req, priority);
                    }
                };

                req.open(
                    options.type || "GET",
                    options.url,
                    // Promise based XHR does not support sync.
                    //
                    true,
                    options.user,
                    options.password
                );
                req.responseType = options.responseType || "";

                Object.keys(options.headers || {}).forEach(function (k) {
                    req.setRequestHeader(k, options.headers[k]);
                });

                if (options.customRequestInitializer) {
                    options.customRequestInitializer(req);
                }

                if (options.data === undefined) {
                    req.send();
                } else {
                    req.send(options.data);
                }
            },
            function () {
                req.onreadystatechange = noop;
                req._canceled = true;
                req.abort();
            }
        );
    }

    _Base.Namespace.define("WinJS", {
        xhr: xhr
    });

    return xhr;

});
