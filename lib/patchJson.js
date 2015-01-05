require('es6-shim');

var ComparisonConfig = require('./ComparisonConfig').ComparisonConfig;
    TraverseState = require('./TraverseState');

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
    'use strict';

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
        } else {
            if (sign === '*' || sign === '+') {
                obj[realKey] = config.parseValue(value, state);
            } else if (sign === '-') {
                if (isArrayElementDeletion(obj, realKey)) {
                    postponeArrayElementDeletion(deletions, obj, realKey);
                } else {
                    delete obj[realKey];
                }
            }
        }
    });
}

function executeDeletions(map) {
    map.forEach(function (value, key, map) {
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
