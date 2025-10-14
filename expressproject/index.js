
import express from "express";
import cors from "cors";
import Sentiment from "sentiment";
import pkg from "pg";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";
import { execFile } from 'child_process';
import os from "os";
import util from "util";

import { spawn } from "child_process";
import ytdlp from 'yt-dlp-exec';
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
/*

import { Player } from "textalive-app-api";
import fetch from "node-fetch"; // or "import fetch from 'node-fetch'" in ESM

const player = new Player({
  app: {
    token: process.env.TEXTALIVE_TOKEN, // your token
    name: "My Audio Player"
  }
});

const songUrl = "https://www.nicovideo.jp/watch/so45125163";

await player.createFromSongUrl(songUrl);

async function displayLyricsWithTimings(player) {
  if (!player.data.lyrics?.url) {
    console.log("No lyrics URL available");
    return;
  }

  // Fetch raw lyrics
  const response = await fetch(player.data.lyrics.url);
  const text = await response.text();

  const lines = text
    .split("\n")
    .filter(line => line.trim() !== "");

  const lyricArrays = player.data.lyrics.data;

  // Skip metadata rows at the top
  const skipCount = lines.length - lyricArrays.length;
  const lyricLines = lines.slice(skipCount);

  const timedLyrics = lyricLines.map((lineText, i) => {
    const syllables = lyricArrays[i];
    if (!syllables || syllables.length === 0) {
      return { text: lineText, startTime: undefined, endTime: undefined, syllables: [] };
    }

    // Optionally, split text into "syllables" (naive split: 1 char per syllable)
    // You can replace this with more advanced kana/romaji split if needed
    const chars = [...lineText];
    const syllableCount = syllables.length;
    const charsPerSyllable = Math.ceil(chars.length / syllableCount);
    const textSyllables = [];
    for (let j = 0; j < syllableCount; j++) {
      textSyllables.push(chars.slice(j * charsPerSyllable, (j + 1) * charsPerSyllable).join(""));
    }

    // Combine timings with text
    const timedSyllables = syllables.map((s, idx) => ({
      text: textSyllables[idx] || "",
      startTime: s.start_time,
      endTime: s.end_time
    }));

    return {
      text: lineText,
      startTime: timedSyllables[0].startTime,
      endTime: timedSyllables[timedSyllables.length - 1].endTime,
      syllables: timedSyllables
    };
  });

  // Print everything
  timedLyrics.forEach((line, idx) => {
    console.log(`Line ${idx + 1}: "${line.text}" [${line.startTime?.toFixed(2)} - ${line.endTime?.toFixed(2)}]`);
    line.syllables.forEach((s, i) => {
      console.log(`  Syllable ${i + 1}: "${s.text}" [${s.startTime?.toFixed(2)} - ${s.endTime?.toFixed(2)}]`);
    });
  });
}

displayLyricsWithTimings(player);*/

/*
async function fetchLyrics(songUrl) {
  try {
    await player.createFromSongUrl(songUrl);

    const lyrics = player.data.lyrics;

    //console.log("Raw lyrics:", JSON.stringify(player.data.lyrics, null, 2));
    //console.log(JSON.stringify(player.data.lyrics.data[0][0], null, 2));
    if (!lyrics || !lyrics.data) {
      console.log("No lyrics available for this song");
      return [];
    }

    const timedLyrics = player.data.lyrics.data
      .flatMap(line => line)   // flatten phrases
      .flatMap(part => part)   // flatten words/parts
      .map(l => ({
        startTime: l.start_time,
        endTime: l.end_time,
        text: l.text || ""  // fallback to empty string if text missing
      }));
    return timedLyrics;
  } catch (err) {
    console.error("Failed to fetch lyrics:", err);
    return [];
  }
}
import { load } from "cheerio"; // <- correct import

async function fetchPiaproLyrics(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const html = await res.text();

    const $ = load(html);

    // Piapro usually wraps lyrics in <div class="itemBody">
    const lyrics = $(".itemBody")
      .text()
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lyrics;
  } catch (err) {
    console.error("Failed to fetch Piapro lyrics:", err);
    return [];
  }
}

// Example usage
const url = "https://www.nicovideo.jp/watch/so45125163"; // the URL from your song object
fetchPiaproLyrics(url).then(lyrics => {
  console.log("Lyrics lines:", lyrics);
});

//fetchLyrics("http://nicovideo.jp%2Fwatch%2Fsm33447778");

fetchLyrics("https://www.nicovideo.jp/watch/so45125163");*/
/*
const buffer = await downloadYouTubeToBuffer(url);
const filename = `temp_audio_${uuidv4()}.mp3`;

const { data, error } = await supabase
  .storage
  .from("audio")
  .upload(filename, buffer, { cacheControl: "3600", upsert: true });

if (error) throw error;

const publicUrl = supabase.storage.from("audio").getPublicUrl(filename).data.publicUrl;
return publicUrl;*/
/*
import fetch from "node-fetch"; // or native fetch in Node 18+
import { load } from "cheerio";

async function fetchLyrics(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const html = await res.text();

    const $ = load(html);
    const lyrics = $(".itemBody")
      .text()
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lyrics; // returns an array of lines
  } catch (err) {
    console.error("Failed to fetch Piapro lyrics:", err);
    return [];
  }
}*/

