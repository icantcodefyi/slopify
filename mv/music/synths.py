"""Oscillators, envelopes, filters and the pitched instruments. Everything is synthesised from scratch."""

import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(1234)


def ns(sec):
    return max(0, int(round(sec * SR)))


def secs(n):
    return np.arange(n) / SR


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, float) - 69.0) / 12.0)


def noise(n, seed=None):
    r = rng if seed is None else np.random.default_rng(seed)
    return r.standard_normal(n)


# ---------------------------------------------------------------- oscillators (polyBLEP, band-limited)

def _phase(freq, n, ph0):
    inc = np.broadcast_to(np.asarray(freq, float) / SR, (n,)).copy()
    ph = (ph0 + np.cumsum(inc) - inc) % 1.0
    return ph, inc


def _blep(ph, dt):
    out = np.zeros_like(ph)
    a = ph < dt
    x = ph[a] / dt[a]
    out[a] = x + x - x * x - 1.0
    b = ph > 1.0 - dt
    x = (ph[b] - 1.0) / dt[b]
    out[b] = x * x + x + x + 1.0
    return out


def saw(freq, n, ph0=0.0):
    ph, dt = _phase(freq, n, ph0)
    return 2.0 * ph - 1.0 - _blep(ph, dt)


def pulse(freq, n, width=0.5, ph0=0.0):
    ph, dt = _phase(freq, n, ph0)
    ph2 = (ph + width) % 1.0
    return (2.0 * ph - _blep(ph, dt)) - (2.0 * ph2 - _blep(ph2, dt))


def sine(freq, n, ph0=0.0):
    ph, _ = _phase(freq, n, ph0)
    return np.sin(2 * np.pi * ph)


# ---------------------------------------------------------------- envelopes

def adsr(gate, a=0.005, d=0.15, s=0.7, r=0.12):
    """Envelope for a note held `gate` seconds, followed by an `r` second release."""
    ng, na, nd, nr = ns(gate), max(ns(a), 1), max(ns(d), 1), max(ns(r), 1)
    t = np.arange(ng)
    g = np.where(t < na, t / na, s + (1 - s) * np.exp(-3.0 * np.maximum(t - na, 0) / nd))
    last = g[-1] if ng else 0.0
    return np.concatenate([g, last * np.exp(-5.0 * np.arange(nr) / nr)])


def fit(e, n):
    """Trim or zero-pad an envelope to n samples."""
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def perc(n, decay, attack=0.002):
    t = secs(n)
    return np.minimum(t / attack, 1.0) * np.exp(-t / decay)


# ---------------------------------------------------------------- filters

def _clip_fc(fc):
    return float(np.clip(fc, 10.0, SR * 0.45))


def lowpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, _clip_fc(fc), "low", fs=SR, output="sos"), x, axis=-1)


def highpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, _clip_fc(fc), "high", fs=SR, output="sos"), x, axis=-1)


def bandpass(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [_clip_fc(lo), _clip_fc(hi)], "band", fs=SR, output="sos"), x, axis=-1)


