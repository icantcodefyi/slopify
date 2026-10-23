# 「スロッピファイ計画」, the /slopify MV

A Japanese MMD-style music video for /slopify. スロップちゃん (Slop-chan) dances on a concert stage while the LED wall behind her cycles through the 12 slop sites. Everything is a deterministic function of time, so the same code renders the video file and [plays live in your browser](https://slopified.vercel.app/mv/).

No 3D model files, motion files, samples or footage: the character, the dance, the stage, the song and the singing voice are all code.

| folder | what |
|---|---|
| `web/` | the MV itself: plain ES modules + vendored three.js, no build step |
| `web/src/chan.js` | スロップちゃん: a chibi built from primitives, toon ramp, inverted-hull outlines, canvas-drawn anime face with lip sync, twin-tail "physics" |
| `web/src/dance.js` | the choreography: beat-locked moves (kira step, point, wota circles, spin…), a bar-by-bar routine, blending, the face track |
| `web/src/stage.js` | the MMD editor void for the intro, then the stage: LED floor, LED wall of slop sites, spotlights, lasers, penlight crowd, sakura, emoji rain |
| `web/src/camera.js` | the shot list, cut on bar lines (orbits, cranes, a dolly zoom, dutch angles) |
| `web/src/overlay.js` | 2D layer: the *MikuMikuSlop* editor parody, title, karaoke lyrics, anime-OP staff credits, roll-call cards, end card |
| `music/` | the soundtrack: `score.py` (the contract: structure, chords, melody, lyrics), the synths and a WORLD-vocoder singer |
| `render/` | headless-Chromium frame renderer + stills for checking shots |
| `out/` | renders (not tracked) |

## Video

```bash
cd mv
npm i -D playwright && npx playwright install chromium   # once
python3 music/score.py                                   # writes web/assets/timing.json
node render/still.mjs --t 7,26,40,62                     # check a few frames → out/stills
node render/render.mjs                                   # 1920×1080 60 fps → out/slopify-mv.mp4
```

The renderer steps `window.__mv.renderAt(t)` frame by frame, so the output is identical every run and doesn't depend on how fast your machine is. On an M-series Mac it renders faster than real time.

For the soundtrack, see [`music/README.md`](music/README.md).

## Web app

`web/` is a static site. Serve it with anything (`npx serve mv/web`) and open it. The deploy copies it to `examples/mv`, so it's live at **[slopified.vercel.app/mv](https://slopified.vercel.app/mv/)**. Click to play, space to pause, ← → to seek.

## The song

150 BPM, 40 bars, D major, with the final chorus up a semitone. Royal-road (王道進行) chorus.

| bars | section | on screen |
|---|---|---|
| 1–4 | intro | the *MikuMikuSlop Ver.6.66* editor loads `slop_chan.pmx` in T-pose. ▶ 再生 is pressed, then the app freezes (応答なし) |
| 5–12 | verse | title card, then the stage. 「コミックサンスでこんにちは」 |
| 13–16 | pre-chorus | 「ちょっとまって　まだあるよ」, a dolly zoom, then a blackout for 「さあ」 |
| 17–24 | chorus | 「スロップ　スロップ　スロッピファイ」. Colour floods in, with lasers and penlights |
| 25–30 | bridge | roll call: one slop site per half bar, each shouted in katakana |
| 31–38 | final chorus | key up, emoji rain, 「せかいをスロップにしちゃえ」 |
| 39–40 | outro | end card. Then the motion file ends and she snaps back to T-pose. おわり |

## License

MIT, same as the rest of the repo. three.js is MIT (`web/vendor/LICENSE`). Fonts load from Google Fonts (SIL OFL). The site screenshots are of this repo's own `examples/`.

---

slopped by [@icantcodefyi](https://x.com/icantcodefyi)
