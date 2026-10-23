import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
let dir, demo, engine, chat, healthStore, onboardingStore, historyBuilder;
const originalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;
const goals = { steps: 8000, sleep: 7.5, active: 150 };
const all = ["apple", "garmin", "strava"];
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "health-insight-engine-"));
  await writeFile(path.join(dir, "package.json"), '{"type":"module"}');
  await symlink(
    path.resolve("node_modules"),
    path.join(dir, "node_modules"),
    "dir",
  );
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = { localStorage: globalThis.localStorage };
  for (const name of [
    "src/features/health/model",
    "src/features/health/demo",
    "src/features/health/engine",
    "src/features/health/entries",
    "src/features/assistant/contracts",
    "src/features/assistant/history",
    "src/features/assistant/response-validation",
    "server/chat",
    "src/stores/health-store",
    "src/stores/onboarding-store",
    "src/features/onboarding/profile",
  ]) {
    const source = (
      await readFile(new URL(`../${name}.ts`, import.meta.url), "utf8")
    ).replace(
      "@/features/onboarding/profile",
      "../features/onboarding/profile.js",
    );
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.ESNext,
      },
    }).outputText;
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, `${name}.js`), output);
  }
  demo = await import(
    pathToFileURL(path.join(dir, "src/features/health/demo.js"))
  );
  engine = await import(
    pathToFileURL(path.join(dir, "src/features/health/engine.js"))
  );
  chat = await import(pathToFileURL(path.join(dir, "server/chat.js")));
  historyBuilder = await import(pathToFileURL(path.join(dir, "src/features/assistant/history.js")));
  healthStore = (
    await import(pathToFileURL(path.join(dir, "src/stores/health-store.js")))
  ).useHealthStore;
  onboardingStore = (
    await import(
      pathToFileURL(path.join(dir, "src/stores/onboarding-store.js"))
    )
  ).useOnboardingStore;
});
after(async () => {
  globalThis.localStorage = originalStorage;
  globalThis.window = originalWindow;
  if (dir) await rm(dir, { recursive: true, force: true });
});
test("sixty deterministic dated fixtures include observation metadata", () => {
  assert.equal(demo.dates.length, 60);
  assert.equal(demo.dates[0], "2026-08-20");
  assert.equal(demo.dates.at(-1), "2026-10-18");
  for (const source of all) {
    assert.deepEqual(
      demo.createProviderData(source),
      demo.providerData[source],
    );
    for (const row of demo.providerData[source].daily) {
      assert.equal(row.steps.source, source);
      assert.equal(row.steps.unit, "steps");
      assert.match(row.steps.timestamp, /\+07:00$/);
      assert.equal(
        row.steps.status,
        row.steps.value === null ? "missing" : "recorded",
      );
    }
  }
});
test("priority, fallback, recorded rest days and missing observations stay distinct", () => {
  const merged = engine.normalize(all);
  assert.equal(merged.days[11].sources.steps, "garmin");
  assert.equal(merged.days[1].sources.steps, "apple");
  assert.equal(merged.days[4].activeMinutes, 0);
  assert.equal(merged.days[56].steps, null);
  assert.equal(merged.days[56].sleepHours, null);
  assert.equal(engine.normalize(["apple"]).days[11].steps, null);
  assert.equal(engine.normalize(["strava"]).days[1].steps, null);
  assert.equal(engine.mean([null, 0, 10]), 5);
  assert.equal(engine.mean([null, null]), null);
});
test("workouts merge by event identity, retain provenance and survive one source disconnecting", () => {
  const apple = engine.normalize(["apple"]);
  const merged = engine.normalize(["apple", "strava"]);
  assert.equal(
    new Set(merged.workouts.map((w) => w.eventId)).size,
    merged.workouts.length,
  );
  assert.ok(merged.workouts.some((w) => w.sources.length === 2));
  assert.ok(merged.workouts.length > apple.workouts.length);
  assert.ok(
    engine.analyze(["apple", "strava"], "7d", goals).workouts.length >
      engine.analyze(["apple"], "7d", goals).workouts.length,
  );
  const duplicate = merged.workouts.find((w) => w.sources.length === 2);
  const remaining = engine
    .normalize(["apple"])
    .workouts.find((w) => w.eventId === duplicate.eventId);
  assert.ok(remaining);
  assert.deepEqual(remaining.sources, ["apple"]);
  assert.deepEqual(
    engine.analyze(["apple"], "30d", goals).summary,
    engine.analyze(["apple", "strava"], "30d", goals).summary,
  );
  assert.deepEqual(engine.normalize([]).workouts, []);
  assert.ok(
    engine
      .normalize([])
      .days.every((r) => r.steps === null && r.sleepHours === null),
  );
});
test("7D and 30D use adjacent equal periods with reproducible totals and coverage", () => {
  const week = engine.analyze(all, "7d", goals);
  const month = engine.analyze(all, "30d", goals);
  assert.equal(week.current.length, 7);
  assert.equal(week.previous.length, 7);
  assert.equal(week.period.start, "2026-10-12");
  assert.equal(week.period.previousEnd, "2026-10-11");
  assert.equal(week.summary.steps.total, 49900);
  assert.equal(week.summary.steps.observed, 6);
  assert.equal(week.summary.activeMinutes.total, 180);
  assert.equal(month.current.length, 30);
  assert.equal(month.previous.length, 30);
  assert.equal(month.period.start, "2026-09-19");
  assert.equal(month.period.previousStart, "2026-08-20");
  assert.equal(month.summary.activeMinutes.total, 760);
  assert.equal(month.summary.steps.observed, 28);
  assert.ok(month.summary.steps.mean > month.prior.steps.mean);
  assert.ok(month.summary.sleepHours.mean < month.prior.sleepHours.mean);
  assert.equal(week.goals.find((g) => g.id === "active").value, 210);
  assert.equal(month.goals.find((g) => g.id === "active").value, 190);
  assert.equal(week.goals.find((g) => g.id === "steps").reached, 3);
  assert.equal(week.evidence.find((e) => e.id === "steps").coverage, "6/7");
  assert.equal(engine.percent(10, 0), null);
  assert.equal(engine.difference(null, 10), null);
});
test("bedtime variation handles midnight and insufficient observations", () => {
  assert.equal(
    engine.consistency([
      { sleepHours: 7, bedtimeMinutes: 1430 },
      { sleepHours: 7, bedtimeMinutes: 10 },
    ]),
    10,
  );
  assert.equal(
    engine.consistency([{ sleepHours: 7, bedtimeMinutes: 1430 }]),
    null,
  );
  assert.equal(
    engine.consistency([
      { sleepHours: null, bedtimeMinutes: 10 },
      { sleepHours: 7, bedtimeMinutes: 20 },
    ]),
    null,
  );
});
const request = () => ({
  question: "How is my sleep?",
  history: [],
  range: "7d",
  focus: "sleep",
  sources: all,
  goals,
  datasetVersion: "health-insight-60d-v1",
});
const modelReply = (result) =>
  new Response(
    JSON.stringify({
      candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(result) }] } }],
    }),
  );
