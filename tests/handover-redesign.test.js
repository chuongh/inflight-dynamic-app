const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("inline application script is valid JavaScript", () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .filter((script) => script.trim());
  assert.ok(scripts.length > 0);
  scripts.forEach((script) => assert.doesNotThrow(() => new vm.Script(script)));
});

test("device custody supports onboard storage and two-step crew transfer", () => {
  assert.match(html, /deviceMode:\s*"onboard"/);
  assert.match(html, /deviceOfferedAt:\s*null/);
  assert.match(html, /deviceReceivedAt:\s*null/);
  assert.match(html, /Để lại trên tàu bay/);
  assert.match(html, /Chờ tổ mới xác nhận/);
  assert.doesNotMatch(html, /Tick iPad \/ máy POS đã bàn giao cho ground/);
});

test("returned goods use entered-items-first progressive disclosure", () => {
  assert.match(html, /Thêm hàng hoá/);
  assert.match(html, /goods-catalog/);
  assert.match(html, /goods-empty/);
});

test("handover status colors have distinct semantic roles", () => {
  assert.match(html, /\.ho-status\.complete/);
  assert.match(html, /\.ho-status\.pending/);
  assert.match(html, /\.ho-tab\[aria-selected="true"\]/);
});

test("operations tab uses a defined edit permission", () => {
  const handoverDetail = html.match(/function HandoverDetail[\s\S]*?function packStrip/);
  assert.ok(handoverDetail);
  assert.doesNotMatch(handoverDetail[0], /disabled:\s*!editable/);
  assert.match(handoverDetail[0], /disabled:\s*!purser/);
});
