import pandas as pd
import numpy as np
import json, os

FEATURES = [
    "eye_openness", "blink_normality", "gaze_contact",
    "posture_score", "slouch_control", "tilt_control", "posture_consistency",
    "pitch_expression", "silence_control", "speaking_pace",
    "stammer_control", "pitch_level",
]

path = "data/training_data.csv"
if not os.path.exists(path):
    print("ERROR: data/training_data.csv not found. Run build_training_data.py first.")
    exit(1)

df = pd.read_csv(path)

missing = [f for f in FEATURES if f not in df.columns]
if missing:
    print(f"ERROR: Missing columns: {missing}")
    print(f"Found: {df.columns.tolist()}")
    print("Fix: delete the data folder, then re-run mock_data_generator.py and build_training_data.py")
    exit(1)

label_map = {"confident": 1, "nervous": 0, "dishonest": -1}
df["label"] = df["archetype"].map(label_map)

correlations = {}
for feat in FEATURES:
    corr = abs(df[feat].corr(df["label"]))
    correlations[feat] = corr if not np.isnan(corr) else 0.0

total = sum(correlations.values())
weights = {k: round(v / total, 4) for k, v in correlations.items()}

print("Tuned weights (sum = 1.0):")
for feat, w in sorted(weights.items(), key=lambda x: -x[1]):
    bar = "=" * int(w * 80)
    print(f"  {feat:<24} {w:.4f}  {bar}")

os.makedirs("data", exist_ok=True)
with open("data/tuned_weights.json", "w") as f:
    json.dump(weights, f, indent=2)
print("\nSaved to data/tuned_weights.json")
