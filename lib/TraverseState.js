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
