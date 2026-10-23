"""Render the 「スロッピファイ計画」 soundtrack.

    /tmp/slopmv/.venv/bin/python render.py

Writes out/slopify-mv.wav (48 kHz / 24-bit / 66.4 s), out/stems/*.wav, ../web/assets/slopify-mv.mp3
and ../web/assets/envelopes.json, then runs the self-check (check.py) and prints its report.
"""

import os
import subprocess
import sys
import time
import warnings

warnings.filterwarnings("ignore", message="pkg_resources")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

import arrangement as A  # noqa: E402
import check  # noqa: E402
import mix as M  # noqa: E402
import score  # noqa: E402
import singer  # noqa: E402
from synths import SR, highpass, ns  # noqa: E402

OUT = os.path.join(HERE, "out")
ASSETS = os.path.join(HERE, "..", "web", "assets")

# stem levels (linear) into the mix bus
LEVEL = {"kick": 0.5, "snare": 0.5, "hats": 0.5, "bass": 0.6, "chords": 0.6, "keys": 0.6, "fx": 0.55,
         "vocal": 1.2, "shouts": 0.6}
# instrument-bus level per bar (energy curve): intro < verse < pre build < chorus, bridge dips, final is biggest
DYNAMICS = [(1, 0.5), (3, 0.5), (5, 0.56), (12, 0.62), (13, 0.64), (16, 0.85), (17, 1.0), (24, 1.0), (25, 0.78),
            (30, 0.82), (31, 1.08), (38, 1.1), (39, 1.0), (41, 1.0)]


def dynamics(n):
    """Piecewise-linear gain over bars; jumps happen on downbeats."""
    t = np.arange(n) / SR
    g = np.ones(n)
    for (b0, g0), (b1, g1) in zip(DYNAMICS, DYNAMICS[1:]):
        t0, t1 = score.at(b0), score.at(b1)
        sel = (t >= t0) & (t < t1)
        g[sel] = g0 + (g1 - g0) * (t[sel] - t0) / (t1 - t0) if b1 - b0 > 1 else g0
    return g


def sing(tr, data, ir):
    dry = singer.Singer().sing(data["lead"], data["duration"])
    dry = dry / (np.max(np.abs(dry)) + 1e-9) * 0.5
    throws = []
    for li in sorted({e["line"] for e in data["lead"]}):
        last = [e for e in data["lead"] if e["line"] == li and "midi" in e][-1]
        throws.append((last["t"], last["t"] + last["dur"] + 0.05))
    tr.buf["vocal"] += M.vocal_chain(dry, throws, ir)
    return dry


def shout(tr, data, ir):
    buf = np.zeros(tr.n)
    for c in data["calls"]:
        y = singer.speak(c["text"], rate=300, semitones=3.0, max_dur=0.74)
        i = ns(c["t"])
        buf[i:i + len(y)] += y[: tr.n - i]
    sp = data["spoken"][0]
    y = singer.speak(sp["text"], rate=200, semitones=2.0)
    i = ns(sp["t"])
    buf[i:i + len(y)] += 0.8 * y[: tr.n - i]
    x = highpass(buf, 150)
    x = M.compress(x[None, :], -22, 4.0, 0.005, 0.08)[0]
    st = M.chorus_double(x, 0.4)
    tr.buf["shouts"] += M.reverb(st, ir, 0.12) * 0.7


def process(tr):
    n = tr.n
    ir = M.plate_ir()
    ir_short = M.plate_ir(0.9, 0.7, 0.35, 0.01, seed=9)
    st, post = tr.buf, tr.post
    sc = M.duck(n, tr.kicks, 0.6, 0.15)
    sc_light = M.duck(n, tr.kicks, 0.3, 0.1)
    st["bass"] *= M.duck(n, tr.kicks, 0.8, 0.09)
    st["chords"] = M.reverb(st["chords"] * sc, ir, 0.15)
    st["keys"] = M.reverb(st["keys"] * sc_light, ir, 0.25)
    st["snare"] = M.reverb(st["snare"], ir_short, 0.2)
    st["fx"] = M.reverb(st["fx"], ir, 0.2)
    g = M.gate(n, A.STOPS) * dynamics(n)
    for k in A.INSTRUMENT_STEMS:
        st[k] *= g[None, :]
    post["fx"] = M.reverb(post["fx"], ir, 0.3)
    post["snare"] = M.reverb(post["snare"], ir_short, 0.2)
    fade = np.ones(n)
    a, b = ns(64.4), n
    fade[a:b] = np.cos(np.linspace(0, np.pi / 2, b - a)) ** 2
    return {k: (st[k] + post[k]) * LEVEL[k] * fade[None, :] for k in A.STEMS}


def main():
    t0 = time.time()
    data = score.build()
    os.makedirs(os.path.join(OUT, "stems"), exist_ok=True)
    tr = A.arrange(data)
    print(f"arranged {time.time() - t0:.1f}s")
    ir_vox = M.plate_ir(2.0, 1.7, 0.8, 0.022, seed=21)
    dry = sing(tr, data, ir_vox)
    shout(tr, data, ir_vox)
    print(f"vocals {time.time() - t0:.1f}s")
    stems = process(tr)
    bus = sum(stems.values())
    master, gain = M.master(bus)
    n = ns(data["duration"])
    assert master.shape[1] == n
    wav = os.path.join(OUT, "slopify-mv.wav")
    sf.write(wav, master.T, SR, subtype="PCM_24")
    g = M.undb(gain)
    for k, x in stems.items():
        sf.write(os.path.join(OUT, "stems", f"{k}.wav"), (x * g).T.astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(OUT, "stems", "vocal_dry.wav"), dry.astype(np.float32), SR, subtype="FLOAT")
    mp3 = os.path.join(ASSETS, "slopify-mv.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "192k", mp3], check=True)
    print(f"rendered {time.time() - t0:.1f}s, master gain {gain:+.1f} dB")
    check.run(data, tr, OUT, ASSETS)


if __name__ == "__main__":
    main()
