"""Effects, the vocal chain and the master bus (all offline, numpy/scipy)."""

import numpy as np
import pyloudnorm
from scipy import signal
from scipy.ndimage import maximum_filter1d, uniform_filter1d

from synths import SR, eq, highpass, lowpass, noise, ns, secs


def db(x):
    return 20 * np.log10(np.maximum(x, 1e-12))


def undb(x):
    return 10 ** (np.asarray(x) / 20)


def stereo(x):
    return np.stack([x, x]) if x.ndim == 1 else x


# ---------------------------------------------------------------- dynamics

def compress(x, thresh_db=-18, ratio=3.0, tau=0.012, release=0.12, makeup_db=0.0):
    """Feed-forward RMS compressor (stereo-linked). Fast-ish attack via peak hold, smooth release."""
    x = stereo(x)
    lvl = np.sqrt(signal.lfilter([1 - np.exp(-1 / (tau * SR))], [1, -np.exp(-1 / (tau * SR))], (x ** 2).max(0)))
    over = np.maximum(db(lvl) - thresh_db, 0)
    gr = over * (1 - 1 / ratio)
    gr = maximum_filter1d(gr, ns(0.004))
    a = np.exp(-1 / (release * SR))
    gr = signal.lfilter([1 - a], [1, -a], gr)
    return x * undb(makeup_db - gr)[None, :]


def duck(n, times, depth=0.6, release=0.16, attack=0.004):
    """Sidechain gain curve from trigger times (kick)."""
    imp = np.zeros(n)
    for t in times:
        i = ns(t)
        if i < n:
            imp[i] = 1.0
    a = np.exp(-1 / (release * SR))
    env = np.minimum(signal.lfilter([1], [1, -a], imp), 1.0)
    env = uniform_filter1d(env, max(ns(attack), 1))  # soften the dip so sustained parts don't click
    return 1 - depth * env


def gate(n, windows, fade=0.004):
    """1 everywhere except 0 inside each (t0, t1) window, with short ramps."""
    g = np.ones(n)
    f = ns(fade)
    for t0, t1 in windows:
        a, b = ns(t0), ns(t1)
        g[a:b] = 0
        g[max(a - f, 0):a] *= np.linspace(1, 0, a - max(a - f, 0))
        g[b:b + f] *= np.linspace(0, 1, len(g[b:b + f]))
    return g


# ---------------------------------------------------------------- time effects

def plate_ir(length=1.8, rt60=1.6, hf_rt60=0.7, predelay=0.018, seed=3):
    """Synthetic stereo plate: dense decorrelated noise, highs decaying faster than lows."""
    n = ns(length)
    t = secs(n)
    ir = []
    for ch in range(2):
        nz = noise(n, seed + ch)
        lo, hi = lowpass(nz, 2500), highpass(nz, 2500)
        y = lo * np.exp(-6.9 * t / rt60) + hi * np.exp(-6.9 * t / hf_rt60)
        y *= np.minimum(t / 0.004, 1)
        ir.append(np.concatenate([np.zeros(ns(predelay)), y]))
    ir = np.array(ir)
    return highpass(ir, 200) / np.sqrt((ir ** 2).sum() / 2)


def reverb(x, ir, wet=0.2):
    x = stereo(x)
    mono = x.mean(0)
    w = np.stack([signal.fftconvolve(mono, ir[c])[: x.shape[1]] for c in range(2)])
    return x + wet * w


def delay_taps(x, d, feedback=0.45, taps=5, pingpong=True, tone=4500):
    """Feed-forward approximation of a (ping-pong) feedback delay; returns only the wet signal."""
    mono = x.mean(0) if x.ndim > 1 else x
    mono = lowpass(highpass(mono, 300), tone)
    out = np.zeros((2, len(mono)))
    D = ns(d)
    for k in range(1, taps + 1):
        g = feedback ** (k - 1)
        sh = k * D
        if sh >= len(mono):
            break
        ch = (k % 2) if pingpong else None
        seg = mono[: len(mono) - sh] * g
        if ch is None:
            out[:, sh:] += seg
        else:
            out[ch, sh:] += seg
            out[1 - ch, sh:] += seg * 0.25
    return out


