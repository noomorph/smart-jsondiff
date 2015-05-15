(function e(t, n, r) {
    "use strict";
    function s(o, u) {
        if (!n[o]) {
/*eslint semi:0*/
            if (!t[o]) {
                var a = typeof require === "function" && require;
                if (!u && a) {return a(o, !0);}
                if (i) {return i(o, !0);}
                var f = new Error("Cannot find module '" + o + "'");
/*eslint no-sequences:0*/
                f.code = "MODULE_NOT_FOUND";
                throw f;
            }
            var l = n[o] = {exports: {}};
            t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];
                return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
    }

    var i = typeof require === "function" && require;
    for (var o = 0; o < r.length; o++) {s(r[o]);}
    return s;
})({1: [function (require, module/*, exports*/) {
    "use strict";
    module.exports = {
        compareJson: require('./lib/compareJson'),
        patchJson: require('./lib/patchJson'),
        defaults: require('./lib/ComparisonConfig').defaults
    };

}, {"./lib/ComparisonConfig": 2, "./lib/compareJson": 4, "./lib/patchJson": 5}], 2: [function (require, module/*, exports*/) {
    "use strict";
    function defaultEqualityComparer(a, b/*, state*/) {
        if ((typeof a === "object") && (typeof b === "object") && a !== null && b !== null) {
            return undefined;
        }

        return a === b;
    }

    function keysReducer(map, key) {
        map[key] = key;
        return map;
    }

    function defaultEntriesGetter(obj/*, state*/) {
        return Object.keys(obj).reduce(keysReducer, {});
    }

    function defaultValueFormatter(obj/*, state*/) {
        return JSON.stringify(obj);
    }

    function defaultValueParser(obj/*, state*/) {
        if (typeof obj !== "string") {
            return obj;
        }

        return JSON.parse(obj);
    }

    function ComparisonConfig(override) {
        override = override || {};

        this.doNotClone = override.doNotClone || false;
        this.compareIndices = override.compareIndices || false;

        this.equalityComparer = override.equalityComparer || defaultEqualityComparer;
        this.getEntries = override.getEntries || defaultEntriesGetter;
        this.formatValue = override.formatValue || defaultValueFormatter;
        this.parseValue = override.formatValue || defaultValueParser;

        this.equalityComparer = this.equalityComparer.bind(defaultEqualityComparer);
        this.getEntries = this.getEntries.bind(defaultEntriesGetter);
        this.formatValue = this.formatValue.bind(defaultValueFormatter);
        this.parseValue = this.parseValue.bind(defaultValueParser);
    }

    module.exports = {
        ComparisonConfig: ComparisonConfig,
        defaults: new ComparisonConfig()
    };

}, {}], 3: [function (require, module/*, exports*/) {
    "use strict";
    function TraverseState(root, path) {
        this.path = path;
        this.root = root;
    }

    TraverseState.prototype.getNextState = function (to) {
        var path = this.getNextPath(to);

        return new TraverseState(this.root, path);
    };

    TraverseState.prototype.getNextPath = function (to) {
        if (this.path) {
            return this.path + "." + to;
        }

        return to;
    };

    module.exports = TraverseState;

}, {}], 4: [function (require, module/*, exports*/) {
    "use strict";
    var ComparisonConfig = require('./ComparisonConfig').ComparisonConfig;
    var TraverseState = require('./TraverseState');

    function recursiveDiff(a, b, state, config) {

        var areEqual = config.equalityComparer(a, b, state);

        if (areEqual === true) {
            return [];
        }

        if (areEqual === false) {
            return [
                ["*", state.path, config.formatValue(a, state), config.formatValue(b, state)]
            ];
        }

        if (areEqual === undefined) {
            var entriesA = config.getEntries(a, state),
                entriesB = config.getEntries(b, state),
                keysA = Object.keys(entriesA),
                keysB = Object.keys(entriesB),
                indexA,
                indexB,
                valueA,
                valueB,
                key,
                nextState,
                i,
                result = [];

            for (i = 0; i < keysA.length; i++) {
                key = keysA[i];
                nextState = state.getNextState(key);
                indexA = entriesA[key];
                valueA = a[indexA];

                if (!entriesB.hasOwnProperty(key)) {
                    result.push(["-", nextState.path, config.formatValue(valueA, nextState), undefined]);
                } else {
                    indexB = entriesB[key];
                    valueB = b[indexB];

                    if (config.compareIndices && indexA !== indexB) {
                        result.push(["~", nextState.path, indexA, indexB]);
                    }

                    result = result.concat(recursiveDiff(valueA, valueB, nextState, config));
                }
            }

            for (i = 0; i < keysB.length; i++) {
                key = keysB[i];
                nextState = state.getNextState(key);

                if (!entriesA.hasOwnProperty(key)) {
                    valueB = b[entriesB[key]];
                    result.push(["+", nextState.path, undefined, config.formatValue(valueB, nextState)]);
                }
            }

            return result;
        }
    }

    function compareJSON(a, b, config) {
        config = new ComparisonConfig(config);

        var root;

        if (config.doNotClone) {
            root = {
                a: a,
                b: b
            };
        } else {
            root = {
                a: JSON.parse(JSON.stringify(a)),
                b: JSON.parse(JSON.stringify(b))
            };
        }

        return recursiveDiff(
            root.a,
            root.b,
            new TraverseState(root, ""),
            config
        );
    }

    module.exports = compareJSON;

}, {"./ComparisonConfig": 2, "./TraverseState": 3}], 5: [function (require, module/*, exports*/) {
    "use strict";
    var ComparisonConfig = require('./ComparisonConfig').ComparisonConfig;
    var TraverseState = require('./TraverseState');

    function isArrayElementDeletion(obj, realKey) {
        return Array.isArray(obj) && !isNaN(+realKey);
    }

    function postponeArrayElementDeletion(map, arr, realKey) {
        if (map.has(arr)) {
            map.get(arr).push(realKey);
        } else {
            map.set(arr, [realKey]);
        }
    }

    function patchDiff(root, diff, deletions, state, config) {

        var obj = root,
            sign = diff[0],
            path = diff[1],
            value = diff[3],
            separator = config.separator || '.';

        path.split(separator).forEach(function (key, index, segments) {
            var entries = config.getEntries(obj, state),
                realKey = entries.hasOwnProperty(key) ? entries[key] : key;

            if (index < segments.length - 1) {
                obj = obj[realKey];
                state = state.getNextState(key);
            } else if (sign === '*' || sign === '+') {
                obj[realKey] = config.parseValue(value, state);
            } else if (sign === '-') {
                if (isArrayElementDeletion(obj, realKey)) {
                    postponeArrayElementDeletion(deletions, obj, realKey);
                } else {
                    delete obj[realKey];
                }
            }
        });
    }

    function executeDeletions(map) {
        map.forEach(function (value, key/*, map*/) {
            value.sort();

            for (var i = value.length - 1; i >= 0; i--) {
                key.splice(value[i], 1);
            }
        });
    }

    function patchJSON(obj, diffs, config) {
        config = new ComparisonConfig(config);

        var root;

        if (config.doNotClone) {
            root = obj;
        } else {
            root = JSON.parse(JSON.stringify(obj));
        }

        var deletions = new Map();
        diffs.forEach(function (diff) {
            patchDiff(root, diff, deletions, new TraverseState(root, ""), config);
        });

        executeDeletions(deletions);

        return root;
    }

    module.exports = patchJSON;

}, {"./ComparisonConfig": 2, "./TraverseState": 3}], 6: [function (require/*, module, exports*/) {
    "use strict";
    var indexPackage = require('./index');
    window.compareJson = indexPackage.compareJson;
}, {"./index": 1}]}, {}, [6]);
