"""A tiny UTAU-style concatenative singer.

Each mora is spoken once by macOS `say` (Kyoko), analysed with the WORLD vocoder (f0 / spectral
envelope / aperiodicity), and then resynthesised as part of a phrase:

* the consonant frames are copied at natural speed and placed *before* the note's grid time
  (pre-utterance), so the vowel lands on the beat;
* the vowel frames are stretched to fill the note (first 40 ms natural, the rest slowed down);
* neighbouring notes crossfade in the log-spectral domain over 15 ms (legato);
* f0 is replaced by the score pitch with portamento, a scoop at phrase starts, delayed vibrato
  on long notes and a little drift;
* the spectral envelope is warped up a few percent for a younger, cuter timbre.
"""

import hashlib
import os
import subprocess

import numpy as np
import pyworld as pw
import soundfile as sf

from synths import SR

FP = 5.0  # WORLD frame period, ms
FPS = 1000.0 / FP
FFT = pw.get_cheaptrick_fft_size(SR, 71.0)
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache", "tts")
SILENT = np.log(1e-14)

# ---------------------------------------------------------------- kana -> (consonant, vowel)
_ROWS = {"": "アイウエオ", "k": "カキクケコ", "g": "ガギグゲゴ", "s": "サシスセソ", "z": "ザジズゼゾ",
         "t": "タチツテト", "d": "ダヂヅデド", "n": "ナニヌネノ", "h": "ハヒフヘホ", "b": "バビブベボ",
         "p": "パピプペポ", "m": "マミムメモ", "y": "ヤ_ユ_ヨ", "r": "ラリルレロ", "w": "ワ___ヲ"}
_IRREG = {"シ": "sh", "チ": "ch", "ツ": "ts", "フ": "f", "ジ": "j", "ヂ": "j"}
KANA = {}
for c, row in _ROWS.items():
    for k, v in zip(row, "aiueo"):
        if k != "_":
            KANA[k] = (_IRREG.get(k, c), v)
KANA["ヲ"] = ("", "o")
KANA["ン"] = ("N", "N")
for base in "キギシジチニヒビピミリ":
    c = KANA[base][0]
    c = c if c in ("sh", "ch", "j") else c + "y"
    for small, v in zip("ャュョ", "auo"):
        KANA[base + small] = (c, v)
for small, v in zip("ァィェォ", "aieo"):
    KANA["フ" + small] = ("f", v)

UNVOICED = {"k", "ky", "s", "sh", "t", "ch", "ts", "h", "hy", "f", "p", "py"}
# how far into the voiced region the consonant still lasts (ms), and the max consonant length (ms)
VOICED_TAIL = {"m": 45, "my": 45, "n": 40, "ny": 45, "r": 22, "ry": 30, "d": 22, "b": 25, "by": 30, "g": 25,
               "gy": 30, "z": 40, "j": 40, "y": 40, "w": 40, "": 8, "N": 0}
MAX_CONS = {"s": 80, "sh": 80, "ts": 70, "ch": 70, "h": 70, "hy": 70, "f": 70, "z": 70, "j": 70}


def kana_info(kana):
    return KANA.get(kana, ("", "a"))


# ---------------------------------------------------------------- TTS with on-disk cache

def tts(text, voice="Kyoko", rate=150):
    key = hashlib.sha1(f"{voice}|{rate}|{text}".encode()).hexdigest()[:16]
    path = os.path.join(CACHE, f"{voice}-{rate}-{key}.wav")
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        tmp = path[:-4] + ".tmp.wav"
        subprocess.run(["say", "-v", voice, "-r", str(rate), "--data-format=LEI16@48000", "-o", tmp, text],
                       check=True)
        os.replace(tmp, path)
    x, sr = sf.read(path, dtype="float64")
    assert sr == SR, sr
    return x.mean(1) if x.ndim > 1 else x