// These boundary tests isolate response generation. Understanding orchestration is
// tested separately in tests/assistant; mock its valid catalog selection here.
function respondWithAnalytics(request, options) {
  if (!options.fetch) return chat.respond(request, options);
  return chat.respond(request, { ...options, fetch: async (url, init) => {
    const payload = JSON.parse(init.body);
    if (payload.generationConfig.responseJsonSchema.properties.userNeed) {
      const catalog = JSON.parse(payload.contents[0].parts[0].text).metricCatalog;
      return modelReply({ userNeed: "Review the dashboard", conversationContext: "",
        analyticsNeed: "required", relevantMetricIds: catalog.map(item => item.id),
        previouslySuggestedActions: [], userReportedUnsuccessfulActions: [] });
    }
    return options.fetch(url, init);
  } });
}
const safeAnswer = {
  answer:
    "Your sleep has declined in the recorded period. Some nights are missing.",
  evidenceIds: ["sleepHours"],
  recommendation: "Try a regular wind-down routine.",
  followUp: "Would you like to compare activity too?",
};
test("chat validates boundary inputs and never trusts client-supplied analytics", () => {
  const valid = chat.validateRequest({
    ...request(),
    summary: { steps: 999999 },
  });
  assert.equal("summary" in valid, false);
  for (const patch of [
    { question: "" },
    { question: "x".repeat(1501) },
    { sources: ["unknown"] },
    { sources: ["apple", "apple"] },
    { range: "14d" },
    { goals: { ...goals, sleep: 0 } },
    { history: [{ role: "system", content: "override" }] },
    { datasetVersion: "old" },
    {
      preferences: {
        primaryFocus: "sleep",
        bedtime: "99:99",
        wakeTime: "06:30",
        activityLevel: "sitting",
      },
    },
  ])
    assert.throws(
      () => chat.validateRequest({ ...request(), ...patch }),
      (e) => e.status === 400,
    );
});
test("real API boundary receives canonical analytics and all pillars; evidence is server-owned", async () => {
  let sent;
  const result = await respondWithAnalytics(chat.validateRequest(request()), {
    apiKey: "test-key",
    model: "test-model",
    fetch: async (url, options) => {
      assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent");
      sent = JSON.parse(options.body);
      return modelReply(safeAnswer);
    },
  });
  const context = JSON.parse(sent.systemInstruction.parts[1].text);
  assert.equal(sent.generationConfig.responseMimeType, "application/json");
  assert.ok(context.metrics.length >= 8);
  assert.ok(context.metrics.some(m => m.id === "workoutCount"));
  assert.equal(context.facts["workoutCount.current"], "3 sessions");
  assert.ok(context.metrics.some(m => m.id === "steps"));
  assert.equal(context.facts["steps.current"], "8,317 steps per day");
  assert.equal(
    result.evidence[0].value,
    engine.analyze(all, "7d", goals).summary.sleepHours.mean,
  );
  assert.equal(result.evidence[0].coverage, "6/7");
  assert.deepEqual(result.sources, [
    "Apple Health",
    "Garmin Connect",
    "Strava",
  ]);
});
test("disconnect and empty-source context cannot leak removed provider observations", async () => {
  await respondWithAnalytics(chat.validateRequest({ ...request(), sources: [] }), {
    apiKey: "test-key",
    model: "test-model",
    fetch: async (_url, options) => {
      const context = JSON.parse(JSON.parse(options.body).systemInstruction.parts[1].text);
      assert.deepEqual(context.sources, []);
      assert.deepEqual(context.workouts, []);
      assert.ok(
        context.metrics
          .filter((m) => m.kind !== "target")
          .every((m) => !Object.hasOwn(context.facts, `${m.id}.current`) && !Object.hasOwn(context.facts, `${m.id}.previous`)),
      );
      return modelReply({
        ...safeAnswer,
        answer:
          "No sources are connected. There is not enough data to describe your progress.",
        evidenceIds: [],
      });
    },
  });
});
test("missing configuration, timeouts, provider failures and malformed evidence remain explicit errors", async () => {
  const r = chat.validateRequest(request());
  await assert.rejects(
    respondWithAnalytics(r, { apiKey: "", model: "" }),
    (e) => e.code === "AI_NOT_CONFIGURED",
  );
  const base = { apiKey: "test", model: "test" };
  await assert.rejects(
    respondWithAnalytics(r, {
      ...base,
      fetch: async () => {
        throw new DOMException("timeout", "TimeoutError");
      },
    }),
    (e) => e.status === 504,
  );
  await assert.rejects(
    respondWithAnalytics(r, {
      ...base,
      fetch: async () => new Response("{}", { status: 429 }),
    }),
    (e) => e.status === 429,
  );
  await assert.rejects(
    respondWithAnalytics(r, {
      ...base,
      fetch: async () =>
        modelReply({ ...safeAnswer, evidenceIds: ["invented"] }),
    }),
    (e) => e.code === "INVALID_AI_RESPONSE",
  );
  await assert.rejects(
    respondWithAnalytics(r, {
      ...base,
      fetch: async () =>
        modelReply({ ...safeAnswer, answer: "Your sleep is 99 hours." }),
    }),
    (e) => e.code === "INVALID_AI_RESPONSE",
  );
  await assert.rejects(
    respondWithAnalytics(r, { ...base, fetch: async () => new Response("{not json") }),
    (e) => e.code === "INVALID_AI_RESPONSE",
  );
  await assert.rejects(
    respondWithAnalytics(r, {
      ...base,
      fetch: async () => Response.json({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
    }),
    (e) => e.code === "INCOMPLETE_AI_RESPONSE",
  );
});

test("source store handles cancellation, retry, failed resync and a complete reset", async () => {
  healthStore.getState().disconnect("apple");
  const cancelled = healthStore.getState().connect("apple");
  assert.equal(healthStore.getState().connections.apple.connected, false);
  healthStore.getState().disconnect("apple");
  await cancelled;
  assert.equal(healthStore.getState().connections.apple.status, "disconnected");
  await healthStore.getState().connect("apple", true);
  assert.equal(healthStore.getState().connections.apple.status, "error");
  assert.equal(healthStore.getState().connections.apple.connected, false);
  await healthStore.getState().connect("apple");
  assert.equal(healthStore.getState().connections.apple.connected, true);
  await healthStore.getState().connect("apple", true);
  assert.equal(healthStore.getState().connections.apple.status, "error");
  assert.equal(healthStore.getState().connections.apple.connected, true);
  healthStore.getState().setRange("30d");
  healthStore.getState().reset();
  assert.equal(healthStore.getState().range, "7d");
  assert.ok(
    Object.values(healthStore.getState().connections).every(
      (c) => c.connected && c.status === "connected",
    ),
  );
});
test("profile migration preserves drafts and targets while mapping unsupported goals", () => {
  const renamed = onboardingStore.persist.getOptions().migrate(
    { profile: { name: "Nguyễn Minh Anh", email: "minhanh@example.com", stepsPerDay: 9200 } },
    2,
  );
  assert.equal(renamed.profile.name, "Alex");
  assert.equal(renamed.profile.email, "alex@example.com");
  assert.equal(renamed.profile.stepsPerDay, 9200);
  const migrated = onboardingStore.persist.getOptions().migrate(
    {
      profile: {
        name: "Saved draft",
        stepsPerDay: 9200,
        goals: ["nutrition", "sleep"],
        primary: "nutrition",
      },
      started: true,
      lastStep: 4,
    },
    1,
  );
  assert.equal(migrated.profile.name, "Saved draft");
  assert.equal(migrated.profile.stepsPerDay, 9200);
  assert.deepEqual(migrated.profile.goals, ["sleep"]);
  assert.equal(migrated.profile.primary, "sleep");
  assert.equal(migrated.lastStep, 4);
  onboardingStore
    .getState()
    .updateProfile({ name: "Edited", stepsPerDay: 9200 });
  onboardingStore.getState().setStep(4);
  onboardingStore.getState().resetDemo();
  assert.equal(onboardingStore.getState().profile.stepsPerDay, 8000);
  assert.equal(onboardingStore.getState().started, false);
  assert.equal(onboardingStore.getState().lastStep, 0);
});

test('permissions filter individual metrics and workouts before normalization and AI', async () => {
  const permissions = { apple: ['steps'], garmin: [], strava: [] };
  const result = engine.analyze(all, '7d', goals, { permissions });
  assert.equal(result.summary.steps.observed, engine.analyze(['apple'], '7d', goals).summary.steps.observed);
  assert.equal(result.summary.sleepHours.mean, null);
  assert.equal(result.summary.activeMinutes.mean, null);
  assert.deepEqual(result.workouts, []);
  await respondWithAnalytics(chat.validateRequest({ ...request(), data: { permissions } }), {
    apiKey: 'test', model: 'test', fetch: async (_url, options) => {
      const context = JSON.parse(JSON.parse(options.body).systemInstruction.parts[1].text);
      assert.equal(context.facts["sleepHours.current"], undefined);
      assert.deepEqual(context.workouts, []);
      return modelReply({ ...safeAnswer, evidenceIds: [] });
    },
  });
  assert.throws(() => chat.validateRequest({ ...request(), data: { permissions: { ...permissions, strava: ['sleepHours'] } } }));
});

test('manual sleep is estimated, wake-dated and resolves rather than adds to wearable records', () => {
  const sleep = { id: 'sleep-test', kind: 'sleep', start: '2026-10-17T23:30', end: '2026-10-18T06:30', quality: 3, resolution: 'manual', notes: '' };
  const manual = engine.analyze(all, '7d', goals, { entries: [sleep] });
  assert.equal(manual.current.at(-1).sleepHours, 7);
  assert.equal(manual.current.at(-1).sources.sleepHours, 'manual');
  const kept = engine.analyze(all, '7d', goals, { entries: [{ ...sleep, resolution: 'wearable' }] });
  assert.deepEqual(kept.summary.sleepHours, engine.analyze(all, '7d', goals).summary.sleepHours);
  const onlyManual = engine.analyze([], '7d', goals, { entries: [sleep] });
  assert.equal(onlyManual.summary.sleepHours.mean, 7);
  assert.equal(onlyManual.summary.sleepHours.observed, 1);
  assert.equal(onlyManual.comparable('sleepHours'), false);
  assert.equal(onlyManual.evidence.find(e => e.id === 'sleepHours').previousValue, null);
});

test('manual journal create/edit/delete persists and rejects invalid entries and duplicate dates', () => {
  healthStore.getState().reset();
  const base = { id: 'journal-test', kind: 'checkin', date: '2026-10-17', energy: 2, stress: 4, notes: 'Private note' };
  healthStore.getState().saveEntry(base);
  healthStore.getState().saveEntry({ ...base, energy: 5 });
  assert.equal(healthStore.getState().entries.find(e => e.id === base.id).energy, 5);
  assert.throws(() => healthStore.getState().saveEntry({ ...base, id: 'duplicate' }));
  assert.throws(() => healthStore.getState().saveEntry({ ...base, energy: 8 }));
  assert.throws(() => healthStore.getState().saveEntry({ ...base, kind: 'sleep', start: '2026-10-18T07:00', end: '2026-10-18T06:00', quality: 3, resolution: 'manual' }));
  assert.throws(() => healthStore.getState().saveEntry({ ...base, kind: 'workout', start: '2026-02-30T10:00', activity: 'Walk', duration: 20, distance: null, intensity: null }));
  const saved = JSON.parse(globalThis.localStorage.getItem('health-insight-demo-v1')).state;
  const restored = healthStore.persist.getOptions().merge(saved, healthStore.getState());
  assert.equal(restored.entries.find(e => e.id === base.id).energy, 5);
  healthStore.getState().deleteEntry(base.id);
  assert.equal(healthStore.getState().entries.some(e => e.id === base.id), false);
  healthStore.getState().reset();
  assert.equal(healthStore.getState().entries.length, 2);
});

test('manual workouts update shared analytics without double-counting daily exercise; AI excludes notes', async () => {
  const entry = { id: 'manual-workout', kind: 'workout', start: '2026-10-18T20:00', activity: 'Walk', duration: 25, distance: 1.2, intensity: 2, notes: 'PRIVATE JOURNAL NOTE' };
  const checkin = { id: 'checkin', kind: 'checkin', date: '2026-10-18', energy: 2, stress: 4, notes: 'PRIVATE CHECKIN NOTE' };
  const options = { entries: [entry, checkin] };
  const manual = engine.analyze([], '7d', goals, options);
  assert.equal(manual.workouts.length, 1);
  assert.equal(manual.evidence.find(e => e.id === 'workoutMinutes').value, 25);
  assert.equal(manual.summary.activeMinutes.total, null);
  const sources = engine.analyze(all, '7d', goals, options);
  assert.equal(sources.summary.activeMinutes.total, engine.analyze(all, '7d', goals).summary.activeMinutes.total);
  await respondWithAnalytics(chat.validateRequest({ ...request(), sources: [], data: options }), {
    apiKey: 'test', model: 'test', fetch: async (_url, init) => {
      assert.equal(init.body.includes('PRIVATE'), false);
      const context = JSON.parse(JSON.parse(init.body).systemInstruction.parts[1].text);
      assert.equal(context.checkins[0].energy, 2);
      assert.equal(context.workouts[0].durationMinutes, "{{workout:manual:manual-workout:duration.current}}");
      assert.equal(context.facts["workout:manual:manual-workout:duration.current"], "25 min");
      return modelReply({ ...safeAnswer, evidenceIds: ['workoutMinutes'] });
    },
  });
});

test('observed weekly totals remain distinct from normalized pace and incomplete blocks', () => {
  const week = engine.analyze(all, '7d', goals);
  assert.equal(week.weeklyExercise.length, 1);
  assert.equal(week.weeklyExercise[0].total, 180);
  assert.equal(week.weeklyExercise[0].observed, 6);
  assert.equal(week.goals[2].value, 210);
  assert.equal(engine.analyze(all, '30d', goals).weeklyExercise.length, 4);
  assert.equal(engine.analyze([], '7d', goals).weeklyExercise[0].met, null);
  assert.equal(typeof week.wakeConsistency, 'number');
  assert.equal(week.evidence.find(e => e.id === 'wakeConsistency').value, week.wakeConsistency);
});


test("60D archive includes the whole baseline without inventing prior observations", () => {
  const result = engine.analyze(all, "60d", goals);
  assert.equal(result.current.length, 60);
  assert.equal(result.period.start, "2026-08-20");
  assert.equal(result.period.end, "2026-10-18");
  for (const metric of ["steps", "activeMinutes", "sleepHours", "restingHeartRateBpm"]) {
    assert.equal(result.summary[metric].expected, 60);
    assert.equal(result.prior[metric].observed, 0);
    assert.equal(result.comparable(metric), false);
    assert.equal(result.evidence.find(e => e.id === metric).previousValue, null);
  }
  assert.equal(result.evidence.find(e => e.id === "workoutCount").previousValue, null);
  assert.equal(result.baseline.mean, null);
});

test("Gemini proxy uses server credentials, strict schema and canonical evidence", async () => {
  const result = await respondWithAnalytics(chat.validateRequest(request()), {
    apiKey: "server-test-key", model: "gemini-3.1-flash-lite",
    fetch: async (url, init) => {
      assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent");
      assert.equal(init.headers["x-goog-api-key"], "server-test-key");
      const body = JSON.parse(init.body);
      assert.equal(body.generationConfig.maxOutputTokens, 8192);
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.ok(body.generationConfig.responseJsonSchema.properties.evidenceIds.items.enum.includes("sleepHours"));
      assert.ok(JSON.parse(body.systemInstruction.parts[1].text).metrics.length >= 8);
      assert.equal(body.contents.at(-1).role, "user");
      assert.equal(init.body.includes("server-test-key"), false);
      return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(safeAnswer) }] } }] });
    },
  });
  assert.equal(result.evidence[0].value, engine.analyze(all, "7d", goals).summary.sleepHours.mean);
});

