// Takes optimized screenshots of local pages with headless Chrome (no npm deps).
// Usage (from the portfolio folder, with the local server running on :4321):
//   node tools/shoot.mjs            → all images
//   node tools/shoot.mjs og         → only files whose name contains "og"
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4321";
const OUT = fileURLToPath(new URL("../assets/img/", import.meta.url));
const PORT = 9333;

const jobs = [
  { url: "/assets/mock/before-auto.html", file: "before-auto.webp", w: 1280, h: 800, format: "webp", quality: 82 },
  { url: "/demos/auto-repair/", file: "demo-auto.webp", w: 1280, h: 800, format: "webp", quality: 82 },
  { url: "/demos/cleaning/", file: "demo-cleaning.webp", w: 1280, h: 800, format: "webp", quality: 82 },
  { url: "/demos/landscaping/", file: "demo-landscaping.webp", w: 1280, h: 800, format: "webp", quality: 82 },
  { url: "/assets/mock/og.html", file: "og.jpg", w: 1200, h: 630, format: "jpeg", quality: 88 },
  { url: "/assets/mock/icon.html", file: "apple-touch-icon.png", w: 180, h: 180, format: "png" },
];
const only = process.argv.slice(2);

const profile = mkdtempSync(join(tmpdir(), "jm-shoot-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome did not start");
}

const ws = new WebSocket(await wsUrl());
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const waiters = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method) waiters.filter((w) => w.method === msg.method).forEach((w) => w.resolve(msg));
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id;
  pending.set(i, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));

await send("Page.enable");
await send("Runtime.enable");
for (const job of jobs) {
  if (only.length && !only.some((o) => job.file.includes(o))) continue;
  await send("Emulation.setDeviceMetricsOverride", { width: job.w, height: job.h, deviceScaleFactor: 1, mobile: false });
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url: BASE + job.url });
  await loaded;
  await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });
  await sleep(job.wait ?? 1200);
  const params = { format: job.format, captureBeyondViewport: false };
  if (job.quality) params.quality = job.quality;
  const { data } = await send("Page.captureScreenshot", params);
  const buf = Buffer.from(data, "base64");
  writeFileSync(join(OUT, job.file), buf);
  console.log(`${job.file}  ${(buf.length / 1024).toFixed(0)} KB`);
}
ws.close();
chrome.kill();