def analyse(x):
    x = np.ascontiguousarray(x / (np.max(np.abs(x)) + 1e-9) * 0.5)
    f0, t = pw.harvest(x, SR, f0_floor=71.0, f0_ceil=800.0, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, SR, fft_size=FFT)
    ap = pw.d4c(x, f0, t, SR, fft_size=FFT)
    return f0, sp, ap


# ---------------------------------------------------------------- one analysed mora

class Mora:
    def __init__(self, kana, voice="Kyoko", rate=150):
        self.kana = kana
        self.cons, self.vowel = kana_info(kana)
        text = kana if kana == "ン" else kana + "ー"  # long vowel gives a clean, voiced vowel to stretch
        f0, sp, ap = analyse(tts(text, voice, rate))
        self.f0, self.logsp, self.ap = f0, np.log(sp + 1e-16), ap
        power = 10 * np.log10(sp.sum(1) + 1e-20)
        on = np.where(power > power.max() - 38)[0]
        e0, e1 = int(on[0]), int(on[-1])
        voiced = np.where(f0[e0:] > 0)[0]
        v0 = e0 + (int(voiced[0]) if len(voiced) else 0)
        v1 = e0 + (int(voiced[-1]) if len(voiced) else e1 - e0)
        if self.cons in UNVOICED:
            cend = v0 + 3
        else:
            cend = v0 + int(VOICED_TAIL.get(self.cons, 30) / FP)
        if self.cons in ("", "N"):
            e0 = max(v0 - 1, e0)
        cmax = int(MAX_CONS.get(self.cons, 70) / FP)
        e0 = max(e0, cend - cmax)
        self.c0, self.c1 = e0, cend                 # consonant frames [c0, c1)
        self.s1 = max(cend + 6, v1 - 8)             # stable vowel frames [c1, s1)
        self.s1 = min(self.s1, len(f0) - 1)
        st = slice(self.c1, self.s1)
        self.level = 10 * np.log10(np.exp(self.logsp[st]).sum(1).mean() + 1e-20)

    @property
    def cons_len(self):
        return self.c1 - self.c0

    @property
    def stable_len(self):
        return self.s1 - self.c1


def _interp_frames(arr, pos):
    """Linear interpolation of rows of `arr` at fractional frame positions."""
    pos = np.clip(pos, 0, len(arr) - 1)
    i = np.floor(pos).astype(int)
    j = np.minimum(i + 1, len(arr) - 1)
    w = (pos - i)[:, None]
    return arr[i] * (1 - w) + arr[j] * w


def warp_formants(logsp, alpha):
    """Shift the spectral envelope up by `alpha` (>1 = smaller vocal tract)."""
    k = np.arange(logsp.shape[1])
    src = np.clip(k / alpha, 0, logsp.shape[1] - 1)
    i = np.floor(src).astype(int)
    j = np.minimum(i + 1, logsp.shape[1] - 1)
    w = src - i
    return logsp[:, i] * (1 - w) + logsp[:, j] * w


# ---------------------------------------------------------------- the singer