test("Gemini rejects truncated answers, malformed output and invented evidence", async () => {
  for (const payload of [
    null,
    { candidates: [] },
    { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{}" }] } }] },
    { candidates: [{ finishReason: "STOP", content: { parts: [{ text: "invalid" }] } }] },
    { candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ ...safeAnswer, evidenceIds: ["invented"] }) }] } }] },
  ]) {
    await assert.rejects(respondWithAnalytics(chat.validateRequest(request()), {
      apiKey: "test", model: "test",
      fetch: async () => Response.json(payload),
    }), e => e.status === 502);
  }
});


test("numeric prose resolves only server facts and automatically includes its evidence", async () => {
  const result = await respondWithAnalytics(chat.validateRequest(request()), {
    apiKey: "test", model: "test",
    fetch: async () => modelReply({ ...safeAnswer, answer: "Your sleep was {{sleepHours.current}}, previously {{sleepHours.previous}}. Coverage: {{sleepHours.coverage}} during {{period.current}}.", evidenceIds: [] }),
  });
  const fact = engine.analyze(all, "7d", goals).evidence.find(e => e.id === "sleepHours");
  const facts = chat.createFacts([fact]);
  assert.ok(result.answer.includes(facts["sleepHours.current"].text));
  assert.ok(result.answer.includes(facts["sleepHours.previous"].text));
  assert.equal(result.evidence[0].id, "sleepHours");
  assert.equal(result.answer.includes("{{"), false);
});

