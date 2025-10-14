from flask import Flask, jsonify, request
import requests
from tempfile import NamedTemporaryFile
from tempfile import gettempdir
from pydub import AudioSegment
from aeneas.executetask import ExecuteTask
from aeneas.task import Task
import json
import os
import time
import threading
import uuid
import subprocess
import sys





app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({"status": "ok", "message": "Python server is running"})

TMP_DIR = "/tmp"
CLEAN_INTERVAL = 15 * 60  # 15 minutes

def cleanup_tmp():
    tmp_dir = "/tmp"
    for f in os.listdir(tmp_dir):
        if f.startswith("audio_") or f.endswith(".txt"):
            try:
                os.remove(os.path.join(tmp_dir, f))
            except:
                pass
    # schedule next cleanup
    threading.Timer(900, cleanup_tmp).start()  # 900 sec = 15 min


# Start the cleanup thread when the app starts
cleanup_tmp()

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

def safe_temp_file(suffix=".txt"):
    """Create a temp file with unique UUID-based name"""
    filename = f"{uuid.uuid4()}{suffix}"
    filepath = os.path.join(gettempdir(), filename)
    # create empty file
    with open(filepath, "w", encoding="utf-8") as f:
        pass
    return filepath

def fetch_and_save(url, suffix):
    """Fetch content from URL and save to temp file"""
    response = requests.get(url)
    response.raise_for_status()
    tmp_path = safe_temp_file(suffix)
    mode = "wb" if suffix.endswith((".mp3", ".wav")) else "w"
    with open(tmp_path, mode) as f:
        f.write(response.content if mode=="wb" else response.text)
    return tmp_path

def fetch_and_save_lyrics(lyrics_url, suffix=".txt"):
    res = requests.get(lyrics_url)
    res.raise_for_status()
    data = res.json()

    all_lines = []

    # Process JSON lines
    if isinstance(data, dict) and "lines" in data:
        for line in data["lines"]:
            # Split embedded line breaks (\n, \r\n, \r)
            split_lines = line.replace("\r\n", "\n").replace("\r", "\n").split("\n")
            # Remove zero-width spaces and strip whitespace
            clean_lines = [l.replace("\u200B", "").strip() for l in split_lines if l.strip()]
            all_lines.extend(clean_lines)
    else:
        # Fallback: convert to string, normalize line breaks
        text = str(data).replace("\r\n", "\n").replace("\r", "\n")
        all_lines = [l.replace("\u200B", "").strip() for l in text.split("\n") if l.strip()]

    # Write all visual lines with consistent \n endings
    tmp_path = safe_temp_file(suffix)
    with open(tmp_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(all_lines))

    print(f"Saved lyrics to {tmp_path}. Total visual lines: {len(all_lines)}")
    return tmp_path


@app.route("/save_lyrics", methods=["GET", "POST"])
def save_lyrics():
    if request.method == "POST":
        data = request.get_json()
        url = data.get("url") if data else None
    else:  # GET
        url = request.args.get("url")

    if not url:
        return jsonify({"error": "Missing 'url' parameter"}), 400

    try:
        response = requests.get(url)
        response.raise_for_status()

        lyrics_text = response.text

        print("Fetched lyrics:", lyrics_text)
        save_path = "/tmp/lyrics.txt"
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(lyrics_text)

        return jsonify({"message": "Lyrics saved successfully", "path": save_path})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/align_song_full", methods=["POST"])
def align_song_full():
    """
    Expects JSON payload:
    {
        "lyrics_url": "...",
        "audio_url": "..."
    }
    Returns: JSON of aligned lyrics
    """
    print("📩 Got /align_song_full request", file=sys.stderr)
    data = request.json
    lyrics_url = data.get("lyrics_url")
    audio_url = data.get("audio_url")

    try:
        # 1️⃣ Fetch and save lyrics and audio
        lyrics_file = fetch_and_save_lyrics(lyrics_url)
        audio_file = fetch_and_save(audio_url, ".wav")
        print("🎵 Lyrics and audio downloaded", file=sys.stderr)
        with open(lyrics_file, "r", encoding="utf-8") as f:
            original = f.read()
        new_content = "[instrumental]\n" + original
        with open(lyrics_file, "w", encoding="utf-8") as f:
            f.write(new_content)
        # load into AudioSegment
        audio = AudioSegment.from_file(audio_file)
        # convert to mono, 16kHz, 16-bit
        audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)

        # export to temp WAV for Aeneas
        audio_wav_file = safe_temp_file(".wav")
        audio.export(audio_wav_file, format="wav", codec="pcm_s16le")
        print(f"🔊 Audio converted to WAV: {audio_wav_file}", file=sys.stderr)
        print("Audio duration (ms):", len(audio), file=sys.stderr)
        with open(lyrics_file, "r", encoding="utf-8") as f:
            text = f.read()
            print("Lyrics preview:", text, file=sys.stderr)
            lines = text.splitlines()  # splits on \n, \r\n, or \r

        print("Total lines:", len(lines), file=sys.stderr)

        # 3️⃣ Run Aeneas alignment
        sync_file = safe_temp_file(".json")
        task = Task(config_string="task_language=en|is_text_type=plain|os_task_file_format=json")
        task.audio_file_path_absolute = audio_wav_file
        task.text_file_path_absolute = lyrics_file
        task.sync_map_file_path_absolute = sync_file

        print("🔧 Running Aeneas alignment...", file=sys.stderr)
        ExecuteTask(task).execute()
        print("✅ Aeneas finished executing", file=sys.stderr)

        # 4️⃣ Read and parse sync file
        if not os.path.exists(sync_file):
            print("❌ Sync file missing", file=sys.stderr)
            return jsonify({"status": "error", "message": "Sync file was not created"})
        elif os.path.getsize(sync_file) == 0:
            print("⚠️ Sync file is empty", file=sys.stderr)
            return jsonify({"status": "error", "message": "Sync file is empty"})

        with open(sync_file, "r", encoding="utf-8") as f:
            raw = f.read()
            print("📜 Sync file content preview:", raw[:200], file=sys.stderr)
            sync_data = json.loads(raw)

        print("🗂 Sync map loaded successfully", file=sys.stderr)
        return jsonify({"status": "ok", "sync_map": sync_data})

    except requests.RequestException as e:
        print(f"❌ Failed to fetch files: {e}", file=sys.stderr)
        return jsonify({"status": "error", "message": f"Failed to fetch: {e}"})
    except Exception as e:
        print(f"⚠️ Alignment failed: {e}", file=sys.stderr)
        return jsonify({"status": "error", "message": f"Alignment failed: {e}"})



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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
