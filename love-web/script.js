const PASSWORD = "010711";

const GITHUB_OWNER = "minhphuong1906";
const GITHUB_REPO = "tuongvii";
const GITHUB_BRANCH = "main";
const ASSET_ROOT = "assets";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"]);

const CACHE_KEY = "tuongvii-assets-cache-v5";
const CACHE_TTL = 1000 * 60 * 60 * 24;
const START_DATE = new Date(2026, 3, 10); // April 10, 2026

const lockScreen = document.getElementById("lockScreen");
const homeScreen = document.getElementById("homeScreen");
const messageScreen = document.getElementById("messageScreen");
const albumScreen = document.getElementById("albumScreen");
const giftScreen = document.getElementById("giftScreen");
const imageModal = document.getElementById("imageModal");

const passwordInput = document.getElementById("passwordInput");
const errorMsg = document.getElementById("errorMsg");
const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");

const avatarImage = document.getElementById("avatarImage");
const albumGrid = document.getElementById("albumGrid");
const bgMusic = document.getElementById("bgMusic");
const modalImage = document.getElementById("modalImage");
const modalVideo = document.getElementById("modalVideo");
const videoPlayBtn = document.getElementById("videoPlayBtn");
const flowerBox = document.getElementById("flowerBox");
const giftBoxWrapper = document.getElementById("giftBoxWrapper");

let assets = {
  images: [],
  videos: [],
  audios: []
};

let currentAudioIndex = 0;
let musicStarted = false;

function setActive(screen) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function showSection(name) {
  const map = {
    lockScreen,
    homeScreen,
    messageScreen,
    albumScreen,
    giftScreen
  };
  if (map[name]) setActive(map[name]);
}

function pressKey(num) {
  if (passwordInput.value.length < 6) {
    passwordInput.value += num;
    updatePasswordDisplay();
    if (passwordInput.value.length === 6) {
      setTimeout(checkPassword, 300);
    }
  }
}

function clearAll() {
  passwordInput.value = "";
  updatePasswordDisplay();
  errorMsg.classList.remove("show");
}

function backspace() {
  passwordInput.value = passwordInput.value.slice(0, -1);
  updatePasswordDisplay();
}

function updatePasswordDisplay() {
  for (let i = 1; i <= 6; i++) {
    const dot = document.getElementById(`p${i}`);
    if (i <= passwordInput.value.length) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  }
}

function updateTime() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const options = { weekday: "long", day: "numeric", month: "numeric" };
  dateEl.textContent = now.toLocaleDateString("vi-VN", options);
}

function updateCounter() {
  const now = new Date();
  const diff = now - START_DATE;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = hours;
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("seconds").textContent = seconds;
}

function baseName(filePath) {
  const file = filePath.split("/").pop() || filePath;
  return file.replace(/\.[^.]+$/, "");
}

function extOf(fileName) {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : "";
}

function isImage(name) {
  return IMAGE_EXTS.has(extOf(name));
}

function isVideo(name) {
  return VIDEO_EXTS.has(extOf(name));
}

function isAudio(name) {
  return AUDIO_EXTS.has(extOf(name));
}

function pickAvatar(images) {
  if (!images.length) return null;
  const preferred = ["avatar", "avatar1", "profile", "profilepic"];
  const found = images.find((img) => {
    const name = baseName(img.name).toLowerCase().replace(/\s+/g, "");
    return preferred.includes(name) || name.startsWith("avatar");
  });
  return found || images[0];
}

function cacheAssets(data) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      data
    })
  );
}

function getCachedAssets() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.data) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function fetchGitHubPath(path) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURI(path)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function walkGitHubDir(path) {
  try {
    const data = await fetchGitHubPath(path);
    const entries = Array.isArray(data) ? data : [data];
    let results = [];

    for (const item of entries) {
      if (!item?.type || !item?.path) continue;
      if (item.type === "dir") {
        results = results.concat(await walkGitHubDir(item.path));
        continue;
      }
      if (item.type !== "file") continue;

      const name = item.name || item.path.split("/").pop();
      if (!name) continue;

      if (item.size === 0) continue;

      if (!isImage(name) && !isVideo(name) && !isAudio(name)) continue;

      let kind = "image";
      if (isVideo(name)) kind = "video";
      else if (isAudio(name)) kind = "audio";

      results.push({
        kind,
        name,
        path: item.path,
        url: item.download_url || ""
      });
    }
    return results;
  } catch (err) {
    console.error("Error walking directory:", err);
    return [];
  }
}