import axios from "axios";
import * as cheerio from "cheerio";





const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // use the environment variable for security
  ssl: {
    rejectUnauthorized: false // allows Node to accept self-signed certificates
  }
});

const TEXTALIVE_TOKEN = process.env.TEXTALIVE_TOKEN;

 // Quick DB test
(async () => {
  const client = await pool.connect();
  const res = await client.query("SELECT NOW()");
  console.log("DB connected at:", res.rows[0].now);
  client.release();
})();

const app = express();
const port = process.env.PORT || 10000;


async function downloadYouTubeToBuffer(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", ["-x", "--audio-format", "wav", "-o", "-", url], {
  stdio: ["ignore", "pipe", "pipe"]
});

    const chunks = [];
    let errorData = "";

    ytdlp.stdout.on("data", chunk => chunks.push(chunk));
    ytdlp.stderr.on("data", chunk => errorData += chunk.toString());

    ytdlp.on("error", err => reject(err));
    ytdlp.on("close", code => {
      if (code !== 0) return reject(new Error(`yt-dlp failed:\n${errorData}`));
      resolve(Buffer.concat(chunks)); // THIS is a real Buffer
    });

  //  ytdlp.stdin.end(); // close stdin
  });
}

async function cleanSupabaseTemp() {
  try {
    const { data: files, error: listError } = await supabase
      .storage
      .from('audio')
      .list();

    if (listError) return console.error("Supabase list error:", listError);

    const now = Date.now();
    const expiryMs = 15 * 60 * 1000; // 15 minutes old

    const filesToDelete = files
      .filter(file => {
        const created = new Date(file.created_at).getTime();
        return now - created > expiryMs;
      })
      .map(file => file.name);

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .storage
        .from('audio')
        .remove(filesToDelete);

      if (deleteError) console.error("Supabase delete error:", deleteError);
      else console.log("Deleted Supabase temp files:", filesToDelete);
    }
  } catch (err) {
    console.error("Supabase cleanup failed:", err);
  }
}

// Run immediately and then periodically
cleanSupabaseTemp();
setInterval(cleanSupabaseTemp, 15 * 60 * 1000); // every 5 minutes
/*
function cleanOldFiles() {
  const tempFolder = path.join(process.cwd(), "temp_audio"); // <-- define tempFolder
  if (!fs.existsSync(tempFolder)) return; // no folder, nothing to clean

  const files = fs.readdirSync(tempFolder);
  const now = Date.now();

  files.forEach(file => {
    const filePath = path.join(tempFolder, file);
    const stats = fs.statSync(filePath);
    const ageMs = now - stats.mtimeMs;

    if (ageMs > 15 * 60 * 1000) { // older than 15 minutes
      fs.unlink(filePath, err => {
        if (err) console.error("Failed to delete old file:", err);
        else console.log("Deleted old file:", file);
      });
    }
  });
}

// Run immediately and periodically
cleanOldFiles();
setInterval(cleanOldFiles, 5 * 60 * 1000);*/

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static("public"));

//const GENIUS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
//import https from "https";


