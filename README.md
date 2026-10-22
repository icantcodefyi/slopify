<div align="center">

# 🌭 /slopify

### An agent skill that builds the **worst websites on the internet**. On purpose.

**[🔴 LIVE GALLERY → slopified.vercel.app](https://slopified.vercel.app)** &nbsp;·&nbsp; **[Install](#install)** &nbsp;·&nbsp; **[How it works](#how-it-works)**

<img src="assets/preview.gif" alt="slopify showcase" width="720" />

*12 cursed internet eras · 12 site formats · 20+ gags · 0 businesses that should exist*

</div>

---

## What is this?

`/slopify` is a skill for AI coding agents (Claude Code and friends). It builds **deliberately terrible,
genuinely funny parody websites**: Comic Sans, marquees, hit counters, fake antivirus popups, misspelled
nav links, pricing that goes up while you read, and a guy named Steve who does everything by hand in MS Paint.

It's not one template with a different coat of paint. Every run rolls a different **era × format × mascot ×
narrator**, and each era has its own layout, fonts, components and voice. A Windows 98 site is a
desktop OS you click around in. A brainrot site is a TikTok feed with Subway Surfers underneath. A forum
site is one derailed phpBB thread.

## The gallery

All 12 of these were made by separate AI agents running this skill, one per era. **[Visit the gallery →](https://slopified.vercel.app)**

<img src="assets/gallery.jpg" alt="12 slop websites" />

| | Site | Era | The bit |
|---|---|---|---|
| 🦆 | **[Quackademy 98](https://slopified.vercel.app/win98/)** | Windows 98 desktop | a 13-year-old built a whole OS in computer lab to sell a $997 rubber-duck course |
| 🧱 | **[Church of the Holy Brick](https://slopified.vercel.app/y2k/)** | Y2K chrome splash | an AI agent told to sell 3% more bricks started a religion. SKIP INTRO plays a longer intro |
| 🥔 | **[$TATER](https://slopified.vercel.app/crypto/)** | Crypto rug-pull 2021 | a fry stand launched a memecoin. 99% dev wallet (safe) |
| 🖨️ | **[PrinterTok](https://slopified.vercel.app/brainrot/)** | Gen-alpha brainrot feed | a grade 4 school project on printers, made by a dad who is not ok |
| 🌭 | **[Uncle Gary's HOT DOG SHRINE](https://slopified.vercel.app/geocities/)** | GeoCities / Angelfire | a 73-year-old learned HTML yesterday. the JOIN button runs away |
| 🧦 | **[Unclr (BETA)](https://slopified.vercel.app/web2/)** | Web 2.0 beta | share Uncle Dennis with friends, socially. GOLD tier = same thing but gold |
| 🧀 | **[SlopedIn: CurdPilot](https://slopified.vercel.app/linkedin/)** | LinkedIn guru | "I fired my best employee. He was a cheese." Agree? |
| 🚧 | **[Dept. of Traffic Cone Innovation](https://slopified.vercel.app/gov/)** | 2001 government portal | register ur cone startup. please fax Form 27-B/6 to Gary's garage |
| 📠 | **[FAXGROUNDS](https://slopified.vercel.app/flash/)** | Flash game portal | beat the (playable) game to RSVP to a fax machine's retirement party |
| 🪿 | **[DGC Boards](https://slopified.vercel.app/forum/)** | phpBB forum | the goose permit office is a locked forum thread. the fee goes up while u read |
| 📻 | **[SlopSpace: Mike Rowave](https://slopified.vercel.app/myspace/)** | MySpace 2006 | an 1100W microwave (actually 700W) looking for love. Top 8 drama |
| 🦞 | **[LOBSTAKE™](https://slopified.vercel.app/infomercial/)** | 3am infomercial funnel | one lobster restaurant. BUT WAIT. there is still one lobster |

## Install

```bash
# Claude Code (personal skill)
git clone https://github.com/icantcodefyi/slopify ~/.claude/skills/slopify

# or just for one project
git clone https://github.com/icantcodefyi/slopify .claude/skills/slopify
```

Any agent that reads `SKILL.md`-style skills works. Point it at this folder.

## Usage

```
/slopify
/slopify a landing page for Notion
/slopify my portfolio but make it a MySpace profile
/slopify a dentist website, win98 era
```

With no subject, it rolls everything. With a subject, it keeps your subject and rolls the rest.

## How it works

```
1. ROLL      node scripts/roll.mjs  →  era × format × mascot × narrator × "Steve" × 3 running gags
2. READ      styles/<era>.md        →  layout skeleton, fonts, palette, components, voice
3. RESEARCH  (if real) fetch the actual product and parody it section by section
4. BIBLE     claim → knockoff, narrator, Steve, mascot, running gags that pay off 3+ times
5. WRITE     references/comedy-rules.md (claims that undercut themselves, fake precision, misspellings)
6. BUILD     plain HTML/CSS/JS + templates/slop.js gag engine, re-skinned per era
7. VERIFY    1280px + 390px, every popup dismissable, no console errors
```

### 12 eras (`styles/`)

| Era | It's a… |
|---|---|
| `geocities-1999` | hand-made homepage. marquees, hit counter, under construction, webring |
| `win98-desktop` | the whole site is an OS: desktop icons, draggable windows, Start menu, BSOD |
| `myspace-2006` | profile page: Top 8, glitter text, mood, comments wall, music player |
| `web2-beta-2008` | glossy startup with a dropped vowel, BETA badge, wet-floor reflections, tag cloud |
| `y2k-chrome-splash` | ENTER SITE splash, chrome text, lens flares, "requires Flash 5" |
| `infomercial-funnel` | long sales letter, countdown that resets, BUT WAIT THERE'S MORE, upsell chain |
| `crypto-rugpull-2021` | $MASCOT token, tokenomics donut, roadmap to ???, fake wallet connect |
| `gov-portal-2001` | table layout, deadpan bureaucracy, forms you must fax |
| `brainrot-feed` | 9:16 TikTok feed, Subway Surfers underneath, word-by-word captions, aura meter |
| `linkedin-guru` | broetry feed, Corporate Memphis art, $997 course |
| `phpbb-forum` | the whole site is one derailed forum thread with signatures and a power-tripping mod |
| `flash-portal` | free online games site with a playable mini-game and skyscraper ads |

### The gag engine (`templates/slop.js`)

No dependencies, every gag opt-in, themed per era with CSS variables:

```js
slop.cookie({ accept: ['Accept', 'ACCEPT HARDER'], reject: 'reject' }); // reject button runs away
slop.creep('[data-creep]');            // prices go up while you read
slop.proof({ places: ['Ohio'] });      // "Someone in Ohio just cried 12 seconds ago"
slop.errors(['Error: Success.']);      // close one, two more spawn
slop.virus(['steve.exe']);             // fake antivirus that finds steve.exe
slop.captcha('#form');                 // "select all hotdogs" (50% chance ur wrong)
slop.clippy(['It looks like ur trying to leave.']);
slop.konami();                         // ↑↑↓↓←→←→BA
```

Plus toast, modal queue, hit counter, emoji rain, exit intent, prize wheel, barrel roll, screen quake,
a chatbot that ignores you, and a "demo that works badly" helper. Full list in [`references/gags.md`](references/gags.md).

## Repo layout

```
SKILL.md                    the workflow the agent follows
scripts/roll.mjs            the dice
styles/*.md                 12 era recipes
references/comedy-rules.md  the joke formulas
references/gags.md          gag engine API
templates/slop.js           gag engine
templates/slop-base.css     gag styles (CSS-variable themed)
examples/                   the 12 sites + gallery (deployed to slopified.vercel.app)
```

## Rules it follows

- Parodies of real brands are labeled unofficial and never use real logos
- Fake malware/scams are just divs: no real downloads, no back-button traps, no real wallet calls
- No audio before a click, chaotic gags wait for the first interaction, `prefers-reduced-motion` is respected
- Punch at hype, not at people

---

<div align="center">

**slopped by [@icantcodefyi](https://x.com/icantcodefyi)** 🌭

*best viewed in Netscape Navigator 4.7 at 800×600*

</div>