async function loadGitHubAssets() {
  const cached = getCachedAssets();
  if (cached) {
    assets = cached;
    return;
  }

  try {
    const items = await walkGitHubDir(ASSET_ROOT);
    items.sort((a, b) => a.path.localeCompare(b.path, "vi"));

    assets.images = items.filter((x) => x.kind === "image");
    assets.videos = items.filter((x) => x.kind === "video");
    assets.audios = items.filter((x) => x.kind === "audio");

    console.log("Assets loaded:", assets);
    cacheAssets(assets);
  } catch (err) {
    console.error("Failed to load assets:", err);
  }
}

function renderAssets() {
  const avatar = pickAvatar(assets.images);

  if (avatar?.url) {
    avatarImage.src = avatar.url;
  } else {
    avatarImage.src =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#ff6b9d;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ffc0cb;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" rx="50" fill="url(#grad)"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                font-size="60" fill="white" font-family="Arial" font-weight="bold">Vi</text>
        </svg>
      `);
  }

  albumGrid.innerHTML = "";
  const allMedia = [
    ...assets.images.filter((img) => !avatar || img.path !== avatar.path),
    ...assets.videos
  ];

  if (allMedia.length === 0) {
    albumGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ff69b4;">Chưa có ảnh/video</p>`;
  } else {
    allMedia.forEach((item) => {
      const wrap = document.createElement("div");
      wrap.className = "album-item";
      if (item.kind === "video") wrap.classList.add("is-video");

      if (item.kind === "video") {
        const video = document.createElement("video");
        video.src = item.url;
        wrap.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.src = item.url;
        img.alt = baseName(item.name);
        wrap.appendChild(img);
      }

      wrap.onclick = () => openImageModal(item);
      albumGrid.appendChild(wrap);
    });
  }

  // Load first audio
  if (assets.audios.length > 0) {
    loadNextAudio();
  }
}

function loadNextAudio() {
  if (assets.audios.length === 0) return;
  const audio = assets.audios[currentAudioIndex];
  bgMusic.src = audio.url;
  console.log("Music loaded:", audio.url);
  currentAudioIndex = (currentAudioIndex + 1) % assets.audios.length;
}

function playMusic() {
  if (!bgMusic.src) {
    console.error("No music source");
    return;
  }

  try {
    bgMusic.volume = 0.3;
    bgMusic.play().catch((err) => {
      console.error("Playback error:", err);
    });
  } catch (err) {
    console.error("Play error:", err);
  }
}

function checkPassword() {
  if (passwordInput.value === PASSWORD) {
    errorMsg.classList.remove("show");
    showSection("homeScreen");
    if (!musicStarted) {
      playMusic();
      musicStarted = true;
    }
  } else {
    errorMsg.textContent = "✗ Sai mật khẩu!";
    errorMsg.classList.add("show");
    passwordInput.value = "";
    updatePasswordDisplay();
  }
}

function openImageModal(item) {
  imageModal.classList.remove("hidden");
  imageModal.classList.add("active");

  if (item.kind === "video") {
    modalVideo.classList.remove("hidden");
    modalImage.classList.add("hidden");
    modalVideo.src = item.url;
    videoPlayBtn.classList.remove("hidden");
  } else {
    modalImage.classList.remove("hidden");
    modalVideo.classList.add("hidden");
    modalImage.src = item.url;
    videoPlayBtn.classList.add("hidden");
  }
}

function closeImageModal() {
  imageModal.classList.add("hidden");
  imageModal.classList.remove("active");
  modalVideo.pause();
}

function playModalVideo() {
  modalVideo.play();
  videoPlayBtn.classList.add("hidden");
}

function openGift() {
  // Hide gift box, show flower
  giftBoxWrapper.style.display = "none";
  flowerBox.classList.remove("hidden");
  
  // Auto hide flower after 5 seconds
  setTimeout(() => {
    flowerBox.classList.add("hidden");
    giftBoxWrapper.style.display = "block";
  }, 5000);
}

function goToLoveGame() {
  window.location.href = "https://yeuhaykhongyeu-delta.vercel.app/";
}

document.addEventListener("keydown", (e) => {
  if (!lockScreen.classList.contains("active")) return;

  if (e.key >= "0" && e.key <= "9") {
    pressKey(e.key);
  } else if (e.key === "Backspace") {
    backspace();
  } else if (e.key === "Escape") {
    clearAll();
  } else if (e.key === "Enter") {
    checkPassword();
  }
});

bgMusic.addEventListener("ended", () => {
  if (assets.audios.length > 0) {
    loadNextAudio();
    playMusic();
  }
});

updateTime();
setInterval(updateTime, 1000);
setInterval(updateCounter, 1000);

(async function init() {
  await loadGitHubAssets();
  renderAssets();
  updateCounter();
  bgMusic.preload = "auto";
  bgMusic.loop = false;
})();
