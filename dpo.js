// CSV in, preference pairs out. Plain functions so index.html and dpo.test.js share them.

// RFC 4180 CSV: a quoted field may hold commas, newlines, and "" for a literal quote.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = text.startsWith("﻿") ? 1 : 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// The non-empty cells of the "response" column. Other columns, such as id, are ignored.
function readResponses(text) {
  const [header, ...rows] = parseCsv(text);
  const column = header ? header.indexOf("response") : -1;
  if (column === -1) {
    throw new Error(`CSV needs a "response" column; its header is: ${header}`);
  }
  return rows.map((row) => row[column]).filter((response) => response);
}

// Two distinct indices below n, uniformly at random.
function pickPair(n, random = Math.random) {
  const a = Math.floor(random() * n);
  let b = Math.floor(random() * (n - 1));
  if (b >= a) b++;
  return [a, b];
}

// [[accepted, rejected], ...] as CSV, every field quoted.
function pairsToCsv(pairs) {
  const quote = (field) => `"${field.replaceAll('"', '""')}"`;
  const lines = [["accepted", "rejected"], ...pairs].map((pair) => pair.map(quote).join(","));
  return lines.join("\n") + "\n";
}

if (typeof module === "object") {
  module.exports = { parseCsv, readResponses, pickPair, pairsToCsv };
}
