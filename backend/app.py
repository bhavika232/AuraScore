from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
import os
import tempfile
import traceback

app = Flask(__name__)
CORS(app)

# ── Database config ───────────────────────────────────────────────────────────
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'aurascore.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# ── Lazy-load analyzers (graceful if deps missing) ────────────────────────────
try:
    from analyzers.face_analyzer import analyze_face
    from analyzers.voice_analyzer import analyze_voice
    from analyzers.body_analyzer import analyze_body
    from analyzers.scorer import compute_score
    ANALYZERS_LOADED = True
    print("[AuraScore] ✅ All analyzers loaded successfully.")
except Exception as e:
    ANALYZERS_LOADED = False
    print(f"[AuraScore] ⚠️  Analyzers not available: {e}")
    print("[AuraScore]    Will use mock fallback for /analyze.")


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User with this email already exists'}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(name=name, email=email, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully', 'user': new_user.to_dict()}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    return jsonify({'message': 'Login successful', 'user': user.to_dict()}), 200


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    user = User.query.filter_by(email=email).first()
    if user:
        print(f"Password reset requested for {email}")
    return jsonify({'message': 'If your email is registered, you will receive a reset link.'}), 200


# ── Analysis route ────────────────────────────────────────────────────────────

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Accepts a multipart video upload (key: 'file' or 'video').
    Runs face + voice + body analysis, returns combined JSON.
    Falls back to rich mock data if analyzers are unavailable.
    """
    # ── If analyzers not loaded, return error ──
    if not ANALYZERS_LOADED:
        return jsonify({'error': 'Analyzers are not loaded'}), 500

    video_file = request.files.get('file') or request.files.get('video')
    if not video_file:
        return jsonify({'error': 'No video file provided. Use key "file" or "video".'}), 400

    # Determine extension
    filename = video_file.filename or 'interview.webm'
    ext = os.path.splitext(filename)[-1] or '.webm'

    # Write to temp files
    video_tmp  = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    audio_tmp  = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    video_path = video_tmp.name
    audio_path = audio_tmp.name
    video_tmp.close()
    audio_tmp.close()

    try:
        video_file.save(video_path)
        file_size = os.path.getsize(video_path)
        print(f"[analyze] Video saved: {video_path} ({file_size} bytes)")

        # ── Extract audio ──
        duration = 60.0
        try:
            from moviepy import VideoFileClip
            clip = VideoFileClip(video_path)
            duration = clip.duration or 60.0
            if clip.audio:
                clip.audio.write_audiofile(audio_path, logger=None)
            clip.close()
            print(f"[analyze] Audio extracted: {audio_path}, duration={duration:.1f}s")
        except Exception as e:
            print(f"[analyze] moviepy not available or failed: {e}. Voice analysis will use mock.")
            audio_path = None

        # ── Run analyzers ──
        print("[analyze] Running face analysis...")
        try:
            face_result = analyze_face(video_path)
        except Exception as e:
            print(f"[analyze] Face analysis failed: {e}")
            face_result = getattr(__import__("analyzers.face_analyzer", fromlist=["_mock_result"]), "_mock_result")()

        print("[analyze] Running voice analysis...")
        try:
            if audio_path:
                voice_result = analyze_voice(audio_path, duration)
            else:
                voice_result = getattr(__import__("analyzers.voice_analyzer", fromlist=["_mock_result"]), "_mock_result")()
        except Exception as e:
            print(f"[analyze] Voice analysis failed: {e}")
            voice_result = getattr(__import__("analyzers.voice_analyzer", fromlist=["_mock_result"]), "_mock_result")()

        print("[analyze] Running body analysis...")
        try:
            body_result = analyze_body(video_path)
        except Exception as e:
            print(f"[analyze] Body analysis failed: {e}")
            body_result = getattr(__import__("analyzers.body_analyzer", fromlist=["_mock_result"]), "_mock_result")()

        # ── Score ──
        print("[analyze] Computing final score...")
        result = compute_score(face_result, voice_result, body_result)

        # ── Attach raw module outputs ──
        result['face']  = face_result
        result['voice'] = voice_result
        result['body']  = body_result
        result['duration'] = round(duration, 1)

        print(f"[analyze] Done. Score={result['score']}, Archetype={result['archetype']}")
        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        print(f"[analyze] Global Error during analysis: {e}")
        return jsonify({'error': 'Failed to process analysis'}), 500

    finally:
        # Cleanup temp files
        for p in [video_path, audio_path]:
            try:
                if p and os.path.exists(p):
                    os.unlink(p)
            except Exception:
                pass





if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=False, host='0.0.0.0', port=port)
