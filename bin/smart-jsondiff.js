#!/usr/local/bin/node

require('es6-shim');

var program = require('commander'),
    compare = require('../index.js'),
    fs = require('fs');


function readConfig() {
    if (process.argv[4]) {
        var txt = fs.readFileSync(process.argv[4], 'utf-8');

        return eval(txt);
    }

    return undefined;
}

if (process.argv.length < 3) {
    console.log('specify <file1> <file2>');
} else {
    var path1 = process.argv[2],
        path2 = process.argv[3],
        text1 = fs.readFileSync(path1, 'utf-8'),
        text2 = fs.readFileSync(path2, 'utf-8'),
        json1 = JSON.parse(text1),
        json2 = JSON.parse(text2),
        diff = compare.compareJson(json1, json2, readConfig());

    if (diff.length === 0) {
        console.log('JSON files are identical');
    } else {
        console.log('Found ' + diff.length + ' differences: ');
        diff.forEach(function (diff, index) {
            console.log((index + 1) + ". " + JSON.stringify(diff));
        });
    }
}
