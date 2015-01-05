require('es6-shim');

var path = require('path');
var expect = require('chai').expect;

var SJD = require(path.join(__dirname, '..', './index.js'));

describe('JSON diff algorithm', function () {
  'use strict';

  var A, B;
  var $S = SJD.defaults.formatValue;

  describe("simple comparer", function () {

      beforeEach(function () {
          A = createJSON();
          B = createJSON();
      });

      it('returns [] if A=B', function () {
          expect(SJD.compareJson(A, B)).to.eql([]);
      });

      it('returns [-b] if A.b and !B.b', function () {
          delete B.b;
          expect(SJD.compareJson(A, B)).to.eql([["-", "b", $S(A.b), undefined]]);
      });

      it('returns [+b] if !A.b and B.b', function () {
          delete A.b;
          expect(SJD.compareJson(A, B)).to.eql([["+", "b", undefined, $S(B.b)]]);
      });

      it('returns [+b] if !A.b and B.b', function () {
          delete A.b;
          expect(SJD.compareJson(A, B)).to.eql([["+", "b", undefined, $S(B.b)]]);
      });

      it('returns [-x.a] if A.x.a and !B.x.a', function () {
          A.x.a = "";
          expect(SJD.compareJson(A, B)).to.eql([["-", "x.a", $S(A.x.a), undefined]]);
      });

      it('returns [+x.a] if !A.x.a and B.x.a', function () {
          B.x.a = "";
          expect(SJD.compareJson(A, B)).to.eql([["+", "x.a", undefined, $S(B.x.a)]]);
      });

      it('returns [[*b.0, XXX, YYY], [*b.1, YYY, XXX]] if b[0] <-> b[1]', function () {
          var b0 = B.b[0];
          B.b[0] = B.b[1];
          B.b[1] = b0;

          expect(SJD.compareJson(A, B)).to.eql([
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
              getEntries: function (obj, state) {
                  if (state.path === 'set') {
                      return obj.reduce(function (map, o, index) {
                          map[o.id] = index;
                          return map;
                      }, {});
                  }

                  return this(obj, state);
              }
          };
      });

      it("ignores order of elements in set", function () {
          B.set[0] = A.set[1];
          B.set[1] = A.set[0];

          expect(SJD.compareJson(A, B, config)).to.eql([]);
      });

      it("detects real changes in the set", function () {
          var t = B.set[0];
          B.set[0] = B.set[1];
          B.set[1] = t;
          t.data = "other";

          expect(SJD.compareJson(A, B, config)).to.eql([
              ['*', 'set.I.data', $S('first'), $S('other')]
          ]);
      });

      it("can detect index changes in the set as well", function () {
          config.compareIndices = true;

          var t = B.set[0];
          B.set[0] = B.set[1];
          B.set[1] = t;
          t.data = "other";

          expect(SJD.compareJson(A, B, config)).to.eql([
              ['~', 'set.I', 0, 1],
              ['*', 'set.I.data', $S('first'), $S('other')],
              ['~', 'set.II', 1, 0]
          ]);
      });

      it("does not ignore order of elements in list", function () {
          B.list[0] = A.list[1];
          B.list[1] = A.list[0];

          expect(SJD.compareJson(A, B, config)).to.eql([
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
