var path = require('path');
var expect = require('chai').expect;

var SJD = require(path.join(__dirname, '..', 'index.js'));

describe('JSON patch algorithm', function () {
    'use strict';

    var $S = JSON.stringify.bind(JSON),
        EMPTY = "",
        A,
        B;

    describe("simple comparer", function () {
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
        });

        it('can apply empty patch', function () {
            B = SJD.patchJson(A, []);
            expect(B).to.eql(A);
        });

        it('can delete root property', function () {
            B = SJD.patchJson(A, [["-", "a", EMPTY, EMPTY]]);
            delete A.a;

            expect(B).to.eql(A);
        });

        it('can modify root property', function () {
            B = SJD.patchJson(A, [["*", "a", EMPTY, $S(6)]]);
            A.a = 6;

            expect(B).to.eql(A);
        });

        it('can add root property', function () {
            B = SJD.patchJson(A, [["+", "c", EMPTY, $S("hello")]]);
            A.c = "hello";

            expect(B).to.eql(A);
        });

        it('can add nested property', function () {
            B = SJD.patchJson(A, [["+", "x.a", EMPTY, $S({})]]);
            A.x.a = {};

            expect(B).to.eql(A);
        });

        it('can modify nested property', function () {
            B = SJD.patchJson(A, [["*", "b.0.y", EMPTY, $S(0)]]);
            A.b[0].y = 0;

            expect(B).to.eql(A);
        });

        it('can delete nested property', function () {
            B = SJD.patchJson(A, [["-", "b.0.y"]]);
            delete A.b[0].y;

            expect(B).to.eql(A);
        });

        it('can add element to array', function () {
            B = SJD.patchJson(A, [["+", "b.3", EMPTY, $S({})]]);
            A.b.push({});

            expect(B).to.eql(A);
            expect(B.b.length).to.eq(4);
        });

        it('can modify element in array', function () {
            B = SJD.patchJson(A, [["*", "b.0", EMPTY, $S(null)]]);
            A.b[0] = null;

            expect(B).to.eql(A);
        });

        it('can delete element from array', function () {
            B = SJD.patchJson(A, [["-", "b.1"]]);
            A.b.splice(1, 1);

            expect(B).to.eql(A);
        });

        it('can delete series of elements from array', function () {
            A = [1, 3];

            B = SJD.patchJson([0, 1, 2, 3, 4], [
                ["-", "4"],
                ["-", "0"],
                ["-", "2"]
            ]);

            expect(B).to.eql(A);
        });

        it('should not modify object A', function () {
            B = SJD.patchJson(A, [["-", "b"]]);

            expect(B).to.not.eq(A);
        });

        it('should ignore array order changes', function () {
            B = SJD.patchJson(A, [
                ["~", "b", 0, 1],
                ["~", "b", 1, 0]
            ]);

            expect(B.b[0]).to.eql(A.b[0]);
            expect(B.b[1]).to.eql(A.b[1]);
        });

        it('should modify object A if doNotClone === true', function () {
            B = SJD.patchJson(A, [["-", "b"]], { doNotClone: true });

            expect(A).to.eq(B);
            expect(A.b).to.eq(undefined);
        });
    });
});
