"""The score: structure, chords, lead melody and lyrics of 「スロッピファイ計画」.

This file is the contract between the soundtrack and the picture. `python score.py` writes
`../web/assets/timing.json`, which the MV reads for lyrics, cuts and beat pulses.

150 BPM, 4/4. beat = 0.4 s, bar = 1.6 s, 8th = 0.2 s. Bar 1 beat 1 = t 0.
Melody tokens: `disp=sing:len:note` (len in 8ths). `disp` is shown on screen, `sing` is what the
singer pronounces (defaults to disp). `ッ` and `_` are rests. `ー` holds the previous vowel.
"""

import json
import os

BPM = 150
BEAT = 60 / BPM
BAR = 4 * BEAT
E8 = BEAT / 2
BARS = 40
TAIL = 2.4

SECTIONS = [  # name, first bar, last bar (inclusive)
    ("intro", 1, 4),
    ("verse", 5, 12),
    ("pre", 13, 16),
    ("chorus", 17, 24),
    ("bridge", 25, 30),
    ("final", 31, 38),
    ("outro", 39, 40),
]

# one chord per bar (key D major; final chorus +1 semitone -> Eb)
CHORDS = (
    ["Dmaj7"] * 4
    + ["Bm", "G", "A", "D", "Bm", "G", "Em", "A"]
    + ["G", "A", "F#m", "Bm"]
    + ["G", "A", "F#m", "Bm", "G", "A", "D", "D"]
    + ["Bm", "Bm", "G", "A", "Bm", "A"]
    + ["G", "A", "F#m", "Bm", "G", "A", "D", "D"]
    + ["D", "D"]
)
TRANSPOSE = {b: 1 for b in range(31, 41)}

LINES = [  # first bar, english gloss, tokens
    (5, "hello, in Comic Sans",
     "コ:1:F#4 ミ:1:A4 ッ:1:_ ク:1:A4 サ:1:B4 ン:1:A4 ス:1:F#4 で=デ:1:E4 "
     "こ=コ:1:D4 ん=ン:1:E4 に=ニ:1:F#4 ち=チ:1:A4 は=ワ:3:F#4 _:1"),
    (7, "the hit counter spins and spins",
     "ヒ:1:F#4 ッ:1:_ ト:1:F#4 カ:1:A4 ウ:1:B4 ン:1:A4 タ:1:F#4 ー:1:E4 "
     "ま=マ:1:D4 わ=ワ:1:E4 る=ル:1:F#4 ま=マ:1:A4 わ=ワ:1:B4 る=ル:2:A4 _:1"),
    (9, "close the popup, it comes back",
     "ポ:1:B4 ッ:1:_ プ:1:B4 ア:1:C#5 ッ:1:_ プ:1:B4 _:1 と=ト:1:A4 "
     "じ=ジ:1:B4 て=テ:1:A4 も=モ:1:F#4 ま=マ:1:F#4 た=タ:1:E4 で=デ:1:F#4 る=ル:1:A4 よ=ヨ:1:B4"),
    (11, "accept every cookie",
     "ク:1:A4 ッ:1:_ キ:1:A4 ー:1:B4 ぜ=ゼ:1:A4 ん=ン:1:G4 ぶ=ブ:2:F#4 "
     "う=ウ:1:E4 け=ケ:1:F#4 い=イ:1:G4 れ=レ:1:A4 て=テ:3:A4 _:1"),
    (13, "but wait, there's more",
     "ちょ=チョ:1:D5 っ:1:_ と=ト:1:D5 ま=マ:1:C#5 っ:1:_ て=テ:1:B4 _:2 "
     "ま=マ:1:C#5 だ=ダ:1:C#5 _:1 あ=ア:1:C#5 る=ル:1:D5 よ=ヨ:3:E5"),
    (15, "whatever you do, don't click",
     "ぜ=ゼ:1:B4 っ:1:_ た=タ:1:B4 い=イ:1:C#5 ク:1:D5 リ:1:C#5 ッ:1:_ ク:1:B4 "
     "し=シ:1:A4 ちゃ=チャ:1:B4 だ=ダ:1:C#5 め=メ:1:C#5 _:2 さ=サ:2:E5"),
    (17, "slop, slop, slopify",
     "ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 "
     "ス:1:E5 ロ:1:E5 ッ:1:_ ピ:1:E5 ファ:1:D5 イ:2:C#5 _:1"),
    (19, "take over the world with an ugly site",
     "ダ:1:C#5 サ:1:C#5 い=イ:1:D5 サ:1:C#5 イ:1:A4 ト:1:A4 で=デ:2:C#5 "
     "せ=セ:1:B4 か=カ:1:A4 い=イ:1:B4 せ=セ:1:D5 い=イ:1:C#5 ふ=フ:1:B4 く=ク:2:B4"),
    (21, "slop, slop, slopify",
     "ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 "
     "ス:1:E5 ロ:1:E5 ッ:1:_ ピ:1:E5 ファ:1:D5 イ:2:C#5 _:1"),
    (23, "pile on all the brainrot",
     "ブ:1:A4 レ:1:B4 イ:1:D5 ン:1:D5 ロ:1:E5 ッ:1:_ ト:2:F#5 "
     "ぜ=ゼ:1:E5 ん=ン:1:D5 ぶ=ブ:1:B4 の=ノ:1:A4 せ=セ:1:B4 て=テ:3:D5"),
    (31, "slop, slop, slopify",
     "ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 "
     "ス:1:E5 ロ:1:E5 ッ:1:_ ピ:1:E5 ファ:1:D5 イ:2:C#5 _:1"),
    (33, "take over the world with an ugly site",
     "ダ:1:C#5 サ:1:C#5 い=イ:1:D5 サ:1:C#5 イ:1:A4 ト:1:A4 で=デ:2:C#5 "
     "せ=セ:1:B4 か=カ:1:A4 い=イ:1:B4 せ=セ:1:D5 い=イ:1:C#5 ふ=フ:1:B4 く=ク:2:B4"),
    (35, "slop, slop, slopify",
     "ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 ス:1:B4 ロ:1:D5 ッ:1:_ プ:1:D5 "
     "ス:1:E5 ロ:1:E5 ッ:1:_ ピ:1:E5 ファ:1:D5 イ:2:C#5 _:1"),
    (37, "turn the whole world into slop",
     "せ=セ:1:A4 か=カ:1:B4 い=イ:1:D5 を=オ:1:D5 ス:1:E5 ロ:1:E5 ッ:1:_ プ:1:F#5 "
     "に=ニ:1:E5 し=シ:1:D5 ちゃ=チャ:1:E5 え=エ:5:D5"),
]

