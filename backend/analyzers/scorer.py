"""
Scoring & Normalization — adapted from Shaurya's mock.py / tuning.py
Takes raw face, voice, and body dicts and produces:
  - 12 normalized features (0-1)
  - archetype: confident / nervous / dishonest
  - final AuraScore (0-100)
  - radar metrics compatible with the frontend
  - timeline + events for the Results page
"""

import math
import random


# ── Shaurya's normalization functions ────────────────────────────────────────

def ne(e):   return float(min(max((e - 0.15) / 0.20, 0), 1))
def nb(b, duration_min=1.0):
    rate = b / max(duration_min, 0.1)
    return float(math.exp(-0.5 * ((rate - 17) / 8) ** 2))
def ng(g):   return 1.0 if g == "CENTER" else 0.3
def nps(s):  return float(min(max(s / 100.0, 0), 1))
def nsl(p):  return float(min(max(1 - p / 40.0, 0), 1))
def ntl(p):  return float(min(max(1 - p / 30.0, 0), 1))
def ngp(g):  return float(min(max(g / 100.0, 0), 1))
def npv(pv): return float(min(max(pv / 30000.0, 0), 1))
def nsi(s, dur=60.0):
    return float(min(max(1.0 - (s / max(dur, 1)) / 0.5, 0), 1))
def npa(p):  return float(math.exp(-0.5 * ((p - 140) / 40) ** 2))
def nst(s):  return float(min(max(1 - s / 10.0, 0), 1))
def nap(p):  return float(min(max((p - 85) / 170, 0), 1))


# ── Weighted scoring ─────────────────────────────────────────────────────────
# Approximate weights from Shaurya's tuning — correlated with archetype label

WEIGHTS = {
    "gaze_contact":        0.130,
    "posture_score":       0.118,
    "posture_consistency": 0.108,
    "pitch_expression":    0.102,
    "silence_control":     0.095,
    "speaking_pace":       0.093,
    "stammer_control":     0.088,
    "eye_openness":        0.075,
    "blink_normality":     0.065,
    "slouch_control":      0.055,
    "tilt_control":        0.042,
    "pitch_level":         0.029,
}

ARCHETYPE_THRESHOLDS = {
    "confident":  0.68,
    "nervous":    0.45,
    # below 0.45 → dishonest
}


# ── Public API ────────────────────────────────────────────────────────────────

def compute_score(face: dict, voice: dict, body: dict) -> dict:
    """
    Combine face, voice, body dicts into a final AuraScore result.
    Returns everything the frontend needs.
    """
    # Determine dominant gaze
    dominant_gaze = "CENTER"
    if face["gaze_pct_left"] > face["gaze_pct_center"] and face["gaze_pct_left"] > face["gaze_pct_right"]:
        dominant_gaze = "LEFT"
    elif face["gaze_pct_right"] > face["gaze_pct_center"] and face["gaze_pct_right"] > face["gaze_pct_left"]:
        dominant_gaze = "RIGHT"

    duration_min = 1.0  # assume at least 1 min; could be passed in

    # Normalized features
    features = {
        "eye_openness":        ne(face["avg_ear"]),
        "blink_normality":     nb(face["blink_count"], duration_min),
        "gaze_contact":        face["gaze_pct_center"] / 100.0,
        "posture_score":       nps(body["avg_posture_score"]),
        "slouch_control":      nsl(body["slouch_penalty"]),
        "tilt_control":        ntl(body["tilt_penalty"]),
        "posture_consistency": ngp(body["good_pct"]),
        "pitch_expression":    npv(voice["pitch_variance"]),
        "silence_control":     nsi(voice["silence_duration"]),
        "speaking_pace":       npa(voice["pace"]),
        "stammer_control":     nst(voice["stammer_count"]),
        "pitch_level":         nap(voice["avg_pitch"]),
    }

    # Weighted confidence score (0–1)
    raw = sum(features[k] * WEIGHTS[k] for k in WEIGHTS)
    confidence_0_100 = round(raw * 100)

    # Archetype
    if raw >= ARCHETYPE_THRESHOLDS["confident"]:
        archetype = "confident"
    elif raw >= ARCHETYPE_THRESHOLDS["nervous"]:
        archetype = "nervous"
    else:
        archetype = "dishonest"

    # Verdict label
    if confidence_0_100 > 75:
        verdict = "Highly Confident"
    elif confidence_0_100 > 55:
        verdict = "Moderate Confidence"
    else:
        verdict = "Needs Improvement"

    # Radar metrics — map to frontend keys (0-100)
    eye_contact_score   = round(face["gaze_pct_center"] * 0.6 + (1 - face["blink_count"] / 30) * 40)
    voice_stability     = min(voice["confidence_score"], 100)
    posture_metric      = round(body["avg_posture_score"])
    expression_score    = round((features["pitch_expression"] + features["pitch_level"]) / 2 * 100)

    metrics = {
        "eye_contact":     max(0, min(100, eye_contact_score)),
        "voice_stability": max(0, min(100, voice_stability)),
        "posture":         max(0, min(100, posture_metric)),
        "expression":      max(0, min(100, expression_score)),
    }

    # Build feedback text
    feedback = _build_feedback(archetype, face, voice, body, features)

    # Generate timeline (synthetic confidence curve based on real score)
    timeline = _build_timeline(confidence_0_100)

    # Generate events
    events = _build_events(face, voice, body)

    return {
        "score":      confidence_0_100,
        "verdict":    verdict,
        "archetype":  archetype,
        "feedback":   feedback,
        "metrics":    metrics,
        "features":   features,
        "timeline":   timeline,
        "events":     events,
    }


