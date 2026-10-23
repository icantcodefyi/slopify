"""The arrangement: who plays what, bar by bar. Produces dry stereo stems on the score's grid."""

import numpy as np

import drums as D
import synths as S
from score import BEAT, CHORDS, E8, NOTE, TRANSPOSE, at, midi
from synths import lowpass, ns, pan2

S16 = BEAT / 4
STEMS = ["kick", "snare", "hats", "bass", "chords", "keys", "fx", "vocal", "shouts"]
INSTRUMENT_STEMS = ["kick", "snare", "hats", "bass", "chords", "keys", "fx"]
# hard stops: intro freeze ("応答なし"), pre-chorus break, bridge stop. Instruments are muted here
# (including reverb tails); only events added with post=True (ding, swells, the fill) sound.
STOPS = [(5.6, 6.4), (24.8, 25.6), (47.2, 48.0)]

# the signature music-box motif (8th position from bar start, note): 6 notes in D major
MOTIF = [(2, "A5"), (3, "D6"), (4, "F#6"), (6, "E6"), (7, "C#6"), (8, "D6")]


class Track:
    def __init__(self, duration):
        self.n = ns(duration)
        self.buf = {k: np.zeros((2, self.n)) for k in STEMS}
        self.post = {k: np.zeros((2, self.n)) for k in STEMS}
        self.kicks = []          # sidechain triggers
        self.marks = {"crash": [], "impact": [], "accent": []}

    def add(self, stem, t, sig, gain=1.0, pan=0.0, post=False):
        x = sig if sig.ndim == 2 else pan2(sig, pan)
        i = ns(t)
        if i >= self.n:
            return
        seg = x[:, : self.n - i]
        (self.post if post else self.buf)[stem][:, i:i + seg.shape[1]] += gain * seg


# ---------------------------------------------------------------- harmony helpers

def chord(bar):
    name = CHORDS[bar - 1]
    root = name[:2] if len(name) > 1 and name[1] in "#b" else name[0]
    iv = {"": (0, 4, 7), "m": (0, 3, 7), "maj7": (0, 4, 7, 11), "m7": (0, 3, 7, 10), "7": (0, 4, 7, 10)}[name[len(root):]]
    return (NOTE[root] + TRANSPOSE.get(bar, 0)) % 12, iv


def tones(bar, lo):
    """Chord tones placed in [lo, lo + 12)."""
    r, iv = chord(bar)
    return sorted(lo + (r + i - lo) % 12 for i in iv)


def root(bar, lo):
    return lo + (chord(bar)[0] - lo) % 12


# ---------------------------------------------------------------- shared one-shots (rendered once)

class Kit:
    def __init__(self):
        self.kick = D.kick()
        self.kick_soft = lowpass(D.kick(punch=0.2), 260, 4) * 0.8
        self.clap = D.clap()
        self.snare = D.snare()
        self.chh = [D.hat(False) for _ in range(3)]
        self.ohh = D.hat(True)
        self.crash = D.crash()


def kick(tr, kit, t, gain=1.0):
    tr.add("kick", t, kit.kick, gain)
    tr.kicks.append(t)


def crash(tr, kit, t, gain=0.55):
    tr.add("hats", t, kit.crash, gain)
    tr.marks["crash"].append(t)


def impact(tr, t, gain=0.7, post=False):
    tr.add("fx", t, D.impact(), gain, post=post)
    tr.marks["impact"].append(t)


def hats_16(tr, kit, bar, gain=0.22, open_off=True, closed=True):
    for k in range(16):
        t = at(bar) + k * S16
        if open_off and k % 4 == 2:
            tr.add("hats", t, kit.ohh, gain * 1.2, pan=0.15)
        elif closed:
            tr.add("hats", t, kit.chh[k % 3], gain * (1.0 if k % 2 == 0 else 0.55), pan=-0.2)


def bass_bounce(tr, bar, gain=0.55, octave=True):
    r = root(bar, 33)
    for k in range(8):
        m = r + (12 if octave and k % 2 else 0)
        tr.add("bass", at(bar) + k * E8, S.bass(m, 0.16), gain)


def arp_pluck(tr, bar, lo=69, gain=0.16, pan=-0.35, pattern=(0, 2, 1, 2, 0, 2, 1, 3)):
    ts = tones(bar, lo)
    ts = ts + [ts[0] + 12]
    for k, p in enumerate(pattern):
        tr.add("keys", at(bar) + k * E8, S.chip_pluck(ts[p % len(ts)], 0.1), gain, pan=pan)


def stabs(tr, bar, gain=0.32, lo=62, cutoff=None):
    for k in range(1, 8, 2):
        y = S.stab(tones(bar, lo), 0.1)
        if cutoff:
            y = lowpass(y, cutoff)
        tr.add("keys", at(bar) + k * E8, y, gain, pan=0.3)


