// Jonathan Mattos — portfolio v2. Vanilla JS, no dependencies.
const isPT = (document.documentElement.lang || "en").toLowerCase().startsWith("pt");
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// 1) Before / after slider.
document.querySelectorAll(".ba-stage").forEach((stage) => {
  const range = stage.querySelector(".ba-range");
  if (!range) return;
  const update = () => stage.style.setProperty("--pos", range.value + "%");
  range.addEventListener("input", update);
  update();
});

// 2) Header border once the page scrolls.
const header = document.querySelector(".site-header");
if (header) {
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// 3) Remember the language the visitor picked; suggest Portuguese to PT browsers.
document.querySelectorAll("[data-set-lang]").forEach((a) =>
  a.addEventListener("click", () => store.set("jm-lang", a.dataset.setLang))
);
const bar = document.querySelector(".lang-bar");
if (bar && !isPT) {
  const langs = (navigator.languages || [navigator.language || ""]).join(",").toLowerCase();
  const chosen = store.get("jm-lang");
  if (langs.includes("pt") && chosen !== "en" && store.get("jm-lang-bar") !== "closed") bar.hidden = false;
  bar.querySelector("button")?.addEventListener("click", () => {
    bar.hidden = true;
    store.set("jm-lang-bar", "closed");
  });
}

// 4) Hero "paste your site" → carries the link into the contact form.
const mock = document.querySelector("#mockup-form");
const form = document.querySelector("#contact-form");
if (mock && form) {
  mock.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = mock.querySelector("input").value.trim();
    const site = form.querySelector('[name="website"]');
    if (value && site) site.value = value;
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => form.querySelector('[name="name"]').focus({ preventScroll: true }), 500);
  });
}

// 5) Contact form → Web3Forms (free). Paste your access key in the hidden
//    "access_key" input. Until then the form explains it isn't connected yet.
if (form) {
  const status = form.querySelector(".form-status");
  const t = isPT
    ? {
        sending: "Enviando…",
        ok: "Recebido! Te respondo em até 24 horas com o próximo passo.",
        err: "Não consegui enviar. Me chama direto no WhatsApp ou por e-mail.",
        setup: "Formulário ainda não conectado. Por enquanto, me chama no WhatsApp ou por e-mail.",
      }
    : {
        sending: "Sending…",
        ok: "Got it! I'll get back to you within 24 hours with next steps.",
        err: "Something went wrong. Please text or email me directly.",
        setup: "This form isn't connected yet. For now, please text or email me directly.",
      };
  const show = (msg, kind) => {
    status.textContent = msg;
    status.className = "form-status show " + kind;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = form.querySelector('[name="access_key"]').value;
    if (!key || key.startsWith("YOUR_")) return show(t.setup, "err");
    const button = form.querySelector('button[type="submit"]');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = t.sending;
    try {
      const res = await fetch(form.action, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
      form.reset();
      show(t.ok, "ok");
    } catch {
      show(t.err, "err");
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
}

// 6) Current year in the footer.
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
