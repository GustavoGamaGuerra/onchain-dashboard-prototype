# ONCHAIN Ramp — B2B Dashboard (V2) · Interactive prototype

A clickable, front-end-only prototype of the ONCHAIN Ramp B2B client dashboard, built 1:1 from the Figma page **"V2 - B2B - Desktop"**.
Plain HTML, CSS and JavaScript — no framework, no build step. Designed for desktop (1440px).

## Run locally

```bash
cd onchain-v2-prototype
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly also works in most browsers.)

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `onchain-dashboard-prototype`).
2. Push the contents of this folder to the `main` branch:
   ```bash
   cd onchain-v2-prototype
   git init && git add . && git commit -m "ONCHAIN Ramp V2 prototype"
   git branch -M main
   git remote add origin https://github.com/<you>/onchain-dashboard-prototype.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)`** → Save.
4. Your prototype is live at `https://<you>.github.io/onchain-dashboard-prototype/` within a minute.

`.nojekyll` is included so GitHub serves every asset as-is.

## What you can do

| Flow | Route |
|---|---|
| Sign in (email) → 6-digit code → personal details → digital asset details | `#/signin` … `#/asset-details` |
| Unsupported (taxed) token modal · animated "Setting up your account" loader | from asset details |
| Dashboard states: setup incomplete (banner) → being verified → welcome → populated | `#/dashboard` |
| Finish setup checklist with animated progress: asset cleared / not cleared, whitepaper, payment method, plan, X verification (or email the X account owner) | `#/setup/<step>` |
| Transactions: search, sort by amount/date, pagination, CSV export, copy-to-clipboard | `#/transactions` |
| Settings: project info (upload logo), digital asset (upload ticker image, description), billing (plan · payment details · transactions). The upload modal follows Figma: preview circle + "Click to upload or drag and drop" zone, Cancel / Save (Save enabled once an image is picked). The project logo (Project info) shows in the top bar; the ticker image (Digital asset) shows in the dashboard Digital asset card. | `#/settings/...` |
| Deactivate account: exit survey → confirmation → deactivated → reactivate | `#/settings/deactivate` |
| Failed subscription payment: banner → retry → failed / successful modals | Prototype panel → "Toggle failed payment" |
| Owner one-time link (X sign-in page the project owner receives) | `#/owner` |

### Prototype panel & deep links
The **Prototype ▾** pill (bottom-left) jumps to any state. You can also share links straight to a state:

- `?state=dash-setup` · `?state=dash-verifying` · `?state=dash-welcome` · `?state=dash-populated`
- `?state=transactions` · `?state=settings` · `?state=notcleared` · `?state=owner`
- Combine: `?state=dash-populated,fail` (populated dashboard with a failed payment)
- Preset + specific screen: `?state=settings&keep=1#/settings/billing/payment`
- `?state=settings&keep=1&open=upload#/settings/project` opens the upload modal directly.
- `?state=reset` starts from scratch.

Progress is saved in `localStorage`, so a refresh keeps you where you were.

## Interaction best practices applied
- **Buttons:** real `<button>`s; primary actions stay disabled until the form is valid; async actions show an inline spinner (`aria-busy`) and can't be double-submitted; destructive actions use the red style and require an explicit confirmation checkbox.
- **Loaders:** branded rotating ring for account setup, spinner + message for long fetches ("fetching token pairs", "being verified"), button-level spinners for short actions. Respects `prefers-reduced-motion`.
- **Progress bars:** animate between values (eased width transition + subtle shimmer while in progress), turn green at 100%, exposed as `role="progressbar"` with `aria-valuenow`.
- **Forms:** inline validation on blur (URL, contract address, email), OTP inputs with auto-advance, backspace and paste support.
- **Accessibility:** visible focus rings, keyboard-operable selects/menus, focus-trapped modals that close with Esc, live-region toasts, semantic tables and landmarks.

## Deviations from the static Figma (intentional)
- Added explicit **Continue** buttons to the *Whitepaper* and *Payment details* setup steps (the static frames have none) so every step has a clear commit action.
- Added a **"Copy your Ramp link"** call to action on the first-run "Welcome" state and a **"Top up balance"** action in billing.
- The **Prototype** panel and deep links are presentation tooling, not product UI.

## Structure
```
index.html        app shell
css/app.css       design values from Figma (colours, type, spacing, radii)
js/app.js         router, screens, state, interactions
assets/img/       icons and logos exported from Figma
SPEC-NOTES.md     measurements captured from the Figma frames
```
