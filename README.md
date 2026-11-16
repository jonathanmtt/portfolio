# Jonathan Mattos — Websites for local businesses

My portfolio site: fast, modern websites for local service businesses in the US, in English and Portuguese.

**What's inside**

- A bilingual site (`/` in English, `/pt/` in Portuguese) with a before/after slider, a free-mockup request flow and a privacy policy.
- Three concept websites for local businesses, each a single, dependency-free HTML file that doubles as a starting template:
  - [`demos/auto-repair`](demos/auto-repair/) — Ironside Auto Repair (Las Vegas)
  - [`demos/cleaning`](demos/cleaning/) — BrightNest Home Cleaning (San Diego), fully bilingual EN/PT
  - [`demos/landscaping`](demos/landscaping/) — Fernway Landscaping (North County San Diego)
- Small Node scripts (no dependencies) to fill in contact details and to generate optimized screenshots with headless Chrome.

**How it's built**

Plain HTML, CSS and a little vanilla JavaScript — no framework, no build step, no database. Mobile-first, accessible (semantic HTML, focus states, reduced-motion support), with structured data, a sitemap and hreflang for both languages. Hosted on Cloudflare Pages.

I use AI tools to work faster; I review every page and test everything on real phones before it ships.

**Run it locally**

```bash
python -m http.server 4321
```

Then open http://localhost:4321.

---

The businesses in `demos/` are fictional and labeled as concept work. Phone numbers use the reserved 555-01xx range.
