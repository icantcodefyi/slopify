"""Synthesised drums, cymbals, transitions and UI sound effects (mono unless noted)."""

import numpy as np

from synths import bandpass, highpass, lowpass, noise, ns, perc, secs, sine, pulse, sweep, bell

_METAL = np.array([263.0, 400.0, 421.0, 474.0, 587.0, 845.0])  # 808-style inharmonic square bank


def _metal(n, scale=1.0):
    return sum(pulse(f * scale, n, 0.5, ph0=i * 0.13) for i, f in enumerate(_METAL)) / 6.0


def kick(length=0.42, punch=1.0):
    n = ns(length)
    t = secs(n)
    f = 50 + 150 * np.exp(-t / 0.03) + 60 * np.exp(-t / 0.004)
    body = sine(f, n) * np.exp(-t / 0.16) * np.minimum(t / 0.0008, 1)
    click = highpass(noise(n), 1800) * np.exp(-t / 0.0025) * 0.35 * punch
    return np.tanh(1.8 * body) * 0.9 + click


def snare(length=0.3):
    n = ns(length)
    t = secs(n)
    tone = sine(185 * (1 + 0.25 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.05) * 0.55
    nz = bandpass(noise(n), 1400, 9000) * np.exp(-t / 0.11)
    return np.tanh(1.3 * (tone + nz)) * 0.8


def clap(length=0.35):
    n = ns(length)
    t = secs(n)
    env = sum(np.where(t >= o, np.exp(-(t - o) / 0.0045), 0) for o in (0.0, 0.011, 0.022))
    env += np.where(t >= 0.03, 0.8 * np.exp(-(t - 0.03) / 0.1), 0)
    return bandpass(noise(n), 900, 5200) * env * 0.9


def hat(open_=False):
    n = ns(0.35 if open_ else 0.08)
    y = highpass(_metal(n) * 0.6 + noise(n) * 0.4, 7000, 4)
    return y * perc(n, 0.16 if open_ else 0.022, 0.0005) * (0.7 if open_ else 0.8)


def crash(length=2.6, seed=0):
    """Stereo crash: metallic bank + noise, two decorrelated channels. Returns (2, n)."""
    n = ns(length)
    t = secs(n)
    out = []
    for ch in range(2):
        y = _metal(n, 1.37 + 0.02 * ch) * 0.5 + noise(n, seed + ch) * 0.7
        y = highpass(y, 3200, 2) + 0.25 * bandpass(noise(n, seed + 10 + ch), 500, 2500)
        out.append(y * (0.65 * np.exp(-t / 0.9) + 0.35 * np.exp(-t / 0.08)) * np.minimum(t / 0.001, 1))
    return np.array(out) * 0.6


def tom(m, length=0.35):
    n = ns(length)
    t = secs(n)
    f = 440 * 2 ** ((m - 69) / 12) * (1 + 0.6 * np.exp(-t / 0.02))
    return np.tanh(1.5 * sine(f, n) * np.exp(-t / 0.15)) * 0.7


def impact(length=2.2):
    """Cinematic hit: falling sub boom + noise burst, saturated."""
    n = ns(length)
    t = secs(n)
    boom = sine(32 + 70 * np.exp(-t / 0.25), n) * np.exp(-t / 0.7)
    burst = lowpass(noise(n), 2500) * np.exp(-t / 0.12) * 0.6
    snap = highpass(noise(n), 3000) * np.exp(-t / 0.01) * 0.4
    return np.tanh(2.0 * (boom + burst)) * 0.8 + snap


def riser(length, lo=300.0, hi=9000.0):
    """Noise sweep + rising detuned tone, amplitude growing to the end. Returns (2, n)."""
    n = ns(length)
    t = secs(n) / length
    nz = sweep(noise(n), lo, hi, "low") + 0.5 * sweep(noise(n), lo * 0.7, hi * 0.7, "low")
    tone = sine(220 * 2 ** (2 * t), n) * 0.15 + sine(220 * 2 ** (2 * t) * 1.5, n) * 0.08
    y = (nz * 0.5 + tone) * t ** 2
    return np.stack([y, np.roll(y, 37)]) * 0.5


def reverse_swell(length):
    """Reversed cymbal-ish wash that ends exactly at `length`. Returns (2, n)."""
    c = crash(length + 0.3, seed=7)[:, : ns(length)]
    c = c[:, ::-1]
    t = secs(c.shape[1]) / length
    return c * (t ** 1.5)[None, :] * 0.8


# ---------------------------------------------------------------- UI / cut accents

def mouse_click():
    def one(level, f):
        n = ns(0.03)
        t = secs(n)
        return level * (bandpass(noise(n), 1800, 7000) * np.exp(-t / 0.0012) + 0.5 * sine(f, n) * np.exp(-t / 0.002))
    y = np.zeros(ns(0.12))
    a = one(0.9, 3100)
    y[: len(a)] += a
    b = one(0.5, 2600)
    o = ns(0.075)
    y[o:o + len(b)] += b
    return y


def tick(tock=False):
    n = ns(0.03)
    t = secs(n)
    f = 1500 if tock else 2100
    return (bandpass(noise(n), 2500, 7000) * np.exp(-t / 0.0012) * 0.6 + sine(f, n) * np.exp(-t / 0.004)) * 0.5


def error_ding():
    """A small two-partial chime, Windows-error-ish but original."""
    y = bell(84, 0.9, 1.0, ratio=2.0, index=0.6) + 0.6 * bell(91, 0.9, 1.0, ratio=2.0, index=0.4)
    n = len(y)
    return y * np.exp(-secs(n) / 0.35) * 0.9


def zap():
    n = ns(0.22)
    t = secs(n)
    f = 2600 * (110 / 2600) ** (t / 0.2)
    return (sine(f, n) * 0.7 + pulse(f * 0.5, n, 0.3) * 0.25) * np.exp(-t / 0.07) * 0.8


def shutter():
    def clk(level):
        n = ns(0.04)
        t = secs(n)
        return level * (bandpass(noise(n), 1500, 8000) * np.exp(-t / 0.002) + sine(180, n) * np.exp(-t / 0.012) * 0.6)
    y = np.zeros(ns(0.16))
    a = clk(0.9)
    y[: len(a)] += a
    b = clk(0.6)
    o = ns(0.06)
    y[o:o + len(b)] += b
    return y


def boom_lite():
    n = ns(0.9)
    t = secs(n)
    y = sine(40 + 30 * np.exp(-t / 0.08), n) * np.exp(-t / 0.35)
    y += lowpass(noise(n), 400) * np.exp(-t / 0.05) * 0.4
    return np.tanh(2.5 * y) * 0.7
