import pandas as pd
import numpy as np
import os

REAL_PATH = "data/real_candidates.csv"
MOCK_PATH = "data/mock_candidates.csv"
OUT_PATH  = "data/training_data.csv"
REAL_ONLY_THRESHOLD = 20

EXPECTED_COLS = [
    "eye_openness", "blink_normality", "gaze_contact",
    "posture_score", "slouch_control", "tilt_control", "posture_consistency",
    "pitch_expression", "silence_control", "speaking_pace",
    "stammer_control", "pitch_level", "archetype"
]

os.makedirs("data", exist_ok=True)
frames = []

if os.path.exists(REAL_PATH):
    real = pd.read_csv(REAL_PATH)
    frames.append(real)
    n_real = len(real)
    print(f"Real sessions loaded: {n_real}")
else:
    n_real = 0
    print("No real sessions found yet")

if n_real < REAL_ONLY_THRESHOLD:
    if os.path.exists(MOCK_PATH):
        mock = pd.read_csv(MOCK_PATH)
        # verify mock has correct columns
        missing = [c for c in EXPECTED_COLS if c not in mock.columns]
        if missing:
            print(f"ERROR: mock_candidates.csv has wrong columns.")
            print(f"  Missing: {missing}")
            print(f"  Found:   {mock.columns.tolist()}")
            print("  Fix: delete the data folder and re-run mock_data_generator.py")
            exit(1)
        frames.append(mock)
        print(f"Mock data loaded: {len(mock)} rows")
    else:
        print("No mock data — run mock_data_generator.py first")
        exit(1)

combined = pd.concat(frames, ignore_index=True)
combined.to_csv(OUT_PATH, index=False)
print(f"Training data saved: {len(combined)} rows -> {OUT_PATH}")
print(f"Columns: {combined.columns.tolist()}")
print(f"Archetype breakdown:\n{combined['archetype'].value_counts().to_string()}")
