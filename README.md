# 🌭 /slopify

An agent skill that builds **deliberately terrible, hilarious parody websites**: GeoCities
homepages, Windows 98 desktops, MySpace profiles, crypto rug-pulls, gen-alpha brainrot feeds and more.

**Live gallery of 12 sites made with this skill → https://slopify.vercel.app**

## Why it doesn't make the same site twice

Every run rolls a combo: **era × format × mascot × narrator × "Steve" × running gags**.

- **12 eras** in [`styles/`](styles). Each one has its own layout skeleton, fonts, palette, components and voice:
  `geocities-1999` · `win98-desktop` · `myspace-2006` · `web2-beta-2008` · `y2k-chrome-splash` ·
  `infomercial-funnel` · `crypto-rugpull-2021` · `gov-portal-2001` · `brainrot-feed` ·
  `linkedin-guru` · `phpbb-forum` · `flash-portal`
- **12 formats**: product parody, personal homepage, fan shrine, local business, cult of the mascot, government service…
- [`references/comedy-rules.md`](references/comedy-rules.md): the joke formulas (self-undercutting claims, fake precision, Steve…)
- [`templates/slop.js`](templates/slop.js): a dependency-free gag engine (cookie banners, error storms, fake
  antivirus, captchas, prize wheels, price creep, chatbots, Konami code…) that gets re-skinned per era with CSS variables

```bash
node scripts/roll.mjs                 # random combo
node scripts/roll.mjs --era win98-desktop --seed toaster
```

## Install

```bash
# Claude Code (personal skills)
git clone https://github.com/icantcodefyi/slopify ~/.claude/skills/slopify
```

Then ask: `/slopify a landing page for Notion` or `/slopify` and let it roll.

## Rules it follows
Parodies of real brands are labeled unofficial, and all fake malware/scams are just divs. The page respects
`prefers-reduced-motion`, and nothing chaotic happens before the visitor's first click.

---

slopped by [@icantcodefyi](https://x.com/icantcodefyi) 🌭