def glitter(tr, bar, gain=0.1, lo=81):
    ts = tones(bar, lo)
    seq = ts + [ts[0] + 12] + ts[::-1][1:]
    for k in range(16):
        tr.add("keys", at(bar) + k * S16, S.bell(seq[k % len(seq)], 0.35), gain * (1.0 if k % 4 == 0 else 0.7),
               pan=0.5 if k % 2 else -0.5)


def motif(tr, bar, transpose=0, gain=0.6, until=None):
    for pos, name in MOTIF:
        t = at(bar) + pos * E8
        if until is not None and t >= until - 1e-6:
            continue
        tr.add("keys", t, S.music_box(midi(name) + transpose, 1.8), gain, pan=0.25 if pos % 2 else -0.25)


# ---------------------------------------------------------------- sections

def intro(tr, kit):
    tr.add("fx", 0.0, D.mouse_click(), 0.9, pan=0.1)
    for k in range(1, int(round(5.6 / E8))):
        tr.add("hats", k * E8, D.tick(k % 2 == 1), 0.22 if k % 2 == 0 else 0.13, pan=0.35 if k % 2 else -0.35)
    tr.add("chords", 0.15, S.pad(tones(1, 57) + [root(1, 45)], 5.4, attack=1.6, cutoff=1300), 0.55)
    motif(tr, 1, gain=0.6)
    motif(tr, 3, gain=0.6, until=5.6)
    for q in range(6):  # bar 3: filtered kick sneaks in
        tr.add("kick", at(3, q), kit.kick_soft, 0.45 + 0.08 * q)
    seq = [62, 66, 69, 73, 74, 73, 69, 66]
    for k in range(int(round((5.6 - at(3)) / S16))):
        prog = k / 24
        y = lowpass(S.chip_pluck(seq[k % 8] + 12, 0.06, width=0.5), 500 * 12 ** prog)
        tr.add("keys", at(3) + k * S16, y, 0.12 + 0.12 * prog, pan=0.4 if k % 2 else -0.4)
    tr.add("fx", at(3), D.riser(5.6 - at(3), 250, 7000), 0.35)
    # freeze: the editor stops responding
    tr.add("fx", 5.6, D.error_ding(), 0.45, post=True)
    tr.add("fx", 6.4 - 0.35, D.reverse_swell(0.35), 0.35, post=True)


def verse(tr, kit):
    impact(tr, at(5))
    crash(tr, kit, at(5))
    for b in range(5, 13):
        for q in range(4):
            kick(tr, kit, at(b, q))
        for q in (1, 3):
            tr.add("snare", at(b, q), kit.clap, 0.6)
        hats_16(tr, kit, b, 0.18)
        bass_bounce(tr, b, 0.5)
        stabs(tr, b, 0.28)
        arp_pluck(tr, b, 69, 0.13)
        tr.add("chords", at(b), S.pad(tones(b, 57), 1.6, attack=0.08, release=0.3), 0.32)
    for k in range(4):  # small fill into the pre-chorus
        tr.add("snare", at(12, 3) + k * S16, kit.snare, 0.25 + 0.08 * k)


def pre(tr, kit):
    for b in range(13, 17):
        for q in range(4 if b < 16 else 2):
            kick(tr, kit, at(b, q))
        if b <= 14:
            for q in (1, 3):
                tr.add("snare", at(b, q), kit.clap, 0.6)
            hats_16(tr, kit, b, 0.18)
        else:
            hats_16(tr, kit, b, 0.2, open_off=False)
        r = root(b, 33)
        for k in range(8 if b < 16 else 4):
            tr.add("bass", at(b) + k * E8, S.bass(r, 0.16), 0.5)
        prog = (b - 13) / 3
        if b < 16:
            tr.add("chords", at(b), S.supersaw(tones(b, 60) + [root(b, 48)], 1.55, bright=2500 * 3 ** prog,
                                               seed=b), 0.38 + 0.12 * prog)
        else:
            tr.add("chords", at(b), S.supersaw(tones(b, 60) + [root(b, 48)], 0.75, release=0.05, bright=9000,
                                               seed=b), 0.5)
        stabs(tr, b, 0.26)
        if b < 16:
            arp_pluck(tr, b, 71, 0.13)
    # snare roll: 8ths in bar 15, 16ths in bar 16 (beats 1-2)
    for k in range(8):
        tr.add("snare", at(15) + k * E8, kit.snare, 0.3 + 0.04 * k)
    for k in range(8):
        tr.add("snare", at(16) + k * S16, kit.snare, 0.5 + 0.05 * k)
    tr.add("fx", at(13), D.riser(at(16, 2) - at(13), 300, 10000), 0.42)
    # break: drums out, only 「さ」 and a swell into the drop
    tr.add("fx", at(16, 2) + 0.1, D.reverse_swell(at(17) - at(16, 2) - 0.1), 0.5, post=True)