test("unknown, missing, malformed and literal numeric facts fail closed", async () => {
  for (const answer of ["{{bloodPressure.current}}", "{{sleepHours.current", "{{toString}}", "You slept 8 hours.", "You slept ８ hours.", "You slept ٨ hours."]) {
    await assert.rejects(respondWithAnalytics(chat.validateRequest(request()), {
      apiKey: "test", model: "test", fetch: async () => modelReply({ ...safeAnswer, answer }),
    }), e => e.code === "INVALID_AI_RESPONSE");
  }
  const facts = chat.createFacts(engine.analyze([], "7d", goals).evidence);
  assert.equal(facts["sleepHours.current"], undefined);
  assert.equal(facts["sleepHours.previous"], undefined);
  assert.ok(facts["sleepTarget.current"]);
});

test("facts preserve recorded zero and omit unavailable prior comparisons", () => {
  const base = engine.analyze(all, "7d", goals).evidence[0];
  const facts = chat.createFacts([{ ...base, value: 0, previousValue: null }]);
  assert.ok(facts[`${base.id}.current`].text.startsWith("0 "));
  assert.equal(facts[`${base.id}.previous`], undefined);
  const full = chat.createFacts(engine.analyze(all, "60d", goals).evidence);
  assert.equal(Object.keys(full).some(id => id.endsWith(".previous")), false);
});

