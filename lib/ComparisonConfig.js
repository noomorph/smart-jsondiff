function defaultEqualityComparer(a, b, state) {
    if ((typeof a === "object") && (typeof b === "object") && a !== null && b !== null) {
        return undefined;
    }

    return a === b;
}

function defaultKeysGetter(obj, state) {
    return Object.keys(obj);
}

function defaultValueGetter(obj, key, state) {
    return obj[key];
}

function defaultValueFormatter(obj, state) {
    return JSON.stringify(obj);
}

function ComparisonConfig(override) {
    override = override || {};
    this.equalityComparer = override.equalityComparer || defaultEqualityComparer;
    this.getKeys = override.getKeys || defaultKeysGetter;
    this.getValue = override.getValue || defaultValueGetter;
    this.formatValue = override.formatValue || defaultValueFormatter;

    this.equalityComparer = this.equalityComparer.bind(defaultEqualityComparer);
    this.getKeys = this.getKeys.bind(defaultKeysGetter);
    this.getValue = this.getValue.bind(defaultValueGetter);
    this.formatValue = this.formatValue.bind(defaultValueFormatter);
}

module.exports = {
    ComparisonConfig: ComparisonConfig,
    defaults: new ComparisonConfig()
};