def sweep(x, fc_start, fc_end, kind="low", block=256, q_order=2):
    """Time-varying Butterworth filter (exponential cutoff sweep), processed block-wise."""
    n = len(x)
    out = np.empty_like(x)
    nb = max(1, -(-n // block))
    fcs = fc_start * (fc_end / fc_start) ** (np.arange(nb) / max(nb - 1, 1))
    zi = None
    for i in range(nb):
        sos = signal.butter(q_order, _clip_fc(fcs[i]), kind, fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        seg = x[i * block:(i + 1) * block]
        out[i * block:(i + 1) * block], zi = signal.sosfilt(sos, seg, zi=zi)
    return out


def biquad(kind, f0, gain_db=0.0, q=0.707):
    """RBJ cookbook biquad as an sos row. kind: peak | lowshelf | highshelf."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w), np.sin(w)
    al = sw / (2 * q)
    if kind == "peak":
        b = [1 + al * A, -2 * cw, 1 - al * A]
        a = [1 + al / A, -2 * cw, 1 - al / A]
    else:
        sq = 2 * np.sqrt(A) * al
        sgn = 1 if kind == "lowshelf" else -1
        b = [A * ((A + 1) - sgn * (A - 1) * cw + sq), sgn * 2 * A * ((A - 1) - sgn * (A + 1) * cw),
             A * ((A + 1) - sgn * (A - 1) * cw - sq)]
        a = [(A + 1) + sgn * (A - 1) * cw + sq, -sgn * 2 * ((A - 1) + sgn * (A + 1) * cw),
             (A + 1) + sgn * (A - 1) * cw - sq]
    b, a = np.array(b) / a[0], np.array(a) / a[0]
    return np.concatenate([b, a])[None, :]


def eq(x, *bands):
    sos = np.concatenate([biquad(*b) for b in bands])
    return signal.sosfilt(sos, x, axis=-1)


def bright_dark(x, hi, lo, tau):
    """Cheap filter envelope: crossfade from a bright to a dark lowpass with time constant tau."""
    b, d = lowpass(x, hi), lowpass(x, lo)
    return d + (b - d) * np.exp(-secs(len(x)) / tau)


def pan2(x, p):
    """Mono -> stereo with constant-power pan, p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.stack([np.cos(a) * x, np.sin(a) * x]) * np.sqrt(2)


# ---------------------------------------------------------------- instruments (mono unless noted)

def music_box(m, length=1.8, vel=1.0):
    """Glassy music-box tine: few inharmonic partials with fast-decaying highs and a tiny pluck click."""
    n = ns(length)
    t = secs(n)
    f = float(mtof(m))
    y = np.zeros(n)
    for ratio, amp, dec in ((1.0, 1.0, 1.1), (2.0, 0.28, 0.45), (3.01, 0.12, 0.25), (5.42, 0.16, 0.12),
                            (8.93, 0.06, 0.05)):
        if f * ratio < SR * 0.45:
            y += amp * np.sin(2 * np.pi * f * ratio * t + ratio) * np.exp(-t / dec)
    y += 0.08 * np.sin(2 * np.pi * f * 1.004 * t) * np.exp(-t / 0.9)  # beating -> glassy shimmer
    y += 0.25 * highpass(noise(n), 4000) * np.exp(-t / 0.002)
    return vel * y * np.minimum(t / 0.0015, 1.0) * 0.5


def bell(m, length=0.6, vel=1.0, ratio=3.5, index=2.2):
    """Small FM bell used for the glittery chorus top line and the error ding."""
    n = ns(length)
    t = secs(n)
    f = float(mtof(m))
    mod = index * np.exp(-t / 0.12) * np.sin(2 * np.pi * f * ratio * t)
    y = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / (length * 0.45))
    return vel * y * np.minimum(t / 0.001, 1.0) * 0.5


def chip_pluck(m, gate=0.15, vel=1.0, width=0.25):
    """Chiptune square pluck with a little pitch blip on the attack."""
    n = ns(gate + 0.12)
    t = secs(n)
    f = mtof(m) * (1 + 0.03 * np.exp(-t / 0.008))
    y = pulse(f, n, width) * fit(adsr(gate, 0.002, 0.08, 0.35, 0.1), n)
    return vel * lowpass(y, 7000) * 0.35


def bass(m, gate=0.18, vel=1.0):
    """Saw + sub sine with a quick filter blip."""
    n = ns(gate + 0.06)
    f = mtof(m)
    y = bright_dark(saw(f, n), 3200, 420, 0.05) * 0.75 + sine(f, n) * 0.45
    y = np.tanh(1.4 * y) * fit(adsr(gate, 0.003, 0.12, 0.8, 0.05), n)
    return vel * y * 0.5


def sub(m, gate=0.4, vel=1.0):
    n = ns(gate + 0.08)
    t = secs(n)
    f = mtof(m) * (1 + 0.5 * np.exp(-t / 0.01))
    return vel * np.tanh(1.5 * sine(f, n)) * fit(adsr(gate, 0.003, 0.3, 0.7, 0.08), n) * 0.55


def supersaw(notes, gate, vel=1.0, release=0.25, spread=1.0, bright=9000.0, seed=0):
    """Stereo 7-voice detuned saw stack per note. Returns (2, n)."""
    r = np.random.default_rng(seed)
    n = ns(gate + release)
    out = np.zeros((2, n))
    env = fit(adsr(gate, 0.008, 0.4, 0.75, release), n)
    detune = np.array([-27, -16, -7, 0, 7, 16, 27]) * spread
    pans = np.array([-0.9, 0.6, -0.4, 0.0, 0.4, -0.6, 0.9])
    for m in notes:
        for dc, p in zip(detune, pans):
            v = saw(mtof(m + dc / 100.0), n, r.random()) * (0.6 if dc == 0 else 0.45)
            out += pan2(v, p * spread)
    out = lowpass(highpass(out, 140), bright) * env
    return vel * out / (len(notes) * 4.0)


def pad(notes, gate, vel=1.0, attack=0.35, release=0.9, cutoff=1800.0, seed=1):
    """Soft stereo pad: detuned saw pairs, dark lowpass, slow attack. Returns (2, n)."""
    r = np.random.default_rng(seed)
    n = ns(gate + release)
    out = np.zeros((2, n))
    for m in notes:
        for dc, p in ((-9, -0.7), (9, 0.7), (0, 0.0)):
            out += pan2(saw(mtof(m + dc / 100.0), n, r.random()), p)
    env = fit(adsr(gate, attack, 0.6, 0.9, release), n)
    return vel * lowpass(out, cutoff, 2) * env / (len(notes) * 3.0)


def stab(notes, gate=0.12, vel=1.0):
    """Short bright chord stab (saw + square), filter-enveloped."""
    n = ns(gate + 0.08)
    y = np.zeros(n)
    for m in notes:
        f = mtof(m)
        y += saw(f * 1.003, n) * 0.5 + pulse(f * 0.997, n, 0.5) * 0.4
    y = bright_dark(y, 7000, 1400, 0.04) * fit(adsr(gate, 0.002, 0.06, 0.4, 0.07), n)
    return vel * highpass(y, 250) / len(notes) * 0.6
