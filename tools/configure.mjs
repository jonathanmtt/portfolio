// Fills in your real contact details across the whole site, in one go.
// Run from the portfolio folder. Every option is optional — pass only what you have:
//
//   node tools/configure.mjs --domain jonathanmattos.com --email hello@jonathanmattos.com \
//        --phone "(702) 555-1234" --whatsapp "+1 702 555 1234" --web3forms abcd-1234-...
//
//   --check    only lists what is still a placeholder (changes nothing)
//   --dry-run  shows what would change without writing
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FILES = ["index.html", "pt/index.html", "privacy.html", "pt/privacidade.html", "sitemap.xml", "robots.txt"];
const PLACEHOLDERS = ["yourdomain.com", "(555) 555-0100", "15555550100", "YOUR_WEB3FORMS_ACCESS_KEY"];

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : undefined; };
const flag = (name) => args.includes("--" + name);
const fail = (msg) => { console.error("✗ " + msg); process.exit(1); };

const digits = (s) => String(s).replace(/\D/g, "");
function usPhone(raw) {
  let d = digits(raw);
  if (d.length === 10) d = "1" + d;
  if (d.length !== 11 || !d.startsWith("1")) fail(`--phone must be a US number (10 digits), got "${raw}"`);
  return { e164: "+" + d, display: `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}` };
}
function waNumber(raw) {
  let d = digits(raw);
  if (d.length === 10) d = "1" + d; // assume US when no country code
  if (d.length < 11 || d.length > 15) fail(`--whatsapp needs the full number with country code, got "${raw}"`);
  return d;
}

const rules = []; // [old, new]
const removeTodo = []; // regexes for TODO comments that no longer apply

const domainRaw = opt("domain");
if (domainRaw) {
  const domain = domainRaw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) fail(`--domain looks wrong: "${domainRaw}"`);
  const email = opt("email") || `hello@${domain}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`--email looks wrong: "${email}"`);
  rules.push(["hello@yourdomain.com", email], ["yourdomain.com", domain]);
  removeTodo.push(/^[ \t]*<!-- TODO: (replace yourdomain\.com|trocar yourdomain\.com)[^>]*-->\r?\n/gm, /^# TODO: replace yourdomain\.com.*\r?\n/gm, /^<!-- TODO: replace yourdomain\.com.*-->\r?\n/gm);
} else if (opt("email")) {
  rules.push(["hello@yourdomain.com", opt("email")]);
}

const phoneRaw = opt("phone");
const waRaw = opt("whatsapp") || phoneRaw;
if (phoneRaw) {
  const p = usPhone(phoneRaw);
  rules.push(["sms:+15555550100", "sms:" + p.e164], ["(555) 555-0100", p.display]);
}
if (waRaw) rules.push(["wa.me/15555550100", "wa.me/" + waNumber(waRaw)]);
if (phoneRaw && waRaw && opt("email")) {
  removeTodo.push(/^[ \t]*<!-- TODO: (replace (the phone number|phone, WhatsApp|your real email)|trocar (o número|número do WhatsApp|pelo seu e-mail))[^>]*-->\r?\n/gm);
}

const key = opt("web3forms");
if (key) {
  if (!/^[A-Za-z0-9-]{20,}$/.test(key.trim())) fail(`--web3forms key looks wrong: "${key}"`);
  rules.push(["YOUR_WEB3FORMS_ACCESS_KEY", key.trim()]);
  removeTodo.push(/^[ \t]*<!-- TODO: (get a free access key|pegar uma chave)[^>]*-->\r?\n/gm);
}

const check = flag("check") || rules.length === 0;
const dry = flag("dry-run");
let changedFiles = 0;
const left = {};

for (const rel of FILES) {
  const path = ROOT + rel;
  let text = readFileSync(path, "utf8");
  const before = text;
  if (!check) {
    for (const [from, to] of rules) text = text.split(from).join(to);
    for (const re of removeTodo) text = text.replace(re, "");
  }
  if (text !== before) {
    changedFiles++;
    if (!dry) writeFileSync(path, text, "utf8");
    console.log(`${dry ? "would update" : "updated"}  ${rel}`);
  }
  const remaining = PLACEHOLDERS.filter((p) => text.includes(p));
  if (remaining.length) left[rel] = remaining;
}

if (!check) console.log(`\n${changedFiles} file(s) ${dry ? "would change" : "changed"}.`);
const names = { "yourdomain.com": "domain/email", "(555) 555-0100": "phone", "15555550100": "phone/WhatsApp", YOUR_WEB3FORMS_ACCESS_KEY: "form key" };
if (Object.keys(left).length === 0) console.log("✓ No placeholders left. Ready to publish.");
else {
  console.log("Still to fill in:");
  for (const [rel, list] of Object.entries(left)) console.log(`  ${rel}: ${[...new Set(list.map((p) => names[p]))].join(", ")}`);
}