// cloud debug
/*
const cmd = `curl -k -H "Authorization: Bearer ${process.env.GENIUS_ACCESS_TOKEN}" "https://api.genius.com/search?q=coldplay%20yellow"`;

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error("Curl failed:", err);
    return;
  }

  try {
    const data = JSON.parse(stdout);
    console.log("Genius API response:", data);
  } catch (parseErr) {
    console.error("Failed to parse JSON:", parseErr);
  }
});
*/
//const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// debug song id
/*
const artist = "Coldplay";
const song = "Yellow";
const query = encodeURIComponent(`${artist} ${song}`);
const cmd = `curl -k -s -H "Authorization: Bearer ${process.env.GENIUS_ACCESS_TOKEN}" "https://api.genius.com/search?q=${query}"`;

exec(cmd, (err, stdout) => {
  if (err) return console.error("Curl failed:", err);

  try {
    const data = JSON.parse(stdout);
    const hits = data.response.hits || [];
    if (!hits.length) {
      console.log("No hits found");
      return;
    }

    hits.forEach((hit, index) => {
      console.log(
        `${index + 1}. Song: ${hit.result.full_title}, ID: ${hit.result.id}, URL: https://genius.com${hit.result.path}`
      );
    });
  } catch (e) {
    console.error("Failed to parse JSON:", e);
  }
});*/


// The version below doesnt work due to cloud service not having google chrome
/*import puppeteer from "puppeteer";

async function getLyricsGenius(artist, song) {
  // Format the URL like Genius expects
  const formattedArtist = artist.replace(/\s+/g, "-");
  const formattedSong = song.replace(/\s+/g, "-");
  const url = `https://genius.com/${formattedArtist}-${formattedSong}-lyrics`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // required for many cloud providers
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for lyrics container to appear
    await page.waitForSelector('div[data-lyrics-container="true"]', { timeout: 5000 });

    // Extract lyrics lines
    const lines = await page.$$eval('div[data-lyrics-container="true"]', els =>
      els.flatMap(el => el.innerText.split("\n").map(l => l.trim()).filter(Boolean))
    );

    return lines.length ? lines : null;
  } catch (err) {
    console.warn("Puppeteer fetch failed:", err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}*/

// test-browserless.js


/*const TOKEN = process.env.BROWSERLESS_TOKEN; // set your token in env variable

(async () => {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://production-sfo.browserless.io?token=${TOKEN}`,
    });

    const page = await browser.newPage();
    await page.goto("https://vocaloidlyrics.miraheze.org/wiki/ST/AR", { waitUntil: "domcontentloaded" });

    const title = await page.title();
    console.log("Page title:", title);

    await browser.close();
    console.log("Browserless test succeeded!");
  } catch (err) {
    console.error("Browserless test failed:", err.message);
  }
})();*/
/* doesnt work. too strict policies on Genius.com
import Genius from "genius-lyrics-api";

const options = {
  apiKey: process.env.GENIUS_ACCESS_TOKEN, // your Genius API key
  title: "",   // to be set per song
  artist: "",  // to be set per song
  optimizeQuery: true
};

export async function getLyricsGenius(artist, song) {
  try {
    options.title = song;
    options.artist = artist;
    const lyrics = await Genius.getLyrics(options);

    if (!lyrics) {
      console.warn("No lyrics found via genius-lyrics-api");
      return null;
    }

    // Split into lines for convenience
    const lines = lyrics.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.length ? lines : null;
  } catch (err) {
    console.warn("genius-lyrics-api fetch failed:", err.message);
    return null;
  }
}

export default getLyricsGenius;*/

