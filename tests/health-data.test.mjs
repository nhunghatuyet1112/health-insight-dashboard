import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
const dir = await mkdtemp(path.join(tmpdir(), "synapse-health-test-"));
try {
  for (const name of ["data", "analytics"]) {
    const source = await readFile(
      new URL(`../src/features/health/${name}.ts`, import.meta.url),
      "utf8",
    );
    const output = ts
      .transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        },
      })
      .outputText.replace(/from ['"]\.\/data['"]/g, "from './data.mjs'");
    await writeFile(path.join(dir, `${name}.mjs`), output);
  }
  const data = await import(pathToFileURL(path.join(dir, "data.mjs")));
  const analytics = await import(
    pathToFileURL(path.join(dir, "analytics.mjs"))
  );
  test("28 deterministic, consecutive fictional records", () => {
    assert.deepEqual(data.generateRecords(), data.records);
    assert.equal(data.records.length, 28);
    assert.equal(data.records[0].date, "2026-09-21");
    assert.equal(data.records.at(-1).date, "2026-10-18");
    assert.equal(new Set(data.records.map((r) => r.date)).size, 28);
    data.records.forEach((r, i) => {
      assert.equal(
        r.date,
        new Date(Date.UTC(2026, 8, 21 + i)).toISOString().slice(0, 10),
      );
      assert.equal(r.source, "synthetic");
      assert.ok(
        r.steps >= 0 &&
          r.activeMinutes >= 0 &&
          r.sleepHours > 0 &&
          r.sleepHours <= 24,
      );
    });
  });
  test("weekly aggregates match supplied narrative and daily observations", () => {
    const summaries = analytics.weeks.map((w) => analytics.summarize(w.rows));
    assert.deepEqual(
      summaries.map((s) => s.steps),
      [5400, 6200, 6800, 7600],
    );
    assert.deepEqual(
      summaries.map((s) => s.active),
      [92, 105, 123, 145],
    );
    assert.deepEqual(
      summaries.map((s) => Number(s.sleep.toFixed(1))),
      [6.2, 6.5, 6.7, 7],
    );
    assert.equal(summaries[3].water, 1900);
    assert.equal(
      Number(
        analytics
          .changePercent(summaries[3].steps, summaries[2].steps)
          .toFixed(1),
      ),
      11.8,
    );
    assert.equal(
      analytics.weeks[3].rows.filter((r) => r.steps >= 8000).length,
      3,
    );
  });
  test("missing data is excluded, while recorded zero remains in denominator", () => {
    assert.equal(analytics.mean([null, 0, 10]), 5);
    assert.equal(analytics.mean([null, null]), null);
    assert.equal(analytics.summarize([]).active, null);
    assert.equal(analytics.changePercent(10, 0), null);
    assert.ok(data.records.some((r) => r.restingHeartRateBpm === null));
    assert.ok(data.records.some((r) => r.activeMinutes === 0));
  });
  test("assistant summary uses actual selected week and target", () => {
    const answer = analytics.progressAnswer(
      analytics.weeks[3].rows,
      analytics.weeks[2].rows,
      { steps: 8000, sleep: 7.5, active: 150, water: 2000 },
    );
    for (const expected of [
      "7,600",
      "+11.8%",
      "95%",
      "3/7",
      "7.0h",
      "145/150",
      "1.9L",
    ])
      assert.ok(answer.includes(expected), expected);
    const first = analytics.progressAnswer(analytics.weeks[0].rows, [], {
      steps: 10000,
      sleep: 8,
      active: 180,
      water: 2500,
    });
    assert.ok(first.includes("no previous week"));
    assert.ok(first.includes("54%"));
  });
} finally {
  await rm(dir, { recursive: true, force: true });
}