class Singer:
    XF = 3          # legato crossfade, frames (15 ms)
    RELEASE = 9     # release ramp at phrase ends, frames (45 ms)
    TARGET_DB = -20.0

    def __init__(self, voice="Kyoko", rate=150, formant=1.07):
        self.voice, self.rate, self.formant = voice, rate, formant
        self.bank = {}

    def mora(self, kana):
        if kana not in self.bank:
            self.bank[kana] = Mora(kana, self.voice, self.rate)
        return self.bank[kana]

    def sing(self, events, total_len):
        """Render all sung events (dicts with t, dur, sing, midi) into a mono track of `total_len` s."""
        out = np.zeros(int(total_len * SR) + SR)
        for phrase in _phrases(events):
            t0, y = self._phrase(phrase)
            i0 = int(round(t0 * SR))
            seg = y[: len(out) - i0]
            out[i0:i0 + len(seg)] += seg
        return out[: int(total_len * SR)]

    # -- one legato phrase -> audio
    def _phrase(self, notes):
        t_start = notes[0]["t"] - 0.25
        t_end = notes[-1]["t"] + notes[-1]["dur"] + 0.3
        nf = int((t_end - t_start) * FPS) + 1
        fr = lambda t: int(round((t - t_start) * FPS))  # noqa: E731

        srcs, lc = [], []
        prev_src = None
        for k, n in enumerate(notes):
            src = prev_src if n["sing"] == "ー" and prev_src is not None else self.mora(n["sing"])
            hold = n["sing"] == "ー"
            L = 0 if hold else src.cons_len
            if k and _adjacent(notes[k - 1], n):
                L = min(L, int(0.35 * notes[k - 1]["dur"] * FPS))
            srcs.append((src, hold))
            lc.append(L)
            prev_src = src

        K = srcs[0][0].logsp.shape[1]
        acc_sp = np.zeros((nf, K))
        acc_ap = np.zeros((nf, K))
        acc_v = np.zeros(nf)
        acc_w = np.zeros(nf)
        acc_g = np.zeros(nf)

        for k, n in enumerate(notes):
            src, hold = srcs[k]
            L = lc[k]
            von = fr(n["t"])
            s = von - L
            legato = k + 1 < len(notes) and _adjacent(n, notes[k + 1])
            e = fr(notes[k + 1]["t"]) - lc[k + 1] + self.XF if legato else fr(n["t"] + n["dur"]) - 1
            e = max(e, von + 2)
            idx = np.arange(s, e)
            # source frame positions
            pos = np.empty(len(idx))
            cmask = idx < von
            pos[cmask] = src.c1 - L + (idx[cmask] - s)
            j = idx[~cmask] - von
            Lv = len(j)
            if hold:  # keep singing the end of the previous vowel
                a = max(src.c1, src.s1 - 12)
                pos[~cmask] = a + (src.s1 - 1 - a) * j / max(Lv - 1, 1)
            elif Lv <= src.stable_len:
                pos[~cmask] = src.c1 + j
            else:
                nat = min(8, src.stable_len - 1)
                rest = np.maximum(j - nat, 0)
                span = src.stable_len - 1 - nat
                pos[~cmask] = np.where(j < nat, src.c1 + j, src.c1 + nat + span * rest / max(Lv - nat - 1, 1))
            sp = _interp_frames(src.logsp, pos)
            ap = _interp_frames(src.ap, pos)
            vo = np.where(cmask, src.f0[np.clip(np.round(pos).astype(int), 0, len(src.f0) - 1)] > 0, True)

            w = np.ones(len(idx))
            first = k == 0 or not _adjacent(notes[k - 1], n)
            xf = np.linspace(0, 1, self.XF + 2)[1:-1]  # complementary ramps: in + out == 1
            if first:
                w[:2] = (0.3, 0.7)
            else:
                w[:self.XF] = xf
            if legato:
                w[-self.XF:] *= xf[::-1]
            else:
                w[-self.RELEASE:] *= np.cos(np.linspace(0, np.pi / 2, self.RELEASE))
            gain = 10 ** ((self.TARGET_DB - src.level) * 0.75 / 20)

            ok = (idx >= 0) & (idx < nf)
            ii = idx[ok]
            acc_sp[ii] += w[ok, None] * sp[ok]
            acc_ap[ii] += w[ok, None] * ap[ok]
            acc_v[ii] += w[ok] * vo[ok]
            acc_w[ii] += w[ok]
            acc_g[ii] += w[ok] * gain

        on = acc_w > 1e-6
        logsp = np.full((nf, K), SILENT)
        ap = np.ones((nf, K))
        logsp[on] = acc_sp[on] / acc_w[on, None]
        ap[on] = np.clip(acc_ap[on] / acc_w[on, None], 0.0, 1.0)
        voiced = np.zeros(nf, bool)
        voiced[on] = acc_v[on] / acc_w[on] > 0.5
        amp = np.clip(acc_g, 0, None)
        logsp = warp_formants(logsp, self.formant) + 2 * np.log(amp + 1e-9)[:, None]
        logsp[~on] = SILENT
        ap[voiced] = np.minimum(ap[voiced], 0.9)  # slightly cleaner, more "synthetic" voicing

        midi = self._pitch(notes, t_start, nf)
        f0 = np.where(voiced, 440.0 * 2 ** ((midi - 69) / 12), 0.0)
        y = pw.synthesize(np.ascontiguousarray(f0), np.ascontiguousarray(np.exp(logsp)),
                          np.ascontiguousarray(ap), SR, FP)
        return t_start, y

    # -- pitch curve in (fractional) midi per frame
    def _pitch(self, notes, t_start, nf):
        tt = t_start + np.arange(nf) / FPS
        m = np.full(nf, float(notes[0]["midi"]))
        for n in notes:
            m[tt >= n["t"] - 0.01] = n["midi"]
        for k, n in enumerate(notes):
            if k and _adjacent(notes[k - 1], n) and notes[k - 1]["midi"] != n["midi"]:
                # portamento: glide from the previous pitch, centred slightly after the boundary
                a, b = n["t"] - 0.025, n["t"] + 0.055
                sel = (tt >= a) & (tt < b)
                x = (tt[sel] - a) / (b - a)
                m[sel] = notes[k - 1]["midi"] + (n["midi"] - notes[k - 1]["midi"]) * (0.5 - 0.5 * np.cos(np.pi * x))
            elif not k or not _adjacent(notes[k - 1], n):
                sel = (tt >= n["t"] - 0.05) & (tt < n["t"] + 0.07)
                x = (tt[sel] - (n["t"] - 0.05)) / 0.12
                m[sel] = n["midi"] - 0.45 * (1 - x) ** 2  # small scoop into phrase starts
            if n["dur"] >= 0.6 - 1e-6:  # delayed vibrato on notes >= 3 eighths
                v0 = n["t"] + 0.22
                sel = (tt >= v0) & (tt < n["t"] + n["dur"])
                x = tt[sel] - v0
                m[sel] += 0.38 * np.minimum(x / 0.25, 1.0) * np.sin(2 * np.pi * 5.7 * x)
        drift = np.convolve(np.random.default_rng(5).standard_normal(nf), np.hanning(41) / 41 * 4, "same")
        return m + 0.05 * drift