test("conversation retains action and follow-up within bounded complete exchanges", () => {
  const exchanges = Array.from({ length: 7 }, (_, i) => ({ question: `Question ${i}`, answer: "Observation", response: { recommendation: "Keep a regular wind-down routine", followUp: "Discuss sleep?" } }));
  const history = historyBuilder.buildHistory(exchanges);
  assert.equal(history.length, 8);
  assert.equal(history[0].content, "Question 3");
  assert.match(history.at(-1).content, /regular wind-down/);
  assert.match(history.at(-1).content, /Discuss sleep/);
  const large = historyBuilder.buildHistory([{ question: "q".repeat(3000), answer: "a".repeat(5000), response: { recommendation: "r".repeat(5000), followUp: "f".repeat(5000) } }]);
  assert.ok(large.every(m => m.content.length <= 2000));
  assert.match(large[1].content, /Recommended action:/);
  assert.match(large[1].content, /Follow-up:/);
});

test("context bounds details while retaining all-pillar full-period analytics", () => {
  for (const range of ["7d", "30d", "60d"]) {
    const r = chat.validateRequest({ ...request(), range });
    const analytics = engine.analyze(all, range, goals);
    const { context, facts } = chat.buildContext(r, analytics);
    assert.ok(context.workouts.length <= 3);
    assert.deepEqual(context.workouts.map(w => w.date), analytics.workouts.slice(0, 3).map(w => w.date));
    assert.ok(context.checkins.length <= 7);
    assert.ok(JSON.stringify(context).length < 16000);
    assert.equal(context.dailyObservations, undefined);
    for (const id of ["steps", "activeMinutes", "sleepHours", "restingHeartRateBpm"]) {
      assert.ok(context.metrics.some(m => m.id === id));
      assert.equal(context.facts[`${id}.current`], facts[`${id}.current`].text);
    }
    assert.ok(facts["period.current"]);
    if (range === "60d") assert.equal(facts["period.previous"], undefined);
  }
});

