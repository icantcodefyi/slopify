# Infomercial / dropship scam funnel

**Vibe:** 2 a.m. TV ad + Shopify dropship long-form sales letter. One product, one giant BUY button repeated 11 times.

## Layout skeleton
Single narrow column (max 720px) sales letter on white, with a yellow-highlighted headline. Order:
red top bar "⚠ WARNING: SALE ENDS IN 09:59 (resets)" → "AS SEEN ON TV" seal + headline + subheadline →
product hero with "BEFORE / AFTER" split (before is grayscale crying, after is the same image but saturated)
→ "Are you tired of…?" black-and-white struggle list → features with ✅ → "BUT WAIT, THERE'S MORE!" →
stacked bonuses with crossed-out "value" prices summing to $4,997 → "Today only: 3 easy payments of $19.99"
→ guarantee badge → fake reviews with stars and "Verified Buyer (bot)" → FAQ → giant order form.

## Type & palette
- Headlines `Impact,"Arial Black"` red `#d00` and yellow highlights `background:#ff0`
- Body Georgia 18px (sales letter), dashed-border order boxes, `#0a0` "Add to Cart" buttons with arrow →
- Stock "As seen on TV" seal: red circle with white text; starburst savings stickers

## Signature components
- Countdown timer that resets to 10:00 when it reaches 0
- "Only 3 left in stock!", where the number goes up sometimes
- "🔴 37 people are viewing this right now" (proof)
- Hand-drawn red circle + arrow around a bullet point (SVG)
- Fake phone number "1-800-SLOP-NOW" with "Operators are standing by (Steve)"
- Upsell modal chain on BUY: "Add protection plan?" → "Add 2nd one for just shipping?" → "Are you SURE you don't want the protection plan?"

## Voice
Infomercial host: "But that's not all!", rhetorical questions, *Results not typical*, small-print disclaimers that admit everything.

## Best gags
creep (price), proof, exit ("WAIT! Your cart is crying"), cookie, upsell chain via slop.modal, countdown via slop.every
