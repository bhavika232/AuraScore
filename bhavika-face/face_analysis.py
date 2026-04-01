import cv2
import mediapipe as mp
import numpy as np
import time

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]
LEFT_IRIS  = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]

# 3D model points for solvePnP (standard face model)
MODEL_POINTS = np.array([
    (0.0,    0.0,    0.0),     # Nose tip        – landmark 1
    (0.0,   -330.0, -65.0),    # Chin            – landmark 152
    (-225.0, 170.0, -135.0),   # Left eye corner – landmark 33
    (225.0,  170.0, -135.0),   # Right eye corner– landmark 263
    (-150.0,-150.0, -125.0),   # Left mouth      – landmark 61
    (150.0, -150.0, -125.0),   # Right mouth     – landmark 291
], dtype=np.float64)

FACE_LANDMARKS_IDS = [1, 152, 33, 263, 61, 291]

def eye_aspect_ratio(landmarks, eye_indices, w, h):
    pts = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in eye_indices]
    A = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    B = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    C = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (A + B) / (2.0 * C)

def get_gaze(landmarks, iris_indices, eye_indices, w, h):
    iris_pts  = [(landmarks[i].x * w, landmarks[i].y * h) for i in iris_indices]
    eye_pts   = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_indices]
    iris_cx   = np.mean([p[0] for p in iris_pts])
    eye_left  = eye_pts[0][0]
    eye_right = eye_pts[3][0]
    ratio = (iris_cx - eye_left) / (eye_right - eye_left + 1e-6)
    if ratio < 0.42:   return "LEFT"
    elif ratio > 0.58: return "RIGHT"
    else:              return "CENTER"

def get_head_pose(landmarks, w, h):
    image_points = np.array([
        (landmarks[i].x * w, landmarks[i].y * h) for i in FACE_LANDMARKS_IDS
    ], dtype=np.float64)

    focal_length = w
    cam_matrix   = np.array([
        [focal_length, 0,            w / 2],
        [0,            focal_length, h / 2],
        [0,            0,            1    ]
    ], dtype=np.float64)
    dist_coeffs = np.zeros((4, 1))

    success, rot_vec, trans_vec = cv2.solvePnP(
        MODEL_POINTS, image_points, cam_matrix, dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not success:
        return None, None, None

    rot_mat, _ = cv2.Rodrigues(rot_vec)
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rot_mat)

    pitch = angles[0]
    yaw   = angles[1]
    roll  = angles[2]

    # ── fix the 180° wrap issue ──
    if pitch > 90:
        pitch = pitch - 180
    elif pitch < -90:
        pitch = pitch + 180

    return pitch, yaw, roll
def classify_chin(pitch):
    if pitch < -15:  return "UP"
    elif pitch > 15: return "DOWN"
    else:            return "LEVEL"

def classify_yaw(yaw):
    if yaw < -10:   return "LEFT"
    elif yaw > 10:  return "RIGHT"
    else:           return "FORWARD"

cap = cv2.VideoCapture(0)
blink_count   = 0
was_closed    = False
EAR_THRESHOLD = 0.21
start_time    = time.time()
gaze_log      = []

