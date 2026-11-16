// Full-page review screenshots (desktop + mobile) with headless Chrome. No npm deps.
// Usage: node tools/review.mjs <outDir> <path> [path...]   e.g. node tools/review.mjs shots / /pt/
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4321";
const [outDir, ...rawPaths] = process.argv.slice(2);
// Paths are given without the leading slash ("root" = homepage) so Git Bash doesn't rewrite them.
const paths = rawPaths.map((p) => (p === "root" ? "/" : "/" + p.replace(/^\/+/, "")));
mkdirSync(outDir, { recursive: true });
const PORT = 9334;
const profile = mkdtempSync(join(tmpdir(), "jm-review-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "--lang=en-US", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let url;
for (let i = 0; i < 50 && !url; i++) {
  try { url = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl; } catch {}
  if (!url) await sleep(200);
}
const ws = new WebSocket(url);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(); const waiters = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method) waiters.filter((w) => w.method === m.method).forEach((w) => w.resolve(m));
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
await send("Page.enable"); await send("Runtime.enable");
await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });

const views = [{ name: "desktop", w: 1366, h: 900, mobile: false }, { name: "mobile", w: 375, h: 812, mobile: true }];
for (const p of paths) {
  for (const v of views) {
    await send("Emulation.setDeviceMetricsOverride", { width: v.w, height: v.h, deviceScaleFactor: 1, mobile: v.mobile });
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url: BASE + p });
    await loaded;
    await send("Runtime.evaluate", { expression: "document.fonts.ready.then(()=>true)", awaitPromise: true });
    await sleep(900);
    const { result } = await send("Runtime.evaluate", { expression: "JSON.stringify({h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, iw: innerWidth})" });
    const info = JSON.parse(result.value);
    const height = Math.min(info.h, 16000);
    await send("Emulation.setDeviceMetricsOverride", { width: v.w, height, deviceScaleFactor: 1, mobile: v.mobile });
    await sleep(500);
    // Save the page in segments so each image stays readable.
    const seg = v.mobile ? 1500 : 1700;
    const name = p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";
    let n = 0;
    for (let y = 0; y < height; y += seg) {
      const clip = { x: 0, y, width: v.w, height: Math.min(seg, height - y), scale: v.mobile ? 0.8 : 0.6 };
      const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 72, clip, captureBeyondViewport: true });
      writeFileSync(join(outDir, `${name}-${v.name}-${String(++n).padStart(2, "0")}.jpg`), Buffer.from(data, "base64"));
    }
    console.log(`${name}-${v.name}: ${n} segments  height=${info.h}  overflowX=${info.sw > info.iw ? "YES " + info.sw : "no"}`);
  }
}
ws.close(); chrome.kill();
