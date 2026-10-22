# Gag catalog (`templates/slop.js`)

Load `slop-base.css` + `slop.js`, then call gags from your own `<script>` after them. Re-skin the
dialogs/toasts for the era by overriding the `--slop-*` variables (defaults = Win98 dialog).
Pick the 5–9 gags that suit the era. The era file lists them.

| Gag | Call | What it does |
|---|---|---|
| Toast | `slop.toast(msg)` | bottom toast; use it as a tray balloon, PM notification or "NOTICE" |
| Modal | `await slop.modal({title, html, buttons})` | queued dialog, returns the button index (-1 = ✕). Chain them for upsells |
| Hit counter | `slop.counter('#count')` | odometer that keeps counting up |
| Price creep | `slop.creep('[data-creep]', {step, prefix})` | numbers that keep going up (price, queue position, likes, market cap) |
| Cookie | `slop.cookie({text, accept, reject})` | the reject button is tiny and moves away |
| Social proof | `slop.proof({places, actions})` or `{template: () => str}` | "Someone in Ohio just cried 12 seconds ago" |
| Rain | `slop.rain(['💸','🌭'])` | falling emoji |
| Exit intent | `slop.exit({title, html, buttons})` | when the mouse leaves the top of the window, once, only after the first click |
| Clippy | `slop.clippy(lines, {face})` | assistant with unhelpful tips; set face to the mascot |
| Error storm | `slop.errors(lines, n)` | draggable error windows; closing one can spawn two more |
| Virus scan | `slop.virus(names)` | fake antivirus modal that finds funny "threats" |
| Captcha | `slop.captcha(form, {prompt, tiles})` | blocks a form submit; 50% chance it says you're wrong |
| Prize wheel | `slop.wheel(prizes)` | every slice is the same prize |
| Barrel roll | `slop.roll()` / `slop.randomRolls(0.1)` | whole page spins |
| Quake | `slop.quake()` | screen shake |
| Chatbot | `slop.chat({name, avatar, replies})` | ignores what you type |
| Konami | `slop.konami(fn?)` | default: page flips + Papyrus |
| Demo | `slop.demo({form, output, loading, captions, render, credits, creditsEl})` | the product "works", badly |
| Utils | `slop.afterClick(fn)`, `slop.every(ms, fn)`, `slop.drag(el)`, `slop.el(html)`, `slop.pick(arr)` | for building era-specific gags |

## Build era-specific gags too
The engine is a starting point. The best gags are written per era: a Win98 Start menu, a MySpace
Top 8, a TikTok aura meter, a forum mod locking the thread, a countdown that resets. Build at
least one custom gag per site that only makes sense in that era.

## The "demo that works badly"
Each site needs one interactive bit that copies its format: a generator, a booking form, a
quiz, a mini-game, a "connect wallet", or a government form. It accepts input, shows overly
long loading, gives a cursed result with a deflating caption, and runs out of credits.

## Pacing rules
- One modal at a time (`slop.modal` queues them). Only the cookie banner shows up in the first 3 seconds.
- Chaotic gags (errors, rolls, exit) only after the first click (`slop.afterClick`).
- Every annoying thing has a visible way out, even if the button label is sarcastic.
