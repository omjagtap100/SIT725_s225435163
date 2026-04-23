const { expect } = require('chai');

const { addNumbers } = require('../utils/calculator');

describe('Calculation Function: addNumbers()', function () {
  it('adds two valid integers correctly (valid behaviour)', function () {
    const result = addNumbers(10, 5);
    expect(result).to.equal(15);
  });

  it('adds decimal values correctly (edge case)', function () {
    const result = addNumbers(0.1, 0.2);
    expect(result).to.be.closeTo(0.3, 0.000001);
  });

  it('throws error for non-numeric input (invalid behaviour)', function () {
    expect(() => addNumbers('abc', 2)).to.throw('Invalid numeric input');
  });
});
