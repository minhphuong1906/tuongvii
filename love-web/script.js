const PASSWORD = "010711";

// Sửa đúng theo repo của bạn
const GITHUB_OWNER = "minhphuong1906";
const GITHUB_REPO = "tuongvii";
const GITHUB_BRANCH = "main";
const ASSET_ROOT = "assets";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

const CACHE_KEY = "tuongvii-assets-cache-v2";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 giờ

const lockScreen = document.getElementById("lockScreen");
const profileScreen = document.getElementById("profileScreen");
const messageScreen = document.getElementById("messageScreen");
const albumScreen = document.getElementById("albumScreen");
const giftScreen = document.getElementById("giftScreen");

const passwordInput = document.getElementById("passwordInput");
const errorMsg = document.getElementById("errorMsg");
const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");

const avatarImage = document.getElementById("avatarImage");
const albumGrid = document.getElementById("albumGrid");
const bgMusic = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
const trackName = document.getElementById("trackName");
const finalWish = document.getElementById("finalWish");

let assets = {
  images: [],
  audios: []
};

let musicFadeTimer = null;
let musicStarted = false;
let effectsStarted = false;
let heartInterval = null;
let sparkleInterval = null;

function setActive(screen) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function showSection(name) {
  const map = {
    lockScreen,
    profileScreen,
    messageScreen,
    albumScreen,
    giftScreen
  };

  if (map[name]) setActive(map[name]);
}

function pressKey(num) {
  if (passwordInput.value.length < 6) {
    passwordInput.value += num;
    if (passwordInput.value.length === 6) {
      setTimeout(checkPassword, 120);
    }
  }
}

function clearAll() {
  passwordInput.value = "";
  errorMsg.classList.remove("show");
}

function backspace() {
  passwordInput.value = passwordInput.value.slice(0, -1);
}

function updateTime() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  dateEl.textContent = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric"
  });
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

function isAudio(name) {
  return AUDIO_EXTS.has(extOf(name));
}

function pickAvatar(images) {
  if (!images.length) return null;

  const preferredNames = ["avatar", "avatar1", "profile", "profilepic", "profile-image"];
  const byPreferred = images.find((img) => {
    const name = baseName(img.name).toLowerCase().replace(/\s+/g, "");
    return preferredNames.includes(name) || name.startsWith("avatar");
  });

  return byPreferred || images[0];
}

function pickMusic(audios) {
  if (!audios.length) return null;

  const preferredNames = ["music", "bgmusic", "backgroundmusic", "soundtrack", "song"];
  const byPreferred = audios.find((aud) => {
    const name = baseName(aud.name).toLowerCase().replace(/\s+/g, "");
    return preferredNames.includes(name) || name.startsWith("music");
  });

  return byPreferred || audios[0];
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
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json();
}

async function walkGitHubDir(path) {
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

    if (!isImage(name) && !isAudio(name)) continue;

    results.push({
      kind: isImage(name) ? "image" : "audio",
      name,
      path: item.path,
      url: item.download_url || ""
    });
  }

  return results;
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
    assets.audios = items.filter((x) => x.kind === "audio");

    cacheAssets(assets);
  } catch (err) {
    console.error("Không tải được assets từ GitHub:", err);

    const fallback = getCachedAssets();
    if (fallback) {
      assets = fallback;
    } else {
      assets = { images: [], audios: [] };
    }
  }
}

