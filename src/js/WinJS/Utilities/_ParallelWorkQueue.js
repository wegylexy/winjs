// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
define([
    'exports',
    '../Core/_Base',
    '../Promise',
    '../Scheduler'
    ], function parallelWorkQueueInit(exports, _Base, Promise, Scheduler) {
    "use strict";

    _Base.Namespace._moduleDefine(exports, "WinJS.UI", {
        _ParallelWorkQueue : _Base.Namespace._lazy(function () {
            return _Base.Class.define(function ParallelWorkQueue_ctor(maxRunning) {
                var workIndex = 0;
                var workItems = {};
                var workQueue = [];

                maxRunning = maxRunning || 3;
                var running = 0;
                var processing = 0;
                function runNext() {
                    running--;
                    // if we have fallen out of this loop, then we know we are already
                    // async, so "post" is OK. If we are still in the loop, then the
                    // loop will continue to run, so we don't need to "post" or
                    // recurse. This avoids stack overflow in the sync case.
                    //
                    if (!processing) {
                        Scheduler.schedule(run, Scheduler.Priority.normal,
                            null, "WinJS._ParallelWorkQueue.runNext");
                    }
                }
                function run() {
                    processing++;
                    for (; running < maxRunning; running++) {
                        var next;
                        var nextWork;
                        do {
                            next = workQueue.shift();
                            nextWork = next && workItems[next];
                        } while (next && !nextWork);

                        if (nextWork) {
                            delete workItems[next];
                            try {
                                nextWork().then(runNext, runNext);
                            }
                            catch (err) {
                                // this will only get hit if there is a queued item that
                                // fails to return something that conforms to the Promise
                                // contract
                                //
                                runNext();
                            }
                        } else {
                            break;
                        }
                    }
                    processing--;
                }
                function queue(f, data, first) {
                    var id = "w" + (workIndex++);
                    var workPromise;
                    return new Promise(
                        function (c, e, p) {
                            var w = function () {
                                workPromise = f().then(c, e, p);
                                return workPromise;
                            };
                            w.data = data;
                            workItems[id] = w;
                            if (first) {
                                workQueue.unshift(id);
                            } else {
                                workQueue.push(id);
                            }
                            run();
                        },
                        function () {
                            delete workItems[id];
                            if (workPromise) {
                                workPromise.cancel();
                            }
                        }
                    );
                }

                this.sort = function (f) {
                    workQueue.sort(function (a, b) {
                        a = workItems[a];
                        b = workItems[b];
                        return a === undefined && b === undefined ? 0 : a === undefined ? 1 : b === undefined ? -1 : f(a.data, b.data);
                    });
                };
                this.queue = queue;
            }, {
                /* empty */
            }, {
                supportedForProcessing: false,
            });
        })
    });

});

