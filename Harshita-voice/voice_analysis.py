import librosa
import numpy as np
import sounddevice as sd
import scipy.io.wavfile as wav

# ---- STEP 1: RECORD VOICE ----
def record_audio(duration=30, sample_rate=44100):
    print("Recording... Speak now!")
    audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
    sd.wait()  # Wait until recording is done
    print("Recording complete!")
    wav.write("interview_response.wav", sample_rate, audio)
    return "interview_response.wav", sample_rate

# ---- STEP 2: ANALYZE PITCH ----
def analyze_pitch(audio, sample_rate):
    pitches, magnitudes = librosa.piptrack(y=audio, sr=sample_rate)
    pitch_values = pitches[pitches > 0]
    if len(pitch_values) == 0:
        return 0, 0
    avg_pitch = np.mean(pitch_values)
    pitch_variance = np.var(pitch_values)
    print(f"Average Pitch: {avg_pitch:.2f} Hz")
    print(f"Pitch Variance: {pitch_variance:.2f}")
    return avg_pitch, pitch_variance

# ---- STEP 3: DETECT SILENCE GAPS ----
def detect_silence(audio, sample_rate, threshold=0.01):
    silence_threshold = threshold
    is_silent = np.abs(audio) < silence_threshold
    silent_frames = np.sum(is_silent)
    silence_duration = silent_frames / sample_rate
    print(f"Total Silence Duration: {silence_duration:.2f} seconds")
    return silence_duration

# ---- STEP 4: ANALYZE PACE (WORDS PER MINUTE ESTIMATE) ----
def analyze_pace(audio, sample_rate):
    intervals = librosa.effects.split(audio, top_db=20)
    num_words_estimate = len(intervals)
    duration_minutes = len(audio) / sample_rate / 60
    pace = num_words_estimate / duration_minutes if duration_minutes > 0 else 0
    print(f"Estimated Pace: {pace:.2f} words per minute")
    return pace

# ---- STEP 5: DETECT STAMMERING ----
def detect_stammering(audio, sample_rate):
    intervals = librosa.effects.split(audio, top_db=20)
    short_bursts = [i for i in intervals if (i[1] - i[0]) < sample_rate * 0.1]
    stammer_count = len(short_bursts)
    print(f"Stammer Count: {stammer_count}")
    return stammer_count

# ---- MAIN FUNCTION: RUN EVERYTHING ----
def analyze_voice():
    # Record audio
    filename, sample_rate = record_audio(duration=30)
    
    # Load recorded audio
    audio, sr = librosa.load(filename, sr=None)
    
    # Run all analyses
    avg_pitch, pitch_variance = analyze_pitch(audio, sr)
    silence_duration = detect_silence(audio, sr)
    pace = analyze_pace(audio, sr)
    stammer_count = detect_stammering(audio, sr)
    
    # Final Report
    print("\n===== VOICE ANALYSIS REPORT =====")
    print(f"Average Pitch: {avg_pitch:.2f} Hz")
    print(f"Pitch Variance: {pitch_variance:.2f}")
    print(f"Silence Duration: {silence_duration:.2f} seconds")
    print(f"Pace: {pace:.2f} words per minute")
    print(f"Stammer Count: {stammer_count}")
    print("=================================")
    
    return {
        "avg_pitch": avg_pitch,
        "pitch_variance": pitch_variance,
        "silence_duration": silence_duration,
        "pace": pace,
        "stammer_count": stammer_count
    }

# Run the analysis
if __name__ == "__main__":
    analyze_voice()