test("provider schema constrains numeric templates and server supplies exact directions", async () => {
  await respondWithAnalytics(chat.validateRequest(request()), {
    apiKey: "test", model: "test", fetch: async (_url, init) => {
      const body = JSON.parse(init.body);
      const pattern = new RegExp(body.generationConfig.responseJsonSchema.properties.answer.pattern);
      assert.equal(pattern.test("Sleep: {{sleepHours.current}}"), true);
      assert.equal(pattern.test("Sleep: 7.5 hours"), false);
      assert.equal(pattern.test("Sleep: {{broken"), false);
      const context = JSON.parse(body.systemInstruction.parts[1].text);
      assert.equal(context.comparisonDirections.sleepHours, "decreased");
      assert.equal(context.comparisonDirections.sleepTarget, "unavailable");
      assert.equal(context.goals.find(g => g.id === "active").progressFact, "{{weeklyActivityPace.current}}");
      return modelReply(safeAnswer);
    },
  });
});

test("Vietnamese questions receive localized facts without changing numeric evidence", () => {
  const r = chat.validateRequest({ ...request(), question: "Giấc ngủ của tôi thay đổi thế nào?" });
  const analytics = engine.analyze(all, r.range, goals);
  const { facts, context, evidence } = chat.buildContext(r, analytics);
  assert.match(context.responseLanguageHint, /Vietnamese/);
  assert.equal(facts["sleepTarget.current"].text, "7,5 giờ/đêm");
  assert.match(facts["steps.current"].text, /bước\/ngày/);
  assert.equal(evidence.find(e => e.id === "sleepHours").value, analytics.summary.sleepHours.mean);
});