/*
export async function getLyricsGeniusDirect(artist, song) {
  const formattedSong = song.replace(/\s+/g, "-");
  const formattedArtist = artist.replace(/\s+/g, "-");
  const songUrl = `https://genius.com/${formattedArtist}-${formattedSong}-lyrics`;

  // 1. Try fetching HTML via curl first
  try {
    const html = await new Promise((resolve, reject) => {
      const cmd = `curl -k -L -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${songUrl}"`;
      exec(cmd, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout);
      });
    });

    const $ = cheerio.load(html);
    const lines = [];
    $('div[data-lyrics-container="true"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text)
        lines.push(...text.split("\n").map((l) => l.trim()).filter(Boolean));
    });

    if (lines.length) return lines;
    // If curl succeeds but no lyrics found, fall through to axios
    console.warn("Curl succeeded but no lyrics found, trying axios fallback...");
  } catch (err) {
    console.warn("Curl failed:", err.message, "Trying axios fallback...");
  }

  // 2. Fallback: axios (might fail on cloud)
  try {
    const { data } = await axios.get(songUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    const $ = cheerio.load(data);
    const lines = [];
    $('div[data-lyrics-container="true"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text)
        lines.push(...text.split("\n").map((l) => l.trim()).filter(Boolean));
    });
    return lines.length ? lines : null;
  } catch (err) {
    console.warn("Axios fallback failed:", err.message);
    return null;
  }
}*/


/* Does not work due to anti bot requests.
async function getLyricsAZ(artist, song) {
  const formattedArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, '');
  const formattedSong = song.toLowerCase().replace(/[^a-z0-9]/g, '');
  const url = `https://www.azlyrics.com/lyrics/${formattedArtist}/${formattedSong}.html`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      },
      timeout: 5000
    });
    const $ = cheerio.load(data);
    const mainDiv = $('div.col-xs-12.col-lg-8.text-center').first();
    const lyricsDiv = mainDiv.children('div').filter((i, el) => !el.attribs.class && !el.attribs.id).first();
    const lines = lyricsDiv.text().trim().split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) throw new Error("No lyrics found");
    return lines;
  } catch (err) {
    console.warn("AZLyrics failed:", err.message);
    return null;
  }
}*/

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

/*app.get("/translate", async (req, res) => {
  const { text, target_lang } = req.query;
  const result = await translateText(text, target_lang || "EN");
  res.json({ translation: result });
});*/


export async function translateText(text, targetLang = "EN") {
  try {
    const response = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      new URLSearchParams({
        auth_key: process.env.DEEPL_API_KEY,
        text,
        target_lang: targetLang,
      })
    );
    return response.data.translations[0].text;
  } catch (err) {
    console.error("DeepL translation failed:", err.message);
    return null;
  }
}

/**
 * Fetch the first song URL from Utaten search.
 */
async function searchUtaten(artist, title) {
  const query = encodeURIComponent(`${artist} ${title}`);

  const url = `https://utaten.com/search?sort=popular_sort_asc&artist_name=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}&beginning=&body=&lyricist=&composer=&sub_title=&tag=&show_artists=1`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const $ = cheerio.load(data);

    // Collect all links in search results
    const results = [];
    $(".searchResult a").each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href");
      if (href) results.push({ text, href });
    });

    // Utaten search result links
    const firstLink = results.find(r => r.href.includes("/lyric/"))?.href;

    if (!firstLink) return null;

    // Full URL
    return firstLink.startsWith("http") ? firstLink : `https://utaten.com${firstLink}`;
  } catch (err) {
    console.error("Utaten search failed:", err.message);
    return null;
  }
}

/**
 * Fetch lyrics from a specific Utaten lyrics page
 */
 export async function fetchUtatenLyrics(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });

    const $ = cheerio.load(data);

    const lyricLines = $(".hiragana");
    const lines = [];

    lyricLines.each((i, line) => {
      const $line = $(line);

      function extractText(node) {
        const $node = $(node);

        if (node.type === "text") {
          return node.data.trim();
        }

        if ($node.is("br") || $node.is("b")) {
          return "\n"; // treat <b> like a line break too
        }

        if ($node.hasClass("ruby")) {
          // Only get the rb part, ignore rt
          const rbText = $node.find(".rb").map((_, el) => $(el).text().trim()).get().join("");
          return rbText;
        }

        if (node.children && node.children.length > 0) {
          return node.children.map(extractText).join("");
        }

        return "";
      }

      // join, collapse multiple \n into one, then split into lines
      const fullText = line.children.map(extractText).join("");
      const splitLines = fullText
        .split(/\n+/)          // split by any consecutive line breaks
        .map(l => l.trim())    // remove leading/trailing spaces
        .filter(Boolean);      // remove empty lines

      lines.push(...splitLines);
    });

    return lines;
  } catch (err) {
    console.error("Utaten fetch failed:", err.message);
    return null;
  }
}