def _adjacent(a, b):
    return abs(a["t"] + a["dur"] - b["t"]) < 1e-3


def _phrases(events):
    sung = [e for e in events if "midi" in e]
    out, cur = [], []
    for e in sung:
        if cur and not _adjacent(cur[-1], e):
            out.append(cur)
            cur = []
        cur.append(e)
    if cur:
        out.append(cur)
    return out


# ---------------------------------------------------------------- spoken shouts

def speak(text, voice="Kyoko", rate=280, semitones=3.0, formant=1.05, max_dur=None):
    """Speak `text`, trim the silence, pitch it up with WORLD and squeeze it to `max_dur` seconds."""
    f0, sp, ap = analyse(tts(text, voice, rate))
    power = 10 * np.log10(sp.sum(1) + 1e-20)
    on = np.where(power > power.max() - 40)[0]
    a, b = int(on[0]), int(on[-1]) + 4
    f0, sp, ap = f0[a:b], sp[a:b], ap[a:b]
    n = len(f0)
    if max_dur and n / FPS > max_dur:
        m = int(max_dur * FPS)
        pos = np.linspace(0, n - 1, m)
        sp = np.exp(_interp_frames(np.log(sp + 1e-16), pos))
        ap = _interp_frames(ap, pos)
        f0 = f0[np.round(pos).astype(int)]
    logsp = warp_formants(np.log(sp + 1e-16), formant)
    f0 = f0 * 2 ** (semitones / 12)
    y = pw.synthesize(np.ascontiguousarray(f0), np.ascontiguousarray(np.exp(logsp)), np.ascontiguousarray(ap), SR, FP)
    fade = min(len(y), int(0.02 * SR))
    y[-fade:] *= np.linspace(1, 0, fade)
    return y / (np.max(np.abs(y)) + 1e-9)
