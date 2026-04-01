# AuraScore 🎯
### *See yourself like they do.*

AuraScore is a real-time AI interview coaching tool that analyzes how 
you come across — not what you say, but how you say it. Using computer 
vision and audio processing, AuraScore evaluates your body language, 
facial expressions, posture, eye contact, and voice modulation during 
mock interviews and gives you an actionable confidence score.

🔍 What It Analyzes
- 👁️ Eye contact & gaze direction
- 🗣️ Voice modulation, pace & stammering
- 🧍 Posture & body movement
- 😐 Facial expressions & micro-expressions
- 🤨 Brow tension & lip stress indicators

How It Works
AuraScore processes your webcam and microphone input frame by frame. 
It extracts behavioral signals using MediaPipe and librosa, builds a 
feature vector per second, and runs it through an Isolation Forest 
model to detect nervousness anomalies. All signals are combined into 
a final AuraScore — a confidence rating that updates in real time.

🛠️ Tech Stack
- Computer Vision: MediaPipe, OpenCV
- Audio Analysis: librosa, pyAudio
- ML Model: Isolation Forest (scikit-learn)
- Backend: Flask (Python)
- Frontend: React.js, Chart.js 
interview-coach, body-language, nlp, flask, react, 
computer-vision, audio-analysis, ai-project