export async function fetchUtatenRomaji(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });

    const $ = cheerio.load(data);
    const lyricLines = $(".romaji");
    const lines = [];

    lyricLines.each((i, line) => {
      function extractText(node) {
        const $node = $(node);

        if (node.type === "text") {
          return node.data.trim();
        }

        if ($node.is("br") || $node.is("b")) {
          return "\n";
        }

        if ($node.hasClass("ruby")) {
          // join all <rt> inside this ruby with no extra space
          const rtText = $node.find(".rt").map((_, el) => $(el).text().trim()).get().join("");
          return rtText;
        }

        if (node.children && node.children.length > 0) {
          // recursively extract children and join with space
          return node.children.map(extractText).join(" ");
        }

        return "";
      }

      // <-- add space between top-level children here
      const fullText = line.children.map(extractText).filter(Boolean).join(" ");
      const splitLines = fullText
        .split(/\n+/)
        .map(l => l.trim())
        .filter(Boolean);

      lines.push(...splitLines);
    });

    return lines;
  } catch (err) {
    console.error("Utaten romaji fetch failed:", err.message);
    return null;
  }
}

/**
 * Full helper: fetch lyrics from Utaten by artist/title
 */
export async function getLyricsUtaten(artist, song, mode="normal") {
  const lyricsUrl = await searchUtaten(artist, song);
  if (!lyricsUrl) return null;
  let lines;
  if (mode == "romaji") lines = await fetchUtatenRomaji(lyricsUrl);
  else {
    lines = await fetchUtatenLyrics(lyricsUrl);
  }
  return lines;
}

export async function getLyricsLT(artist, song) {
  const formattedSong = song.replace(/\s+/g, "-");
  const formattedArtist = artist.replace(/\s+/g, "-");
  //const formattedArtist = artist;
  //const formattedSong = song;
  const songUrl = `https://lyricstranslate.com/en/${formattedArtist}-${formattedSong}-lyrics.html`;

  // 1️⃣ Try fetching HTML via curl first
  try {
    const html = await new Promise((resolve, reject) => {
      const cmd = `curl -k -L -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${songUrl}"`;
      exec(cmd, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout);
      });
    });

    const $ = cheerio.load(html);
    const lines = [];
    $('#song-body').each((_, el) => {
      const text = $(el).text().trim();
      if (text) lines.push(...text.split("\n").map((l) => l.trim()).filter(Boolean));
    });

    if (lines.length) return lines;
    console.warn("Curl succeeded but no lyrics found, trying axios fallback...");
  } catch (err) {
    console.warn("Curl failed:", err.message, "Trying axios fallback...");
  }

  // 2️⃣ Fallback: axios (might still fail on cloud)
  try {
    const { data } = await axios.get(songUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });

    const $ = cheerio.load(data);
    const lines = [];
    $('#song-body').each((_, el) => {
      const text = $(el).text().trim();
      if (text) lines.push(...text.split("\n").map((l) => l.trim()).filter(Boolean));
    });

    if (lines.length) return lines;
    console.warn("Axios succeeded but no lyrics found.");
  } catch (err) {
    console.warn("Axios fallback failed:", err.message, );
  }

  // 3️⃣ Final fallback: Browserless (works even if cloud IP is blocked)
/*  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://production-sfo.browserless.io?token=${BROWSERLESS_TOKEN}`,
    });

    const page = await browser.newPage();
    await page.goto(songUrl, { waitUntil: "domcontentloaded" });
    const html = await page.content();

    const $ = cheerio.load(html);
    const lines = [];
    $('div[data-lyrics-container="true"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text) lines.push(...text.split("\n").map((l) => l.trim()).filter(Boolean));
    });

    await browser.close();
    return lines.length ? lines : null;
  } catch (err) {
    console.warn("Browserless fallback failed:", err.message);
    return null;
  }*/
}