# spoken shouts in the bridge: one per half bar, over the site roll call
CALLS = [
    ("win98", "きゅうはち！"), ("y2k", "ワイツーケー！"), ("crypto", "クリプト！"),
    ("brainrot", "ブレインロット！"), ("geocities", "ジオシティーズ！"), ("web2", "ウェブツー！"),
    ("linkedin", "リンクトイン！"), ("gov", "おやくしょ！"), ("flash", "フラッシュ！"),
    ("forum", "けいじばん！"), ("myspace", "マイスペース！"), ("infomercial", "テレビショッピング！"),
]
CALL_BAR = 25
OUTRO_SPOKEN = (39.5, "スロップしてくれて、ありがとう！")  # bar position, text

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8,
        "A": 9, "A#": 10, "Bb": 10, "B": 11}


def midi(name):
    return 12 * (int(name[-1]) + 1) + NOTE[name[:-1]]


def at(bar, beat=0.0):
    return (bar - 1) * BAR + beat * BEAT


def lead():
    events = []
    for li, (bar, gloss, toks) in enumerate(LINES):
        pos = 0
        for tok in toks.split():
            text, length, note = (tok.split(":") + ["_"])[:3]
            length = int(length)
            disp, _, sing = text.partition("=")
            sing = sing or disp
            t = at(bar) + pos * E8
            rest = note == "_" or disp in ("ッ", "っ", "_")
            ev = {"t": round(t, 4), "dur": round(length * E8, 4), "line": li, "disp": "" if disp == "_" else disp}
            if not rest:
                bar_of = int(t // BAR) + 1
                ev.update(sing=sing, midi=midi(note) + TRANSPOSE.get(bar_of, 0))
            events.append(ev)
            pos += length
        assert pos == 16, f"line at bar {bar} has {pos} eighths"
    return events


def build():
    return {
        "bpm": BPM, "beat": BEAT, "bar": BAR, "bars": BARS, "duration": round(BARS * BAR + TAIL, 3),
        "sections": [{"name": n, "bar": a, "t0": at(a), "t1": at(b + 1)} for n, a, b in SECTIONS],
        "chords": [{"bar": i + 1, "t": at(i + 1), "chord": c, "transpose": TRANSPOSE.get(i + 1, 0)}
                   for i, c in enumerate(CHORDS)],
        "lines": [{"bar": b, "t0": at(b), "t1": at(b + 2), "gloss": g,
                   "text": "".join(e["disp"] for e in lead() if e["line"] == i)}
                  for i, (b, g, _) in enumerate(LINES)],
        "lead": lead(),
        "calls": [{"t": at(CALL_BAR, 2 * k), "slug": s, "text": x} for k, (s, x) in enumerate(CALLS)],
        "spoken": [{"t": at(OUTRO_SPOKEN[0]), "text": OUTRO_SPOKEN[1]}],
        "cues": {"stop_intro": at(4, 2), "impact": at(5), "break": at(16, 2), "chorus": at(17),
                 "bridge": at(25), "bridge_stop": at(30, 2), "final": at(31), "outro": at(39)},
    }


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "assets", "timing.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    data = build()
    with open(out, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    for ln in data["lines"]:
        print(f"bar {ln['bar']:>2}  {ln['text']}  ({ln['gloss']})")
    print(f"{len(data['lead'])} lead events, {data['duration']} s -> {os.path.normpath(out)}")
