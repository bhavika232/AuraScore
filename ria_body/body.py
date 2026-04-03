import cv2
import mediapipe as mp
import numpy as np
from collections import deque

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose    = mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6)

SMOOTHING_WINDOW   = 15
GOOD_POSTURE_SCORE = 75
SLOUCH_THRESHOLD   = 0.08
TILT_THRESHOLD     = 0.04
HEAD_OFFSET_THRESH = 0.12

score_history       = []
slouch_count        = 0
shoulder_tilt_count = 0
total_scored_frames = 0
score_buffer        = deque(maxlen=SMOOTHING_WINDOW)

def draw_custom_skeleton(frame, landmarks, w, h, posture_score):
    t = max(0, min(1, (posture_score - 40) / 60))
    good_color = (int(20 + (1-t)*200), int(200*t), int(20 + (1-t)*200))

    def px(idx):
        lm = landmarks[idx]
        return int(lm.x * w), int(lm.y * h)

    def vis(idx, thresh=0.45):
        return landmarks[idx].visibility > thresh

    #  SHOULDERS + ARMS      
    shoulder_color = (100, 220, 255)   
    arm_l_color    = (80,  255, 140)    
    arm_r_color    = (80,  180, 255)    
    neck_color     = (180, 180, 255)   

    conn_colors = {
        (11, 12): shoulder_color,
        (11, 13): arm_l_color, (13, 15): arm_l_color,
        (12, 14): arm_r_color, (14, 16): arm_r_color,
    }

    for (a, b), color in conn_colors.items():
        if not (vis(a) and vis(b)):
            continue
        pa, pb = px(a), px(b)
        overlay = frame.copy()
        cv2.line(overlay, pa, pb, good_color, 10)
        cv2.addWeighted(overlay, 0.18, frame, 0.82, 0, frame)
        # Main line
        cv2.line(frame, pa, pb, color, 2, cv2.LINE_AA)

    # Neck line
    if vis(0) and vis(11) and vis(12):
        nose_pt = px(0)
        ls_pt   = px(11)
        rs_pt   = px(12)
        mid     = ((ls_pt[0]+rs_pt[0])//2, (ls_pt[1]+rs_pt[1])//2)
        overlay = frame.copy()
        cv2.line(overlay, nose_pt, mid, good_color, 8)
        cv2.addWeighted(overlay, 0.18, frame, 0.82, 0, frame)
        cv2.line(frame, nose_pt, mid, neck_color, 2, cv2.LINE_AA)
        cv2.circle(frame, mid, 4, neck_color, -1, cv2.LINE_AA)

    # Joints 
    joint_map = {
        11: shoulder_color, 12: shoulder_color,
        13: arm_l_color,    15: arm_l_color,
        14: arm_r_color,    16: arm_r_color,
    }
    for idx, color in joint_map.items():
        if not vis(idx):
            continue
        p = px(idx)
        overlay = frame.copy()
        cv2.circle(overlay, p, 10, good_color, -1)
        cv2.addWeighted(overlay, 0.18, frame, 0.82, 0, frame)
        cv2.circle(frame, p, 6, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.circle(frame, p, 5, color,           -1, cv2.LINE_AA)
        cv2.circle(frame, p, 2, (255, 255, 255), -1, cv2.LINE_AA)

def get_landmark(landmarks, idx, w, h):
    l = landmarks[idx]
    return np.array([l.x * w, l.y * h]), l.visibility

def landmarks_visible(*visibilities, threshold=0.5):
    return all(v > threshold for v in visibilities)

def get_posture_score(landmarks, w, h):
    ls,  ls_vis = get_landmark(landmarks, mp_pose.PoseLandmark.LEFT_SHOULDER,  w, h)
    rs,  rs_vis = get_landmark(landmarks, mp_pose.PoseLandmark.RIGHT_SHOULDER, w, h)
    nose, n_vis = get_landmark(landmarks, mp_pose.PoseLandmark.NOSE,           w, h)

    if not landmarks_visible(ls_vis, rs_vis, n_vis):
        return None, {}, "Adjust position – shoulders not visible"

    shoulder_width = np.linalg.norm(ls - rs)
    if shoulder_width < 20:
        return None, {}, "Move closer to the camera"

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

    warning = None
    margin  = 0.05 * w
    if ls[0] < margin or rs[0] > w - margin:
        warning = "Move to center – shoulders clipped"
    if nose[1] < 0.05 * h:
        warning = "Move down – head clipped"

    raw_score  = max(0.0, 100.0 - tilt_penalty - slouch_penalty - horiz_penalty)
    components = {
        "tilt_penalty":   round(tilt_penalty,   1),
        "slouch_penalty": round(slouch_penalty,  1),
        "horiz_penalty":  round(horiz_penalty,   1),
    }
    return raw_score, components, warning

def smooth_score(raw_score):
    score_buffer.append(raw_score)
    return round(np.mean(score_buffer), 1)

def get_feedback(score, components):
    if score >= 85:
        return "Good posture", (0, 220, 80)
    if components["slouch_penalty"] > 12:
        return "Sit straight – head forward", (0, 80, 220)
    if components["tilt_penalty"] > 10:
        return "Level your shoulders", (0, 160, 255)
    if components["horiz_penalty"] > 5:
        return "Centre yourself in frame", (0, 200, 255)
    return "Slightly off – adjust", (0, 160, 255)

def draw_ui(frame, score, feedback, color, components, warning):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (300, 130), (15, 15, 15), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    cv2.rectangle(frame, (10, 10), (300, 130), (60, 60, 60), 1)

    cv2.putText(frame, f"POSTURE  {score:.0f}/100", (20, 45),
                cv2.FONT_HERSHEY_DUPLEX, 0.75, (220, 220, 220), 1, cv2.LINE_AA)

    bar_max  = 270
    bar_fill = int(bar_max * score / 100)
    t        = max(0, min(1, (score - 40) / 60))
    bar_col  = (int(20*(1-t)), int(200*t), int(200*(1-t)))
    cv2.rectangle(frame, (18, 55), (18+bar_max, 72), (40, 40, 40), -1)
    cv2.rectangle(frame, (18, 55), (18+bar_fill, 72), bar_col,     -1)
    cv2.rectangle(frame, (18, 55), (18+bar_max, 72), (80, 80, 80),  1)

    labels = [("Slouch", components["slouch_penalty"], 40),
              ("Tilt",   components["tilt_penalty"],   30),
              ("Horiz",  components["horiz_penalty"],  15)]
    for i, (label, val, max_val) in enumerate(labels):
        y       = 85 + i * 14
        fill    = int(250 * val / max_val)
        pen_col = (40, 40, int(80 + 170 * val / max_val))
        cv2.rectangle(frame, (18, y), (118, y+9), (40,40,40), -1)
        cv2.rectangle(frame, (18, y), (18+fill, y+9), pen_col, -1)
        cv2.putText(frame, f"{label}: {val:.0f}", (125, y+8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (160,160,160), 1)

    overlay2 = frame.copy()
    cv2.rectangle(overlay2, (10, 138), (340, 165), (15,15,15), -1)
    cv2.addWeighted(overlay2, 0.55, frame, 0.45, 0, frame)
    cv2.putText(frame, feedback, (18, 158),
                cv2.FONT_HERSHEY_DUPLEX, 0.6, color, 1, cv2.LINE_AA)

    if warning:
        overlay3 = frame.copy()
        cv2.rectangle(overlay3, (0, h-50), (w, h), (0,0,140), -1)
        cv2.addWeighted(overlay3, 0.7, frame, 0.3, 0, frame)
        cv2.putText(frame, f"  {warning}", (10, h-18),
                    cv2.FONT_HERSHEY_DUPLEX, 0.6, (255,255,255), 1, cv2.LINE_AA)

#  Session report 
def print_report():
    if not score_history:
        print("\nNo posture data recorded.")
        return
    avg      = np.mean(score_history)
    best     = np.max(score_history)
    worst    = np.min(score_history)
    good_pct = 100 * sum(s >= GOOD_POSTURE_SCORE for s in score_history) / len(score_history)

    print("\n" + "═"*45)
    print("         POSTURE SESSION REPORT")
    print("═"*45)
    print(f"  Frames analysed : {len(score_history)}")
    print(f"  Average score   : {avg:.1f} / 100")
    print(f"  Best score      : {best:.1f} / 100")
    print(f"  Worst score     : {worst:.1f} / 100")
    print(f"  Good posture    : {good_pct:.1f}% of session")
    print("─"*45)
    print("  SUGGESTIONS")
    print("─"*45)
    if good_pct >= 80:
        print("  Great job! Posture was well maintained.")
    elif good_pct >= 50:
        print("  Posture was acceptable but has room for improvement.")
    else:
        print("  Posture needs significant improvement.")
    slouch_pct = 100 * slouch_count / (len(score_history) + 1e-6)
    if slouch_pct > 30:
        print(f"  • You tend to slouch forward ({slouch_pct:.0f}% of frames).")
        print("    Try: chin tucks, monitor at eye level, lumbar support.")
    tilt_pct = 100 * shoulder_tilt_count / (len(score_history) + 1e-6)
    if tilt_pct > 30:
        print(f"  • Shoulder imbalance detected ({tilt_pct:.0f}% of frames).")
        print("    Try: shoulder stretches, check desk/armrest height.")
    if slouch_pct <= 30 and tilt_pct <= 30 and good_pct >= 50:
        print("   No major postural pattern issues detected.")
    print("═"*45 + "\n")

cap = cv2.VideoCapture(0)
print("Posture Monitor running — press 'q' to quit.\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w    = frame.shape[:2]
    rgb     = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if results.pose_landmarks:
        lms = results.pose_landmarks.landmark
        raw_score, components, warning = get_posture_score(lms, w, h)

        if raw_score is not None:
            smoothed = smooth_score(raw_score)
            score_history.append(smoothed)
            total_scored_frames += 1

            if components["slouch_penalty"] > 12:
                slouch_count += 1
            if components["tilt_penalty"] > 10:
                shoulder_tilt_count += 1

            draw_custom_skeleton(frame, lms, w, h, smoothed)
            feedback, fb_color = get_feedback(smoothed, components)
            draw_ui(frame, smoothed, feedback, fb_color, components, warning)
        else:
            hh, ww = frame.shape[:2]
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, hh-50), (ww, hh), (0,0,140), -1)
            cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
            cv2.putText(frame, f"  {warning}", (10, hh-18),
                        cv2.FONT_HERSHEY_DUPLEX, 0.6, (255,255,255), 1)

    cv2.imshow("Posture Monitor", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print_report()