async function getLyricsLN(artist, song) {
  const formattedArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const formattedSong = song.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const url = `https://www.lyrical-nonsense.com/lyrics/${formattedArtist}/${formattedSong}/`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Prefer Romaji if available
    let lyricsDiv = $('#Romaji #PriLyr');

    // If Romaji not found, fall back to any PriLyr
    if (!lyricsDiv.length) {
      lyricsDiv = $('#PriLyr');
    }

    if (!lyricsDiv.length) throw new Error("No lyrics found");
    // Convert <br> to newline
    lyricsDiv.find('br').replaceWith('\n');

    // Split by newline, trim, filter empty lines, remove leading numbers
    const lines = lyricsDiv.text()
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line
        .replace(/^\d+\.\s?/, '')   // remove leading numbers
        .replace(/\d+\.$/, '')      // remove trailing numbers
      );

    return lines;
  } catch (err) {
    console.warn("Lyrical Nonsense failed:", err.message);
    return null;
  }
}

/**
 * Search Letras.com for a song and return the first lyrics page URL.
 * @param {string} song - Song name (required)
 * @param {string} [artist] - Optional artist name
 * @returns {Promise<string|null>} - Full URL of first lyrics page or null if not found
 */
 // this function needs to use browserless because Letras uses google search to fill
 // html with javascript, which cannot be loaded without browserless.
 const TOKEN = process.env.BROWSERLESS_TOKEN;

 let browser; // global browser instance

 async function getBrowser() {
   if (!browser) {
     console.log("Starting new browser instance...");
     browser = await puppeteer.connect({
       browserWSEndpoint: `wss://production-sfo.browserless.io?token=${TOKEN}`,
     });
   }
   return browser;
 }


 /**
  * Fetches the first lyrics link from Letras for a given artist and song.
  */
 export async function searchLetras(artist, song) {
   try {
     const browser = await getBrowser();
     const page = await browser.newPage();

     const query = encodeURIComponent(`${artist} ${song}`);
     const searchUrl = `https://www.letras.com/?q=${query}`;
     await page.goto(searchUrl, { waitUntil: "networkidle2" });

     // Wait for the search results container
     await page.waitForSelector(".gsc-webResult.gsc-result", { timeout: 10000 });

     // Grab first lyrics link
     const firstLink = await page.$eval(
       ".gsc-webResult.gsc-result .gs-title a",
       (el) => el.href
     );

     await page.close();

     if (!firstLink) return null;
     return firstLink.startsWith("http") ? firstLink : `https://www.letras.com${firstLink}`;
   } catch (err) {
     console.error("Letras search failed:", err.message);
     return null;
   }
 }

 /**
  * Close the browser instance (optional, e.g., on app shutdown)
  */
 export async function closeBrowser() {
   if (browser) {
     await browser.close();
     browser = null;
     console.log("Browser closed");
   }
 }

 /**
 * Fetch lyrics from a Letras lyrics page
 */
 export async function fetchLetrasLyrics(url) {
   try {

     const { data } = await axios.get(url, {
       headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
     });

     const $ = cheerio.load(data);
     const lyricsDiv = $(".lyric-original");
     if (!lyricsDiv.length) return null;

     const lines = [];

     function extractText(node) {
       if (node.type === "text") {
         return node.data;
       }

       if (node.name === "br") {
         return "\n";
       }

       if (node.name === "p") {
         // Extract children, then add a line break after the paragraph
         const inner = node.children.map(extractText).join("");
         return inner + "\n";
       }

       if (node.children && node.children.length) {
         return node.children.map(extractText).join("");
       }

       return "";
     }

     lyricsDiv.each((i, el) => {
       const text = extractText(el);
       lines.push(...text.split(/\n+/).map(l => l.trim()).filter(Boolean));
     });

     return lines;
   } catch (err) {
     console.error("Letras fetch failed:", err.message);
     return null;
   }
 }

export async function getLyricsLetras(artist, song) {
  let url = await searchLetras(artist, song);
  if (!url) return null;
  url = url.replace(/\/traduc?a?o?n?\.html$/, "");
  url = url.replace(/\/traduccion.html$/, "");
  console.log(url);
  const lyrs = await fetchLetrasLyrics(url);
  await  closeBrowser();
  return lyrs;
}


