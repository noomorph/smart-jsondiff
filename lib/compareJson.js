var ComparisonConfig = require('./ComparisonConfig').ComparisonConfig;
    TraverseState = require('./TraverseState');

function recursiveDiff(a, b, state, config) {
    'use strict';

    var areEqual = config.equalityComparer(a, b, state);

    if (areEqual === true) {
        return [];
    }

    if (areEqual === false) {
        return [["*", state.path, config.formatValue(a, state), config.formatValue(b, state)]];
    }

    if (areEqual === undefined) {
        var keysA = config.getKeys(a, state),
            keysB = config.getKeys(b, state),
            valueA,
            valueB,
            key,
            nextState,
            i,
            result = [];

        for (i = 0; i < keysA.length; i++) {
            key = keysA[i];
            nextState = state.getNextState(key);
            valueA = config.getValue(a, key, nextState);

            if (keysB.indexOf(key) === -1) {
                result.push(["-", nextState.path, config.formatValue(valueA, nextState), undefined]);
            } else {
                valueB = config.getValue(b, key, nextState);
                result = result.concat(recursiveDiff(valueA, valueB, nextState, config));
            }
        }

        for (i = 0; i < keysB.length; i++) {
            key = keysB[i];
            nextState = state.getNextState(key);

            if (keysA.indexOf(key) === -1) {
                valueB = config.getValue(b, key, nextState);
                result.push(["+",  nextState.path, undefined, config.formatValue(valueB, nextState)]);
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