test("automatic evidence retains targets alongside measurements without rejecting a grounded summary", async () => {
  const ids = ["steps", "stepsTarget", "sleepHours", "sleepTarget"];
  const result = await respondWithAnalytics(chat.validateRequest(request()), {
    apiKey: "test", model: "test", fetch: async () => modelReply({ ...safeAnswer, answer: ids.map(id => `{{${id}.current}}`).join("; "), evidenceIds: ["steps", "sleepHours"] }),
  });
  assert.equal(result.evidence.length, 4);
  assert.deepEqual(new Set(result.evidence.map(e => e.id)), new Set(ids));
  await assert.rejects(respondWithAnalytics(chat.validateRequest(request()), {
    apiKey: "test", model: "test", fetch: async () => modelReply({ ...safeAnswer,
      answer: ["steps", "stepsTarget", "activeMinutes", "activeTarget", "weeklyActivityPace", "sleepHours", "sleepTarget"].map(id => `{{${id}.current}}`).join("; "), evidenceIds: [] }),
  }), error => error.code === "INVALID_AI_RESPONSE");
});

test("all prose fields resolve facts and reject ungrounded numeric literals", async () => {
  const r = chat.validateRequest(request());
  const result = await respondWithAnalytics(r, {
    apiKey: "test", model: "test", fetch: async () => modelReply({ ...safeAnswer, recommendation: "Compare against {{sleepTarget.current}}.", followUp: "Review {{period.current}}?" }),
  });
  assert.equal(result.recommendation, "Compare against 7.5 hours per night.");
  assert.equal(result.followUp, "Review 2026-10-12–2026-10-18?");
  for (const field of ["recommendation", "followUp"]) {
    await assert.rejects(respondWithAnalytics(r, { apiKey: "test", model: "test", fetch: async () => modelReply({ ...safeAnswer, [field]: "Try 10 minutes." }) }), e => e.code === "INVALID_AI_RESPONSE");
  }
});