export async function getLyrics(artist, song, mode = "normal", site = "LN") {
  let lines;
  if (mode == "romaji") {
    lines = await getLyricsUtaten(artist, song, "romaji");
  }
  if (site == "Letras") lines = await getLyricsLetras(artist, song);
  if (site == "LT") lines = await getLyricsLT(artist, song);
  if (site == "Utaten") lines = await getLyricsUtaten(artist, song);
  if (!lines) lines = await getLyricsLN(artist, song);
  if (!lines && (site != "LT")) lines = await getLyricsLT(artist, song);
  if (!lines && (site != "Utaten")) lines = await getLyricsUtaten(artist, song);
  if (!lines && (site != "Letras")) lines = await getLyricsLetras(artist, song);
  if (mode === "translate") {
    const textToTranslate = lines.filter(Boolean).join("\n"); // skip nulls
    const translated = await translateText(textToTranslate);
    lines = translated ? translated.split("\n") : lines;
  }

  return lines || [];
}

async function saveLyricsToFile(artist, song, mode = "normal",site = "LN") {
  const lines = await getLyrics(artist, song, mode, site);

  if (!lines || lines.length === 0) {
    console.log("No lyrics found.");
    return;
  }

  // Join lines into a single string
  const text = lines.join("\n");

  // Optional: create a safe filename
  const fileName = `${artist} - ${song}.txt`.replace(/[\/\\?%*:|"<>]/g, "-");
  const filePath = path.join("./lyrics", fileName);

  // Make sure the folder exists
  fs.mkdirSync("./lyrics", { recursive: true });

  // Write the file
  fs.writeFileSync(filePath, text, "utf-8");

  console.log(`Lyrics saved to ${filePath}`);
}

const execAsync = util.promisify(exec);

app.get("/align-lyrics", async (req, res) => {
  let { audioUrl, lyrics } = req.query;
  if (!audioUrl || !lyrics) return res.status(400).json({ error: "Missing audio or lyrics" });
  lyrics = `[instrumental]\n${lyrics}`;
  const id = uuidv4();
  const tempJsonPath = path.join(os.tmpdir(), `temp_alignment_${id}.json`);
  const bucketName = "alignments";


  try {
    // --- Run Aeneas ---
    const configString = `task_language=eng|os_task_file_format=json`;
    const task = await aeneas.createTask(configString, tempPath, lyrics);
    await task.execute();
    await task.outputFile(tempJsonPath);

    // --- Read JSON and upload to Supabase ---
    const jsonBuffer = fs.readFileSync(tempJsonPath);
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(`temp_alignment_${id}.json`, jsonBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: "application/json",
      });
    if (uploadError) throw uploadError;

    // --- Create signed URL ---
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(`temp_alignment_${id}.json`, 60 * 60);
    if (signedError) throw signedError;
    if (!signedData?.signedUrl) throw new Error("Signed URL not returned");

    res.json({ url: signedData.signedUrl });

    // --- Cleanup ---
    [tempPath, tempJsonPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));

  } catch (err) {
    [tempPath, tempJsonPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
    res.json({ error: "Something went wrong. Please check your input and try again." });
  }
});

// Example usage:
//alignLyrics("wastequa.wav", "waste2.txt", "test.json");




/*app.get('/getLyrics', async (req, res) => {
  try {
    // Decode special characters
    const artist = decodeURIComponent(req.query.artist);
    const song = decodeURIComponent(req.query.song);

    const lines = await getLyrics(artist, song); // calls your local getLyrics function
    res.json(lines); // return as array
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});*/


//getLyrics("coldplay", "yellow").then(console.log)

app.get("/lyrics", async (req, res) => {
  const { artist, song, mode, site } = req.query;
  if (!artist || !song) return res.status(400).json({ error: "artist and song required" });
  const lines = await getLyrics(artist, song, mode, site);
  res.json({ lines });
});

//getLyrics("*Luna","ST/A#R", "translate")

const sentiment = new Sentiment();

// ----- Sentiment Endpoint -----
app.post("/sentiment", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const result = sentiment.analyze(text);
  res.json({
    text,
    score: result.score,
    comparative: result.comparative,
    words: result.words
  });
});

