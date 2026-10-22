# Y2K chrome / Flash splash (1999–2003)

**Vibe:** a "multimedia experience". Black, chrome, lens flares, the Matrix, enter-site splash.

## Layout skeleton
1. **Splash screen**: full black, a spinning chrome logo, "LOADING… 3%" bar that jumps around, then the
   choice "[ ENTER SITE ] [ SKIP INTRO ]" (skip intro plays a longer intro).
2. **Main**: fixed 800×600 centered "interface" frame with a beveled metal border, left vertical nav of
   pill buttons that make a (fake) click sound, content panel with a scrolling inner area,
   a "visualizer" of animated bars, and a footer "Best experienced with Macromedia Flash 5 and a 56k modem".

## Type & palette
- Headings: chrome text `background: linear-gradient(#fff,#999 45%,#222 50%,#ddd 55%,#fff); background-clip:text`, wide letter-spacing, `"Eurostile","Microgramma","Arial Black",sans-serif`
- Body: Verdana 11px, light gray on black; accents electric blue `#00d8ff` and toxic lime `#b6ff00`
- Scanline overlay (`repeating-linear-gradient` 2px), matrix rain canvas or CSS columns

## Signature components
- Lens flare (radial gradients) drifting across the header
- Metal pill buttons with highlight; on hover they "glow" (blue outer glow)
- "Hit counter" in LED segment style; "Sign my guestbook (Flash required)"
- Fake browser requirement modal: "Please install Flash Player 4.0.2 to continue" → "Install" spawns another modal
- Spinning 3D-ish text with `perspective` + `rotateY`

## Voice
Cyber-dramatic, ALL CAPS, "ENTER THE {MASCOT} DIMENSION", "Y2K COMPLIANT", "the future is now (2001)".

## Best gags
errors (as Flash crash), virus, konami, roll, splash loader, quake

## Image-gen prompts
"Y2K chrome 3D logo of a {mascot}, lens flare, black background, bevel and emboss, 2000 Photoshop"
