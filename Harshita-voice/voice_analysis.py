import librosa
import numpy as np
import sounddevice as sd
import scipy.io.wavfile as wav
import speech_recognition as sr
from datetime import datetime

# ---- STEP 1: RECORD VOICE ----
def record_audio(sample_rate=44100):
    duration = int(input("How long do you want to record? (in seconds): "))
    print(f"\nRecording for {duration} seconds... Speak now!")
    audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
    sd.wait()
    print("Recording complete!")
    wav.write("Harshita-voice/interview_response.wav", sample_rate, audio)
    return "Harshita-voice/interview_response.wav", sample_rate, duration

# ---- STEP 2: ANALYZE PITCH ----
def analyze_pitch(audio, sample_rate):
    pitches, magnitudes = librosa.piptrack(y=audio, sr=sample_rate)
    pitch_values = pitches[pitches > 0]
    if len(pitch_values) == 0:
        return 0, 0
    avg_pitch = np.mean(pitch_values)
    pitch_variance = np.var(pitch_values)
    return avg_pitch, pitch_variance

# ---- STEP 3: DETECT SILENCE GAPS ----
def detect_silence(audio, sample_rate, threshold=0.01):
    is_silent = np.abs(audio) < threshold
    silent_frames = np.sum(is_silent)
    silence_duration = silent_frames / sample_rate
    return silence_duration

# ---- STEP 4: ANALYZE PACE ----
def analyze_pace(audio, sample_rate):
    intervals = librosa.effects.split(audio, top_db=20)
    num_words_estimate = len(intervals)
    duration_minutes = len(audio) / sample_rate / 60
    pace = num_words_estimate / duration_minutes if duration_minutes > 0 else 0
    return pace

# ---- STEP 5: DETECT STAMMERING ----
def detect_stammering(audio, sample_rate):
    intervals = librosa.effects.split(audio, top_db=20)
    short_bursts = [i for i in intervals if (i[1] - i[0]) < sample_rate * 0.1]
    return len(short_bursts)

# ---- STEP 6: DETECT FILLER WORDS ----
def detect_filler_words(filename):
    recognizer = sr.Recognizer()
    filler_words = ["um", "uh", "like", "you know", "basically", "literally", "so", "right"]
    filler_count = 0
    found_fillers = {}

    try:
        with sr.AudioFile(filename) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data).lower()
            print(f"\nTranscription: {text}\n")

            for word in filler_words:
                count = text.split().count(word)
                if count > 0:
                    filler_count += count
                    found_fillers[word] = count

    except Exception as e:
        print("Could not transcribe audio for filler word detection.")

    return filler_count, found_fillers

# ---- STEP 7: CALCULATE CONFIDENCE SCORE ----
def calculate_confidence_score(pitch_variance, silence_duration, pace, stammer_count, filler_count, total_duration):
    score = 100

    if pace < 100 or pace > 160:
        score -= 20
    elif pace < 110 or pace > 155:
        score -= 10

    if stammer_count > 10:
        score -= 20
    elif stammer_count > 5:
        score -= 10

    silence_ratio = silence_duration / total_duration
    if silence_ratio > 0.6:
        score -= 20
    elif silence_ratio > 0.4:
        score -= 10

    if pitch_variance < 50000:
        score -= 15

    if filler_count > 8:
        score -= 15
    elif filler_count > 4:
        score -= 8

    return max(0, score)

# ---- STEP 8: GENERATE FEEDBACK ----
def generate_feedback(pitch_variance, silence_duration, pace, stammer_count, filler_count):
    feedback = []

    if pace < 100:
        feedback.append("Pace is too slow. Try to speak a little faster and more confidently.")
    elif pace > 150:
        feedback.append("Pace is too fast. Slow down so the interviewer can follow.")
    else:
        feedback.append("Pace is good. Speaking at a comfortable speed.")

    if stammer_count > 10:
        feedback.append("High stammer count. Practice speaking smoothly and take a breath before answering.")
    elif stammer_count > 5:
        feedback.append("Some stammering detected. Try to pause and collect thoughts before speaking.")
    else:
        feedback.append("Very little stammering. Good fluency.")

    if silence_duration > 15:
        feedback.append("Too many long pauses. Try to keep the answer flowing.")
    elif silence_duration > 8:
        feedback.append("Some long pauses detected. Try to reduce them.")
    else:
        feedback.append("Good flow with minimal silence gaps.")

    if pitch_variance < 50000:
        feedback.append("Voice sounds monotone. Try to vary tone to sound more engaging.")
    else:
        feedback.append("Good pitch variance. Voice sounds expressive.")

    if filler_count > 8:
        feedback.append("Too many filler words. Try replacing them with a short pause.")
    elif filler_count > 4:
        feedback.append("Some filler words detected. Be mindful of words like um, uh, like.")
    else:
        feedback.append("Very few filler words detected. Good.")

    return feedback

# ---- MAIN FUNCTION ----
def analyze_voice():
    session_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    filename, sample_rate, duration = record_audio()
    audio, sr_rate = librosa.load(filename, sr=None)

    avg_pitch, pitch_variance     = analyze_pitch(audio, sr_rate)
    silence_duration              = detect_silence(audio, sr_rate)
    pace                          = analyze_pace(audio, sr_rate)
    stammer_count                 = detect_stammering(audio, sr_rate)
    filler_count, found_fillers   = detect_filler_words(filename)
    confidence_score              = calculate_confidence_score(
                                        pitch_variance, silence_duration,
                                        pace, stammer_count, filler_count, duration
                                    )
    feedback                      = generate_feedback(
                                        pitch_variance, silence_duration,
                                        pace, stammer_count, filler_count
                                    )

    silence_ratio = (silence_duration / duration) * 100
    speech_ratio  = 100 - silence_ratio

    # ---- PRINT SESSION SUMMARY ----
    print("\n========== SESSION SUMMARY ==========")
    print(f"Session Date         : {session_time}")
    print(f"Recording Duration   : {duration} seconds")
    print("--------------------------------------")
    print(f"Avg Pitch            : {avg_pitch:.1f} Hz")
    print(f"Pitch Variance       : {pitch_variance:.1f}")
    print("--------------------------------------")
    print(f"Speech Time          : {speech_ratio:.1f}%")
    print(f"Silence Time         : {silence_ratio:.1f}%")
    print(f"Silence Duration     : {silence_duration:.2f} seconds")
    print("--------------------------------------")
    print(f"Pace                 : {pace:.1f} words/min")
    print(f"Stammer Count        : {stammer_count}")
    print("--------------------------------------")
    print(f"Filler Word Count    : {filler_count}")
    for word, count in found_fillers.items():
        print(f"  {word:<20}: {count}")
    print("--------------------------------------")
    print(f"Confidence Score     : {confidence_score}/100")
    print("======================================")
    print("\nFEEDBACK:")
    print("--------------------------------------")
    for tip in feedback:
        print(f"- {tip}")
    print("======================================\n")

    return {
        "session": session_time,
        "avg_pitch": avg_pitch,
        "pitch_variance": pitch_variance,
        "silence_duration": silence_duration,
        "pace": pace,
        "stammer_count": stammer_count,
        "filler_count": filler_count,
        "confidence_score": confidence_score,
        "feedback": feedback
    }

if __name__ == "__main__":
    analyze_voice()