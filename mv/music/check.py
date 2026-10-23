"""Self-check by analysis (nobody gets to listen): loudness, cue alignment, stops, vocal pitch,
plus the per-frame envelopes for the picture and an overview PNG.

    /tmp/slopmv/.venv/bin/python check.py      # re-check an existing render
"""

import json
import os
import re
import subprocess
import sys
import warnings

warnings.filterwarnings("ignore", message="pkg_resources")
import numpy as np  # noqa: E402
import pyworld as pw  # noqa: E402
import soundfile as sf  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SR = 48000
ENV_STEMS = ("kick", "snare", "vocal")


def load(path):
    x, sr = sf.read(path, dtype="float64", always_2d=True)
    assert sr == SR
    return x.T


def ffmpeg_loudness(wav):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    summ = r[r.rfind("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
    lra = float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", summ).group(1))
    r2 = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav, "-af",
                         "loudnorm=I=-12:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    ln = json.loads(r2[r2.rfind("{"):r2.rfind("}") + 1])
    return {"ebur128_I_LUFS": i, "ebur128_LRA_LU": lra, "ebur128_truepeak_dBTP": tp,
            "loudnorm_input_i": float(ln["input_i"]), "loudnorm_input_tp": float(ln["input_tp"])}


def peak_db(x, t0, t1):
    seg = x[..., int(t0 * SR):int(t1 * SR)]
    return float(20 * np.log10(np.abs(seg).max() + 1e-12))


def rms_db(x, t0, t1):
    seg = x[..., int(t0 * SR):int(t1 * SR)]
    return float(10 * np.log10((seg ** 2).mean() + 1e-24))


def onset_near(x, t, pre=0.06, post=0.2, rel=0.1):
    """Onset of the event expected at t: after the quietest point in [t - pre, t + 2 ms], the first
    1 ms frame that reaches `rel` (default -20 dB) of the event's peak (peak taken over [t, t + post])."""
    m = np.abs(x).max(0) if x.ndim > 1 else np.abs(x)
    h = 48
    a = max(int((t - pre) * SR), 0)
    b = int((t + post) * SR)
    seg = m[a:b]
    e = seg[: len(seg) // h * h].reshape(-1, h).max(1)
    k0 = int(round((t * SR - a) / h))
    lo = int(np.argmin(e[: k0 + 2]))
    thr = rel * e[k0:].max()
    k = lo + int(np.argmax(e[lo:] >= thr))
    return (a + k * h) / SR - t


def kick_grid(kick, tr_kicks):
    """Detect kick onsets independently (energy jumps) and measure their offset to the 16th grid."""
    m = np.abs(kick).max(0)
    h = 48
    e = m[: len(m) // h * h].reshape(-1, h).max(1)
    le = 20 * np.log10(e + 1e-9)
    rise = np.r_[0, le[1:] - le[:-1]]
    cand = np.where((rise > 9) & (le > -45))[0]
    on = []
    for c in cand:
        if not on or c - on[-1] > 60:
            on.append(c)
    on = np.array(on) * h / SR
    grid = 0.1
    dev = (on - np.round(on / grid) * grid) * 1000
    return {"detected": int(len(on)), "scheduled": len(tr_kicks), "median_abs_ms": float(np.median(np.abs(dev))),
            "max_abs_ms": float(np.max(np.abs(dev)))}


def pitch_error(dry, lead):
    f0, t = pw.harvest(dry, SR, f0_floor=150, f0_ceil=1100, frame_period=5)
    per_note, frames, bad = [], [], []
    for e in lead:
        if "midi" not in e:
            continue
        target = 440 * 2 ** ((e["midi"] - 69) / 12)
        sel = (t >= e["t"] + 0.04) & (t < e["t"] + e["dur"] - 0.075) & (f0 > 0)
        if e["dur"] >= 0.6:  # vibrato notes: measure before the vibrato starts, and the mean over the rest
            sel &= t < e["t"] + 0.24
        if sel.sum() < 2:
            continue
        c = 1200 * np.log2(f0[sel] / target)
        frames.extend(c.tolist())
        med = float(np.median(c))
        per_note.append(med)
        if abs(med) > 50:
            bad.append({"t": e["t"], "sing": e["sing"], "cents": round(med, 1)})
    per_note = np.array(per_note)
    return {"notes_measured": int(len(per_note)), "notes_total": sum(1 for e in lead if "midi" in e),
            "median_abs_cents_per_note": float(np.median(np.abs(per_note))),
            "mean_abs_cents_per_note": float(np.mean(np.abs(per_note))),
            "median_abs_cents_per_frame": float(np.median(np.abs(frames))),
            "notes_over_50c": bad}, (f0, t)


def envelopes(signals, duration, fps=30):
    n = int(round(duration * fps))
    hop = SR // fps
    out = {"fps": fps, "frames": n, "duration": duration,
           "note": "per-frame RMS, normalised so each track's loudest frame is 1.0"}
    for name, x in signals.items():
        m = x.mean(0) if x.ndim > 1 else x
        m = np.pad(m, (0, max(0, n * hop - len(m))))[: n * hop]
        r = np.sqrt((m.reshape(n, hop) ** 2).mean(1))
        out[name] = np.round(r / (r.max() + 1e-12), 3).tolist()
    return out


def overview_png(path, mix, stems, data, f0t):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy import signal

    dur = data["duration"]
    fig, ax = plt.subplots(4, 1, figsize=(22, 13), sharex=True,
                           gridspec_kw={"height_ratios": [1.2, 2.4, 2.0, 1.6]})
    mono = mix.mean(0)
    hop = 480
    env = np.sqrt((mono[: len(mono) // hop * hop].reshape(-1, hop) ** 2).mean(1))
    ax[0].plot(np.arange(len(env)) * hop / SR, 20 * np.log10(env + 1e-9), lw=0.6)
    ax[0].set_ylim(-70, 0)
    ax[0].set_ylabel("mix RMS dB")
    f, tt, Sx = signal.spectrogram(mono, SR, nperseg=2048, noverlap=1536)
    ax[1].pcolormesh(tt, f, 10 * np.log10(Sx + 1e-14), shading="auto", cmap="magma", vmin=-120, vmax=-30)
    ax[1].set_yscale("symlog", linthresh=200)
    ax[1].set_ylim(30, 20000)
    ax[1].set_ylabel("Hz")
    names = list(stems)
    rows = []
    for k in names:
        m = stems[k].mean(0)
        e = np.sqrt((m[: len(m) // hop * hop].reshape(-1, hop) ** 2).mean(1))
        rows.append(np.clip(20 * np.log10(e + 1e-9), -60, 0))
    ax[2].imshow(np.array(rows), aspect="auto", extent=[0, dur, len(names), 0], cmap="viridis", vmin=-60, vmax=-6)
    ax[2].set_yticks(np.arange(len(names)) + 0.5)
    ax[2].set_yticklabels(names)
    f0, t = f0t
    with np.errstate(divide="ignore"):
        ax[3].plot(t, np.where(f0 > 0, 69 + 12 * np.log2(f0 / 440), np.nan), ".", ms=1.2, label="rendered vocal f0")
    for e in data["lead"]:
        if "midi" in e:
            ax[3].plot([e["t"], e["t"] + e["dur"]], [e["midi"]] * 2, "r-", lw=1.4, alpha=0.6)
    ax[3].set_ylim(58, 82)
    ax[3].set_ylabel("midi (red=score)")
    for a in ax:
        for s in data["sections"]:
            a.axvline(s["t0"], color="w" if a in (ax[1], ax[2]) else "k", lw=0.8, alpha=0.6)
        for c in (5.6, 24.8, 47.2):
            a.axvline(c, color="c", lw=0.8, ls="--")
    for s in data["sections"]:
        ax[0].text(s["t0"] + 0.1, -5, s["name"], fontsize=9)
    ax[3].set_xlabel("seconds")
    ax[3].set_xlim(0, dur)
    fig.tight_layout()
    fig.savefig(path, dpi=80)
    plt.close(fig)

    # zooms on the three stops and the drop
    fig, ax = plt.subplots(1, 4, figsize=(22, 4))
    for a, (t0, t1, title, span) in zip(ax, [(4.8, 7.2, "intro freeze", (5.6, 6.4)), (24.0, 26.4, "break", (24.8, 25.6)),
                                              (46.4, 48.8, "bridge stop", (47.2, 48.0)), (59.8, 66.4, "outro", (64.4, 66.4))]):
        i0, i1 = int(t0 * SR), int(t1 * SR)
        tt = np.arange(i0, i1) / SR
        for k, col in (("kick", "C0"), ("snare", "C1"), ("hats", "C2"), ("fx", "C4"), ("vocal", "C3"),
                       ("shouts", "C5")):
            a.plot(tt[::24], np.abs(stems[k].mean(0)[i0:i1:24]), lw=0.6, color=col, label=k)
        a.set_title(f"{title} {span[0]}-{span[1]} s")
        a.axvspan(*span, color="c", alpha=0.15)
    ax[0].legend(fontsize=7)
    fig.tight_layout()
    fig.savefig(path.replace(".png", "-zoom.png"), dpi=80)
    plt.close(fig)


def run(data, tr, out, assets):
    wav = os.path.join(out, "slopify-mv.wav")
    mix = load(wav)
    stems = {os.path.basename(p)[:-4]: load(os.path.join(out, "stems", p))
             for p in sorted(os.listdir(os.path.join(out, "stems"))) if p.endswith(".wav") and p != "vocal_dry.wav"}
    dry = load(os.path.join(out, "stems", "vocal_dry.wav"))[0]
    info = sf.info(wav)
    rep = {"file": {"samplerate": info.samplerate, "channels": info.channels, "subtype": info.subtype,
                    "duration_s": info.frames / info.samplerate,
                    "sample_peak_dBFS": float(20 * np.log10(np.abs(mix).max())),
                    "clipped_samples": int((np.abs(mix) >= 0.9999).sum())}}
    rep["loudness"] = ffmpeg_loudness(wav)
    import pyloudnorm
    meter = pyloudnorm.Meter(SR)
    lu = lambda x, t0, t1: round(float(meter.integrated_loudness(x[:, int(t0 * SR):int(t1 * SR)].T)), 1)  # noqa: E731
    rep["section_LUFS"] = {s["name"]: lu(mix, s["t0"], min(s["t1"], data["duration"])) for s in data["sections"]}
    rep["vocal_stem_LUFS_in_sections"] = {s["name"]: lu(stems["vocal"], s["t0"], s["t1"])
                                          for s in data["sections"] if s["name"] in ("verse", "chorus", "final")}

    instr = ["kick", "snare", "hats", "bass", "chords", "keys"]
    drums = ["kick", "snare", "hats"]
    rep["stops"] = {
        "intro_5.6-6.4_instrument_peak_dBFS": max(peak_db(stems[k], 5.605, 6.395) for k in instr),
        "intro_5.6-6.4_mix_rms_dBFS": rms_db(mix, 5.6, 6.4),
        "intro_5.95-6.05_mix_peak_dBFS": peak_db(mix, 5.95, 6.05),
        "intro_4.0-5.6_mix_rms_dBFS(ref)": rms_db(mix, 4.0, 5.6),
        "break_24.8-25.6_drums_peak_dBFS": max(peak_db(stems[k], 24.805, 25.595) for k in drums),
        "break_24.8-25.6_instrument_peak_dBFS": max(peak_db(stems[k], 24.805, 25.595) for k in instr),
        "break_vocal_rms_dBFS(さ)": rms_db(stems["vocal"], 25.2, 25.6),
        "bridge_stop_47.2-47.6_instrument_peak_dBFS": max(peak_db(stems[k], 47.205, 47.595) for k in instr),
    }
    cues = {"impact_6.4": (6.4, "fx"), "chorus_drop_25.6_kick": (25.6, "kick"), "final_48.0_kick": (48.0, "kick"),
            "outro_60.8_kick": (60.8, "kick"), "verse_6.4_kick": (6.4, "kick")}
    for b in (5, 17, 21, 31, 35, 39):
        cues[f"crash_bar{b}"] = ((b - 1) * 1.6, "hats")
    for k, c in enumerate(data["calls"]):
        cues[f"call{k + 1}_{c['slug']}_shout"] = (c["t"], "shouts")
        cues[f"call{k + 1}_{c['slug']}_accent"] = (c["t"], "fx")
    cues["mouse_click_0.0"] = (0.0, "fx")
    cues["ding_5.6"] = (5.6, "fx")
    cues["outro_spoken_61.6"] = (61.6, "shouts")
    rep["cue_offsets_ms"] = {}
    for name, (t, stem) in cues.items():
        rel = 0.1 if stem == "shouts" else 0.4  # percussive hits: -8 dB so the previous hit's tail is ignored
        rep["cue_offsets_ms"][name] = round(onset_near(stems[stem], t, rel=rel) * 1000, 1)
    rep["kick_grid"] = kick_grid(stems["kick"], tr.kicks if tr else [])
    rep["pitch"], f0t = pitch_error(dry, data["lead"])

    env = envelopes({"kick": stems["kick"], "snare": stems["snare"], "vocal": stems["vocal"], "mix": mix},
                    data["duration"])
    with open(os.path.join(assets, "envelopes.json"), "w") as f:
        json.dump(env, f, separators=(",", ":"))
    overview_png(os.path.join(out, "overview.png"), mix, stems, data, f0t)
    with open(os.path.join(out, "check.json"), "w") as f:
        json.dump(rep, f, ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False, indent=1))
    return rep


if __name__ == "__main__":
    import score
    run(score.build(), None, os.path.join(HERE, "out"), os.path.join(HERE, "..", "web", "assets"))
