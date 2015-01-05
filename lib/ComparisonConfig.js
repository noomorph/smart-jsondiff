function defaultEqualityComparer(a, b, state) {
    if ((typeof a === "object") && (typeof b === "object") && a !== null && b !== null) {
        return undefined;
    }

    return a === b;
}

function keysReducer(map, key) {
    map[key] = key;
    return map;
}

function defaultEntriesGetter(obj, state) {
    return Object.keys(obj).reduce(keysReducer, {});
}

function defaultValueFormatter(obj, state) {
    return JSON.stringify(obj);
}

function defaultValueParser(obj, state) {
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