function renderAssets() {
  const avatar = pickAvatar(assets.images);
  const music = pickMusic(assets.audios);

  // Avatar
  if (avatar?.url) {
    avatarImage.src = avatar.url;
  } else {
    avatarImage.src =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
          <rect width="100%" height="100%" rx="300" fill="#ffd7e6"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                font-size="42" fill="#5b2b45" font-family="Arial">Vi Vi ☀️</text>
        </svg>
      `);
  }

  // Album = tất cả ảnh trừ avatar được chọn
  albumGrid.innerHTML = "";
  const albumImages = avatar
    ? assets.images.filter((img) => img.path !== avatar.path)
    : assets.images.slice();

  if (albumImages.length === 0) {
    albumGrid.innerHTML = `<div class="sub">Chưa có ảnh trong repo.</div>`;
  } else {
    albumImages.forEach((item) => {
      const wrap = document.createElement("div");
      wrap.className = "album-item";

      const img = document.createElement("img");
      img.src = item.url;
      img.alt = baseName(item.name);
      img.loading = "lazy";
      img.decoding = "async";

      wrap.appendChild(img);
      albumGrid.appendChild(wrap);
    });
  }

  // Nhạc
  if (music?.url) {
    bgMusic.src = music.url;
    trackName.textContent = baseName(music.name);
  } else {
    trackName.textContent = "Chưa có file nhạc";
  }
}

function fadeMusicTo(targetVolume = 0.28, duration = 1200) {
  clearInterval(musicFadeTimer);

  const startVolume = bgMusic.volume;
  const steps = 30;
  let step = 0;

  musicFadeTimer = setInterval(() => {
    step += 1;
    const t = step / steps;
    bgMusic.volume = startVolume + (targetVolume - startVolume) * t;

    if (step >= steps) {
      clearInterval(musicFadeTimer);
      bgMusic.volume = targetVolume;
    }
  }, duration / steps);
}

async function playMusic() {
  if (!bgMusic.src) return;

  try {
    bgMusic.volume = 0;
    await bgMusic.play();
    fadeMusicTo(0.28, 1400);
    musicBtn.textContent = "⏸";
    musicStarted = true;
  } catch (err) {
    musicBtn.textContent = "▶";
  }
}

function toggleMusic() {
  if (!bgMusic.src) return;

  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      fadeMusicTo(0.28, 900);
      musicBtn.textContent = "⏸";
    }).catch(() => {
      musicBtn.textContent = "▶";
    });
  } else {
    bgMusic.pause();
    musicBtn.textContent = "▶";
  }
}

function createHeart() {
  const heart = document.createElement("div");
  heart.className = "bg-heart";

  const symbols = ["❤️", "💖", "💝", "🌸", "✨"];
  heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];

  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.fontSize = `${14 + Math.random() * 16}px`;
  heart.style.animationDuration = `${2.8 + Math.random() * 3.8}s`;
  heart.style.opacity = `${0.45 + Math.random() * 0.5}`;

  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 6500);
}

function createSparkle() {
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";

  sparkle.style.left = `${Math.random() * 100}vw`;
  sparkle.style.top = `${Math.random() * 100}vh`;
  sparkle.style.transform = `scale(${0.5 + Math.random()})`;

  document.body.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1700);
}

function launchEffects() {
  if (effectsStarted) return;
  effectsStarted = true;

  for (let i = 0; i < 12; i++) {
    setTimeout(createHeart, i * 90);
  }

  for (let i = 0; i < 10; i++) {
    setTimeout(createSparkle, i * 120);
  }

  heartInterval = setInterval(createHeart, 360);
  sparkleInterval = setInterval(createSparkle, 850);
}

function checkPassword() {
  if (passwordInput.value === PASSWORD) {
    errorMsg.classList.remove("show");
    showSection("profileScreen");

    if (!musicStarted) {
      playMusic();
    }

    launchEffects();
  } else {
    errorMsg.classList.add("show");
    passwordInput.value = "";
    lockScreen.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(0)" }
      ],
      { duration: 350, easing: "ease-out" }
    );
  }
}

function openGift() {
  finalWish.classList.remove("hidden");
  finalWish.textContent =
    "Chúc Vi luôn vui vẻ, mạnh khỏe, học thật tốt và lúc nào cũng rạng rỡ như một mặt trời nhỏ. ☀️";

  for (let i = 0; i < 16; i++) {
    setTimeout(createHeart, i * 70);
  }

  for (let i = 0; i < 12; i++) {
    setTimeout(createSparkle, i * 90);
  }
}

document.addEventListener("keydown", (e) => {
  if (!lockScreen.classList.contains("active")) return;

  if (e.key >= "0" && e.key <= "9") {
    pressKey(e.key);
  } else if (e.key === "Backspace") {
    backspace();
  } else if (e.key === "Escape" || e.key === "Delete") {
    clearAll();
  } else if (e.key === "Enter") {
    checkPassword();
  }
});

updateTime();
setInterval(updateTime, 1000);

(async function init() {
  await loadGitHubAssets();
  renderAssets();
  bgMusic.loop = true;
})();