# Head pose logs
chin_log = []
yaw_log  = []
pitch_values = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w = frame.shape[:2]
    rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if result.multi_face_landmarks:
        lm = result.multi_face_landmarks[0].landmark

        # ── EAR + blink ──
        left_ear  = eye_aspect_ratio(lm, LEFT_EYE,  w, h)
        right_ear = eye_aspect_ratio(lm, RIGHT_EYE, w, h)
        avg_ear   = (left_ear + right_ear) / 2.0

        if avg_ear < EAR_THRESHOLD:
            if not was_closed:
                blink_count += 1
                was_closed = True
        else:
            was_closed = False

        # ── Gaze ──
        gaze = get_gaze(lm, LEFT_IRIS, LEFT_EYE, w, h)
        gaze_log.append(gaze)

        # ── Live gaze percentages ──
        total_frames = len(gaze_log)
        pct_left   = gaze_log.count("LEFT")   / total_frames * 100
        pct_center = gaze_log.count("CENTER") / total_frames * 100
        pct_right  = gaze_log.count("RIGHT")  / total_frames * 100

        # ── Head pose ──
        pitch, yaw, roll = get_head_pose(lm, w, h)
        if pitch is not None:
            chin_state = classify_chin(pitch)
            yaw_state  = classify_yaw(yaw)
            chin_log.append(chin_state)
            yaw_log.append(yaw_state)
            pitch_values.append(pitch)
        else:
            chin_state = "?"
            yaw_state  = "?"

        # ── Face box coordinates ──
        xs = [int(lm[i].x * w) for i in range(468)]
        ys = [int(lm[i].y * h) for i in range(468)]
        x1, y1 = min(xs), min(ys)
        x2, y2 = max(xs), max(ys)

        # ── Eye box coordinates ──
        eye_indices_draw = LEFT_EYE + RIGHT_EYE
        ex = [int(lm[i].x * w) for i in eye_indices_draw]
        ey = [int(lm[i].y * h) for i in eye_indices_draw]
        padding = 15
        ex1, ey1 = min(ex) - padding, min(ey) - padding
        ex2, ey2 = max(ex) + padding, max(ey) + padding

        # ── Draw face box (translucent white) ──
        overlay = frame.copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (255, 255, 255), -1)
        cv2.addWeighted(overlay, 0.08, frame, 0.92, 0, frame)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 255), 1)

        # Gaze text — top of face box
        gaze_text = f"gaze: {gaze.lower()}"
        cv2.putText(frame, gaze_text, (x1 + 4, y1 + 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)

        # Head pose text — bottom of face box
        chin_total = len(chin_log) if chin_log else 1
        pct_chin_down    = chin_log.count("DOWN")    / chin_total * 100
        pct_chin_level   = chin_log.count("LEVEL")   / chin_total * 100
        pct_chin_up      = chin_log.count("UP")       / chin_total * 100
        pct_yaw_forward  = yaw_log.count("FORWARD")  / chin_total * 100

        # Head pose text — bottom of face box
        if chin_state == "UP":
            chin_text = "chin: lower your chin a little"
        elif chin_state == "DOWN":
            chin_text = "chin: raise your chin!"
        else:
            chin_text = "chin: good posture!"
        yaw_text  = f"head: {yaw_state.lower()}"
        cv2.putText(frame, chin_text, (x1 + 4, y2 - 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
        cv2.putText(frame, yaw_text,  (x1 + 4, y2 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)

        # ── Draw eye box (translucent cyan) ──
        overlay2 = frame.copy()
        cv2.rectangle(overlay2, (ex1, ey1), (ex2, ey2), (200, 220, 255), -1)
        cv2.addWeighted(overlay2, 0.12, frame, 0.88, 0, frame)
        cv2.rectangle(frame, (ex1, ey1), (ex2, ey2), (200, 220, 255), 1)

        # Blink count on eye box
        cv2.putText(frame, f"blinks: {blink_count}", (ex1 + 4, ey1 + 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.30, (200, 220, 255), 1)

    cv2.imshow("AuraScore - Face", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

# ── Session summary after quit ──
elapsed_minutes = (time.time() - start_time) / 60
blink_rate      = blink_count / elapsed_minutes if elapsed_minutes > 0 else 0

total_frames = len(gaze_log)
if total_frames > 0:
    pct_left   = gaze_log.count("LEFT")   / total_frames * 100
    pct_center = gaze_log.count("CENTER") / total_frames * 100
    pct_right  = gaze_log.count("RIGHT")  / total_frames * 100
else:
    pct_left = pct_center = pct_right = 0

chin_total = len(chin_log) if chin_log else 1
pct_chin_down  = chin_log.count("DOWN")    / chin_total * 100
pct_chin_level = chin_log.count("LEVEL")   / chin_total * 100
pct_chin_up    = chin_log.count("UP")      / chin_total * 100
pct_forward    = yaw_log.count("FORWARD")  / chin_total * 100
pct_yaw_left   = yaw_log.count("LEFT")     / chin_total * 100
pct_yaw_right  = yaw_log.count("RIGHT")    / chin_total * 100
avg_pitch      = np.mean(pitch_values) if pitch_values else 0

print("\n========== SESSION SUMMARY ==========")
print(f"Total blinks:        {blink_count}")
print(f"Avg blink rate:      {blink_rate:.1f} blinks/min")
print(f"Gaze - LEFT:         {pct_left:.1f}%")
print(f"Gaze - CENTER:       {pct_center:.1f}%")
print(f"Gaze - RIGHT:        {pct_right:.1f}%")
print(f"-------------------------------------")
print(f"Chin - DOWN:         {pct_chin_down:.1f}%")
print(f"Chin - LEVEL:        {pct_chin_level:.1f}%")
print(f"Chin - UP:           {pct_chin_up:.1f}%")
print(f"Avg pitch angle:     {avg_pitch:.1f}°  ({'down' if avg_pitch < 0 else 'up'})")
print(f"Head - FORWARD:      {pct_forward:.1f}%")
print(f"Head - LEFT:         {pct_yaw_left:.1f}%")
print(f"Head - RIGHT:        {pct_yaw_right:.1f}%")
print("=====================================")