import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = process.env.MEETUPS_TEST_URL ?? "http://localhost:3000";
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

test("meetups workflow and responsive layout using isolated browser fixtures", { timeout: 120000 }, async (context) => {
  const profile = mkdtempSync(join(tmpdir(), "coffee-connect-chrome-"));
  const artifacts = mkdtempSync(join(tmpdir(), "coffee-connect-screenshots-"));
  const chrome = spawn(chromePath, [
    "--headless", "--disable-gpu", "--remote-debugging-pipe", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
  const pending = new Map();
  const listeners = new Map();
  let sequence = 0;
  let buffer = "";
  let sessionId;
  let chromeErrors = "";
  chrome.stderr.on("data", (data) => { chromeErrors = (chromeErrors + data).slice(-2000); });
  chrome.on("error", (error) => {
    for (const request of pending.values()) request.reject(error);
  });
  chrome.stdio[4].on("data", (data) => {
    buffer += data.toString();
    let boundary;
    while ((boundary = buffer.indexOf("\0")) !== -1) {
      const message = JSON.parse(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 1);
      if (message.id) {
        const request = pending.get(message.id);
        if (!request) continue;
        clearTimeout(request.timer);
        pending.delete(message.id);
        if (message.error) request.reject(new Error(JSON.stringify(message.error)));
        else request.resolve(message.result);
      } else {
        for (const listener of listeners.get(message.method) ?? []) listener(message.params);
      }
    }
  });

  function send(method, params = {}, targetSession = sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}. ${chromeErrors}`)); }, 30000);
      pending.set(id, { resolve, reject, timer });
      chrome.stdio[3].write(`${JSON.stringify({ id, method, params, sessionId: targetSession })}\0`);
    });
  }

  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }

  async function waitFor(expression) {
    return evaluate(`new Promise((resolve, reject) => {
      const deadline = performance.now() + 25000;
      function check() {
        if (${expression}) resolve(true);
        else if (performance.now() > deadline) reject(new Error('Condition not met: ' + ${JSON.stringify(expression)}));
        else requestAnimationFrame(check);
      }
      check();
    })`);
  }

  async function click(text, scope = "document") {
    await evaluate(`Array.from(${scope}.querySelectorAll('button')).find(button => button.textContent === ${JSON.stringify(text)}).click()`);
  }

  const person = (id, firstName, lastName = "Example") => ({
    id, first_name: firstName, last_name: lastName, email: `${firstName.toLowerCase()}@example.test`,
    location: "LONDON", job_role: "CON", job_capability: "Backend Engineering",
    job_go_to_market: "Health", registered: true,
    interests: [{ id: 1, name: "Coffee and cafes" }, { id: 2, name: "Board games" }],
  });
  const me = person(10001, "Test");
  const entry = (id, colleague, status = "ACCEPTED", direction = "outgoing", completedAt = null) => ({
    id, colleague, status, direction, matched_at: "2026-10-19T12:00:00Z", completed_at: completedAt,
  });
  const initial = [
    entry(1, person(10002, "Amelia")),
    entry(2, person(10003, "Daniel"), "PENDING", "incoming"),
    entry(3, person(10004, "Morgan"), "PENDING"),
    entry(4, person(10005, "Priya"), "ACCEPTED", "incoming", "2026-10-18T12:00:00Z"),
    entry(5, person(10006, "Alex"), "ACCEPTED", "outgoing", "2026-10-17T12:00:00Z"),
    entry(6, person(10007, "Sam"), "ACCEPTED", "incoming", "2026-10-16T12:00:00Z"),
  ];
  let entries = structuredClone(initial);
  let failLoad = false;
  let failAction = false;
  let completionPosts = 0;
  const browserErrors = [];
  const interceptionErrors = [];

  try {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" }, undefined);
    ({ sessionId } = await send("Target.attachToTarget", { targetId, flatten: true }, undefined));
    await send("Page.enable");
    await send("Runtime.enable");
    listeners.set("Runtime.exceptionThrown", [(event) => browserErrors.push(event.exceptionDetails.text)]);
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: `
      sessionStorage.setItem('coffee-connect-person', ${JSON.stringify(JSON.stringify(me))});
      sessionStorage.setItem('coffee-connect-demo-session', 'active');
    ` });

    listeners.set("Fetch.requestPaused", [(event) => {
      void (async () => {
        const url = new URL(event.request.url);
        let responseCode = 200;
        let body = entries;
        if (event.request.method === "OPTIONS") {
          responseCode = 204;
        } else if (url.pathname.endsWith("/meetups")) {
          if (failLoad) { responseCode = 503; body = { message: "Meetups unavailable for this test." }; }
        } else {
          const matched = url.pathname.match(/\/matches\/(\d+)\/(accept|decline|complete)$/);
          if (!matched) throw new Error(`Unexpected API call: ${url.pathname}`);
          const id = Number(matched[1]);
          const action = matched[2];
          const meetup = entries.find((item) => item.id === id);
          if (failAction) {
            responseCode = 409;
            body = { message: "This match is no longer available." };
          } else if (action === "decline") {
            entries = entries.filter((item) => item.id !== id);
            responseCode = 204;
          } else if (action === "accept") {
            meetup.status = "ACCEPTED";
            body = meetup;
          } else {
            completionPosts++;
            meetup.completed_at = "2026-10-20T12:00:00Z";
            body = meetup;
          }
        }
        await send("Fetch.fulfillRequest", {
          requestId: event.requestId, responseCode,
          responseHeaders: [
            { name: "Content-Type", value: "application/json" },
            { name: "Access-Control-Allow-Origin", value: "*" },
            { name: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
            { name: "Access-Control-Allow-Headers", value: "content-type" },
          ],
          ...(responseCode === 204 ? {} : { body: Buffer.from(JSON.stringify(body)).toString("base64") }),
        });
      })().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('"code":-32602') || !message.includes("Invalid InterceptionId")) {
          interceptionErrors.push(message);
        }
      });
    }]);
    await send("Fetch.enable", { patterns: [{ urlPattern: "http://localhost:5000/api/people/*" }] });
    await send("Page.navigate", { url: `${origin}/meetups` });
    const upcoming = `document.querySelector('section[aria-labelledby="upcoming-heading"]')`;
    const past = `document.querySelector('section[aria-labelledby="past-heading"]')`;
    await waitFor(`${upcoming}?.querySelectorAll('article').length === 3`);

    await context.test("loads account-specific cards, shared interests, history order, and contact links", async () => {
      assert.equal(await evaluate("document.querySelectorAll('header').length"), 1);
      assert.equal(await evaluate("document.querySelector('[aria-label=\"Main navigation\"] a[aria-current=\"page\"]')?.textContent"), "Meetups");
      assert.equal(await evaluate(`${past}.querySelectorAll('article').length`), 3);
      assert.equal(await evaluate(`${past}.querySelector('h3').textContent`), "Priya Example");
      assert.ok(await evaluate(`${upcoming}.textContent.includes('Coffee and cafes, Board games')`));
      assert.equal(await evaluate(`document.querySelector('a[aria-label="Email Priya Example"]').getAttribute('href')`), "mailto:priya@example.test");
      assert.equal(await evaluate(`document.querySelector('a[aria-label^="Open Teams chat with Priya"]').getAttribute('href')`), "https://teams.microsoft.com/l/chat/0/0?users=priya%40example.test");
      assert.ok(!(await evaluate(`document.body.textContent`)).includes("&nearr;"));
      assert.equal(await evaluate(`${past}.querySelectorAll('button').length`), 0);
    });

    await context.test("desktop layout has three columns and no overlapping cards", async () => {
      const boxes = await evaluate(`Array.from(${upcoming}.querySelectorAll('li')).map(item => { const rect = item.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top }; })`);
      const band = await evaluate(`(() => { const element = ${upcoming}; const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width, viewport: document.documentElement.clientWidth }; })()`);
      assert.equal(boxes[0].top, boxes[2].top);
      assert.ok(boxes[0].right < boxes[1].left && boxes[1].right < boxes[2].left);
      assert.ok(Math.abs(band.left - (band.viewport - band.width) / 2) <= 1, JSON.stringify(band));
      const edges = await evaluate(`(() => { const box = (element) => element.getBoundingClientRect(); const heading = box(document.querySelector('#meetups-heading')); const refresh = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Refresh'); const firstCard = box(${upcoming}.querySelector('li')); const lastCard = box(${upcoming}.querySelectorAll('li')[2]); return { headingLeft: heading.left, cardLeft: firstCard.left, refreshRight: box(refresh).right, cardRight: lastCard.right }; })()`);
      assert.ok(Math.abs(edges.headingLeft - edges.cardLeft) <= 1, JSON.stringify(edges));
      assert.ok(Math.abs(edges.refreshRight - edges.cardRight) <= 1, JSON.stringify(edges));
      await evaluate(`Promise.all(document.getAnimations().map(animation => animation.finished))`);
      await evaluate("document.querySelector('nextjs-portal')?.remove()");
      assert.equal(await evaluate(`getComputedStyle(${upcoming}.querySelector('li')).opacity`), "1");
      const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      writeFileSync(join(artifacts, "desktop.png"), Buffer.from(image.data, "base64"));
    });

    await context.test("completion requires confirmation, supports cancel, and moves the card into history", async () => {
      await click("Mark as completed", upcoming);
      assert.equal(completionPosts, 0);
      await click("Cancel", upcoming);
      assert.equal(completionPosts, 0);
      await click("Mark as completed", upcoming);
      await click("Yes, mark completed", upcoming);
      await waitFor(`${past}.querySelectorAll('article').length === 4`);
      assert.equal(await evaluate(`${past}.querySelector('h3').textContent`), "Amelia Example");
      assert.equal(completionPosts, 1);
      await click("Refresh");
      await waitFor(`${past}.querySelectorAll('article').length === 4`);
      assert.equal(await evaluate(`${upcoming}.querySelectorAll('article').length`), 2);
    });

    await context.test("incoming pending matches can be accepted or declined", async () => {
      await click("Accept match", upcoming);
      await waitFor(`${upcoming}.textContent.includes('Mark as completed')`);
      assert.equal(entries.find((item) => item.id === 2).status, "ACCEPTED");
      entries.push(entry(7, person(10008, "Taylor"), "PENDING", "incoming"));
      await click("Refresh");
      await waitFor(`${upcoming}.textContent.includes('Taylor Example')`);
      await click("Decline", upcoming);
      await waitFor(`!${upcoming}.textContent.includes('Taylor Example')`);
    });

    await context.test("failed completion preserves the meetup and shows an error", async () => {
      failAction = true;
      await click("Mark as completed", upcoming);
      await click("Yes, mark completed", upcoming);
      await waitFor(`document.querySelector('[role="alert"]')?.textContent.includes('no longer available')`);
      assert.equal(await evaluate(`${upcoming}.querySelectorAll('article').length`), 2);
      failAction = false;
      await click("Cancel", upcoming);
    });

    await context.test("load failures support retry and empty accounts show no fake meetups", async () => {
      failLoad = true;
      await click("Refresh");
      await waitFor(`document.querySelector('[role="alert"]')?.textContent.includes('Meetups unavailable')`);
      failLoad = false;
      entries = [];
      await click("Try again");
      await waitFor(`${upcoming}.textContent.includes('No upcoming meetups')`);
      assert.ok(await evaluate(`${past}.textContent.includes('No completed calls yet')`));
      assert.equal(await evaluate(`document.querySelectorAll('article').length`), 0);
    });

    await context.test("mobile and tablet layouts fit long names, emails, expanded profiles, and confirmations", async () => {
      entries = structuredClone(initial);
      entries[0].colleague.first_name = "Alexandertheverylongfirstname";
      entries[0].colleague.email = "averylongcolleagueemailaddressforlayoutchecks@example.test";
      await click("Refresh");
      await waitFor(`${upcoming}.querySelectorAll('article').length === 3`);
      for (const width of [768, 390, 320]) {
        await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: false });
        await evaluate(`document.querySelector('details').open = true`);
        const layout = await evaluate(`({ width: innerWidth, scroll: document.documentElement.scrollWidth, overflow: Array.from(document.querySelectorAll('header *, main *')).filter(element => { const box = element.getBoundingClientRect(); const fullBleedBand = element.matches('section[aria-labelledby="upcoming-heading"], section[aria-labelledby="past-heading"]'); return !fullBleedBand && box.width > 0 && (box.right > innerWidth + 1 || box.left < -1 || element.scrollWidth > element.clientWidth + 2); }).map(element => element.tagName + ':' + element.className) })`);
        assert.ok(layout.scroll <= width, JSON.stringify(layout));
        assert.deepEqual(layout.overflow, [], JSON.stringify(layout));
        const band = await evaluate(`(() => { const rect = ${upcoming}.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width, viewport: document.documentElement.clientWidth }; })()`);
        assert.ok(Math.abs(band.left - (band.viewport - band.width) / 2) <= 1, JSON.stringify(band));
        const gutters = await evaluate(`(() => { const grid = ${upcoming}.querySelector('ul').getBoundingClientRect(); const viewport = document.documentElement.clientWidth; return { left: grid.left, right: viewport - grid.right, viewport }; })()`);
        assert.ok(gutters.left >= 8 && Math.abs(gutters.left - gutters.right) <= 1, JSON.stringify(gutters));
        const edge = await evaluate(`(() => { const viewport = document.documentElement.clientWidth; const refresh = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Refresh').getBoundingClientRect(); const count = ${upcoming}.querySelector('h2 + span').getBoundingClientRect(); return { viewport, refreshRightGutter: viewport - refresh.right, countRightGutter: viewport - count.right }; })()`);
        assert.ok(edge.refreshRightGutter >= 8 && edge.countRightGutter >= 8, JSON.stringify(edge));
        if (width === 390) {
          await evaluate(`Promise.all(document.getAnimations().map(animation => animation.finished))`);
          const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
          writeFileSync(join(artifacts, "mobile.png"), Buffer.from(image.data, "base64"));
        }
      }
      await click("Mark as completed", upcoming);
      await waitFor(`${upcoming}.textContent.includes('Has your call')`);
      assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    });

    assert.deepEqual(interceptionErrors, []);
    assert.deepEqual(browserErrors, []);
    console.log(`Screenshots: ${artifacts}`);
  } finally {
    await send("Browser.close", {}, undefined).catch(() => chrome.kill());
    for (const request of pending.values()) clearTimeout(request.timer);
    rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
  }
});