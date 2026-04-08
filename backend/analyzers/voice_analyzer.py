"""
Voice Analysis — adapted from Harshita's voice_analysis.py
Analyzes an extracted audio file using librosa + SpeechRecognition.
Returns pitch, pace, silence, stammer, filler-word stats, and confidence score.
"""

import numpy as np

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    SR_AVAILABLE = False


# ── Internal helpers (Harshita's logic) ─────────────────────────────────────

def _analyze_pitch(audio, sample_rate):
    pitches, magnitudes = librosa.piptrack(y=audio, sr=sample_rate)
    pitch_values = pitches[pitches > 0]
    if len(pitch_values) == 0:
        return 0.0, 0.0
    return float(np.mean(pitch_values)), float(np.var(pitch_values))


def _detect_silence(audio, sample_rate, threshold=0.01):
    is_silent = np.abs(audio) < threshold
    return float(np.sum(is_silent) / sample_rate)


def _analyze_pace(audio, sample_rate):
    intervals = librosa.effects.split(audio, top_db=20)
    num_words_estimate = len(intervals)
    duration_minutes = len(audio) / sample_rate / 60.0
    return float(num_words_estimate / duration_minutes) if duration_minutes > 0 else 0.0


def _detect_stammering(audio, sample_rate):
    intervals = librosa.effects.split(audio, top_db=20)
    short_bursts = [i for i in intervals if (i[1] - i[0]) < sample_rate * 0.1]
    return len(short_bursts)


def _detect_filler_words(audio_path: str):
    if not SR_AVAILABLE:
        return 0, {}
    recognizer = sr.Recognizer()
    filler_words = ["um", "uh", "like", "you know", "basically", "literally", "so", "right"]
    filler_count  = 0
    found_fillers = {}
    try:
        with sr.AudioFile(audio_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data).lower()
            for word in filler_words:
                count = text.split().count(word)
                if count > 0:
                    filler_count += count
                    found_fillers[word] = count
    except Exception:
        pass  # transcription unavailable — skip filler detection
    return filler_count, found_fillers


def _calculate_confidence(pitch_variance, silence_duration, pace, stammer_count, filler_count, total_duration):
    score = 100
    if pace < 100 or pace > 160:
        score -= 20
    elif pace < 110 or pace > 155:
        score -= 10
    if stammer_count > 10: score -= 20
    elif stammer_count > 5: score -= 10
    silence_ratio = silence_duration / max(total_duration, 1)
    if silence_ratio > 0.6: score -= 20
    elif silence_ratio > 0.4: score -= 10
    if pitch_variance < 50000: score -= 15
    if filler_count > 8: score -= 15
    elif filler_count > 4: score -= 8
    return max(0, score)


def _generate_feedback(pitch_variance, silence_duration, pace, stammer_count, filler_count):
    feedback = []
    if pace < 100:
        feedback.append("Pace is too slow — try to speak a little faster and more confidently.")
    elif pace > 150:
        feedback.append("Pace is too fast — slow down so the interviewer can follow.")
    else:
        feedback.append("Pace is good — speaking at a comfortable speed.")

    if stammer_count > 10:
        feedback.append("High stammer count — practice speaking smoothly and take a breath before answering.")
    elif stammer_count > 5:
        feedback.append("Some stammering detected — try to pause and collect thoughts before speaking.")
    else:
        feedback.append("Very little stammering — good fluency.")

    if silence_duration > 15:
        feedback.append("Too many long pauses — try to keep the answer flowing.")
    elif silence_duration > 8:
        feedback.append("Some long pauses detected — try to reduce them.")
    else:
        feedback.append("Good flow with minimal silence gaps.")

    if pitch_variance < 50000:
        feedback.append("Voice sounds monotone — try to vary your tone to sound more engaging.")
    else:
        feedback.append("Good pitch variance — voice sounds expressive.")

    if filler_count > 8:
        feedback.append("Too many filler words — try replacing them with a short pause.")
    elif filler_count > 4:
        feedback.append("Some filler words detected — be mindful of words like 'um', 'uh', 'like'.")
    else:
        feedback.append("Very few filler words — good.")

    return feedback


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_voice(audio_path: str, duration: float) -> dict:
    """
    Analyze an audio file (WAV). Returns full voice metrics dict.
    Falls back to mock values if librosa unavailable.
    """
    if not LIBROSA_AVAILABLE:
        return _mock_result(duration)

    try:
        audio, sr_rate = librosa.load(audio_path, sr=None)
        actual_duration = max(len(audio) / sr_rate, duration, 1.0)

        avg_pitch, pitch_variance   = _analyze_pitch(audio, sr_rate)
        silence_duration            = _detect_silence(audio, sr_rate)
        pace                        = _analyze_pace(audio, sr_rate)
        stammer_count               = _detect_stammering(audio, sr_rate)
        filler_count, found_fillers = _detect_filler_words(audio_path)
        confidence_score            = _calculate_confidence(
            pitch_variance, silence_duration, pace, stammer_count, filler_count, actual_duration
        )
        feedback = _generate_feedback(
            pitch_variance, silence_duration, pace, stammer_count, filler_count
        )

        silence_ratio = (silence_duration / actual_duration) * 100
        speech_ratio  = 100 - silence_ratio

        return {
            "avg_pitch":        round(avg_pitch, 1),
            "pitch_variance":   round(pitch_variance, 1),
            "pace":             round(pace, 1),
            "silence_duration": round(silence_duration, 2),
            "silence_ratio":    round(silence_ratio, 1),
            "speech_ratio":     round(speech_ratio, 1),
            "stammer_count":    stammer_count,
            "filler_count":     filler_count,
            "filler_words":     found_fillers,
            "confidence_score": confidence_score,
            "feedback":         feedback,
        }
    except Exception as e:
        print(f"[voice_analyzer] Error: {e}")
        return _mock_result(duration)


def _mock_result(duration: float = 60.0):
    return {
        "avg_pitch":        0.0,
        "pitch_variance":   0.0,
        "pace":             0.0,
        "silence_duration": 0.0,
        "silence_ratio":    0.0,
        "speech_ratio":     0.0,
        "stammer_count":    0,
        "filler_count":     0,
        "filler_words":     {},
        "confidence_score": 0,
        "feedback":         ["No audio could be analyzed properly."],
    }
