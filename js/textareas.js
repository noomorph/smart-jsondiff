(function onload(window) {
    "use strict";

    var document = window.document;

    var jsonA = "",
        jsonB = "",
        output = "",
        logEl = document.getElementById("diff");

    function log(msg) {
        output = msg;
        logEl.value = output;
    }

    function formatDiff(diffArray) {
        if (diffArray.length < 1) {
            return "JSON structures are identical.";
        }

        return diffArray.map(function (diff) {
            return [ "-------------DIFF-------------",
                     "[" + diff[0] + "] in path: " + diff[1],
                     "a = " + JSON.stringify(diff[2]),
                     "b = " + JSON.stringify(diff[3]),
                     "-------------------------------"
            ].join("\n");
        }).join("\n");
    }

    function compare(a, b) {
        return window.compareJson(JSON.parse(a), JSON.parse(b));
    }

    function runCompare() {
        if (jsonA && jsonB) {
            var diff = compare(jsonA, jsonB);
            log(formatDiff(diff));
        } else {
            var msg = []
                .concat(jsonA ? [] : ["JSON A - missing"])
                .concat(jsonB ? [] : ["JSON B - missing"]);

            log(msg.join("\n"));
        }
    }

    function onDragOver(e) {
        e.target.className = "accepts-file";
        e.preventDefault();
    }

    function onDragEnd(e) {
        e.target.className = "";
        e.preventDefault();
    }

    function onDrop(e) {
        e.target.className = "";
        e.preventDefault();

        var file = e.dataTransfer.files[0];
        var reader = new window.FileReader();

        var self = this;
        reader.onload = function (ev) {
            self(ev.target.result);
            e.target.value = ev.target.result;
        };

        reader.readAsText(file);
    }

    function onChange(e) {
        this(e.target.value);
    }

    function addEventListeners(id, setter) {
        var el = document.getElementById(id);
        el.addEventListener("dragover", onDragOver);
        el.addEventListener("dragend", onDragEnd);
        el.addEventListener("drop", onDrop.bind(setter));
        el.addEventListener("change", onChange.bind(setter));
        el.addEventListener("keyup", onChange.bind(setter));
    }

    addEventListeners("jsonA", function (value, value2) {
        jsonA = value.trim();
        if (value2) {
            jsonB = value2.trim();
        }
        runCompare();
    });

    addEventListeners("jsonB", function (value, value2) {
        jsonB = value.trim();
        if (value2) {
            jsonA = value2.trim();
        }
        runCompare();
    });

    window.onerror = function globalErrorHandler(msg, url, row, col) {
        log([
            "Error on line " + row + ", column " + col,
            "URL: " + url,
            "Message:",
            msg
        ].join("\n"));
    };
}(this));
