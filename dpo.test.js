const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { parseCsv, readResponses, pickPair, pairsToCsv } = require("./dpo.js");

test("reads every response in sample_data.csv", () => {
  const sample = fs.readFileSync(path.join(__dirname, "sample_data.csv"), "utf8");
  const responses = readResponses(sample);
  assert.equal(responses.length, 15);
  assert.match(responses[0], /^The quick brown fox/);
  assert.match(responses[1], /from healthcare to finance, transportation to education\.$/);
});

test("parses quoted commas, doubled quotes, newlines, CRLF, and a BOM", () => {
  const text = '﻿id,response\r\n1,"a, b"\r\n2,"say ""hi"""\r\n3,"line one\nline two"\r\n';
  assert.deepEqual(parseCsv(text), [
    ["id", "response"],
    ["1", "a, b"],
    ["2", 'say "hi"'],
    ["3", "line one\nline two"],
  ]);
});

test("finds the response column by name and skips empty cells", () => {
  assert.deepEqual(readResponses("response,id\nfirst,1\n,2\nsecond,3\n"), ["first", "second"]);
});

test("rejects a CSV without a response column", () => {
  assert.throws(() => readResponses("id,text\n1,hello\n"), /"response" column/);
  assert.throws(() => readResponses(""), /"response" column/);
});

test("pickPair returns two distinct indices in range", () => {
  for (let i = 0; i < 1000; i++) {
    const [a, b] = pickPair(3);
    assert.notEqual(a, b);
    assert.ok(a >= 0 && a < 3 && b >= 0 && b < 3);
  }
  assert.deepEqual(pickPair(2, () => 0.99), [1, 0]);
});

test("pairs CSV round-trips through the parser", () => {
  const pairs = [
    ["good, with comma", 'bad "quoted"'],
    ["multi\nline", "plain"],
  ];
  assert.deepEqual(parseCsv(pairsToCsv(pairs)), [["accepted", "rejected"], ...pairs]);
});
