/**
 * SIT725 – 5.4D Validation Tests (MANDATORY TEMPLATE)
 *
 * HOW TO RUN: (Node.js 18+ is required)
 *   1. Start MongoDB
 *   2. Start your server (npm start)
 *   3. node validation-tests.js
 *
 * DO NOT MODIFY:
 *   - Output format (TEST|, SUMMARY|, COVERAGE|)
 *   - test() function signature
 *   - Exit behaviour
 *   - coverageTracker object
 *   - Logging structure
 *
 * YOU MUST:
 *   - Modify makeValidBook() to satisfy your schema rules
 *   - Add sufficient tests to meet coverage requirements
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_BASE = "/api/books";

// =============================
// INTERNAL STATE (DO NOT MODIFY)
// =============================

const results = [];

const coverageTracker = {
  CREATE_FAIL: 0,
  UPDATE_FAIL: 0,
  TYPE: 0,
  REQUIRED: 0,
  BOUNDARY: 0,
  LENGTH: 0,
  TEMPORAL: 0,
  UNKNOWN_CREATE: 0,
  UNKNOWN_UPDATE: 0,
  IMMUTABLE: 0,
};

// =============================
// OUTPUTS FORMAT (DO NOT MODIFY)
// =============================

function logHeader(uniqueId) {
  console.log("SIT725_VALIDATION_TESTS");
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`API_BASE=${API_BASE}`);
  console.log(`INFO|Generated uniqueId=${uniqueId}`);
}

function logResult(r) {
  console.log(
    `TEST|${r.id}|${r.name}|${r.method}|${r.path}|expected=${r.expected}|actual=${r.actual}|pass=${r.pass ? "Y" : "N"}`
  );
}

function logSummary() {
  const failed = results.filter(r => !r.pass).length;
  console.log(
    `SUMMARY|pass=${failed === 0 ? "Y" : "N"}|failed=${failed}|total=${results.length}`
  );
  return failed === 0;
}

function logCoverage() {
  console.log(
    `COVERAGE|CREATE_FAIL=${coverageTracker.CREATE_FAIL}` +
    `|UPDATE_FAIL=${coverageTracker.UPDATE_FAIL}` +
    `|TYPE=${coverageTracker.TYPE}` +
    `|REQUIRED=${coverageTracker.REQUIRED}` +
    `|BOUNDARY=${coverageTracker.BOUNDARY}` +
    `|LENGTH=${coverageTracker.LENGTH}` +
    `|TEMPORAL=${coverageTracker.TEMPORAL}` +
    `|UNKNOWN_CREATE=${coverageTracker.UNKNOWN_CREATE}` +
    `|UNKNOWN_UPDATE=${coverageTracker.UNKNOWN_UPDATE}` +
    `|IMMUTABLE=${coverageTracker.IMMUTABLE}`
  );
}

// =============================
// HTTP HELPER
// =============================

async function http(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  return { status: res.status, text };
}

// =============================
// TEST REGISTRATION FUNCTION
// =============================

async function test({ id, name, method, path, expected, body, tags }) {

  const { status } = await http(method, path, body);
  const pass = status === expected;

  const result = { id, name, method, path, expected, actual: status, pass };
  results.push(result);
  logResult(result);

  // treat missing or invalid tags as []
  const safeTags = Array.isArray(tags) ? tags : [];

  safeTags.forEach(tag => {
    if (Object.prototype.hasOwnProperty.call(coverageTracker, tag)) {
      coverageTracker[tag]++;
    }
  });
}

// =============================
// STUDENT MUST MODIFY THESE
// =============================

function makeValidBook(id) {
  return {
    id,
    title: "Valid Title",
    author: "Valid Author",
    year: 2020,
    genre: "Other",
    summary: "Valid summary text that satisfies your rules.",
    price: "9.99"
  };
}

function makeValidUpdate() {
  return {
    title: "Updated Title",
    author: "Updated Author",
    year: 2021,
    genre: "Other",
    summary: "Updated summary text.",
    price: "10.50"
  };
}

// =============================
// REQUIRED BASE TESTS (DO NOT REMOVE)
// =============================

async function run() {

  const uniqueId = `b${Date.now()}`;
  logHeader(uniqueId);

  const createPath = API_BASE;
  const updatePath = (id) => `${API_BASE}/${id}`;

  // ---- T01 Valid CREATE ----
  await test({
    id: "T01",
    name: "Valid create",
    method: "POST",
    path: createPath,
    expected: 201,
    body: makeValidBook(uniqueId),
    tags: []
  });

  // ---- T02 Duplicate ID ----
  await test({
    id: "T02",
    name: "Duplicate ID",
    method: "POST",
    path: createPath,
    expected: 409,
    body: makeValidBook(uniqueId),
    tags: ["CREATE_FAIL"]
  });

  // ---- T03 Immutable ID ----
  await test({
    id: "T03",
    name: "Immutable ID on update",
    method: "PUT",
    path: updatePath(uniqueId),
    expected: 400,
    body: { ...makeValidUpdate(), id: "b999" },
    tags: ["UPDATE_FAIL", "IMMUTABLE"]
  });

  // ---- T04 Unknown field CREATE ----
  await test({
    id: "T04",
    name: "Unknown field CREATE",
    method: "POST",
    path: createPath,
    expected: 400,
    body: { ...makeValidBook(`b${Date.now() + 1}`), hack: true },
    tags: ["CREATE_FAIL", "UNKNOWN_CREATE"]
  });

  // ---- T05 Unknown field UPDATE ----
  await test({
    id: "T05",
    name: "Unknown field UPDATE",
    method: "PUT",
    path: updatePath(uniqueId),
    expected: 400,
    body: { ...makeValidUpdate(), hack: true },
    tags: ["UPDATE_FAIL", "UNKNOWN_UPDATE"]
  });

  // =====================================
  // STUDENTS MUST ADD ADDITIONAL TESTS
  // =====================================

  const rid = (suffix) => `b${Date.now()}${suffix}`;

  const bMissingTitle = makeValidBook(rid("m6"));
  delete bMissingTitle.title;
  await test({
    id: "T06",
    name: "CREATE missing title",
    method: "POST",
    path: createPath,
    expected: 400,
    body: bMissingTitle,
    tags: ["CREATE_FAIL", "REQUIRED"]
  });

  const bFuture = makeValidBook(rid("m7"));
  bFuture.year = new Date().getFullYear() + 5;
  await test({
    id: "T07",
    name: "CREATE year in future",
    method: "POST",
    path: createPath,
    expected: 400,
    body: bFuture,
    tags: ["CREATE_FAIL", "TEMPORAL"]
  });

  const bOldYear = makeValidBook(rid("m8"));
  bOldYear.year = 999;
  await test({
    id: "T08",
    name: "CREATE year below minimum",
    method: "POST",
    path: createPath,
    expected: 400,
    body: bOldYear,
    tags: ["CREATE_FAIL", "BOUNDARY"]
  });

  const bShortTitle = makeValidBook(rid("m9"));
  bShortTitle.title = "A";
  await test({
    id: "T09",
    name: "CREATE title too short",
    method: "POST",
    path: createPath,
    expected: 400,
    body: bShortTitle,
    tags: ["CREATE_FAIL", "LENGTH"]
  });

  const bBadPrice = makeValidBook(rid("m10"));
  bBadPrice.price = "0.001";
  await test({
    id: "T10",
    name: "CREATE price below minimum",
    method: "POST",
    path: createPath,
    expected: 400,
    body: bBadPrice,
    tags: ["CREATE_FAIL", "BOUNDARY"]
  });

  const bBadYearType = makeValidBook(rid("m11"));
  bBadYearType.year = "twenty";
  await test({
    id: "T11",
    name: "CREATE non-numeric year",
    method: "POST",
    path: createPath,
    expected: 400,
    body: bBadYearType,
    tags: ["CREATE_FAIL", "TYPE"]
  });

  await test({
    id: "T12",
    name: "UPDATE missing required field",
    method: "PUT",
    path: updatePath(uniqueId),
    expected: 400,
    body: {
      title: "Only Title",
      author: "Author",
      year: 2019,
      genre: "Other",
      summary: "Summary text long enough for rules."
    },
    tags: ["UPDATE_FAIL", "REQUIRED"]
  });

  await test({
    id: "T13",
    name: "UPDATE non-existent book",
    method: "PUT",
    path: updatePath("b_no_such_book_xyz"),
    expected: 404,
    body: makeValidUpdate(),
    tags: ["UPDATE_FAIL"]
  });

  const bShortSummary = makeValidBook(rid("m14"));
  bShortSummary.summary = "short";
  await test({
    id: "T14",
    name: "CREATE summary too short",
    method: "POST",
    path: createPath,
    expected: 400,
    body: bShortSummary,
    tags: ["CREATE_FAIL", "LENGTH"]
  });

  await test({
    id: "T15",
    name: "CREATE id fails pattern",
    method: "POST",
    path: createPath,
    expected: 400,
    body: {
      ...makeValidBook("x_bad_prefix"),
      id: "x_bad_prefix"
    },
    tags: ["CREATE_FAIL", "TYPE"]
  });

  const longTitle = "Y".repeat(301);
  await test({
    id: "T16",
    name: "UPDATE title exceeds max length",
    method: "PUT",
    path: updatePath(uniqueId),
    expected: 400,
    body: { ...makeValidUpdate(), title: longTitle },
    tags: ["UPDATE_FAIL", "LENGTH"]
  });

  const pass = logSummary();
  logCoverage();

  process.exit(pass ? 0 : 1);
}

run().catch(err => {
  console.error("ERROR", err);
  process.exit(2);
});
