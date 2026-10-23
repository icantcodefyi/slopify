# 「スロッピファイ計画」 soundtrack

Original soundtrack for the /slopify MV. Everything is synthesised in numpy/scipy: no samples. The only
external sound source is macOS `say` (Kyoko), which the singer resynthesises.

## Run

```sh
/tmp/slopmv/.venv/bin/python render.py     # ~20 s with a warm TTS cache (first run ~1 min)
/tmp/slopmv/.venv/bin/python check.py      # re-run only the self-check on an existing render
```

Needs macOS (`say -v Kyoko`), ffmpeg and a venv with numpy, scipy, pyworld, soundfile, pyloudnorm and
matplotlib.

Outputs:

| file | what |
| --- | --- |
| `out/slopify-mv.wav` | master, 48 kHz / 24-bit stereo, exactly 66.4 s, -12 LUFS, ≤ -1 dBTP |
| `out/stems/*.wav` | kick, snare, hats, bass, chords, keys, fx, vocal, shouts (float WAV, master gain applied, pre-limiter) and `vocal_dry.wav` (the raw singer) |
| `out/overview.png`, `out/overview-zoom.png` | mix level, spectrogram, stem lanes, vocal f0 vs score; zooms on the stops |
| `out/check.json` | self-check report (loudness, cue offsets, stops, pitch error) |
| `../web/assets/slopify-mv.mp3` | 192 kbps for the web |
| `../web/assets/envelopes.json` | 30 fps RMS (each track normalised to its max) for `kick`, `snare`, `vocal`, `mix` |

`score.py` is the timing contract and is not modified by any of this; `render.py` reads `score.build()`.

## Layout

- `score.py`: structure, chords, melody, lyrics, cue points (the contract)
- `render.py`: entry point: arrange → sing → process stems → master → write → check
- `arrangement.py`: who plays what, bar by bar; the hard stops (`STOPS`) and the music-box motif
- `singer.py`: the WORLD singer and the spoken shouts
- `synths.py`: polyBLEP oscillators, envelopes, filters, instruments (music box, FM bell, chip pluck, bass, supersaw, pad, stab)
- `drums.py`: kick/snare/clap/hats/crash/toms, impact, riser, reverse swell, UI FX (mouse click, error ding, zap, shutter, boom)
- `mix.py`: compressor, sidechain duck, gates, synthetic plate reverb, delay, doubler, exciter, vocal chain, limiter, master
- `check.py`: analysis self-check, `envelopes.json`, overview PNGs

## How the singer works (UTAU-style, `singer.py`)

1. **One recording per mora.** Each distinct `sing` kana is spoken by `say -v Kyoko -r 150` with a
   long-vowel mark appended (`コ` → `コー`) so that there is a clean voiced vowel to stretch, and
   cached under `.cache/tts/`.
2. **WORLD analysis.** `pyworld` harvest/CheapTrick/D4C give f0, the spectral envelope and the
   aperiodicity at 5 ms frames. From the energy and voicing it finds the consonant region (ending a few
   ms into voicing for unvoiced consonants, 20–45 ms in for voiced ones like m/n/r/z) and the stable
   vowel region.
3. **Placement.** The consonant frames are copied at natural speed and placed *before* the note's
   grid time (the pre-utterance, capped at 35% of the previous note), so the vowel lands exactly on the
   beat. The vowel is played at natural speed for 40 ms, then slowly stretched to fill the note. `ー`
   keeps singing the end of the previous vowel at the new pitch. Rests (`ッ`, `_`) are silent.
4. **Legato.** Notes that touch crossfade over 15 ms in the log-spectral domain. Phrase ends get a
   45 ms release.
5. **Pitch.** f0 is replaced with the score's pitch, plus a cosine portamento around note changes
   (-25…+55 ms), a small scoop into phrase starts, delayed vibrato (5.7 Hz, up to ±38 cents, starting
   220 ms in) on notes of 3 or more eighths, and a few cents of slow drift.
6. **Timbre.** The spectral envelope is warped up 7% for a smaller, cuter voice, and the per-mora
   loudness is levelled. Aperiodicity is capped slightly for a cleaner "synthetic" voicing.
7. **Vocal chain** (`mix.vocal_chain`): HPF, EQ (presence +3 dB at 3.2 kHz, air shelf), an exciter that
   adds harmonics above Kyoko's 11 kHz bandwidth, two compressors, a modulated-delay doubler, a plate
   and a ping-pong 1/8 (0.2 s) delay thrown on the last note of every line.

Shouts and the outro line use `say` at rate 300/200, then WORLD pitches them up 3/2 semitones (+5%
formant) and squeezes each shout to at most 0.74 s so it fits its half bar. Each starts exactly on its
`t`.

## Arrangement notes

- **Intro:** a mouse click at 0, ticking, a soft Dmaj7 pad, and the 6-note music-box motif
  (A5 D6 F#6 E6 C#6 D6). Bar 3 adds a filtered kick, a 16th arp and a riser.
- **Hard stops** (`arrangement.STOPS`): every instrument stem, reverb tails included, is gated to
  digital silence in 5.6–6.4, 24.8–25.6 and 47.2–48.0. Only the "post" events sound inside those
  windows:
  - 5.6–6.4: the error ding at 5.6 and a reverse swell into 6.4;
  - 24.8–25.6: 「さ」 and a swell;
  - 47.2–48.0: the last shout, then a snare/tom fill from 47.6.
- **Sections:** the verse is a four-on-the-floor denpa groove with octave bass, offbeat stabs and a
  chip arp. The pre-chorus has a snare roll (8ths in bar 15, 16ths in bar 16) and a riser. The chorus
  adds supersaws and an FM glitter top line. The bridge is a filtered dembow with a zap / shutter /
  boom accent on each half bar. The final chorus is transposed +1 with extra layers. The outro is a
  big Eb chord, then the motif in Eb over a fading pad.
- **Final fade:** cos² from 64.4 s down to silence at 66.4 s.
