function addNumbers(a, b) {
  const parsedA = Number(a);
  const parsedB = Number(b);

  if (!Number.isFinite(parsedA) || !Number.isFinite(parsedB)) {
    throw new Error('Invalid numeric input');
  }

  return parsedA + parsedB;
}

module.exports = {
  addNumbers
};