def mod_delay(x, base, depth, rate, phase=0.0):
    n = len(x)
    t = secs(n)
    d = (base + depth * np.sin(2 * np.pi * rate * t + phase)) * SR
    idx = np.arange(n) - d
    return np.interp(idx, np.arange(n), x, left=0.0)


def chorus_double(x, amount=0.35):
    """Doubler: two modulated short delays panned wide."""
    l = mod_delay(x, 0.013, 0.0016, 0.7)
    r = mod_delay(x, 0.019, 0.0021, 0.53, 1.3)
    return np.stack([x + amount * l, x + amount * r])


def exciter(x, amount=0.25, fc=4500):
    """Generates harmonics above the TTS bandwidth (Kyoko is 22 kHz-native)."""
    h = highpass(x, fc)
    sat = np.tanh(4 * h / (np.max(np.abs(h)) + 1e-9))
    return x + amount * highpass(sat, 7000) * np.max(np.abs(h))


# ---------------------------------------------------------------- vocal chain

def vocal_chain(dry, throws, ir):
    """dry mono vocal -> (stereo processed vocal). `throws` are (t0, t1) regions sent to the 1/8 delay."""
    x = highpass(dry, 110)
    x = eq(x, ("peak", 300, -2.0, 1.0), ("peak", 3200, 3.0, 0.9), ("highshelf", 9000, 3.0))
    x = exciter(x)
    x = compress(x[None, :], -20, 3.0, 0.008, 0.09)[0]
    x = compress(x[None, :], -14, 6.0, 0.002, 0.05)[0]  # light peak control
    st = chorus_double(x, 0.3)
    send = np.zeros_like(x)
    for t0, t1 in throws:
        a, b = ns(t0), ns(t1)
        fade = np.ones(b - a)
        k = min(len(fade), ns(0.02))
        fade[-k:] = np.linspace(1, 0, k)
        send[a:b] += x[a:b] * fade
    dly = delay_taps(send, 0.2, 0.42, 6, True, 5000) * 0.38
    rev =np.stack([signal.fftconvolve(x + 0.5 * dly.mean(0), ir[c])[: len(x)] for c in range(2)])
    return st + dly + 0.16 * rev


# ---------------------------------------------------------------- master

def true_peak(x):
    return np.abs(signal.resample_poly(x, 4, 1, axis=1)).max()


def limit(x, ceiling_db=-1.2, attack=0.0025, release=0.06):
    """Offline (non-causal) brickwall limiter using an oversampled peak estimate."""
    c = undb(ceiling_db)
    p = np.abs(signal.resample_poly(x, 4, 1, axis=1)).max(0)
    p = p[: x.shape[1] * 4].reshape(-1, 4).max(1)
    att = 1 - np.minimum(1.0, c / np.maximum(p, 1e-9))           # attenuation needed per sample
    L = max(ns(attack), 1)
    att = uniform_filter1d(maximum_filter1d(att, 2 * L + 1), L + 1)  # smooth, never under the need
    R = max(ns(release), 1)
    att = np.maximum(att, uniform_filter1d(maximum_filter1d(att, 2 * R + 1), R + 1) * 0.6)
    return x * (1 - att)[None, :]


def loudness(x):
    return pyloudnorm.Meter(SR).integrated_loudness(x.T)


def master(mix, target_lufs=-12.0, ceiling_db=-1.2):
    x = highpass(mix, 28, 2)
    x = eq(x, ("lowshelf", 100, -2.0), ("peak", 3000, 1.5, 0.8), ("highshelf", 10000, 1.5))
    x = compress(x, -16, 1.8, 0.02, 0.25)
    gain = 0.0
    for _ in range(6):
        y = limit(x * undb(gain), ceiling_db)
        err = target_lufs - loudness(y)
        if abs(err) < 0.05:
            break
        gain += err
    tp = true_peak(y)
    if db(tp) > ceiling_db:
        y *= undb(ceiling_db - db(tp))
    return y, gain
