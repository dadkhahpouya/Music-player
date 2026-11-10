"use strict";

// ---------- Elements ----------
const audio = document.getElementById("audio");
const player = document.getElementById("player");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");
const seek = document.getElementById("seek");
const currentEl = document.getElementById("current");
const durationEl = document.getElementById("duration");
const volumeEl = document.getElementById("volume");
const muteBtn = document.getElementById("muteBtn");
const playlistEl = document.getElementById("playlist");
const fileInput = document.getElementById("fileInput");

// ---------- State ----------
// Demo tracks (need internet). You can also add your own songs with the button.
const tracks = [
  { title: "Demo Song 1", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "Demo Song 2", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "Demo Song 3", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

let index = 0;
let shuffle = false;
let repeat = false;
let seeking = false;

// ---------- Helpers ----------
function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = i === index ? "active" : "";
    const name = document.createElement("span");
    name.textContent = `${i + 1}. ${t.title}`;
    const art = document.createElement("span");
    art.textContent = t.artist;
    li.append(name, art);
    li.addEventListener("click", () => loadTrack(i, true));
    playlistEl.appendChild(li);
  });
}

function setPlayingUI(isPlaying) {
  playBtn.textContent = isPlaying ? "⏸" : "▶";
  player.classList.toggle("playing", isPlaying);
}

// ---------- Core ----------
function loadTrack(i, autoplay = false) {
  if (!tracks.length) return;
  index = (i + tracks.length) % tracks.length;
  const t = tracks[index];
  audio.src = t.src;
  titleEl.textContent = t.title;
  artistEl.textContent = t.artist;
  seek.value = 0;
  currentEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  renderPlaylist();
  if (autoplay) play();
  else setPlayingUI(false);
}


function play() {
  if (!audio.src) return;
  audio.play().catch(err => {
    // Happens when the file can't load or the browser blocks autoplay
    console.warn("Playback failed:", err);
    setPlayingUI(false);
  });
}

function pause() { audio.pause(); }

function togglePlay() {
  if (audio.paused) play(); else pause();
}

function randomIndex() {
  if (tracks.length < 2) return index;
  let r;
  do { r = Math.floor(Math.random() * tracks.length); } while (r === index);
  return r;
}

function next() {
  loadTrack(shuffle ? randomIndex() : index + 1, true);
}

function prev() {
  // If more than 3 seconds in, restart the track instead
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    loadTrack(shuffle ? randomIndex() : index - 1, true);
  }
}

// ---------- Audio events ----------
audio.addEventListener("play", () => setPlayingUI(true));
audio.addEventListener("pause", () => setPlayingUI(false));

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (seeking || !audio.duration) return;
  seek.value = (audio.currentTime / audio.duration) * 100;
  currentEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener("ended", () => {
  if (repeat) {
    audio.currentTime = 0;
    play();
  } else {
    next();
  }
});

audio.addEventListener("error", () => {
  artistEl.textContent = "Could not load this track";
  setPlayingUI(false);
});

// ---------- UI events ----------
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", next);
prevBtn.addEventListener("click", prev);

shuffleBtn.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleBtn.classList.toggle("active", shuffle);
  shuffleBtn.setAttribute("aria-pressed", shuffle);
});

repeatBtn.addEventListener("click", () => {
  repeat = !repeat;
  repeatBtn.classList.toggle("active", repeat);
  repeatBtn.setAttribute("aria-pressed", repeat);
});

seek.addEventListener("input", () => {
  seeking = true;
  if (audio.duration) {
    currentEl.textContent = formatTime((seek.value / 100) * audio.duration);
  }
});
seek.addEventListener("change", () => {
  if (audio.duration) {
    audio.currentTime = (seek.value / 100) * audio.duration;
  }
  seeking = false;
});

volumeEl.addEventListener("input", () => {
  audio.volume = Number(volumeEl.value);
  audio.muted = audio.volume === 0;
  updateVolumeIcon();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  updateVolumeIcon();
});

function updateVolumeIcon() {
  muteBtn.textContent = audio.muted || audio.volume === 0 ? "🔇" : "🔊";
}

// Add local songs
fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files).filter(f => f.type.startsWith("audio/"));
  if (!files.length) return;
  const firstNewIndex = tracks.length;
  files.forEach(f => {
    tracks.push({
      title: f.name.replace(/\.[^/.]+$/, ""),
      artist: "My file",
      src: URL.createObjectURL(f)
    });
  });
  fileInput.value = "";
  loadTrack(firstNewIndex, true);
});

// Keyboard shortcuts
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" && e.target.type !== "range") return;
  switch (e.code) {
    case "Space":
      e.preventDefault();
      togglePlay();
      break;
    case "ArrowRight":
      if (e.target === seek) return;
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      break;
    case "ArrowLeft":
      if (e.target === seek) return;
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      break;
    case "KeyN": next(); break;
    case "KeyP": prev(); break;
  }
});

// ---------- Init ----------
audio.volume = Number(volumeEl.value);
loadTrack(0, false);
