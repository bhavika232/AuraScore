import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

# Eye landmark indices (MediaPipe standard)
LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]

# Iris indices for gaze
LEFT_IRIS  = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]

def eye_aspect_ratio(landmarks, eye_indices, w, h):
    pts = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in eye_indices]
    # Vertical distances
    A = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    B = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    # Horizontal distance
    C = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (A + B) / (2.0 * C)  # EAR formula

def get_gaze(landmarks, iris_indices, eye_indices, w, h):
    iris_pts  = [(landmarks[i].x * w, landmarks[i].y * h) for i in iris_indices]
    eye_pts   = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_indices]
    iris_cx   = np.mean([p[0] for p in iris_pts])
    eye_left  = eye_pts[0][0]
    eye_right = eye_pts[3][0]
    # Ratio: 0 = looking left, 1 = looking right
    ratio = (iris_cx - eye_left) / (eye_right - eye_left + 1e-6)
    if ratio < 0.42:   return "LEFT"
    elif ratio > 0.58: return "RIGHT"
    else:              return "CENTER"

cap = cv2.VideoCapture(0)
blink_count  = 0
was_closed   = False
EAR_THRESHOLD = 0.21  # below this = eye closed

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w = frame.shape[:2]
    rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if result.multi_face_landmarks:
        lm = result.multi_face_landmarks[0].landmark

        left_ear  = eye_aspect_ratio(lm, LEFT_EYE,  w, h)
        right_ear = eye_aspect_ratio(lm, RIGHT_EYE, w, h)
        avg_ear   = (left_ear + right_ear) / 2.0

        # Blink detection
        if avg_ear < EAR_THRESHOLD:
            if not was_closed:
                blink_count += 1
                was_closed = True
        else:
            was_closed = False

        gaze = get_gaze(lm, LEFT_IRIS, LEFT_EYE, w, h)

        # Print numbers to terminal (your Day 1 goal!)
        print(f"EAR: {avg_ear:.3f} | Blinks: {blink_count} | Gaze: {gaze}")

        cv2.putText(frame, f"Blinks: {blink_count}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
        cv2.putText(frame, f"Gaze: {gaze}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

    cv2.imshow("AuraScore - Face", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()