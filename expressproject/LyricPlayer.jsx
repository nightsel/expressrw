import React, { useEffect, useRef, useState } from "react";
import { Player } from "textalive-app-api";

export default function LyricPlayer() {
  const [lyrics, setLyrics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const playerRef = useRef(null);

  useEffect(() => {
    const player = new Player({
      app: { token: "YOUR_TEXTALIVE_API_TOKEN" }, // replace with your token
      mediaElement: null,
      mediaUrl: "https://www.youtube.com/watch?v=ScNNfyq3d_w", // example song
    });

    playerRef.current = player;

    player.addListener({
      onVideoReady: (v) => {
        // Collect words into an array
        const words = [];
        v.song.getLyrics().forEach((lyric) => {
          lyric.children.forEach((word) => {
            words.push({
              id: word.id,
              text: word.text,
              start: word.startTime,
              end: word.endTime,
            });
          });
        });
        setLyrics(words);
      },

      onTimeUpdate: (pos) => {
        // Find the current word index
        const idx = lyrics.findIndex(
          (w) => w.start <= pos && pos < w.end
        );
        if (idx !== -1 && idx !== currentIndex) {
          setCurrentIndex(idx);
        }
      },
    });
  }, [lyrics, currentIndex]);

  return (
    <div className="text-center p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-4">Lyric Sync Demo</h1>
      <div className="leading-loose">
        {lyrics.map((word, i) => (
          <span
            key={word.id}
            className={`px-1 ${
              i === currentIndex ? "text-yellow-400 font-bold" : ""
            }`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
}
