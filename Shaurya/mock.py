import numpy as np
import pandas as pd
import os

np.random.seed(42)
N = 100

def r(mean, std, lo=0.0, hi=1.0):
    return float(np.clip(np.random.normal(mean, std), lo, hi))

def gaze_sample(p_center):
    return np.random.choice(["CENTER", "LEFT", "RIGHT"],
                             p=[p_center, (1-p_center)/2, (1-p_center)/2])

types = np.random.choice(["confident", "nervous", "dishonest"],
                          size=N, p=[0.4, 0.4, 0.2])

raw_rows = []
for t in types:
    if t == "confident":
        row = {
            "avg_ear":          r(0.29, 0.03, 0.15, 0.40),
            "blink_count":      int(np.clip(np.random.normal(9,  2),  0, 25)),
            "gaze":             gaze_sample(0.80),
            "posture_score":    r(84,  8,  0, 100),
            "slouch_penalty":   r(4,   3,  0, 40),
            "tilt_penalty":     r(3,   2,  0, 30),
            "good_pct":         r(82,  10, 0, 100),
            "avg_pitch":        r(160, 20, 85, 300),
            "pitch_variance":   r(22000, 4000, 0, 50000),
            "silence_duration": r(4,   1.5, 0, 30),
            "pace":             r(145, 15,  60, 220),
            "stammer_count":    int(np.clip(np.random.normal(1, 1), 0, 20)),
            "archetype":        "confident"
        }
    elif t == "nervous":
        row = {
            "avg_ear":          r(0.22, 0.03, 0.15, 0.40),
            "blink_count":      int(np.clip(np.random.normal(18, 4),  0, 35)),
            "gaze":             gaze_sample(0.40),
            "posture_score":    r(52,  12, 0, 100),
            "slouch_penalty":   r(20,  6,  0, 40),
            "tilt_penalty":     r(14,  5,  0, 30),
            "good_pct":         r(35,  15, 0, 100),
            "avg_pitch":        r(190, 25, 85, 300),
            "pitch_variance":   r(8000, 3000, 0, 50000),
            "silence_duration": r(12,  3,   0, 30),
            "pace":             r(95,  20,  60, 220),
            "stammer_count":    int(np.clip(np.random.normal(7, 3), 0, 20)),
            "archetype":        "nervous"
        }
    else:
        row = {
            "avg_ear":          r(0.24, 0.04, 0.15, 0.40),
            "blink_count":      int(np.clip(np.random.normal(22, 5),  0, 40)),
            "gaze":             gaze_sample(0.25),
            "posture_score":    r(45,  14, 0, 100),
            "slouch_penalty":   r(25,  7,  0, 40),
            "tilt_penalty":     r(18,  6,  0, 30),
            "good_pct":         r(25,  12, 0, 100),
            "avg_pitch":        r(175, 20, 85, 300),
            "pitch_variance":   r(5000, 2000, 0, 50000),
            "silence_duration": r(14,  3,   0, 30),
            "pace":             r(80,  15,  60, 220),
            "stammer_count":    int(np.clip(np.random.normal(8, 3), 0, 20)),
            "archetype":        "dishonest"
        }
    raw_rows.append(row)

def ne(e):   return float(np.clip((e - 0.15) / 0.20, 0, 1))
def nb(b):
    rate = b / 0.5
    return float(np.exp(-0.5 * ((rate - 17) / 8) ** 2))
def ng(g):   return 1.0 if g == "CENTER" else 0.3
def nps(s):  return float(np.clip(s / 100.0, 0, 1))
def nsl(p):  return float(np.clip(1 - p / 40.0, 0, 1))
def ntl(p):  return float(np.clip(1 - p / 30.0, 0, 1))
def ngp(g):  return float(np.clip(g / 100.0, 0, 1))
def npv(pv): return float(np.clip(pv / 30000.0, 0, 1))
def nsi(s):  return float(np.clip(1.0 - (s / 30) / 0.5, 0, 1))
def npa(p):  return float(np.exp(-0.5 * ((p - 140) / 40) ** 2))
def nst(s):  return float(np.clip(1 - s / 10.0, 0, 1))
def nap(p):  return float(np.clip((p - 85) / 170, 0, 1))

normalised = []
for row in raw_rows:
    normalised.append({
        "eye_openness":        ne(row["avg_ear"]),
        "blink_normality":     nb(row["blink_count"]),
        "gaze_contact":        ng(row["gaze"]),
        "posture_score":       nps(row["posture_score"]),
        "slouch_control":      nsl(row["slouch_penalty"]),
        "tilt_control":        ntl(row["tilt_penalty"]),
        "posture_consistency": ngp(row["good_pct"]),
        "pitch_expression":    npv(row["pitch_variance"]),
        "silence_control":     nsi(row["silence_duration"]),
        "speaking_pace":       npa(row["pace"]),
        "stammer_control":     nst(row["stammer_count"]),
        "pitch_level":         nap(row["avg_pitch"]),
        "archetype":           row["archetype"]
    })

df = pd.DataFrame(normalised)
os.makedirs("data", exist_ok=True)
df.to_csv("data/mock_candidates.csv", index=False)
print(f"Saved {N} rows to data/mock_candidates.csv")
print(f"Columns: {df.columns.tolist()}")
print(df.groupby("archetype").mean(numeric_only=True).round(2).to_string())
