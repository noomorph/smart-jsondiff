require('es6-shim');

var path = require('path');
var expect = require('chai').expect;

var diff = require(path.join(__dirname, '..', './index.js'));

describe('JSON diff algorithm', function () {
  'use strict';

  var A, B;
  var $S = JSON.stringify.bind(JSON);

  describe("simple comparer", function () {

      beforeEach(function () {
          A = createJSON();
          B = createJSON();
      });

      it('returns [] if A=B', function () {
          expect(diff.compareJson(A, B)).to.eql([]);
      });

      it('returns [-b] if A.b and !B.b', function () {
          delete B.b;
          expect(diff.compareJson(A, B)).to.eql([["-", "b", $S(A.b), undefined]]);
      });

      it('returns [+b] if !A.b and B.b', function () {
          delete A.b;
          expect(diff.compareJson(A, B)).to.eql([["+", "b", undefined, $S(B.b)]]);
      });

      it('returns [+b] if !A.b and B.b', function () {
          delete A.b;
          expect(diff.compareJson(A, B)).to.eql([["+", "b", undefined, $S(B.b)]]);
      });

      it('returns [-x.a] if A.x.a and !B.x.a', function () {
          A.x.a = "";
          expect(diff.compareJson(A, B)).to.eql([["-", "x.a", $S(A.x.a), undefined]]);
      });

      it('returns [+x.a] if !A.x.a and B.x.a', function () {
          B.x.a = "";
          expect(diff.compareJson(A, B)).to.eql([["+", "x.a", undefined, $S(B.x.a)]]);
      });

      it('returns [[*b.0, XXX, YYY], [*b.1, YYY, XXX]] if b[0] <-> b[1]', function () {
          var b0 = B.b[0];
          B.b[0] = B.b[1];
          B.b[1] = b0;

          expect(diff.compareJson(A, B)).to.eql([
              ["*", "b.0.y", $S(A.b[0].y), $S(B.b[0].y)],
              ["*", "b.1.y", $S(A.b[1].y), $S(B.b[1].y)]
          ]);
      });

      function createJSON() {
          return {
              a: 5,
              x: { },
              b: [
                  { y: 1 },
                  { y: 2 },
                  { y: 3 }
              ]
          };
      }
  });

  describe("custom comparer", function () {
      var config;

      beforeEach(function () {
          A = createJSON();
          B = createJSON();

          config = {
              getKeys: function (obj, state) {
                  if (/\.set$/.test(state.path)) {
                      return obj.map(function (o) {
                          return o.id;
                      });
                  }

                  return diff.defaults.getKeys(obj, state);
              },
              getValue: function (obj, key, state) {
                  if (state.path.match(/^set\.[^\.]+$/)) {
                      return obj.find(function (o) {
                          return o.id === key;
                      });
                  }

                  return diff.defaults.getValue(obj, key, state);
              }
          };
      });

      it("ignores order of elements in set", function () {
          B.set[0] = A.set[1];
          B.set[1] = A.set[0];

          expect(diff.compareJson(A, B, config)).to.eql([]);
      });

      it("does not ignore order of elements in list", function () {
          B.list[0] = A.list[1];
          B.list[1] = A.list[0];

          expect(diff.compareJson(A, B, config)).to.eql([
              ["*", "list.0", $S(10), $S(20)],
              ["*", "list.1", $S(20), $S(10)]
          ]);
      });

      function createJSON() {
          return {
              set: [
                  { id: 'I', data: 'first' },
                  { id: 'II', data: 'second' },
                  { id: 'III', data: 'third' }
              ],
              list: [
                  10,
                  20,
                  30
              ]
          };
      }
  });
});
