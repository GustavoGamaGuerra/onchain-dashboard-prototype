/* ONCHAIN Ramp — B2B Dashboard V2 · interactive prototype
   Vanilla JS, hash router, no build step. Designed to deploy as-is on GitHub Pages. */
(() => {
  "use strict";

  // ---------- utilities ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const I = (p) => `assets/img/${p}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const delay = (ms) => wait(reduced ? Math.min(ms, 300) : ms);

  // ---------- state ----------
  const KEY = "onchain-v2-proto";
  const DEFAULT = {
    email: "", name: "", company: "", website: "",
    network: "", address: "", tax: "na",
    assetStatus: "cleared",
    whitepaper: "", payNetwork: "", plan: false,
    verify: "none", ownerEmail: "",
    account: "signed-out",
    populated: false, paymentFailed: false, retries: 0,
    description: "", logo: "", tickerImg: "",
  };
  let S = load();
  function load() {
    try { return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return { ...DEFAULT }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } }
  function set(patch) { Object.assign(S, patch); save(); }

  const steps = [
    { id: "asset", label: "Digital asset" },
    { id: "whitepaper", label: "Share your Whitepaper link" },
    { id: "payment", label: "Choose your payment method" },
    { id: "plan", label: "Choose your plan" },
    { id: "verify", label: "Verify your account" },
  ];
  const stepDone = (id) => ({
    asset: S.assetStatus === "cleared",
    whitepaper: !!S.whitepaper,
    payment: !!S.payNetwork,
    plan: !!S.plan,
    verify: S.verify === "connected",
  }[id]);
  const progress = () => steps.filter((s) => stepDone(s.id)).length * 20;
  const firstOpenStep = () => (steps.find((s) => !stepDone(s.id)) || steps[4]).id;

  const NETWORKS = [
    { id: "ethereum", label: "Ethereum", icon: `<img class="token-ic" src="${I("eth.svg")}" alt="">` },
    { id: "polygon", label: "Polygon", icon: `<span class="token-ic token-letter" style="background:#8247E5">P</span>` },
    { id: "arbitrum", label: "Arbitrum", icon: `<span class="token-ic token-letter" style="background:#28A0F0">A</span>` },
    { id: "bnb", label: "BNB Chain", icon: `<span class="token-ic token-letter" style="background:#F0B90B">B</span>` },
  ];
  const netById = (id) => NETWORKS.find((n) => n.id === id);

  // mock transactions (deterministic)
  const TX = (() => {
    const rows = []; const amounts = [320, 580, 720, 410, 530, 290, 650, 470, 390, 800, 260, 940];
    const base = new Date(2024, 8, 1, 22, 10).getTime();
    for (let i = 0; i < 118; i++) {
      const a = amounts[i % amounts.length] + (i * 7) % 40;
      const status = i === 1 || i % 17 === 5 ? "Pending" : i === 2 || i % 23 === 9 ? "Failed" : "Succeeded";
      const d = new Date(base - i * 3600e3 * 9);
      const hex = (n) => (n * 2654435761 >>> 0).toString(16).padStart(8, "0");
      rows.push({
        id: i, amount: a, status, qty: Math.round(a * 1530.7).toLocaleString("en-US").padStart(7, "0"),
        wallet: `0x${hex(i + 3).slice(0, 2)}...${hex(i + 11).slice(-4)}`, date: d,
        tx: `0x${hex(i + 7).slice(0, 2)}...${hex(i + 19).slice(-4)}`, order: `${hex(i + 5).slice(0, 4)}...${hex(i + 29).slice(-4)}`,
      });
    }
    return rows;
  })();
  const fmtDate = (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace("AM", "am").replace("PM", "pm");

  // ---------- shared partials ----------
  const logo = () => `
    <a class="logo" href="#/signin" aria-label="ONCHAIN Ramp — home">
      <img class="logo__word" src="${I("logo-onchain.svg")}" alt="">
      <span class="logo__beta"><img src="${I("logo-beta.svg")}" alt=""></span>
      <span class="logo__ramp"><img src="${I("logo-ramp.svg")}" alt=""></span>
    </a>`;
  const chat = () => `<button class="chat-fab" data-act="chat" aria-label="Open support chat"><img src="${I("chat-bubble.svg")}" alt=""></button>`;
  const authFooter = () => `<footer class="footer"><nav class="footer__links"><a href="#" data-act="noop">Terms of Service</a><a href="#" data-act="noop">Privacy Policy</a></nav></footer>`;
  const authPage = (main) => `<div class="auth"><header class="auth__header">${logo()}</header>${main}${authFooter()}</div>${chat()}`;
  const checkbox = (name, label, { checked = false, disabled = false, cls = "", required = false } = {}) => `
    <label class="check ${cls}"><input type="checkbox" name="${name}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} ${required ? "required" : ""}><span class="check__box" aria-hidden="true"></span><span class="check__label">${label}</span></label>`;
  const radio = (name, value, label, checked) => `
    <label class="check radio"><input type="radio" name="${name}" value="${esc(value)}" ${checked ? "checked" : ""}><span class="check__box" aria-hidden="true"></span><span class="check__label">${label}</span></label>`;
  const input = ({ id, label, value = "", placeholder = "", type = "text", icon = "", small = false, readonly = false, disabled = false, labelCls = "" }) => `
    <div class="field">
      ${label ? `<label class="field__label ${labelCls}" for="${id}">${label}</label>` : ""}
      <div class="control ${small ? "control--sm" : ""} ${readonly ? "control--readonly" : ""} ${disabled ? "control--disabled" : ""}">
        <input id="${id}" name="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${readonly ? "readonly" : ""} ${disabled ? "disabled" : ""} autocomplete="off">
        ${icon}
      </div>
      <p class="field__error" id="${id}-err" role="alert"></p>
    </div>`;
  const select = ({ id, label, value, placeholder = "Select", pl20 = false, labelCls = "" }) => {
    const n = netById(value);
    return `
    <div class="field">
      ${label ? `<span class="field__label ${labelCls}" id="${id}-lbl">${label}</span>` : ""}
      <div class="select" data-select="${id}">
        <button type="button" class="select__btn ${pl20 ? "select__btn--pl20" : ""}" aria-haspopup="listbox" aria-expanded="false" ${label ? `aria-labelledby="${id}-lbl"` : ""}>
          ${n ? n.icon : ""}<span class="select__value ${n ? "" : "is-placeholder"}">${n ? n.label : placeholder}</span>
          <img class="select__chev" src="${I("chevron-down-dark.svg")}" alt="">
        </button>
        <ul class="select__menu" role="listbox">
          ${NETWORKS.map((o) => `<li class="select__opt" role="option" data-value="${o.id}" aria-selected="${o.id === value}" tabindex="-1">${o.icon}<span>${o.label}</span></li>`).join("")}
        </ul>
      </div>
    </div>`;
  };

  // top bar + app shell
  function topbar() {
    const active = S.account === "active";
    const days = S.paymentFailed ? "0 days" : "12 days";
    return `
    <header class="topbar">
      <a class="topbar__brand" href="#/dashboard">${S.logo ? `<img src="${esc(S.logo)}" alt="">` : `<span class="avatar topbar__mark" aria-hidden="true">${esc((company().trim()[0] || "A").toUpperCase())}</span>`}<span class="topbar__name">${esc(company())}</span></a>
      <div class="topbar__right">
        <div class="topbar__meta">
          <div><p class="renew__label">Renews in:</p><p class="renew__value ${S.paymentFailed ? "is-danger" : ""}">${days}</p></div>
          <button class="btn btn--tertiary btn--small" data-act="ramp-link" ${active ? "" : "disabled"} title="${active ? "Copy your Ramp link" : "Available after setup and verification"}">
            <span>Ramp link</span><img src="${I(active ? "copy16.svg" : "copy-disabled.svg")}" width="16" height="16" alt="">
          </button>
          <div><p class="user__name">${esc(S.name || "Gustavo Guerra")}</p><p class="user__role">Administrator</p></div>
        </div>
        <div class="avatar" aria-hidden="true">TG</div>
        <div class="menu-wrap">
          <button class="icon-btn" data-act="menu" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu"><img src="${I("chevron-down-dark.svg")}" alt=""></button>
          <div class="dropdown" role="menu">
            <a role="menuitem" href="#/dashboard">Dashboard</a>
            <a role="menuitem" href="#/transactions">Transactions</a>
            <a role="menuitem" href="#/settings/project">Settings</a>
            <button role="menuitem" data-act="signout">Sign out</button>
          </div>
        </div>
      </div>
    </header>`;
  }
  const company = () => (S.company || "ACME Protocol").trim();
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "TG";
  function banner() {
    if (S.paymentFailed) return `<div class="banner banner--error" role="alert"><p>Hello <b>${esc((S.name || "Gustavo").split(" ")[0])}</b>! Your <b>last payment failed</b> due to lack of funds, please click the button to retry!</p><button class="btn" data-act="retry-payment"><span>Retry Payment</span></button></div>`;
    if (S.account === "setup") return `<div class="banner banner--warning" role="status"><p>Complete your account setup to start with <i>ONCHAIN®</i>. Your progress will be saved so you can finish later.</p><button class="btn" data-act="go-setup"><span>Finish setup</span></button></div>`;
    return "";
  }
  const appShell = (content, { withBanner = true } = {}) => `
    <div class="app">
      ${withBanner ? banner() : ""}
      ${topbar()}
      <main class="app__body">${content}</main>
      <footer class="app__footer"><nav class="footer__links"><a href="#" data-act="noop">Terms and Conditions</a><a href="#" data-act="noop">Privacy Policy</a></nav></footer>
    </div>${chat()}`;

  // ---------- screens: sign-up ----------
  function signin() {
    return authPage(`
      <div class="split">
        <section class="split__hero">
          <h1 class="t-h1"><span class="c-primary">Sell Direct.</span><span>Instantly.</span></h1>
          <p class="t-md">The way buying digital assets should have always been.<br><span class="w-500">No Middlemen—straight from the source.</span></p>
        </section>
        <section class="split__card">
          <form class="split__inner" id="f-signin" novalidate>
            <h2 class="t-h4" style="font-weight:500">Start your 14‑day <b>free trial</b>.</h2>
            <img class="divider-grad" src="${I("divider-or.svg")}" alt="">
            <div class="stack gap-16" style="width:100%">
              <h3 class="t-h6 center">Sign in</h3>
              <div class="stack gap-16" style="padding:0 26px 24px">
                ${input({ id: "email", type: "email", value: S.email, placeholder: "Your Email", icon: `<img class="control__icon" src="${I("envelope.svg")}" alt="">` })}
                <button class="btn btn--primary btn--block" type="submit" disabled><span>Continue</span></button>
              </div>
            </div>
          </form>
        </section>
      </div>`);
  }
  function bindSignin() {
    const f = $("#f-signin"), e = $("#email"), b = $("button[type=submit]", f);
    const valid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.value.trim());
    const sync = () => { b.disabled = !valid(); };
    e.addEventListener("input", sync); sync(); e.focus();
    f.addEventListener("submit", async (ev) => {
      ev.preventDefault(); if (!valid()) return;
      await busy(b, 900); set({ email: e.value.trim() }); go("#/verify-email");
    });
  }

  function verifyEmail() {
    return authPage(`
      <div class="split">
        <section class="split__hero">
          <h1 class="t-h1"><span class="c-primary">Sell Direct.</span><span>Instantly.</span></h1>
          <p class="t-md">The way buying digital assets should have always been.<br><span class="w-500">No Middlemen—straight from the source.</span></p>
        </section>
        <section class="split__card">
          <form class="split__inner" id="f-otp" novalidate>
            <div class="stack gap-16" style="align-items:center">
              <img src="${I("envelope-blue.svg")}" width="32" height="32" alt="">
              <p class="t-md center" style="width:427px">We’ve just sent an email to <b class="w-600">${esc(S.email || "youremail@yourdomain.com")}</b><br>Please check your email and enter the confirmation code bellow.</p>
            </div>
            <div class="stack gap-16" style="align-items:center;width:100%;padding:0 24px">
              <div class="otp" role="group" aria-label="6-digit confirmation code">
                ${[0, 1, 2].map((i) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}" data-otp="${i}">`).join("")}
                <span class="dash" aria-hidden="true">-</span>
                ${[3, 4, 5].map((i) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}" data-otp="${i}">`).join("")}
              </div>
              <p class="t-sm" style="padding-top:8px">Didn’t get an email? <button type="button" class="link" data-act="resend">Resend code</button></p>
            </div>
            <button class="btn btn--primary btn--block" type="submit" disabled><span>Continue</span></button>
          </form>
        </section>
      </div>`);
  }
  function bindVerifyEmail() {
    const ins = $$("[data-otp]"), b = $("#f-otp button[type=submit]");
    const code = () => ins.map((i) => i.value).join("");
    const sync = () => { b.disabled = !/^\d{6}$/.test(code()); };
    ins.forEach((inp, i) => {
      inp.addEventListener("input", () => { inp.value = inp.value.replace(/\D/g, "").slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); sync(); });
      inp.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
      inp.addEventListener("paste", (e) => { const d = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6); if (!d) return; e.preventDefault(); d.split("").forEach((c, k) => { if (ins[k]) ins[k].value = c; }); (ins[d.length] || ins[5]).focus(); sync(); });
    });
    ins[0].focus();
    $("[data-act=resend]").addEventListener("click", () => toast("A new code has been sent"));
    $("#f-otp").addEventListener("submit", async (e) => { e.preventDefault(); if (b.disabled) return; await busy(b, 900); if (S.reactivating) { set({ reactivating: false }); go("#/dashboard"); toast("Welcome back! Your account is active again."); } else go("#/details"); });
  }

  function details() {
    return authPage(`
      <main class="auth__main">
        <form class="card" id="f-details" novalidate>
          <div class="stack gap-16">
            <h1 class="card__title">Personal Details</h1>
            ${input({ id: "name", label: "Full name", value: S.name, placeholder: "i.e. John Smith" })}
            ${input({ id: "company", label: "Company name", value: S.company, placeholder: "i.e. Your Token LLC" })}
            ${input({ id: "website", label: "Digital asset website", value: S.website, placeholder: "i.e. https://yourtoken.com" })}
          </div>
          <button class="btn btn--primary btn--block" type="submit" disabled><span>Continue</span></button>
        </form>
      </main>`);
  }
  function bindDetails() {
    const f = $("#f-details"), b = $("button[type=submit]", f);
    const ok = () => $("#name").value.trim() && $("#company").value.trim() && /^https?:\/\/\S+\.\S+/.test($("#website").value.trim());
    const sync = () => { b.disabled = !ok(); };
    $$("input", f).forEach((i) => i.addEventListener("input", sync)); sync(); $("#name").focus();
    $("#website").addEventListener("blur", () => { const v = $("#website").value.trim(); $("#website-err").textContent = v && !/^https?:\/\/\S+\.\S+/.test(v) ? "Enter a full URL, e.g. https://yourtoken.com" : ""; });
    f.addEventListener("submit", async (e) => { e.preventDefault(); if (!ok()) return; await busy(b, 700); set({ name: $("#name").value.trim(), company: $("#company").value.trim(), website: $("#website").value.trim() }); go("#/asset-details"); });
  }

  function assetDetails() {
    const legal = [
      `I agree to <b>ONCHAIN®</b> Terms and Conditions and Privacy Policy.`,
      `I agree to <b>ONCHAIN®</b> Token Agreement and Terms of Service.`,
      `Yes! I’d love to receive updates, exclusive offers, and news from <b>ONCHAIN®</b>.<br>(You can unsubscribe anytime.)`,
    ];
    return authPage(`
      <main class="auth__main">
        <form class="card" id="f-asset" novalidate>
          <div class="stack gap-16">
            <h1 class="card__title">Digital asset details</h1>
            ${select({ id: "network", label: "Network", value: S.network, placeholder: "Select" })}
            ${input({ id: "address", label: "Address", value: S.address, placeholder: "i.e. 0xeef...d3555", small: true })}
            <div class="stack gap-8">
              <span class="field__label">Tax <img src="${I("info-circle.svg")}" width="12" height="12" alt="" title="Tokens with a buy or sell tax can’t be sold through ONCHAIN Ramp yet."></span>
              <div class="tax-row" role="group" aria-label="Tax">
                ${checkbox("tax-buy", "Buy tax", { checked: S.tax === "buy" || S.tax === "both", disabled: S.tax === "na" })}
                ${checkbox("tax-sell", "Sell tax", { checked: S.tax === "sell" || S.tax === "both", disabled: S.tax === "na" })}
                ${checkbox("tax-na", "N/A", { checked: S.tax === "na" })}
              </div>
            </div>
          </div>
          <button class="btn btn--primary btn--block" type="submit" disabled><span>Complete sign up</span></button>
          <div class="stack gap-8">
            ${legal.map((t, i) => checkbox(`legal-${i}`, t, { cls: "check--legal", checked: i < 2 ? false : true, required: i < 2 })).join("")}
          </div>
        </form>
      </main>`);
  }
  function bindAssetDetails() {
    const f = $("#f-asset"), b = $("button[type=submit]", f);
    let network = S.network;
    bindSelect("network", (v) => { network = v; sync(); });
    const na = $("[name=tax-na]"), buy = $("[name=tax-buy]"), sell = $("[name=tax-sell]");
    na.addEventListener("change", () => { buy.disabled = sell.disabled = na.checked; if (na.checked) buy.checked = sell.checked = false; sync(); });
    [buy, sell].forEach((c) => c.addEventListener("change", sync));
    const addrOk = () => /^0x[a-fA-F0-9]{40}$/.test($("#address").value.trim());
    const taxChosen = () => na.checked || buy.checked || sell.checked;
    const ok = () => network && addrOk() && taxChosen() && $("[name=legal-0]").checked && $("[name=legal-1]").checked;
    function sync() { b.disabled = !ok(); }
    $("#address").addEventListener("input", sync);
    $("#address").addEventListener("blur", () => { const v = $("#address").value.trim(); $("#address-err").textContent = v && !addrOk() ? "Enter a valid contract address (0x followed by 40 characters)" : ""; $("#address").closest(".control").classList.toggle("is-invalid", !!(v && !addrOk())); });
    $$("[name^=legal]").forEach((c) => c.addEventListener("change", sync)); sync();
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); if (!ok()) return;
      const tax = na.checked ? "na" : buy.checked && sell.checked ? "both" : buy.checked ? "buy" : "sell";
      set({ network, address: $("#address").value.trim(), tax });
      await busy(b, 800);
      if (tax !== "na") return unsupportedModal();
      settingUp();
    });
  }
  function unsupportedModal() {
    modal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
        <div class="modal__body">
          <div class="modal__icon"><img src="${I("warning-yellow.svg")}" style="width:30px;height:26px" alt=""></div>
          <div class="stack gap-16" style="align-items:center">
            <div class="stack gap-8"><h2 class="t-h6" id="m-title">Unsupported digital asset</h2>
            <p class="t-lg">Your digital asset is not supported because it has a buy or sell tax, which is currently incompatible with our sell flow.</p></div>
            ${checkbox("notify", "Please notify me when this feature is supported")}
          </div>
        </div>
        <button class="btn btn--primary btn--block" data-close>Close</button>
      </div>`, (root, close) => {
      $("[data-close]", root).addEventListener("click", () => { if ($("[name=notify]", root).checked) toast("We’ll let you know when taxed tokens are supported"); close(); });
    });
  }
  async function settingUp() {
    const close = modal(`
      <div class="modal modal--setup" role="dialog" aria-modal="true" aria-labelledby="m-title" aria-busy="true">
        <div class="stack gap-32" style="align-items:center">
          <div class="brand-loader" role="progressbar" aria-label="Setting up your account">
            <img class="brand-loader__ring" src="${I("loader-ring.png")}" alt="">
            <div class="brand-loader__core"><img src="${I("loader-c.svg")}" alt=""></div>
          </div>
          <div class="stack gap-8 center"><h2 class="t-h6" id="m-title">Setting up your account</h2>
          <p class="t-md w-500" aria-live="polite">You’re almost there, it will just take a moment...</p></div>
        </div>
      </div>`, null, { dismissible: false });
    await delay(2600);
    set({ account: "setup" }); close(); go("#/dashboard");
  }

  // ---------- setup (Finish setup) ----------
  function setupSidebar(current) {
    const p = progress();
    return `
    <aside class="side" aria-label="Finish setup">
      <div class="side__head"><h2 class="side__title">Finish setup</h2><button class="icon-btn" data-act="close-setup" aria-label="Close setup"><img src="${I("close.svg")}" alt=""></button></div>
      <div class="side__list">
        <div class="progress"><div class="progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="Setup progress">
          <div class="progress__fill ${p === 100 ? "is-complete" : ""}" data-progress="${p}"><span class="progress__label">${p}%</span></div></div></div>
        <nav class="steps">
          ${steps.map((s) => {
            const done = stepDone(s.id);
            const notCleared = s.id === "asset" && S.assetStatus === "not-cleared";
            const waiting = s.id === "verify" && S.verify === "emailed";
            const cls = notCleared ? "is-error" : waiting ? "is-warning" : done ? "is-done" : s.id === current ? "is-current" : "";
            const icon = notCleared ? "cross-circle-red.svg" : waiting ? "warning-small.svg" : done ? "check-circle-green.svg" : "circle.svg";
            const chev = done ? "chevron-right-green.svg" : "chevron-right.svg";
            return `<a class="step ${cls}" href="#/setup/${s.id}" ${s.id === current ? 'aria-current="step"' : ""}>
              <span class="step__label"><img src="${I(icon)}" alt="">${s.label}${waiting ? `<span class="sr-only"> — waiting for verification</span>` : ""}</span>
              ${s.id === "asset" && done ? "" : `<span class="step__chev"><img src="${I(chev)}" alt=""></span>`}
            </a>`;
          }).join("")}
        </nav>
      </div>
    </aside>`;
  }
  const goplus = () => `<div class="powered">Powered by GoPlus Security <span class="goplus" aria-label="GoPlus"><img src="${I("goplus-mark.svg")}" style="left:0;top:0;width:16.3px;height:13.7px" alt=""><img src="${I("goplus-go.svg")}" style="left:18.6px;top:3.9px;width:17.5px;height:8px" alt=""><img src="${I("goplus-plus.svg")}" style="left:38px;top:3.9px;width:30px;height:8px" alt=""></span></div>`;

  function setupPanel(step) {
    switch (step) {
      case "asset":
        if (S.assetStatus === "not-cleared") return `
          <div class="section">
            <div class="stack gap-4">
              <h1 class="main__title">Digital asset <span class="status-pill pill--failed"><img src="${I("cross-circle-red.svg")}" alt="">Not cleared</span></h1>
              <p class="t-sm w-700" style="padding:0 8px">Your digital asset hasn’t cleared.</p>
            </div>
            <div class="stack gap-8" style="padding:0 8px">
              <p class="t-sm c-muted">After our security check, we flagged the following issues:</p>
              <div class="stack gap-8" style="padding:8px 0"><p class="issue"><img src="${I("warning-small.svg")}" alt="">Low liquidity</p><p class="issue"><img src="${I("warning-small.svg")}" alt="">Security reasons</p></div>
              <p class="t-sm c-muted">If you believe this is incorrect or has since been resolved, please request assistance from our support team.</p>
            </div>
            <div style="width:420px;padding:8px"><button class="btn btn--primary btn--h48 btn--block" data-act="support"><span>Talk to support</span></button></div>
          </div>${goplus()}`;
        return `
          <div class="section">
            <div class="stack gap-4">
              <h1 class="main__title">Digital asset <span class="status-pill pill--cleared"><img src="${I("check-circle-green.svg")}" alt="">Cleared</span></h1>
              <p class="t-sm w-700" style="padding:0 8px">Your digital asset has cleared.</p>
            </div>
            <div class="stack gap-8" style="padding:0 8px">
              <p class="t-sm c-muted">Our security check found no issues:</p>
              <div class="stack gap-8" style="padding:8px 0"><p class="issue" style="font-weight:400"><img src="${I("check-circle-green.svg")}" alt=""><b>Liquidity:</b>&nbsp;sufficient</p><p class="issue" style="font-weight:400"><img src="${I("check-circle-green.svg")}" alt=""><b>Security:</b>&nbsp;no risks detected</p></div>
              <p class="t-sm c-muted">You’re ready for the next step: share your whitepaper link.</p>
            </div>
            <div style="width:420px;padding:8px"><button class="btn btn--primary btn--h48 btn--block" data-act="next-step"><span>Continue setup</span></button></div>
          </div>${goplus()}`;
      case "whitepaper":
        return `
          <form class="section" id="f-wp" novalidate>
            <div class="stack"><h1 class="main__title">Link to Whitepaper</h1><p class="main__sub">Please provide a link to your projects whitepaper</p></div>
            <div class="col-420 stack gap-16" style="padding:8px">
              ${input({ id: "wp", label: "Your whitepaper link", value: S.whitepaper, placeholder: "Enter your whitepaper link", labelCls: "field__label--muted" })}
              <button class="btn btn--primary btn--h48 btn--block" type="submit" disabled><span>${S.whitepaper ? "Update link" : "Continue"}</span></button>
            </div>
          </form>`;
      case "payment":
        return `
          <form class="section" id="f-pay" novalidate>
            <div class="stack"><h1 class="main__title">Payment details</h1><p class="main__sub">Add your preferred payment methods</p></div>
            <div class="row row--top gap-24">
              <div class="stack gap-8" style="width:420px;padding:0 8px">
                <div class="field"><span class="sr-only">Default payment currency</span><div class="control control--disabled"><input value="ACME" disabled aria-label="Default payment currency"></div></div>
                <div class="row gap-16" style="align-items:flex-end">
                  <div class="field" style="flex:1"><span class="field__label field__label--regular">Secondary payment currency</span>
                    <div class="row gap-8" style="height:48px"><img src="${I("usdc.svg")}" width="24" height="24" alt=""><span class="t-md">USDC</span></div></div>
                  <div style="flex:1">${select({ id: "paynet", value: S.payNetwork, placeholder: "Select network ", pl20: true })}</div>
                </div>
                <button class="btn btn--primary btn--h48 btn--block" type="submit" disabled style="margin-top:16px"><span>Continue</span></button>
              </div>
              <div style="width:458px;padding:29px 16px 0">${payInfo()}</div>
            </div>
          </form>`;
      case "plan":
        return `
          <div class="section" style="justify-content:center;flex:1">
            <div class="stack"><h1 class="main__title">Select your plan</h1><p class="main__sub">Activate your plan and start free trial</p></div>
            ${plansGrid({ selectable: true })}
          </div>`;
      case "verify": {
        const connected = S.verify === "connected", emailed = S.verify === "emailed";
        return `
          <div class="section">
            <div class="stack"><h1 class="main__title">${connected ? "Sign in to X" : "Account Verification"}</h1>
              <p class="main__sub">To confirm that you are an authorized representative of this token project, please sign in using the project’s official X account (formerly known as Twitter).</p></div>
            <div class="col-420">
              ${connected
                ? `<button class="btn btn--soft btn--h48 btn--block" disabled style="color:var(--text);background:var(--shade-50)"><img src="${I("x-logo.svg")}" width="24" height="20" alt=""><span>@acme_labs</span></button>`
                : `<button class="btn btn--outline btn--h48 btn--block" data-act="x-signin"><img src="${I("x-logo.svg")}" width="24" height="20" alt=""><span>Sign in</span></button>`}
            </div>
            <div class="hr"></div>
            <div class="stack gap-8">
              <p class="t-lg" style="padding:0 8px">Credentials</p>
              <div style="padding:0 8px">${checkbox("email-owner", "Email the X account owner", { checked: emailed || !!S.ownerEmail, cls: "check--sm", disabled: connected })}</div>
            </div>
            <form class="stack gap-8" id="f-owner" novalidate>
              <div class="col-420">${input({ id: "owner", label: "Owners email address", value: S.ownerEmail, placeholder: "Enter owners email address", type: "email", icon: `<img class="control__icon" src="${I("envelope-gray.svg")}" alt="">`, labelCls: "field__label--regular", disabled: !(emailed || S.ownerEmail) || connected })}</div>
              <div class="col-420" style="padding:8px"><button class="btn btn--soft btn--h48 btn--block" type="submit" disabled><span>${emailed ? "Resend email" : "Send email"}</span></button></div>
              ${emailed ? `<p class="t-sm" style="padding:0 8px;color:var(--yellow-text)" role="status"><b>Your email has been sent.</b> Waiting for verification by ${esc(S.ownerEmail)}.</p>` : ""}
            </form>
            ${connected || emailed ? `<div class="col-420" style="padding:8px"><button class="btn btn--primary btn--h48 btn--block" data-act="finish-setup"><span>Go to dashboard</span></button></div>` : ""}
          </div>`;
      }
    }
    return "";
  }
  function payInfo() {
    return `<div class="info-card"><p><b>Pay with your digital asset</b><br>Token-based projects can settle their subscription fees using the tokens they have issued for their project.<br><a href="https://help.onchainramp.com/en/articles/10604829-accepted-payment-methods-for-onchain-ramp-subscription" target="_blank" rel="noopener">Read more about this</a></p><p><br><span class="warn">⚠</span> <b>Sending USDC from a different network than the one selected can result in a permanent loss. Make sure the network matches before proceeding.</b></p></div>`;
  }
  function plansGrid({ selectable }) {
    const features = ["ONCHAIN Ramp", "Dedicated Dashboard", "Payment Links", "Pay with your own token", "Pay with stablecoins"];
    const ins = ["Sales &amp; volume analytics", "Wallet &amp; region insights", "Ramp link conversions", "Scheduled reports &amp; CSV", "Liquidity &amp; price alerts"];
    const ent = ["Team accounts &amp; roles", "White-label ramp branding", "API &amp; webhooks", "Multi-token &amp; multi-chain", "Dedicated manager &amp; SLA"];
    const li = (arr, ic) => `<ul class="plan__features">${arr.map((t) => `<li><img src="${I(ic)}" alt="">${t}</li>`).join("")}</ul>`;
    return `
      <div class="plans">
        <article class="plan ${S.plan ? "is-selected" : ""}">
          <div class="plan__inner">
            <div class="stack gap-16"><div class="stack" style="gap:13px"><h3 class="plan__name">Starter</h3><p class="plan__price"><span class="t-h3">$200</span><span class="plan__per">/ month</span></p></div>
            <p class="plan__desc">Free for the first 14 days and then $200 per month</p></div>
            <div class="plan__rule"></div>${li(features, "check-blue.svg")}
          </div>
          ${S.plan ? `<button class="btn btn--soft btn--block" disabled style="color:var(--green-text);background:var(--done-bg)"><img src="${I("check-circle-green.svg")}" width="20" height="20" alt=""><span>${selectable ? "Starter selected" : "Current plan"}</span></button>`
            : `<button class="btn btn--primary btn--block" data-act="choose-plan"><span>Choose Starter</span></button>`}
        </article>
        <article class="plan plan--soon" aria-disabled="true">
          <div class="plan__inner">
            <div class="stack gap-16"><div class="stack" style="gap:13px"><h3 class="plan__name">Insights</h3><p class="plan__price"><span class="t-h3">$500</span><span class="plan__per">/ month</span></p></div>
            <p class="plan__desc">Everything on <b>Starter</b> plan plus:</p></div>
            <div class="plan__rule"></div>${li(ins, "check-light.svg")}
          </div>
          <button class="btn btn--muted btn--block" disabled><span>Coming soon</span></button>
        </article>
        <article class="plan plan--soon" aria-disabled="true">
          <div class="plan__inner">
            <div class="stack gap-16"><div class="stack" style="gap:20px"><h3 class="plan__name">Enterprise</h3><p class="t-h4">On Request</p></div>
            <p class="plan__desc">Everything on <b>Insights</b> plan plus:</p></div>
            <div class="plan__rule"></div>${li(ent, "check-light.svg")}
          </div>
          <button class="btn btn--muted btn--block" disabled><span>Coming soon</span></button>
        </article>
      </div>`;
  }
  function setup(step) {
    if (!steps.some((s) => s.id === step)) step = firstOpenStep();
    return appShell(`<div class="panel">${setupSidebar(step)}<section class="main" aria-live="polite">${setupPanel(step)}</section></div>`, { withBanner: false });
  }
  function nextStepAfter(id) { const i = steps.findIndex((s) => s.id === id); const rest = steps.slice(i + 1).find((s) => !stepDone(s.id)); return (rest || steps.find((s) => !stepDone(s.id)) || steps[4]).id; }
  function bindSetup(step) {
    animateProgress();
    $("[data-act=close-setup]").addEventListener("click", () => go("#/dashboard"));
    const next = $("[data-act=next-step]"); if (next) next.addEventListener("click", () => go(`#/setup/${nextStepAfter("asset")}`));
    const sup = $("[data-act=support]"); if (sup) sup.addEventListener("click", () => toast("Opening a conversation with our support team…"));
    if (step === "whitepaper") {
      const f = $("#f-wp"), b = $("button[type=submit]", f), i = $("#wp");
      const ok = () => /^https?:\/\/\S+\.\S+/.test(i.value.trim());
      const sync = () => { b.disabled = !ok() || i.value.trim() === S.whitepaper; };
      i.addEventListener("input", sync); sync(); i.focus();
      i.addEventListener("blur", () => { const v = i.value.trim(); $("#wp-err").textContent = v && !ok() ? "Enter a full link, e.g. https://acme.com/whitepaper.pdf" : ""; });
      f.addEventListener("submit", async (e) => { e.preventDefault(); if (!ok()) return; await busy(b, 800); set({ whitepaper: i.value.trim() }); toast("Whitepaper link saved"); go(`#/setup/${nextStepAfter("whitepaper")}`); });
    }
    if (step === "payment") {
      const f = $("#f-pay"), b = $("button[type=submit]", f); let v = S.payNetwork;
      const sync = () => { b.disabled = !v || v === S.payNetwork; };
      bindSelect("paynet", (x) => { v = x; sync(); }); sync();
      f.addEventListener("submit", async (e) => { e.preventDefault(); if (!v) return; await busy(b, 800); set({ payNetwork: v }); toast("Payment method saved"); go(`#/setup/${nextStepAfter("payment")}`); });
    }
    if (step === "plan") {
      const b = $("[data-act=choose-plan]");
      if (b) b.addEventListener("click", async () => { await busy(b, 1100); set({ plan: true }); toast("Starter plan activated — your 14-day free trial has started"); go(`#/setup/${nextStepAfter("plan")}`); });
    }
    if (step === "verify") {
      const xs = $("[data-act=x-signin]");
      if (xs) xs.addEventListener("click", async () => { await busy(xs, 1500); set({ verify: "connected" }); toast("X account @acme_labs connected"); render(); });
      const chk = $("[name=email-owner]"), ow = $("#owner"), f = $("#f-owner"), b = $("button[type=submit]", f);
      const okMail = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ow.value.trim());
      const sync = () => { b.disabled = !(chk.checked && okMail()) || S.verify === "connected"; };
      chk.addEventListener("change", () => { ow.disabled = !chk.checked; ow.closest(".control").classList.toggle("control--disabled", !chk.checked); if (chk.checked) ow.focus(); sync(); });
      ow.addEventListener("input", sync); sync();
      f.addEventListener("submit", async (e) => { e.preventDefault(); if (b.disabled) return; await busy(b, 1000); set({ verify: "emailed", ownerEmail: ow.value.trim() }); toast(`Verification link sent to ${ow.value.trim()}`); render(); });
      const fin = $("[data-act=finish-setup]");
      if (fin) fin.addEventListener("click", async () => {
        await busy(fin, 700);
        // prototype: a fully verified account lands straight on a populated dashboard
        if (S.verify === "connected") { set({ account: "active", populated: true }); go("#/dashboard"); toast("Setup complete — your account is active 🎉"); }
        else { set({ account: "verifying" }); go("#/dashboard"); }
      });
    }
  }
  function animateProgress() {
    const fill = $(".progress__fill"); if (!fill) return;
    const target = +fill.dataset.progress; const prev = +(sessionStorage.getItem("pp") || 0);
    fill.style.width = `${prev}%`;
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${Math.max(target, 9)}%`; }));
    try { sessionStorage.setItem("pp", target); } catch { /* ignore */ }
  }
  let activationTimer;
  function scheduleActivation() {
    clearTimeout(activationTimer);
    activationTimer = setTimeout(() => { if (S.account === "verifying") { set({ account: "active", populated: true }); toast("Your account has been verified 🎉"); if (location.hash.startsWith("#/dashboard")) render(); } }, reduced ? 800 : 5000);
  }

  // ---------- dashboard ----------
  function txTable(rows, { full = false } = {}) {
    const pill = (s) => s === "Succeeded" ? `<span class="status-pill pill--success"><img src="${I("check-circle-success.svg")}" alt="">Succeeded</span>`
      : s === "Pending" ? `<span class="status-pill pill--pending"><img src="${I("hourglass.svg")}" alt="">Pending</span>`
      : `<span class="status-pill pill--failed"><img src="${I("cross-circle-failed.svg")}" alt="">Failed</span>`;
    const copyBtn = (v, label) => `<button class="copy" data-copy="${esc(v)}" aria-label="Copy ${label} ${esc(v)}">${esc(v)}<img src="${I("copy.svg")}" alt=""></button>`;
    return `
      <div class="table" role="table" aria-label="Transactions">
        <div class="trow thead" role="row">
          <span role="columnheader"><button data-sort="amount" aria-sort="${sortState.key === "amount" ? sortState.dir : "none"}">Amount <img src="${I("sort.svg")}" alt=""></button></span>
          <span role="columnheader">Status</span><span role="columnheader">Quantity</span><span role="columnheader">Wallet</span>
          <span role="columnheader"><button data-sort="date" aria-sort="${sortState.key === "date" ? sortState.dir : "none"}">Date <img src="${I("sort.svg")}" alt=""></button></span>
          <span role="columnheader">On-chain tx</span><span role="columnheader">Order ID</span>
        </div>
        <div class="tbody" role="rowgroup">
          ${rows.length ? rows.map((r, i) => `<div class="trow" role="row" style="animation-delay:${Math.min(i, 10) * 25}ms">
            <span class="amt" role="cell"><b>$${r.amount}</b>USD</span><span role="cell">${pill(r.status)}</span><span role="cell">${r.qty} ACME</span>
            <span role="cell">${copyBtn(r.wallet, "wallet")}</span><span role="cell">${fmtDate(r.date)}</span>
            <span role="cell">${copyBtn(r.tx, "transaction")}</span><span role="cell">${copyBtn(r.order, "order ID")}</span></div>`).join("")
          : `<div class="empty" style="min-height:200px"><p class="t-md c-muted">No transactions match your search.</p></div>`}
        </div>
      </div>`;
  }
  const sortState = { key: "date", dir: "descending" };
  function sorted(rows) {
    const k = sortState.key, m = sortState.dir === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => (k === "amount" ? a.amount - b.amount : a.date - b.date) * m);
  }
  function assetCard() {
    const verified = S.account === "active";
    return `
      <section class="dcard" aria-labelledby="da-title">
        <h2 class="dcard__title" id="da-title">Digital asset</h2>
        <div class="asset-grid">
          <div class="asset-grid__left">
            <div><p class="kv__label">Ticker <img src="${I("info-circle.svg")}" alt="" title="Your token’s ticker symbol"></p><p class="ticker">${S.tickerImg ? `<img src="${esc(S.tickerImg)}" style="border-radius:50%;object-fit:cover" alt="">` : verified ? `<img src="${I("acme.svg")}" alt="">` : `<img src="${I("image-placeholder.svg")}" style="width:24px;height:24px;margin:4px" alt="">`}ACME</p></div>
            <div><p class="kv__label">Status</p><span class="dot ${verified ? "dot--green" : "dot--yellow"}" role="img" aria-label="${verified ? "Active" : "Pending verification"}"></span></div>
            <div><p class="kv__label">Address</p><button class="copy copy--lg" data-copy="${esc(S.address || "0x2c18f2d4e9a1b7c3f5e6d8a9b0c1d2e3f4a54567")}" aria-label="Copy token address">0x2c...4567<img src="${I("copy16.svg")}" alt=""></button></div>
          </div>
          <div><p class="kv__label">Description</p>
            ${S.description ? `<p class="t-sm">${esc(S.description)}</p>` : `<a class="btn-outline-sm" href="#/settings/asset" style="display:inline-flex;align-items:center;text-decoration:none">Add description</a>`}
          </div>
        </div>
        <div class="pairs">
          <div class="row between"><p class="kv__label" style="margin:0">Available pairs <img src="${I("info-circle.svg")}" alt=""></p>${verified ? "" : `<button class="btn-outline-sm" data-act="add-pair">Add pair</button>`}</div>
          <div id="pairs-body">${pairsLoaded ? pairsTable() : `<div class="loading-row" role="status"><span class="spinner" aria-hidden="true"></span>We are fetching the token pairs. This can take up to 10 seconds.</div>`}</div>
        </div>
      </section>`;
  }
  let pairsLoaded = false;
  const pairsTable = () => `
    <div class="table" style="padding:0">
      <div class="trow trow--pairs thead"><span>DEX</span><span>Pair</span><span>Network</span><span><button>Volume (24h) <img src="${I("sort.svg")}" alt=""></button></span><span>Cleared</span></div>
      <div class="tbody"><div class="trow trow--pairs"><span class="dex"><img src="${I("uni.svg")}" alt="">Uniswap V4</span><span>ACME/USDC</span><span><img class="net-ic" src="${I("currency-eth.svg")}" alt="Ethereum"></span><span>$1,324,893</span><span><span class="dot dot--green" role="img" aria-label="Cleared"></span></span></div></div>
    </div>`;
  function dashboard() {
    let tx;
    if (S.account === "setup") tx = `<div class="empty"><p class="empty__title">Complete setting up your account!</p><button class="btn btn--primary btn--small" data-act="go-setup" style="height:36px"><span>Complete setup</span></button></div>`;
    else if (S.account === "verifying") tx = `<div class="empty" role="status"><span class="spinner" aria-hidden="true"></span><p class="empty__title">Your account is being verified.</p>${S.verify === "emailed" ? `<p class="t-sm c-muted">We’re waiting for ${esc(S.ownerEmail)} to confirm ownership through X.</p>` : `<p class="t-sm c-muted">This usually takes a few seconds.</p>`}</div>`;
    else if (!S.populated) tx = `<div class="empty"><p class="welcome">Welcome to <i>ONCHAIN®</i> 🎉</p><p class="welcome-sub">You can now start selling your tokens. No more middlemen, goodbye listing fees!</p><button class="btn btn--tertiary btn--small" data-act="ramp-link"><span>Copy your Ramp link</span><img src="${I("copy16.svg")}" width="16" height="16" alt=""></button></div>`;
    else tx = txTable(sorted(TX).slice(0, 10));
    const viewAll = S.account === "active" && S.populated;
    return appShell(`
      <section class="dcard" aria-labelledby="tx-title">
        <h2 class="dcard__title" id="tx-title">Transactions</h2>
        ${tx}
        <div style="padding:0 16px"><a class="btn btn--small ${viewAll ? "btn--tertiary" : "btn--soft"}" ${viewAll ? `href="#/transactions"` : `aria-disabled="true" tabindex="-1" style="height:50px;padding:6px 12px;background:var(--shade-50);color:var(--shade-200);pointer-events:none"`} style="height:50px;padding:6px 12px;text-decoration:none">View all transactions</a></div>
      </section>
      ${assetCard()}`);
  }
  function bindDashboard() {
    if (!pairsLoaded) setTimeout(() => { pairsLoaded = true; const b = $("#pairs-body"); if (b) { b.innerHTML = pairsTable(); } }, reduced ? 300 : 2800);
    if (S.account === "verifying" && S.verify === "connected") scheduleActivation();
    $$("[data-sort]").forEach((b) => b.addEventListener("click", () => { toggleSort(b.dataset.sort); render(); }));
    const ap = $("[data-act=add-pair]"); if (ap) ap.addEventListener("click", () => toast("Pairs are added automatically once your asset is verified"));
  }
  function toggleSort(k) { if (sortState.key === k) sortState.dir = sortState.dir === "ascending" ? "descending" : "ascending"; else { sortState.key = k; sortState.dir = "descending"; } }

  // ---------- transactions page ----------
  const txView = { q: "", page: 1, per: 10 };
  function transactions() {
    return appShell(`
      <section class="dcard" aria-labelledby="tx-title">
        <div class="dcard__title"><h2 id="tx-title" style="font-size:16px">Transactions</h2>
          <label class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 21l-5.2-5.2M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" stroke="#8899A8" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input id="tx-search" type="search" placeholder="Search by Wallet address or Order ID" value="${esc(txView.q)}" aria-label="Search transactions"></label></div>
        <div id="tx-wrap"></div>
        <div class="table-foot">
          <button class="btn btn--tertiary btn--small" data-act="csv"><img src="${I("download.svg")}" width="16" height="16" alt=""><span>Download CSV</span></button>
          <nav class="pager" aria-label="Pagination" id="pager"></nav>
        </div>
      </section>`);
  }
  function filteredTx() { const q = txView.q.trim().toLowerCase(); return sorted(TX).filter((r) => !q || r.wallet.toLowerCase().includes(q) || r.order.toLowerCase().includes(q) || r.tx.toLowerCase().includes(q)); }
  function renderTxPage() {
    const rows = filteredTx(); const pages = Math.max(1, Math.ceil(rows.length / txView.per));
    txView.page = Math.min(txView.page, pages);
    $("#tx-wrap").innerHTML = txTable(rows.slice((txView.page - 1) * txView.per, txView.page * txView.per), { full: true });
    $$("#tx-wrap [data-sort]").forEach((b) => b.addEventListener("click", () => { toggleSort(b.dataset.sort); renderTxPage(); }));
    const p = txView.page; const nums = [...new Set([1, 2, 3, 4, 5, p - 1, p, p + 1, pages].filter((n) => n >= 1 && n <= pages))].sort((a, b) => a - b);
    let html = `<button data-page="${p - 1}" ${p === 1 ? "disabled" : ""} aria-label="Previous page"><img src="${I("chevron-right.svg")}" style="transform:rotate(180deg);width:7px;height:12px" alt=""></button>`;
    let last = 0; nums.forEach((n) => { if (n - last > 1) html += `<span aria-hidden="true">…</span>`; html += `<button data-page="${n}" ${n === p ? 'aria-current="page"' : ""}>${n}</button>`; last = n; });
    html += `<button data-page="${p + 1}" ${p === pages ? "disabled" : ""} aria-label="Next page"><img src="${I("chevron-right.svg")}" style="width:7px;height:12px" alt=""></button>`;
    $("#pager").innerHTML = html;
    $$("#pager [data-page]").forEach((b) => b.addEventListener("click", () => { txView.page = +b.dataset.page; renderTxPage(); }));
  }
  function bindTransactions() {
    renderTxPage();
    let t; $("#tx-search").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { txView.q = e.target.value; txView.page = 1; renderTxPage(); }, 150); });
    const b = $("[data-act=csv]"); b.addEventListener("click", async () => {
      await busy(b, 700);
      const rows = filteredTx(); const csv = ["Amount (USD),Status,Quantity (ACME),Wallet,Date,On-chain tx,Order ID", ...rows.map((r) => [r.amount, r.status, r.qty.replace(/,/g, ""), r.wallet, fmtDate(r.date).replace(/,/g, ""), r.tx, r.order].join(","))].join("\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "onchain-transactions.csv"; a.click(); URL.revokeObjectURL(a.href);
      toast(`Exported ${rows.length} transactions`);
    });
  }

  // ---------- settings ----------
  const settingsItems = [["project", "Project info"], ["asset", "Digital asset"], ["billing", "Billing"], ["deactivate", "Deactivate account"]];
  const settingsSide = (cur) => `
    <aside class="side" aria-label="Settings">
      <div class="side__head"><h2 class="side__title">Settings</h2><button class="icon-btn" data-act="close-settings" aria-label="Close settings"><img src="${I("close.svg")}" alt=""></button></div>
      <nav class="side__list"><div class="steps">${settingsItems.map(([id, l]) => `<a class="step ${id === cur ? "is-current" : ""}" href="#/settings/${id}" ${id === cur ? 'aria-current="page"' : ""}><span class="step__label">${l}</span><span class="step__chev"><img src="${I("chevron-right.svg")}" alt=""></span></a>`).join("")}</div></nav>
    </aside>`;
  function settings(page, tab) {
    let body = "";
    if (page === "project") body = `
      <form class="section" id="f-project" novalidate style="gap:16px">
        <h1 class="main__title">Project info</h1><div class="hr" style="margin:0 -16px"></div>
        <div class="stack gap-16" style="padding:0 8px">
          <div class="row row--top gap-16">
            <div class="field" style="width:auto"><span class="field__label">Logo</span>
              ${uploadTrigger("Logo")}</div>
            ${input({ id: "p-company", label: "Company name", value: S.company || "ACME Labs" })}
          </div>
          <div class="row row--top gap-16">${input({ id: "p-name", label: "Full name", value: S.name || "Gustavo Guerra" })}${input({ id: "p-email", label: "Email", value: S.email || "gustavo@onchainlabs.org", readonly: true })}</div>
        </div>
        <div class="save-bar" hidden id="save-bar"><button type="button" class="btn btn--tertiary btn--h48" data-act="reset-form">Cancel</button><button class="btn btn--primary btn--h48" type="submit"><span>Save changes</span></button></div>
      </form>`;
    if (page === "asset") body = `
      <form class="section" id="f-asset-settings" novalidate style="gap:16px">
        <h1 class="main__title">Digital asset details</h1><div class="hr" style="margin:0 -16px"></div>
        <div class="stack gap-16" style="padding:0 8px">
          <div class="row row--top gap-16">
            <div class="field" style="width:auto"><span class="field__label">Image</span>${uploadTrigger("Image")}</div>
            ${input({ id: "a-ticker", label: "Ticker", value: "ACME", readonly: true })}
          </div>
          <div class="row row--top gap-16">
            ${input({ id: "a-website", label: "Website", value: S.website || "https://acme.com" })}
            ${input({ id: "a-wp", label: "Link to whitepaper", value: S.whitepaper || "https://acme.com/whitepaper", labelCls: "field__label--regular" })}
          </div>
          <div class="field"><label class="field__label" for="a-desc">Description</label><div class="control control--textarea"><textarea id="a-desc" maxlength="500" placeholder="Add your digital asset description in here...">${esc(S.description)}</textarea></div><p class="field__error c-muted" style="color:var(--text-muted)" id="desc-count">${S.description.length}/500</p></div>
          <div class="row"><button class="btn btn--primary btn--h48" type="submit" disabled><span>Save description</span></button></div>
        </div>
      </form>`;
    if (page === "billing") {
      tab = ["plan", "payment", "transactions"].includes(tab) ? tab : "plan";
      const tabs = [["plan", "Plan"], ["payment", "Payment details"], ["transactions", "Transactions"]];
      let content = "";
      if (tab === "plan") content = `<div style="padding-top:8px">${plansGrid({ selectable: false })}</div>`;
      if (tab === "payment") content = `
        <div class="row row--top gap-24" style="padding:0 8px">
          <div class="stack gap-16" style="flex:1"><h2 class="t-lg w-600">Payment details</h2>
            <div class="control control--disabled"><input value="ACME" disabled aria-label="Default payment currency"></div>
            <div class="row row--top gap-16"><div class="field" style="flex:1"><span class="field__label field__label--regular">Secondary payment method</span><div class="row gap-8" style="height:50px"><img src="${I("usdc.svg")}" width="24" height="24" alt=""><span class="t-md">USDC</span></div></div>
            <div style="flex:1">${select({ id: "bill-net", label: "USDC network", value: S.payNetwork || "ethereum", pl20: true, labelCls: "field__label--regular" })}</div></div>
          </div>
          <div style="flex:1">${payInfo()}</div>
        </div>
        <div class="hr"></div>
        <div class="row row--top gap-24" style="padding:0 8px">
          <div class="stack gap-16" style="flex:1"><h2 class="t-lg w-600">Balance</h2>
            <div class="stack gap-10"><p class="balance"><span class="t-h3">${S.paymentFailed ? "$0" : "$1200"}</span><span class="dot ${S.paymentFailed ? "dot--red" : "dot--green"}" role="img" aria-label="${S.paymentFailed ? "Insufficient funds" : "Funded"}"></span></p>
            <p class="t-xs c-muted">Next payment due <span class="w-500">29th April</span></p>
            <button class="btn btn--tertiary btn--small" data-act="topup" style="align-self:flex-start"><span>Top up balance</span></button></div></div>
          <div class="stack gap-16" style="flex:1"><h2 class="t-lg w-600">Billing details</h2>
            <div class="field"><span class="field__label field__label--regular">Deposit and drawdown address</span><div class="control control--readonly"><input value="0x8954...9F12A4" readonly aria-label="Deposit and drawdown address"><button class="icon-btn" type="button" data-copy="0x8954a1c3e2f9b07d61a4c5e8f2d3b9a7c09F12A4" aria-label="Copy deposit address"><img src="${I("copy16.svg")}" alt=""></button></div></div></div>
        </div>`;
      if (tab === "transactions") content = `
        <div class="table" style="padding:0 8px">
          <div class="trow trow--billing thead"><span>Type</span><span>Amount</span><span>Paid with</span><span>Initiated at</span><span>Status</span></div>
          <div class="tbody">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const failed = i === 2 || i === 5 || i === 8; const usdc = i % 3 === 0; return `<div class="trow trow--billing" style="animation-delay:${i * 25}ms"><span class="w-500">Starter plan monthly payment</span><span>$200</span><span class="dex"><img src="${I(usdc ? "usdc.svg" : "acme.svg")}" style="width:24px;height:24px" alt="">${usdc ? "USDC" : "ACME"}</span><span>${fmtDate(new Date(2024, 8 - i, 1, 22, 10)).replace("pm", "PM")}</span><span class="row gap-4"><span class="dot ${failed ? "dot--red" : "dot--green"}" style="margin:0 4px 0 0;width:8px;height:8px;box-shadow:none"></span>${failed ? "Failed" : "Completed"}</span></div>`; }).join("")}</div>
        </div>`;
      body = `
        <div class="section" style="gap:16px">
          <h1 class="main__title">Billing</h1>
          <div class="tabs" role="tablist">${tabs.map(([id, l]) => `<a class="tab" role="tab" href="#/settings/billing/${id}" aria-selected="${id === tab}">${l}</a>`).join("")}</div>
          ${content}
        </div>`;
    }
    if (page === "deactivate") body = `
      <div class="section" style="gap:16px">
        <h1 class="main__title">Deactivate account</h1><div class="hr" style="margin:0 -16px"></div>
        <div class="stack gap-16" style="padding:8px">
          <p class="t-lg">Deactivating your account will temporarily disable access, but don’t worry — you can reactivate it anytime by simply logging back in.</p>
          <p class="t-lg">We’ll keep your information safe while your account is inactive, and no one will be able to access it during this time.</p>
          <div><button class="btn btn--danger" data-act="deactivate"><span>Deactivate account</span></button></div>
        </div>
      </div>`;
    return appShell(`<div class="panel">${settingsSide(page)}<section class="main">${body}</section></div>`);
  }
  function bindSettings(page) {
    $("[data-act=close-settings]").addEventListener("click", () => go("#/dashboard"));
    const up = $("[data-act=upload]"); if (up) up.addEventListener("click", () => uploadModal(up.dataset.kind));
    if (page === "project") {
      const f = $("#f-project"), bar = $("#save-bar"), ins = ["p-company", "p-name"].map((id) => $(`#${id}`));
      const orig = ins.map((i) => i.value);
      const sync = () => { bar.hidden = ins.every((i, k) => i.value === orig[k]); };
      ins.forEach((i) => i.addEventListener("input", sync));
      $("[data-act=reset-form]").addEventListener("click", () => { ins.forEach((i, k) => { i.value = orig[k]; }); sync(); });
      f.addEventListener("submit", async (e) => { e.preventDefault(); const b = $("button[type=submit]", f); await busy(b, 800); set({ company: ins[0].value.trim(), name: ins[1].value.trim() }); toast("Project info saved"); render(); });
    }
    if (page === "asset") {
      const f = $("#f-asset-settings"), d = $("#a-desc"), b = $("button[type=submit]", f);
      const sync = () => { b.disabled = d.value === S.description; $("#desc-count").textContent = `${d.value.length}/500`; };
      d.addEventListener("input", sync); sync();
      f.addEventListener("submit", async (e) => { e.preventDefault(); await busy(b, 800); set({ description: d.value.trim() }); toast("Description saved"); render(); });
    }
    if (page === "billing") {
      if ($("[data-select=bill-net]")) bindSelect("bill-net", (v) => { set({ payNetwork: v }); toast(`USDC network set to ${netById(v).label}`); });
      const t = $("[data-act=topup]"); if (t) t.addEventListener("click", () => { $$("[data-copy]")[0]?.click(); toast("Deposit address copied — send USDC or ACME to top up"); });
    }
    if (page === "deactivate") $("[data-act=deactivate]").addEventListener("click", surveyModal);
  }
  const SAMPLE_LOGO = I("acme.svg");
  // "Logo" = project/company logo (top bar); "Image" = token ticker image (digital asset)
  const slot = (kind) => (kind === "Image" ? "tickerImg" : "logo");
  const uploadTrigger = (kind) => { const v = S[slot(kind)]; return `<button type="button" class="upload ${v ? "has-image" : ""}" data-act="upload" data-kind="${kind}" aria-label="${v ? `Change ${kind.toLowerCase()}` : `Upload ${kind.toLowerCase()}`}">
      ${v ? `<img class="is-photo" src="${esc(v)}" alt="">` : `<img src="${I("image-placeholder.svg")}" alt="">`}</button>`; };
  function uploadModal(kind) {
    const key = slot(kind); let pending = S[key] || "";
    const preview = (src) => src ? `<img class="up-preview__img" src="${esc(src)}" alt="Selected ${kind.toLowerCase()} preview">` : `<span class="up-preview__ph"><img src="${I("image-placeholder-50.svg")}" alt=""></span>`;
    modal(`
      <div class="up-modal" role="dialog" aria-modal="true" aria-label="Upload ${kind === "Image" ? "ticker image" : "project logo"}">
        <div class="up-row">
          <div class="up-preview" aria-live="polite">${preview(pending)}</div>
          <label class="up-drop" tabindex="0">
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" class="sr-only">
            <span class="up-drop__ic"><img src="${I("cloud-upload.svg")}" alt=""></span>
            <span class="up-drop__txt"><span><b>Click to upload</b> or drag and drop</span><small>Use a square image for best results</small></span>
          </label>
        </div>
        <p class="field__error" role="alert" style="margin:-8px 0 0"></p>
        <div class="up-actions">
          <button type="button" class="btn btn--outline" data-cancel>Cancel</button>
          <button type="button" class="btn btn--primary" data-save disabled><span>Save</span></button>
        </div>
      </div>`, (root, close) => {
      const drop = $(".up-drop", root), file = $("input[type=file]", root), save = $("[data-save]", root), err = $(".field__error", root), pv = $(".up-preview", root);
      const take = (f) => {
        err.textContent = "";
        if (!f) return;
        if (!/^image\//.test(f.type)) { err.textContent = "Please choose a PNG, JPG, SVG or WebP image."; return; }
        if (f.size > 2 * 1024 * 1024) { err.textContent = "Image must be smaller than 2 MB."; return; }
        const r = new FileReader();
        r.onload = () => { pending = r.result; pv.innerHTML = preview(pending); save.disabled = pending === S[key]; };
        r.readAsDataURL(f);
      };
      file.addEventListener("change", () => take(file.files[0]));
      drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); } });
      ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("is-drag"); }));
      ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("is-drag"); }));
      drop.addEventListener("drop", (e) => take(e.dataTransfer.files[0]));
      $("[data-cancel]", root).addEventListener("click", close);
      save.addEventListener("click", async () => { await busy(save, 900); set({ [key]: pending }); close(); toast(`${kind} updated`); render(); });
    });
  }
  function surveyModal() {
    const reasons = ["I no longer use the service", "Privacy or security concerns", "Too many emails or notifications", "Technical issues or poor user experience", "Found a better alternative", "Other reason"];
    modal(`
      <form class="card card--534" role="dialog" aria-modal="true" aria-labelledby="m-title" novalidate>
        <h2 class="t-h6 center" id="m-title">Before you go, tell us why you are leaving</h2>
        <div class="stack gap-8" role="radiogroup" aria-labelledby="m-title">${reasons.map((r) => radio("reason", r, r, false)).join("")}</div>
        <div class="control control--textarea"><textarea name="why" placeholder="Tell us your reason" aria-label="Tell us your reason" rows="4"></textarea></div>
        <div class="stack gap-8"><button class="btn btn--danger btn--block" type="submit" disabled><span>Continue to deactivate account</span></button>
        <button class="btn btn--link" type="button" data-skip style="align-self:center">Skip</button></div>
      </form>`, (root, close) => {
      const f = $("form", root), b = $("button[type=submit]", f);
      $$("[name=reason]", f).forEach((r) => r.addEventListener("change", () => { b.disabled = false; }));
      f.addEventListener("submit", (e) => { e.preventDefault(); close(); confirmModal(); });
      $("[data-skip]", f).addEventListener("click", () => { close(); confirmModal(); });
    });
  }
  function confirmModal() {
    modal(`
      <div class="card card--534" role="alertdialog" aria-modal="true" aria-labelledby="m-title" aria-describedby="m-desc">
        <div class="stack gap-16"><h2 class="t-h6 center" id="m-title">Deactivate account</h2><p class="t-lg center">Are you sure you want to Deactivate your account?</p></div>
        <div class="stack gap-8 t-sm" id="m-desc">
          <p>Deactivating your account is a temporary action — you can come back and reactivate it anytime just by logging in. While your account is suspended:</p>
          <div class="stack gap-4"><p>You will lose access to all features and services tied to your account.</p><p>You won’t be able to share your ramp link or view your ONCHAIN® transactions.</p><p>Any active or scheduled activity will be paused or canceled.</p><p>You will stop receiving emails and notifications from us.</p></div>
          <p>However, your data and preferences will be safely stored, and nothing will be deleted. When you're ready to return, everything will be right where you left it.</p>
          <p>If you're sure, confirm below to suspend your account.</p>
        </div>
        ${checkbox("understand", "I understand that suspending my account is temporary and my data will be saved.")}
        <div class="stack gap-8"><button class="btn btn--danger btn--block" data-confirm disabled><span>Deactivate account</span></button><button class="btn btn--link" data-cancel style="align-self:center">Cancel</button></div>
      </div>`, (root, close) => {
      const c = $("[name=understand]", root), b = $("[data-confirm]", root);
      c.addEventListener("change", () => { b.disabled = !c.checked; });
      $("[data-cancel]", root).addEventListener("click", close);
      b.addEventListener("click", async () => { await busy(b, 1200); close(); set({ account: "deactivated" }); go("#/deactivated"); });
    });
  }
  function deactivatedModal() {
    modal(`
      <div class="card card--534" role="alertdialog" aria-modal="true" aria-labelledby="m-title" aria-describedby="m-desc">
        <div class="stack gap-16 center"><h2 class="t-h6" id="m-title">Your request to deactivate your account has been received 😔</h2>
        <p class="t-lg" id="m-desc">Your account is now inactive. An email confirmation has been sent, and you can reactivate your account at any time by logging back in.</p></div>
        <button class="btn btn--primary btn--block" data-act="reactivate"><span>Reactivate account</span></button>
      </div>`, null, { dismissible: false });
  }

  // ---------- owner one-time link (X) ----------
  const xHeader = () => `<header class="xpage__head">${logo()}</header>`;
  function ownerLink() {
    return `<div class="xpage">${xHeader()}<main class="auth__main"><div class="card" style="text-align:center">
      <div class="stack gap-16"><h1 class="t-h6">Sign in to X</h1><p class="t-sm c-muted">You need to connect your account to X as a method of verification of your project.</p></div>
      <button class="btn btn--outline btn--h48 btn--block" data-act="owner-x"><img src="${I("x-logo.svg")}" width="24" height="20" alt=""><span>Sign in</span></button>
    </div></main>${authFooter()}</div>`;
  }
  function ownerDone() {
    return `<div class="xpage">${xHeader()}<main class="auth__main"><div class="card" style="text-align:center" role="status">
      <img src="${I("check-circle-success.svg")}" width="32" height="32" alt="" style="margin:0 auto">
      <div class="stack gap-8"><h1 class="t-h6">You have successfully connected to your project X account</h1><p class="t-md c-muted">You can now close this page</p></div>
    </div></main>${authFooter()}</div>`;
  }

  // ---------- payment failure ----------
  async function retryPayment(btn) {
    await busy(btn, 1300);
    set({ retries: S.retries + 1 });
    if (S.retries % 2 === 1) paymentResult(false); else paymentResult(true);
  }
  function paymentResult(ok) {
    modal(`
      <div class="modal" role="${ok ? "dialog" : "alertdialog"}" aria-modal="true" aria-labelledby="m-title">
        <div class="modal__body">
          <div class="modal__icon"><img src="${I(ok ? "check-circle-success.svg" : "error-red.svg")}" alt=""></div>
          <div class="stack gap-16">
            <div class="stack gap-8"><h2 class="t-h6" id="m-title">${ok ? "Payment Successful" : "Payment Failed"}</h2><p class="t-lg">${ok ? "A confirmation email with your $200 payment details has been sent." : "We couldn’t complete your payment."}</p></div>
            <p class="t-lg">${ok ? "Thank you for your purchase!" : "Please try again or contact support if the issue continues."}</p>
          </div>
        </div>
        <div class="stack gap-8">${ok ? `<button class="btn btn--primary btn--block" data-close><span>Close</span></button>` : `<button class="btn btn--primary btn--block" data-again><span>Try again</span></button><button class="btn btn--link" data-close style="align-self:center">Cancel</button>`}</div>
      </div>`, (root, close) => {
      $("[data-close]", root).addEventListener("click", () => { close(); if (ok) { set({ paymentFailed: false }); render(); toast("Your subscription is active again"); } });
      const again = $("[data-again]", root); if (again) again.addEventListener("click", async () => { await busy(again, 1300); close(); set({ retries: S.retries + 1 }); paymentResult(true); });
    });
  }

  // ---------- modal / select / toast / busy helpers ----------
  function modal(html, bind, { dismissible = true } = {}) {
    const prev = document.activeElement;
    const ov = document.createElement("div"); ov.className = "overlay"; ov.innerHTML = html; document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener("keydown", onKey); if (prev && prev.focus) prev.focus(); };
    const focusables = () => $$("button:not(:disabled), input:not(:disabled), textarea, a[href]", ov);
    const onKey = (e) => {
      if (e.key === "Escape" && dismissible) close();
      if (e.key === "Tab") { const f = focusables(); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener("keydown", onKey);
    if (dismissible) ov.addEventListener("mousedown", (e) => { if (e.target === ov) close(); });
    if (bind) bind(ov, close);
    setTimeout(() => (focusables()[0] || ov).focus(), 30);
    return close;
  }
  function bindSelect(id, onChange) {
    const root = $(`[data-select="${id}"]`); if (!root) return;
    const btn = $(".select__btn", root), menu = $(".select__menu", root), opts = $$(".select__opt", root);
    let idx = opts.findIndex((o) => o.getAttribute("aria-selected") === "true");
    const open = (v) => { btn.setAttribute("aria-expanded", v); menu.classList.toggle("is-open", v); if (v) { (opts[idx] || opts[0]).focus(); } };
    const choose = (o) => {
      opts.forEach((x) => x.setAttribute("aria-selected", x === o)); idx = opts.indexOf(o);
      const n = netById(o.dataset.value); $(".select__value", btn).textContent = n.label; $(".select__value", btn).classList.remove("is-placeholder");
      $$(".token-ic", btn).forEach((x) => x.remove()); btn.insertAdjacentHTML("afterbegin", n.icon);
      open(false); btn.focus(); onChange(n.id);
    };
    btn.addEventListener("click", () => open(btn.getAttribute("aria-expanded") !== "true"));
    opts.forEach((o, i) => {
      o.addEventListener("click", () => choose(o));
      o.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); opts[Math.min(i + 1, opts.length - 1)].focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); opts[Math.max(i - 1, 0)].focus(); }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(o); }
        if (e.key === "Escape") { open(false); btn.focus(); }
      });
    });
    document.addEventListener("click", (e) => { if (!root.contains(e.target)) open(false); });
  }
  function toast(msg) {
    let host = $(".toast-host"); if (!host) { host = document.createElement("div"); host.className = "toast-host"; host.setAttribute("role", "status"); host.setAttribute("aria-live", "polite"); document.body.appendChild(host); }
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; host.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2600);
  }
  async function busy(btn, ms) {
    if (!btn) return delay(ms);
    btn.setAttribute("aria-busy", "true"); btn.disabled = true;
    await delay(ms);
    btn.removeAttribute("aria-busy"); btn.disabled = false;
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch { /* ignore */ } ta.remove(); }
    toast("Copied to clipboard");
  }

  // ---------- global delegated actions ----------
  document.addEventListener("click", async (e) => {
    const c = e.target.closest("[data-copy]"); if (c) { e.preventDefault(); copy(c.dataset.copy); return; }
    const a = e.target.closest("[data-act]"); if (!a) return;
    const act = a.dataset.act;
    if (act === "noop") { e.preventDefault(); toast("Opens in the live product"); }
    if (act === "chat") toast("Hi! 👋 Support chat would open here.");
    if (act === "go-setup") go(`#/setup/${firstOpenStep()}`);
    if (act === "ramp-link") copy("https://buy.onchain.money/acme");
    if (act === "menu") { const dd = a.nextElementSibling; const open = !dd.classList.contains("is-open"); dd.classList.toggle("is-open", open); a.setAttribute("aria-expanded", open); }
    if (act === "signout") { set({ account: S.account === "deactivated" ? "deactivated" : S.account }); go("#/signin"); toast("Signed out"); }
    if (act === "retry-payment") retryPayment(a);
    if (act === "reactivate") { await busy(a, 1100); set({ account: "active", reactivating: true }); go("#/signin"); toast("Sign in to reactivate your account"); }
    if (act === "owner-x") { await busy(a, 1400); if (S.account === "verifying" && S.verify === "emailed") set({ verify: "connected" }); go("#/owner/done"); scheduleActivation(); }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".menu-wrap")) $$(".dropdown.is-open").forEach((d) => { d.classList.remove("is-open"); d.previousElementSibling?.setAttribute("aria-expanded", "false"); }); });

  // ---------- prototype controls ----------
  function protoPanel() {
    const host = document.createElement("div"); host.className = "proto";
    host.innerHTML = `<div class="proto__panel" role="menu" aria-label="Prototype controls">
      <h4>Jump to</h4>
      <button data-p="signin">Sign up flow</button><button data-p="setup">Finish setup</button>
      <button data-p="dash-setup">Dashboard · setup incomplete</button><button data-p="dash-verifying">Dashboard · being verified</button>
      <button data-p="dash-welcome">Dashboard · welcome</button><button data-p="dash-populated">Dashboard · populated</button>
      <button data-p="transactions">Transactions</button><button data-p="settings">Settings</button><button data-p="owner">Owner one-time link (X)</button>
      <h4>Simulate</h4>
      <button data-p="fail">Toggle failed payment</button><button data-p="notcleared">Toggle asset not cleared</button>
      <button data-p="logo">Toggle sample ACME ticker image</button>
      <button data-p="reset">Reset prototype</button>
    </div><button class="proto__toggle" aria-expanded="false">Prototype ▾</button>`;
    document.body.appendChild(host);
    const tgl = $(".proto__toggle", host);
    tgl.addEventListener("click", () => { const o = !host.classList.contains("is-open"); host.classList.toggle("is-open", o); tgl.setAttribute("aria-expanded", o); });
    $(".proto__panel", host).addEventListener("click", (e) => {
      const b = e.target.closest("[data-p]"); if (!b) return;
      host.classList.remove("is-open"); tgl.setAttribute("aria-expanded", "false");
      preset(b.dataset.p);
    });
  }
  function preset(p) {
    const complete = { assetStatus: "cleared", whitepaper: "https://acme.com/whitepaper", payNetwork: "ethereum", plan: true, verify: "connected", name: S.name || "Gustavo Guerra", email: S.email || "gustavo@onchainlabs.org", company: S.company || "ACME Labs", website: S.website || "https://acme.com", address: S.address || "0x388C818CA8B9251b393131C08a736A67ccB19297", network: S.network || "ethereum" };
    if (p === "signin") { set({ account: "signed-out" }); go("#/signin"); }
    if (p === "setup") { set({ account: "setup" }); go(`#/setup/${firstOpenStep()}`); }
    if (p === "dash-setup") { set({ account: "setup", whitepaper: "", payNetwork: "", plan: false, verify: "none" }); go("#/dashboard"); }
    if (p === "dash-verifying") { set({ ...complete, account: "verifying", verify: "emailed", ownerEmail: S.ownerEmail || "owner@acme.com" }); go("#/dashboard"); }
    if (p === "dash-welcome") { set({ ...complete, account: "active", populated: false }); go("#/dashboard"); }
    if (p === "dash-populated") { set({ ...complete, account: "active", populated: true }); go("#/dashboard"); }
    if (p === "transactions") { set({ ...complete, account: "active", populated: true }); go("#/transactions"); }
    if (p === "settings") { set({ ...complete, account: "active" }); go("#/settings/project"); }
    if (p === "owner") go("#/owner");
    if (p === "logo") { set({ tickerImg: S.tickerImg ? "" : SAMPLE_LOGO }); render(); toast(S.tickerImg ? "Sample ACME ticker image applied" : "Ticker image removed"); }
    if (p === "fail") { set({ paymentFailed: !S.paymentFailed, retries: 0 }); render(); toast(S.paymentFailed ? "Simulating a failed subscription payment" : "Payment restored"); }
    if (p === "notcleared") { set({ assetStatus: S.assetStatus === "cleared" ? "not-cleared" : "cleared" }); go("#/setup/asset"); }
    if (p === "reset") { try { localStorage.removeItem(KEY); sessionStorage.clear(); } catch { /* ignore */ } S = { ...DEFAULT }; pairsLoaded = false; go("#/signin"); }
  }

  // ---------- router ----------
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  const titles = { signin: "Sign in", "verify-email": "Confirm your email", details: "Personal details", "asset-details": "Digital asset details", dashboard: "Dashboard", setup: "Finish setup", transactions: "Transactions", settings: "Settings", deactivated: "Account deactivated", owner: "Verify ownership" };
  function render() {
    const parts = (location.hash.replace(/^#\/?/, "") || "signin").split("/");
    const [r, a, b] = parts;
    const app = $("#app");
    let html = "", bind = () => {};
    // light guards so deep links always land somewhere sensible
    if (["dashboard", "setup", "transactions", "settings"].includes(r) && (S.account === "signed-out" || S.account === "deactivated")) {
      if (S.account === "deactivated") { location.hash = "#/deactivated"; return; }
      set({ account: "setup", name: S.name || "Gustavo Guerra", email: S.email || "gustavo@onchainlabs.org" });
    }
    switch (r) {
      case "signin": html = signin(); bind = bindSignin; break;
      case "verify-email": html = verifyEmail(); bind = bindVerifyEmail; break;
      case "details": html = details(); bind = bindDetails; break;
      case "asset-details": html = assetDetails(); bind = bindAssetDetails; break;
      case "dashboard": html = dashboard(); bind = bindDashboard; break;
      case "setup": { const step = steps.some((s) => s.id === a) ? a : firstOpenStep(); html = setup(step); bind = () => bindSetup(step); break; }
      case "transactions": html = transactions(); bind = bindTransactions; break;
      case "settings": { const page = settingsItems.some(([id]) => id === a) ? a : "project"; html = settings(page, b); bind = () => bindSettings(page); break; }
      case "deactivated": html = settings("deactivate"); bind = () => { bindSettings("deactivate"); deactivatedModal(); }; break;
      case "owner": html = a === "done" ? ownerDone() : ownerLink(); break;
      default: location.hash = "#/signin"; return;
    }
    $$(".overlay").forEach((o) => o.remove());
    app.innerHTML = html;
    document.title = `${titles[r] || "ONCHAIN Ramp"} · ONCHAIN Ramp`;
    window.scrollTo(0, 0);
    bind();
    const h1 = $("h1", app); if (h1) { h1.setAttribute("tabindex", "-1"); }
  }
  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", () => {
    protoPanel();
    const q = new URLSearchParams(location.search);
    if (q.get("state")) { const target = location.hash; q.get("state").split(",").forEach((p) => preset(p.trim())); if (q.get("keep") && target) setTimeout(() => { go(target); if (q.get("open") === "upload") setTimeout(() => $("[data-act=upload]")?.click(), 50); }, 0); return; }
    render();
  });
})();