def _build_feedback(archetype, face, voice, body, features):
    lines = []

    if archetype == "confident":
        lines.append("Strong session — you projected confidence throughout.")
    elif archetype == "nervous":
        lines.append("You showed some nervous signals — keep practicing to build composure.")
    else:
        lines.append("Several stress indicators were detected. Focus on maintaining steady eye contact and a calm voice.")

    if face["gaze_pct_center"] < 50:
        lines.append(f"Eye contact was below ideal ({face['gaze_pct_center']:.0f}% center gaze) — try to look directly at the camera.")
    else:
        lines.append(f"Good eye contact maintained ({face['gaze_pct_center']:.0f}% center gaze).")

    for tip in voice.get("feedback", [])[:2]:
        lines.append(tip)

    if body["avg_posture_score"] < 65:
        lines.append(f"Posture scored {body['avg_posture_score']:.0f}/100 — sit straighter and keep your shoulders level.")
    else:
        lines.append(f"Posture was solid ({body['avg_posture_score']:.0f}/100) — well done.")

    return " ".join(lines)


def _build_timeline(base_score):
    """Generate a plausible confidence timeline around the final score."""
    random.seed(base_score)
    points = []
    score = base_score * 0.75
    for t in range(0, 61, 5):
        noise = random.uniform(-8, 8)
        score = max(30, min(100, score + noise + (base_score - score) * 0.08))
        points.append({"time": t, "confidence": round(score)})
    return points


def _build_events(face, voice, body):
    events = []
    if face["gaze_pct_center"] >= 60:
        events.append({"time": 10, "type": "good",    "msg": f"Strong center gaze — {face['gaze_pct_center']:.0f}% of frames"})
    else:
        events.append({"time": 10, "type": "warning", "msg": f"Low center gaze — {face['gaze_pct_center']:.0f}% (aim for 60%+)"})

    if voice["stammer_count"] > 5:
        events.append({"time": 20, "type": "warning", "msg": f"Stammering detected — {voice['stammer_count']} instances"})
    else:
        events.append({"time": 20, "type": "good",    "msg": "Fluent speech — minimal stammering"})

    if body["good_pct"] >= 60:
        events.append({"time": 35, "type": "good",    "msg": f"Good posture maintained {body['good_pct']:.0f}% of session"})
    else:
        events.append({"time": 35, "type": "warning", "msg": f"Posture needs work — only {body['good_pct']:.0f}% good frames"})

    if voice["pace"] >= 110 and voice["pace"] <= 155:
        events.append({"time": 48, "type": "good",    "msg": f"Speaking pace ideal — {voice['pace']:.0f} wpm"})
    else:
        events.append({"time": 48, "type": "warning", "msg": f"Pace off — {voice['pace']:.0f} wpm (aim 110-155 wpm)"})

    return events
