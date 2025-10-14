import requests
from tempfile import NamedTemporaryFile
from pydub import AudioSegment
from aeneas.executetask import ExecuteTask
from aeneas.task import Task
import json
import os

# ------------------------------
# 1️⃣ Fetch lyrics from Express
# ------------------------------
lyrics_url = "https://expressproject-al0i.onrender.com/lyrics?artist=steve%20aoki&song=waste%20it%20on%20me%20feat%20bts"
try:
    res = requests.get(lyrics_url)
    res.raise_for_status()
    lyrics_lines = res.json().get("lines", [])
    print(f"Lyrics fetched: {len(lyrics_lines)} lines")
except requests.RequestException as e:
    print("Error fetching lyrics:", e)
    lyrics_lines = []

output_file = "waste.txt"

with open(output_file, "w", encoding="utf-8") as f:
    for line in lyrics_lines:
        f.write(line + "\n")

print(f"Lyrics saved to {output_file}")



# ------------------------------
# 2️⃣ Fetch MP3 from Express
# ------------------------------
audio_url = "https://expressproject-al0i.onrender.com/luna"
audio_file = NamedTemporaryFile(suffix=".mp3", delete=False)
resp = requests.get(audio_url)
resp.raise_for_status()
audio_file.write(resp.content)
audio_file.close()
print(f"Audio fetched: {audio_file.name}")

# ------------------------------
# 3️⃣ Convert MP3 → WAV (mono, 16 kHz)
# ------------------------------
input_file = "waste.mp3"  # your existing file
wav_file = NamedTemporaryFile(suffix=".wav", delete=False)
# Load and convert
sound = AudioSegment.from_file(input_file)
sound = sound.set_channels(1)
sound = sound.set_frame_rate(16000)
sound.export(wav_file.name, format="wav", codec="pcm_s16le")
wav_file.close()

print(f"Converted to WAV: {wav_file.name}")
""""
# ------------------------------
# 4️⃣ Split audio into chunks
# ------------------------------
def split_audio(wav_path, chunk_length_ms=30000):
    sound = AudioSegment.from_file(wav_path)
    chunks = []
    for i in range(0, len(sound), chunk_length_ms):
        chunk = sound[i:i+chunk_length_ms]
        chunks.append(chunk)
    return chunks

chunks = split_audio(wav_file.name, chunk_length_ms=20000)  # 20s chunks
print(f"Number of chunks: {len(chunks)}")

# ------------------------------
# 5️⃣ Align chunks with Aeneas (force Python backend)
# ------------------------------
config_string = "task_language=ja|is_text_type=plain|os_task_file_format=json|tts=none"

all_sync_data = []

for i, chunk in enumerate(chunks):
    # Determine lyrics for this chunk
    start_line = i * (len(lyrics_lines) // len(chunks))
    end_line = (i + 1) * (len(lyrics_lines) // len(chunks))
    chunk_lyrics = lyrics_lines[start_line:end_line]

    if not chunk_lyrics:
        print(f"Skipping chunk {i}: no lyrics")
        continue

    # Export chunk to file
    chunk_file_path = f"chunk_{i}.wav"
    chunk.export(chunk_file_path, format="wav", codec="pcm_s16le")

    # Save chunk lyrics to file
    chunk_lyrics_file = f"chunk_{i}.txt"
    with open(chunk_lyrics_file, "w", encoding="utf-8") as f:
        f.write("\n".join(chunk_lyrics))

    # Create Aeneas task (force Python backend)
    task = Task(config_string=config_string)
    task.audio_file_path_absolute = chunk_file_path
    task.text_file_path_absolute = chunk_lyrics_file
    task.sync_map_file_path_absolute = f"sync_chunk_{i}.json"

    try:
        ExecuteTask(task).execute()
        task.output_sync_map_file()
        print(f"Chunk {i} alignment done: {task.sync_map_file_path_absolute}")

        # Append chunk fragments to overall sync data
        with open(task.sync_map_file_path_absolute, "r", encoding="utf-8") as f:
            chunk_data = json.load(f)
            all_sync_data.extend(chunk_data.get("fragments", []))
    except Exception as e:
        print(f"Error aligning chunk {i}:", e)

# ------------------------------
# 6️⃣ Save full alignment
# ------------------------------
with open("full_sync_map.json", "w", encoding="utf-8") as f:
    json.dump({"fragments": all_sync_data}, f, indent=2)

print("All chunks processed. Full sync map saved as full_sync_map.json")

# ------------------------------
# 7️⃣ Inspect one chunk (optional)
# ------------------------------
chunk_file = "sync_chunk_0.json"  # example
with open(chunk_file, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Number of fragments in chunk 0: {len(data['fragments'])}")
for fragment in data["fragments"]:
    print(f"Start: {fragment['begin']}, End: {fragment['end']}, Text: {fragment['lines']}")
"""
