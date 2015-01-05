var path = require('path');
var expect = require('chai').expect;

var SJD = require(path.join(__dirname, '..', 'index.js'));

describe('JSON patch and diff algorithms integration', function () {
    'use strict';

    var $S = JSON.stringify.bind(JSON),
        EMPTY = "",
        A,
        B;

    beforeEach(function () {
        A = {
            a: 5,
            x: { },
            b: [
                { y: 1 },
                { y: 2 },
                { y: 3 }
            ]
        };

        B = {
            // a -> deleted
            x: "modified",
            b: [
                { t: 2, y: 1 },
                { y: 5 }
            ]
        };
    });

    it('can make A object out of B', function () {
        var patch = SJD.compareJson(B, A);
        var A2 = SJD.patchJson(B, patch);
        expect(A2).to.eql(A);
    });

    it('can make B object out of A', function () {
        var patch = SJD.compareJson(A, B);
        var B2 = SJD.patchJson(A, patch);
        expect(B2).to.eql(B);
    });

    it('can make A object out of B object made from A object', function () {
        var patchA = SJD.compareJson(B, A);
        var patchB = SJD.compareJson(A, B);

        var B2 = SJD.patchJson(A, patchB);
        var A2 = SJD.patchJson(B2, patchA);

        expect(A2).to.eql(A);
    });

    it('can make B object out of A object made from B object', function () {
        var patchA = SJD.compareJson(B, A);
        var patchB = SJD.compareJson(A, B);

        var A2 = SJD.patchJson(B, patchA);
        var B2 = SJD.patchJson(A2, patchB);

        expect(B2).to.eql(B);
    });
});
