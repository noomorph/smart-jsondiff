const ComparisonConfig = require('./ComparisonConfig').ComparisonConfig;
const TraverseState = require('./TraverseState');

let visitedNodes = new WeakSet();

function isVisited(node) {
    return visitedNodes.has(node);
}

function markAsVisited(node) {
    if (isComplex(node)) {
        visitedNodes.add(node);
    }
}

function isComplex(value) {
    return typeof value === 'object' || typeof value === 'function';
}

function recursiveDiff(a, b, state, config) {
    'use strict';

    if (isVisited(a) && isVisited(b)) {
        return [];
    }

    markAsVisited(a);
    markAsVisited(b);

    var areEqual = config.equalityComparer(a, b, state);

    if (areEqual === true) {
        return [];
    }

    if (areEqual === false) {
        return [["*", state.path, config.formatValue(a, state), config.formatValue(b, state)]];
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
                result.push(["+",  nextState.path, undefined, config.formatValue(valueB, nextState)]);
            }
        }

        return result;
    }
}

function compareJSON(a, b, config) {
    visitedNodes = new WeakSet();
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
