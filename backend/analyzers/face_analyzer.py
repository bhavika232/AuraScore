"""
Face Analysis — adapted from Bhavika's face_analysis.py
Analyzes a video file frame-by-frame using MediaPipe FaceMesh.
Returns blink stats, gaze distribution, and head pose summary.
"""

import cv2
import numpy as np
import os

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False

LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]
LEFT_IRIS  = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]

MODEL_POINTS = np.array([
    (0.0,    0.0,    0.0),
    (0.0,   -330.0, -65.0),
    (-225.0, 170.0, -135.0),
    (225.0,  170.0, -135.0),
    (-150.0,-150.0, -125.0),
    (150.0, -150.0, -125.0),
], dtype=np.float64)

FACE_LANDMARKS_IDS = [1, 152, 33, 263, 61, 291]
EAR_THRESHOLD = 0.21


def _eye_aspect_ratio(landmarks, eye_indices, w, h):
    pts = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in eye_indices]
    A = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    B = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    C = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (A + B) / (2.0 * C) if C > 0 else 0.0


def _get_gaze(landmarks, iris_indices, eye_indices, w, h):
    iris_pts  = [(landmarks[i].x * w, landmarks[i].y * h) for i in iris_indices]
    eye_pts   = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_indices]
    iris_cx   = np.mean([p[0] for p in iris_pts])
    eye_left  = eye_pts[0][0]
    eye_right = eye_pts[3][0]
    ratio = (iris_cx - eye_left) / (eye_right - eye_left + 1e-6)
    if ratio < 0.42:   return "LEFT"
    elif ratio > 0.58: return "RIGHT"
    else:              return "CENTER"


def _get_head_pose(landmarks, w, h):
    image_points = np.array(
        [(landmarks[i].x * w, landmarks[i].y * h) for i in FACE_LANDMARKS_IDS],
        dtype=np.float64
    )
    focal_length = w
    cam_matrix = np.array([
        [focal_length, 0,            w / 2],
        [0,            focal_length, h / 2],
        [0,            0,            1    ]
    ], dtype=np.float64)
    dist_coeffs = np.zeros((4, 1))
    success, rot_vec, _ = cv2.solvePnP(
        MODEL_POINTS, image_points, cam_matrix, dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not success:
        return None, None, None
    rot_mat, _ = cv2.Rodrigues(rot_vec)
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rot_mat)
    pitch, yaw, roll = angles[0], angles[1], angles[2]
    if pitch > 90:   pitch -= 180
    elif pitch < -90: pitch += 180
    return pitch, yaw, roll


def analyze_face(video_path: str) -> dict:
    """
    Run face analysis on a saved video file using MediaPipe Tasks API and MoviePy.
    Returns a dict with blink, gaze, and head-pose stats.
    Falls back to neutral mock values if processing fails.
    """
    if not MP_AVAILABLE:
        return _mock_result()

    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, 'face_landmarker.task')
    if not os.path.exists(model_path):
        return _mock_result()

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=True,
        num_faces=1)

    try:
        from moviepy import VideoFileClip
        clip = VideoFileClip(video_path)
        fps = 5.0
        
        blink_count = 0
        was_closed  = False
        gaze_log    = []
        chin_log    = []
        yaw_log     = []
        pitch_values = []
        ear_values   = []
        frame_count  = 0

        with vision.FaceLandmarker.create_from_options(options) as detector:
            for frame in clip.iter_frames(fps=fps):
                frame_count += 1
                h, w = frame.shape[:2]
                
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
                result = detector.detect(mp_image)

                if not result.face_landmarks:
                    continue

                lm = result.face_landmarks[0]

                # EAR + blink
                left_ear  = _eye_aspect_ratio(lm, LEFT_EYE,  w, h)
                right_ear = _eye_aspect_ratio(lm, RIGHT_EYE, w, h)
                avg_ear   = (left_ear + right_ear) / 2.0
                ear_values.append(avg_ear)

                if avg_ear < EAR_THRESHOLD:
                    if not was_closed:
                        blink_count += 1
                        was_closed = True
                else:
                    was_closed = False

                # Gaze
                gaze = _get_gaze(lm, LEFT_IRIS, LEFT_EYE, w, h)
                gaze_log.append(gaze)

                # Head pose
                pitch, yaw, _ = _get_head_pose(lm, w, h)
                if pitch is not None:
                    chin_log.append("DOWN" if pitch > 15 else ("UP" if pitch < -15 else "LEVEL"))
                    yaw_log.append("LEFT" if yaw < -10 else ("RIGHT" if yaw > 10 else "FORWARD"))
                    pitch_values.append(pitch)
                    
        clip.close()

    except Exception as e:
        print(f"[face_analyzer] Error: {e}")
        return _mock_result()

    # ── Aggregate ──
    total_frames = max(len(gaze_log), 1)
    chin_total   = max(len(chin_log), 1)
    duration_min = max((frame_count / fps) / 60.0, 1/60.0)

    return {
        "blink_count":       blink_count,
        "blink_rate":        round(blink_count / duration_min, 1),
        "avg_ear":           round(float(np.mean(ear_values)), 3) if ear_values else 0.25,
        "gaze_pct_center":   round(gaze_log.count("CENTER") / total_frames * 100, 1),
        "gaze_pct_left":     round(gaze_log.count("LEFT")   / total_frames * 100, 1),
        "gaze_pct_right":    round(gaze_log.count("RIGHT")  / total_frames * 100, 1),
        "pct_chin_level":    round(chin_log.count("LEVEL")   / chin_total * 100, 1),
        "pct_chin_down":     round(chin_log.count("DOWN")    / chin_total * 100, 1),
        "pct_chin_up":       round(chin_log.count("UP")      / chin_total * 100, 1),
        "pct_head_forward":  round(yaw_log.count("FORWARD")  / chin_total * 100, 1),
        "pct_head_left":     round(yaw_log.count("LEFT")     / chin_total * 100, 1),
        "pct_head_right":    round(yaw_log.count("RIGHT")    / chin_total * 100, 1),
        "avg_pitch_angle":   round(float(np.mean(pitch_values)), 1) if pitch_values else 0.0,
    }


def _mock_result():
    return {
        "blink_count":      0,
        "blink_rate":       0.0,
        "avg_ear":          0.0,
        "gaze_pct_center":  0.0,
        "gaze_pct_left":    0.0,
        "gaze_pct_right":   0.0,
        "pct_chin_level":   0.0,
        "pct_chin_down":    0.0,
        "pct_chin_up":      0.0,
        "pct_head_forward": 0.0,
        "pct_head_left":    0.0,
        "pct_head_right":   0.0,
        "avg_pitch_angle":  0.0,
    }