def chorus(tr, kit, b0, b1, final=False):
    impact(tr, at(b0), 0.8)
    crash(tr, kit, at(b0), 0.6)
    crash(tr, kit, at(b0 + 4), 0.5)
    for b in range(b0, b1 + 1):
        for q in range(4):
            kick(tr, kit, at(b, q))
        for q in (1, 3):
            tr.add("snare", at(b, q), kit.clap, 0.62)
            tr.add("snare", at(b, q), kit.snare, 0.3)
        hats_16(tr, kit, b, 0.2)
        bass_bounce(tr, b, 0.55)
        notes = tones(b, 60) + [root(b, 48), root(b, 72)]
        tr.add("chords", at(b), S.supersaw(notes, 1.55, seed=b), 0.6)
        if final:
            tr.add("chords", at(b), S.supersaw(tones(b, 72), 1.55, seed=100 + b, spread=1.2), 0.22)
        glitter(tr, b, 0.13 if final else 0.1)
        arp_pluck(tr, b, 69, 0.11, pan=-0.45)
        if final:
            stabs(tr, b, 0.2)
    last = b1
    for k in range(4):  # fill on the last beat
        tr.add("snare", at(last, 3) + k * S16, kit.snare, 0.35 + 0.1 * k)
    if not final:
        tr.add("snare", at(last, 3) + 2 * S16, D.tom(50), 0.4)


def bridge(tr, kit, calls):
    for b in range(25, 31):
        for half in (0, 1):
            base = at(b, 2 * half)
            if base >= 47.2 - 1e-6:
                continue
            # dembow: boom - ch - boom - chick
            kick(tr, kit, base, 0.9)
            kick(tr, kit, base + BEAT, 0.75)
            tr.add("snare", base + 3 * S16, kit.clap, 0.42, pan=-0.1)
            tr.add("snare", base + 6 * S16, kit.clap, 0.5, pan=0.1)
            tr.add("snare", base + 6 * S16, kit.snare, 0.2)
            for k in range(4):
                tr.add("hats", base + k * E8, kit.chh[k % 3], 0.16 if k % 2 else 0.1, pan=0.25)
            for o in (0, BEAT):
                tr.add("bass", base + o, S.sub(root(b, 38), 0.32), 0.65)
            for o in (3 * S16, 6 * S16):
                tr.add("keys", base + o, lowpass(S.stab(tones(b, 62), 0.09), 1600), 0.32, pan=0.3)
        gate_len = 1.55 if b < 30 else 0.75
        tr.add("chords", at(b), S.pad(tones(b, 57) + [root(b, 69)], gate_len, attack=0.05, release=0.25,
                                       cutoff=900), 0.5)
    # each shout's half bar gets a cut accent
    accents = [D.zap(), D.shutter(), D.boom_lite()]
    gains = [0.32, 0.55, 0.6]
    for k, c in enumerate(calls):
        a = k % 3
        tr.add("fx", c["t"], accents[a], gains[a], pan=(-0.3, 0.3, 0.0)[a], post=c["t"] >= 47.2 - 1e-6)
        tr.marks["accent"].append(c["t"])
    # stop at bar 30 beat 3, fill into the final chorus
    for k in range(4):
        tr.add("snare", 47.6 + k * S16, kit.snare, 0.4 + 0.12 * k, post=True)
        tr.add("snare", 47.6 + k * S16, D.tom(55 - 3 * k), 0.35, post=True)
    tr.add("fx", 47.35, D.reverse_swell(48.0 - 47.35), 0.45, post=True)


def outro(tr, kit):
    t = at(39)
    impact(tr, t, 0.85)
    crash(tr, kit, t, 0.7)
    kick(tr, kit, t)
    tr.add("chords", t, S.supersaw(tones(39, 60) + [root(39, 48), root(39, 72)], 1.2, release=2.8, seed=39), 0.65)
    tr.add("chords", t, S.supersaw(tones(39, 72), 1.2, release=2.4, seed=139), 0.2)
    tr.add("bass", t, S.sub(root(39, 38), 1.4), 0.7)
    tr.add("chords", t + 0.3, S.pad(tones(39, 57) + [root(39, 45)], 3.6, attack=1.0, release=1.6, cutoff=1500), 0.55)
    motif(tr, 40, transpose=TRANSPOSE.get(40, 0), gain=0.55)


def arrange(data):
    tr = Track(data["duration"])
    kit = Kit()
    intro(tr, kit)
    verse(tr, kit)
    pre(tr, kit)
    chorus(tr, kit, 17, 24)
    bridge(tr, kit, data["calls"])
    chorus(tr, kit, 31, 38, final=True)
    outro(tr, kit)
    return tr
