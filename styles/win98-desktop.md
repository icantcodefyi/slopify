# Windows 98 desktop

**Vibe:** the whole website IS an operating system. There's no scrolling page: you double-click icons.

## Layout skeleton
Full-viewport teal desktop (`#008080`), a column of desktop icons on the left (each one is a page section:
`About.txt`, `Pricing.xls`, `Reviews.doc`, `Recycle Bin`, `Steve.exe`), a taskbar at the bottom with
Start button, open-window buttons and a clock. Sections open as **draggable windows** (`slop.drag`).
One window opens automatically on load. On mobile, windows go full-width and stack.

## Type & palette
- `"MS Sans Serif","Tahoma","Microsoft Sans Serif",Geneva,sans-serif` at 11–13px; use `"Pixelated MS Sans Serif"` if you load 98.css-like fonts
- Silver `#c0c0c0` chrome, title bar gradient `linear-gradient(90deg,#000080,#1084d0)`, white title text
- Bevel: `box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf`

## Signature components
- Window: title bar with `_ □ ✕` buttons (minimize does a funny thing, maximize makes it 3px bigger)
- Start menu with nested programs: "Programs > Steve > Steve (2)", "Shut Down…" → asks "Are u sure? (no)"
- Notepad window for copy, Excel-style grid for pricing, Paint window for the "product demo"
- BSOD easter egg (`#0000aa`, white Courier) when you open the Recycle Bin
- Hourglass cursor (`cursor: wait`) during fake loading; Minesweeper-style smiley as the logo
- System tray balloon: "New hardware found: Hotdog"

## Voice
Error-dialog English. "The program Pricing.xls has performed an illegal operation and will be shut down."

## Best gags
errors (core!), virus, clippy, toasts-as-tray-balloons, drag, konami, a "Defragmenting your savings" progress bar

## Image-gen prompts
"Windows 98 desktop icon of a {mascot}, 32x32 pixel art, dithered"