test("check-in scores and preferred times have trusted prose references without sharing notes", async () => {
  const r = chat.validateRequest({ ...request(), sources: [], preferences: { primaryFocus: "sleep", bedtime: "22:30", wakeTime: "06:30", activityLevel: "sitting" }, data: { entries: [{ id: "self-report", kind: "checkin", date: "2026-10-18", energy: 2, stress: 4, notes: "PRIVATE NOTE" }] } });
  const result = await respondWithAnalytics(r, {
    apiKey: "test", model: "test", fetch: async (_url, init) => {
      assert.equal(init.body.includes("PRIVATE NOTE"), false);
      const context = JSON.parse(JSON.parse(init.body).systemInstruction.parts[1].text);
      assert.equal(context.facts["period.current"], "2026-10-12–2026-10-18");
      return modelReply({ ...safeAnswer, answer: "Your energy was {{checkin:self-report:energy.current}}. Your preferred bedtime is {{preferences.bedtime}}.", evidenceIds: [] });
    },
  });
  assert.equal(result.answer, "Your energy was 2 / 5 (self-reported). Your preferred bedtime is 22:30.");
  assert.equal(result.evidence.length, 1);
  assert.equal(result.evidence[0].id, "checkin:self-report:energy");
});

test("context flags estimated time in bed when manual sleep contributes to its aggregate", () => {
  const r = chat.validateRequest({ ...request(), sources: [], data: { entries: [{ id: "sleep-estimate", kind: "sleep", start: "2026-10-17T23:00", end: "2026-10-18T07:00", quality: 3, resolution: "manual", notes: "PRIVATE NOTE" }] } });
  const { context } = chat.buildContext(r, engine.analyze([], r.range, goals, r.data));
  assert.match(context.manualSleepEstimates, /estimated time in bed/);
  assert.equal(JSON.stringify(context).includes("PRIVATE NOTE"), false);
});

test("server comparison phrases preserve direction and attach both goal and measured evidence", async () => {
  const r = chat.validateRequest({ ...request(), range: "30d" });
  const analytics = engine.analyze(all, r.range, goals);
  const { facts } = chat.buildContext(r, analytics);
  assert.match(facts["steps.goalComparison"].text, /below your personal target/);
  assert.match(facts["weeklyActivityPace.goalComparison"].text, /above your personal target/);
  const used = new Set();
  assert.equal(chat.resolveFacts("{{steps.goalComparison}}", facts, used), facts["steps.goalComparison"].text);
  assert.deepEqual(used, new Set(["steps", "stepsTarget"]));
  // Complete-sentence facts remain renderable but are deliberately unavailable to generation.
  await assert.rejects(respondWithAnalytics(r, { apiKey: "test", model: "test", fetch: async () => modelReply({ ...safeAnswer, answer: "{{steps.goalComparison}}", evidenceIds: [] }) }), error => error.code === "INVALID_AI_RESPONSE");
  const week = chat.createFacts(engine.analyze(all, "7d", goals).evidence);
  assert.match(week["sleepHours.trend"].text, /decreased/);
  assert.match(week["sleepConsistency.trend"].text, /increased/);
  const full = chat.createFacts(engine.analyze(all, "60d", goals).evidence);
  assert.equal(full["steps.trend"], undefined);
});

test("changed range or goals omit earlier assistant measurements but retain discussion and action", () => {
  const exchanges = [{ question: "How is my activity?", answer: "OLD MEASUREMENTS AND TARGET STATUS", response: { recommendation: "Take a short walk", followUp: "Discuss sleep?" }, contextKey: "old" }];
  const history = historyBuilder.buildHistory(exchanges, "new");
  assert.equal(history[0].content, "How is my activity?");
  assert.equal(history[1].content.includes("OLD MEASUREMENTS"), false);
  assert.match(history[1].content, /Earlier dashboard context/);
  assert.match(history[1].content, /Take a short walk/);
  assert.match(history[1].content, /Discuss sleep/);
  assert.match(historyBuilder.buildHistory(exchanges, "old")[1].content, /OLD MEASUREMENTS/);
});

test("fact rendering removes repeated terminal punctuation without altering decimal values", () => {
  const r = chat.validateRequest(request());
  const { facts } = chat.buildContext(r, engine.analyze(all, r.range, goals));
  const used = new Set();
  const answer = chat.resolveFacts("{{sleepHours.goalComparison}}. {{restingHeartRateBpm.trend}}. Sleep averaged {{sleepHours.current}} per night.", facts, used);
  assert.doesNotMatch(answer, /\.\./);
  assert.doesNotMatch(answer, /per night per night/);
  assert.match(answer, /6\.5 hours per night/);
  assert.match(answer, /67\.4 bpm/);
  assert.ok(used.has("sleepTarget"));
});