// download and save to Supabase
app.get("/download-audio", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing audio URL" });

  const id = uuidv4();
  const tempPath = path.join(os.tmpdir(), `temp_audio_${id}.wav`);
  const bucketName = "audio";

  try {
    // --- Download audio from YouTube/SoundCloud using yt-dlp ---
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: "wav",
      output: tempPath,
      quiet: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    // --- Read the temp file into a Buffer ---

    const buffer = fs.readFileSync(tempPath);

    // --- Upload to Supabase ---
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(`temp_audio_${id}.wav`, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: "audio/mpeg",
      });

    if (uploadError) throw uploadError;

    // --- Create a signed URL ---
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(`temp_audio_${id}.wav`, 60 * 60);

    if (signedError) throw signedError;
    if (!signedData?.signedUrl) throw new Error("Signed URL not returned");

    res.json({ url: signedData.signedUrl });

    // --- Cleanup temp file ---
    fs.unlinkSync(tempPath);

  } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      // Return a friendly message for the frontend
      res.json({ error: "Please check the URL and try again." });
    }
});

// for personal debugging
app.get("/my-audio", (req, res) => {
  const filePath = path.join(process.cwd(), "public/proxy-audio.wav");
  res.sendFile(filePath);
});


app.get("/proxy-audio", async (req, res) => {
  try {
    const fileUrl = req.query.url;
    if (!fileUrl) return res.status(400).json({ error: "Missing ?url parameter" });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");

    const upstream = await fetch(fileUrl);
    if (!upstream.ok) return res.status(500).json({ error: "Failed to fetch audio" });

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const range = req.headers.range;
    const total = buffer.length;

    if (range) {
      // Parse range header
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (!match) return res.status(400).send("Malformed range header");

      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : total - 1;

      res.status(206); // Partial Content
      res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", (end - start) + 1);
      res.setHeader("Content-Type", "audio/mpeg");

      res.end(buffer.slice(start, end + 1));
    } else {
      res.setHeader("Content-Length", total);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Type", "audio/mpeg");
      res.end(buffer);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Proxy failed" });
  }
});






app.get("/temp-audio/:id", (req, res) => {
  const { id } = req.params;
  const tempFolder = path.join(process.cwd(), "temp_audio");
  const filePath = path.join(tempFolder, `temp_audio_${id}.wav`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      if (err.code === "ECONNABORTED") {
        console.warn("Client aborted connection (normal for small files)");
      } else {
        console.error("Error sending file:", err);
      }
    } else {
      console.log("File sent successfully");
    }
  });
});

app.get("/luna", async (req, res) => {
  try {
    const { data, error } = await supabase
      .storage.from('defaulttrack')
      .download('lunastar.mp3');
    if (error) throw error;

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const range = req.headers.range;
    const total = buffer.length;

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : total - 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", end - start + 1);
      res.setHeader("Content-Type", "audio/mpeg");
      res.end(buffer.slice(start, end + 1));
    } else {
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", total);
      res.setHeader("Content-Type", "audio/mpeg");
      res.end(buffer);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching audio");
  }
});


/*app.get("/temp-audio", (req, res) => {
  const filePath = path.join(process.cwd(), "temp_audio.mp3");
  res.sendFile(filePath);
});*/

/*app.get("/api/lyrics", async (req, res) => {
  try {
    // Example proxy request to TextAlive
    const r = await fetch("https://api.textalive.jp/some-endpoint", {
      headers: { Authorization: `Bearer ${TEXTALIVE_TOKEN}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});*/

// ----- Poll Backend -----

// Ping route (useful for waking Render backend)
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Submit a vote

app.post("/vote", async (req, res) => {
  const { option, feedback } = req.body;
  if (!option) return res.status(400).json({ error: "No option provided" });

  try {
    await pool.query(
      "INSERT INTO votes (option, feedback) VALUES ($1, $2)",
      [option, feedback || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get current results (aggregated)
// Only return vote counts, no feedback
app.get("/results", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT option, COUNT(*) AS vote_count FROM votes GROUP BY option"
    );

    const votesData = {};
    result.rows.forEach(row => {
      votesData[row.option] = parseInt(row.vote_count);
    });

    res.json(votesData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


// ----- Start Server -----
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
