---
name: slopify
description: Builds deliberately terrible, hilarious parody websites in many cursed internet styles (GeoCities 1999, Windows 98 desktop, MySpace profile, Web 2.0 beta, Y2K chrome splash, infomercial scam funnel, crypto rug-pull, 2001 government portal, gen-alpha brainrot feed, LinkedIn guru, phpBB forum, Flash game portal) by mixing an era, a site format, a mascot and a narrator, so no two sites look alike. Use when the user says slopify, slop site, brainrot website, cursed/ugly-on-purpose website, GeoCities/Neocities/MySpace/Win98 style, "make it look like 2003", parody redesign of a product, or "redesign it for free" bit.
---

# /slopify

Make websites so bad they're good.
The classic GeoCities look is ONE style. This skill covers many. **Never default to Comic-Sans-GeoCities every time.**

**Core rule:** slop is satire, so it has to be specific. Each joke is about the subject.
Chaos with no target gets boring fast. Era-accurate details (a real Win98 title-bar
gradient, a real MySpace "Top 8") are what make the parody land.

## Workflow

1. **Roll the combo.** Run `node scripts/roll.mjs` (add `--seed <word>` for repeatable rolls,
   `--era <id>` / `--format <id>` to lock a slot the user already picked). You get an
   **era × format × mascot × narrator × running gags** combo. If the user gave a subject ("slopify
   Stripe"), keep it and roll the rest. Re-roll any slot that clashes with the subject.
2. **Read the era file** `styles/<era>.md`. It defines the layout skeleton, fonts, palette,
   signature components, voice and the gags that suit that era. Follow its **layout skeleton**.
   Eras differ in structure, not just in colors.
3. **Research the subject** if it's real: fetch its site and list the actual sections, claims,
   pricing and feature names. Parody them one for one.
4. **Write the bible** (a short comment at the top of the HTML): product claim → cheap knockoff
   version, the narrator's situation, the "Steve" (the one human who does all the work by hand), the
   mascot object, and 2–3 running gags that **pay off across at least 3 sections**.
5. **Write the copy** with [references/comedy-rules.md](references/comedy-rules.md).
6. **Build.** Use plain HTML/CSS/JS, one folder. Copy `templates/slop.js` (the gag engine) and
   `templates/slop-base.css` (gag component styles, themed via CSS vars), then write the era's
   own CSS and markup from scratch. Pick 5–9 gags from [references/gags.md](references/gags.md)
   that suit the era. A MySpace page doesn't get a captcha wheel; it gets a song autoplay
   button and a Top 8.
7. **Images:** emoji, CSS art and inline SVG by default. If an image-gen tool exists, use the
   prompts in the era file. Deep-fry real screenshots with `filter: saturate(2.2) contrast(1.4)`.
8. **Verify** at 1280px and 390px. The page has to scroll, the main CTA has to be clickable,
   every popup has to be dismissible, and there should be no horizontal overflow or console errors.

## Variety checklist (run it before you finish)
- [ ] The layout skeleton matches the era file, not the GeoCities centered column
- [ ] The font stack and palette come from the era file (or its listed variant)
- [ ] At least 3 jokes that only make sense for THIS subject
- [ ] Mascot appears in ≥3 places (favicon, a gag, the copy)
- [ ] One interactive "demo that works badly" that fits the format
- [ ] Footer has an unofficial/parody disclaimer if a real brand is involved

## Guardrails
- Real brands: label it as a parody, don't use their logos, and don't make claims that could pass as
  real. Punch at hype, not at private people. No slurs; edgy is fine, hateful isn't.
- Fake malware or scams are only divs: no real downloads, no back-button traps, no `window.open`
  spam, no audio before a user gesture, no real wallet or payment calls.
- `slop-base.css` honors `prefers-reduced-motion`. Keep that.
