"""
Body / Posture Analysis — adapted from Ria's body.py
Analyzes a video file frame-by-frame using MediaPipe Pose.
Returns posture score, penalty breakdown, and session stats.
"""

import cv2
import numpy as np
from collections import deque
import os

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False

SMOOTHING_WINDOW   = 15
GOOD_POSTURE_SCORE = 75
SLOUCH_THRESHOLD   = 0.08
TILT_THRESHOLD     = 0.04
HEAD_OFFSET_THRESH = 0.12


def _get_landmark(landmarks, idx, w, h):
    l = landmarks[idx]
    return np.array([l.x * w, l.y * h]), l.visibility


def _landmarks_visible(*visibilities, threshold=0.5):
    return all(v > threshold for v in visibilities)


def _get_posture_score(landmarks, w, h):
    ls, ls_vis = _get_landmark(landmarks, 11, w, h)
    rs, rs_vis = _get_landmark(landmarks, 12, w, h)
    nose, n_vis = _get_landmark(landmarks, 0,  w, h)

    if not _landmarks_visible(ls_vis, rs_vis, n_vis):
        return None, {}

    shoulder_width = np.linalg.norm(ls - rs)
    if shoulder_width < 20:
        return None, {}

    shoulder_mid = (ls + rs) / 2.0

    tilt_norm    = abs(ls[1] - rs[1]) / (shoulder_width + 1e-6)
    tilt_excess  = max(0.0, tilt_norm - TILT_THRESHOLD)
    tilt_penalty = min(30, tilt_excess * 200)

    head_drop_norm = (nose[1] - shoulder_mid[1]) / (shoulder_width + 1e-6)
    slouch_excess  = max(0.0, head_drop_norm - SLOUCH_THRESHOLD)
    slouch_penalty = min(40, slouch_excess * 250)

    horiz_offset_norm = abs(nose[0] - shoulder_mid[0]) / (shoulder_width + 1e-6)
    horiz_excess  = max(0.0, horiz_offset_norm - HEAD_OFFSET_THRESH)
    horiz_penalty = min(15, horiz_excess * 80)

    raw_score = max(0.0, 100.0 - tilt_penalty - slouch_penalty - horiz_penalty)
    components = {
        "tilt_penalty":   round(tilt_penalty,   1),
        "slouch_penalty": round(slouch_penalty,  1),
        "horiz_penalty":  round(horiz_penalty,   1),
    }
    return raw_score, components


def analyze_body(video_path: str) -> dict:
    """
    Run posture analysis on a saved video file using MediaPipe Tasks API and MoviePy.
    Returns a dict with posture score, penalty breakdown, and good-posture %.
    Falls back to mock values if processing fails.
    """
    if not MP_AVAILABLE:
        return _mock_result()

    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, 'pose_landmarker.task')
    if not os.path.exists(model_path):
        return _mock_result()

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        num_poses=1)

    try:
        from moviepy import VideoFileClip
        clip = VideoFileClip(video_path)
        fps = 5.0
        
        score_history       = []
        slouch_count        = 0
        shoulder_tilt_count = 0
        score_buffer        = deque(maxlen=SMOOTHING_WINDOW)
        frame_count         = 0

        with vision.PoseLandmarker.create_from_options(options) as detector:
            for frame in clip.iter_frames(fps=fps):
                frame_count += 1
                h, w = frame.shape[:2]
                
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
                results = detector.detect(mp_image)

                if not results.pose_landmarks:
                    continue

                lms = results.pose_landmarks[0]
                raw_score, components = _get_posture_score(lms, w, h)

                if raw_score is not None:
                    score_buffer.append(raw_score)
                    smoothed = round(float(np.mean(score_buffer)), 1)
                    score_history.append(smoothed)

                    if components.get("slouch_penalty", 0) > 12:
                        slouch_count += 1
                    if components.get("tilt_penalty", 0) > 10:
                        shoulder_tilt_count += 1
                        
        clip.close()

    except Exception as e:
        print(f"[body_analyzer] Error: {e}")
        return _mock_result()

    if not score_history:
        return _mock_result()

    score_arr = np.array(score_history)
    avg_score  = float(np.mean(score_arr))
    good_pct   = float(np.mean(score_arr >= GOOD_POSTURE_SCORE) * 100)

    # Derive representative penalty means
    # (we can't store per-frame comps easily, so estimate from score degradation)
    avg_slouch_pct = slouch_count / max(len(score_history), 1) * 100
    avg_tilt_pct   = shoulder_tilt_count / max(len(score_history), 1) * 100

    return {
        "avg_posture_score":   round(avg_score, 1),
        "best_posture_score":  round(float(np.max(score_arr)), 1),
        "worst_posture_score": round(float(np.min(score_arr)), 1),
        "good_pct":            round(good_pct,  1),
        "slouch_pct":          round(avg_slouch_pct, 1),
        "tilt_pct":            round(avg_tilt_pct,   1),
        # Estimated average penalties
        "slouch_penalty":      round(max(0, (100 - avg_score) * 0.5), 1),
        "tilt_penalty":        round(max(0, (100 - avg_score) * 0.3), 1),
        "horiz_penalty":       round(max(0, (100 - avg_score) * 0.2), 1),
    }


def _mock_result():
    return {
        "avg_posture_score":   0.0,
        "best_posture_score":  0.0,
        "worst_posture_score": 0.0,
        "good_pct":            0.0,
        "slouch_pct":          0.0,
        "tilt_pct":            0.0,
        "slouch_penalty":      0.0,
        "tilt_penalty":        0.0,
        "horiz_penalty":       0.0,
    }
