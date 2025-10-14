from flask import Flask, jsonify, request
import requests
from tempfile import NamedTemporaryFile
from pydub import AudioSegment
from aeneas.executetask import ExecuteTask
from aeneas.task import Task
import json
import os

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({"status": "ok", "message": "Python server is running"})


@app.route("/download_audio", methods=["POST"])
def download_audio():
    try:
        url = request.json["url"]
        response = requests.get(url)
        response.raise_for_status()
        file_path = "/tmp/audio.mp3"
        with open(file_path, "wb") as f:
            f.write(response.content)
        return jsonify({"message": "Downloaded successfully", "path": file_path})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)})

def safe_temp_file(suffix):
    """Create a safe temporary file and return path"""
    tmp_file = NamedTemporaryFile(delete=False, suffix=suffix)
    tmp_file.close()
    return tmp_file.name

def chunk_lyrics(lyrics_lines, max_words=20):
    """Split lyrics into chunks of max_words"""
    chunks = []
    current_chunk = []
    current_count = 0
    for line in lyrics_lines:
        words = line.split()
        if current_count + len(words) > max_words:
            # Save chunk
            chunk_file = safe_temp_file(".txt")
            with open(chunk_file, "w", encoding="utf-8") as f:
                f.write("\n".join(current_chunk))
            chunks.append(chunk_file)
            current_chunk = []
            current_count = 0
        current_chunk.append(line)
        current_count += len(words)
    if current_chunk:
        chunk_file = safe_temp_file(".txt")
        with open(chunk_file, "w", encoding="utf-8") as f:
            f.write("\n".join(current_chunk))
        chunks.append(chunk_file)
    return chunks

def chunk_audio(audio, num_chunks):
    """Split audio into equal parts"""
    chunk_length_ms = len(audio) // num_chunks
    audio_chunks = []
    for i in range(num_chunks):
        start = i * chunk_length_ms
        end = start + chunk_length_ms if i < num_chunks - 1 else len(audio)
        chunk_file = safe_temp_file(".wav")
        audio[start:end].export(chunk_file, format="wav", codec="pcm_s16le")
        audio_chunks.append(chunk_file)
    return audio_chunks

@app.route("/align")
def align_song():
    # 1️⃣ Fetch lyrics
    lyrics_url = "https://expressproject-al0i.onrender.com/lyrics?artist=*Luna&song=ST/A#R"
    try:
        res = requests.get(lyrics_url)
        res.raise_for_status()
        lyrics_lines = res.json().get("lines", [])
    except requests.RequestException as e:
        return jsonify({"status": "error", "message": f"Failed to fetch lyrics: {e}"})
    if not lyrics_lines:
        return jsonify({"status": "error", "message": "No lyrics found"})

    # 2️⃣ Fetch MP3
    audio_url = "https://expressproject-al0i.onrender.com/luna"
    audio_file = safe_temp_file(".mp3")
    try:
        resp = requests.get(audio_url)
        resp.raise_for_status()
        with open(audio_file, "wb") as f:
            f.write(resp.content)
    except requests.RequestException as e:
        return jsonify({"status": "error", "message": f"Failed to fetch audio: {e}"})

    # 3️⃣ Convert MP3 -> WAV (mono, 16-bit PCM, 16 kHz)
    sound = AudioSegment.from_file(audio_file)
    sound = sound.set_channels(1).set_frame_rate(16000).set_sample_width(2)

    # 4️⃣ Chunk lyrics and audio
    lyrics_chunks = chunk_lyrics(lyrics_lines, max_words=20)
    audio_chunks = chunk_audio(sound, len(lyrics_chunks))

    # 5️⃣ Align each chunk
    sync_results = []
    for i, (ly_file, au_file) in enumerate(zip(lyrics_chunks, audio_chunks)):
        task = Task(config_string="task_language=eng|is_text_type=plain|os_task_file_format=json|use_pure_python=True")
        task.audio_file_path_absolute = au_file
        task.text_file_path_absolute = ly_file
        task.sync_map_file_path_absolute = safe_temp_file(".json")
        try:
            ExecuteTask(task).execute()
            with open(task.sync_map_file_path_absolute, "r", encoding="utf-8") as f:
                data = json.load(f)
                sync_results.extend(data.get("fragments", []))
        except Exception as e:
            return jsonify({"status": "error", "message": f"Chunk {i} alignment failed: {e}"})

    # 6️⃣ Save merged sync map
    sync_map_file = "sync_map.json"
    with open(sync_map_file, "w", encoding="utf-8") as f:
        json.dump({"fragments": sync_results}, f, indent=2)

    return jsonify({"status": "ok", "sync_map": sync_map_file})

from pydub import AudioSegment
from aeneas.executetask import ExecuteTask
from aeneas.task import Task
from tempfile import NamedTemporaryFile
import os
"""
# Function to split audio into chunks of max_duration_ms
def split_audio(audio_path, max_duration_ms=30000):  # 30 sec chunks
    audio = AudioSegment.from_file(audio_path)
    chunks = []
    for i in range(0, len(audio), max_duration_ms):
        chunk = audio[i:i+max_duration_ms]
        tmp = NamedTemporaryFile(suffix=".wav", delete=False)
        chunk.export(tmp.name, format="wav", codec="pcm_s16le")
        tmp.close()
        chunks.append(tmp.name)
    return chunks


# Split your WAV into smaller chunks
chunks = split_audio(wav_file.name)

# Load lyrics
with open(lyrics_file.name, "r", encoding="utf-8") as f:
    lyrics_lines = [line.strip() for line in f if line.strip()]

# Determine how many lines per chunk
lines_per_chunk = max(1, len(lyrics_lines) // len(chunks))

sync_maps = []

for i, chunk_path in enumerate(chunks):
    start_line = i * lines_per_chunk
    end_line = start_line + lines_per_chunk
    tmp_lyrics = NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".txt", delete=False)
    tmp_lyrics.write("\n".join(lyrics_lines[start_line:end_line]))
    tmp_lyrics.close()

    task = Task(config_string="task_language=eng|is_text_type=plain|os_task_file_format=json")
    task.audio_file_path_absolute = chunk_path
    task.text_file_path_absolute = tmp_lyrics.name
    task.sync_map_file_path_absolute = f"sync_map_chunk_{i}.json"

    try:
        ExecuteTask(task).execute()
        task.output_sync_map_file()
        print(f"Chunk {i} aligned successfully: {task.sync_map_file_path_absolute}")
        sync_maps.append(task.sync_map_file_path_absolute)
    except Exception as e:
        print(f"Error aligning chunk {i}: {e}")
"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
