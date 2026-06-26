const PASSWORD = "010711";

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
  setActive(map[name]);
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
  for (let i = 0; i < 12; i++) {
    setTimeout(createHeart, i * 90);
  }

  for (let i = 0; i < 10; i++) {
    setTimeout(createSparkle, i * 120);
  }

  setInterval(createHeart, 360);
  setInterval(createSparkle, 850);
}

function checkPassword() {
  if (passwordInput.value === PASSWORD) {
    errorMsg.classList.remove("show");
    showSection("profileScreen");
    if (!musicStarted) playMusic();
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

async function loadManifest() {
  try {
    const res = await fetch("./assets/manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No manifest");
    const data = await res.json();

    assets.images = Array.isArray(data.images) ? data.images : [];
    assets.audios = Array.isArray(data.audios) ? data.audios : [];
  } catch (err) {
    assets = { images: [], audios: [] };
  }
}

function renderAssets() {
  if (assets.images.length > 0) {
    avatarImage.src = `./${assets.images[0]}`;
  } else {
    avatarImage.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
        <rect width="100%" height="100%" rx="300" fill="#ffd7e6"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-size="42" fill="#5b2b45" font-family="Arial">Vi Vi ☀️</text>
      </svg>
    `);
  }

  albumGrid.innerHTML = "";

  const albumImages = assets.images.length > 0 ? assets.images : [];
  if (albumImages.length === 0) {
    albumGrid.innerHTML = `<div class="sub">Chưa có ảnh trong thư mục assets.</div>`;
  } else {
    albumImages.forEach((src) => {
      const wrap = document.createElement("div");
      wrap.className = "album-item";

      const img = document.createElement("img");
      img.src = `./${src}`;
      img.alt = baseName(src);
      img.loading = "lazy";

      wrap.appendChild(img);
      albumGrid.appendChild(wrap);
    });
  }

  if (assets.audios.length > 0) {
    bgMusic.src = `./${assets.audios[0]}`;
    trackName.textContent = baseName(assets.audios[0]);
  } else {
    trackName.textContent = "Chưa có file .mp3";
  }
}

document.addEventListener("keydown", (e) => {
  if (!lockScreen.classList.contains("active")) return;

  if (e.key >= "0" && e.key <= "9") pressKey(e.key);
  else if (e.key === "Backspace") backspace();
  else if (e.key === "Escape" || e.key === "Delete") clearAll();
  else if (e.key === "Enter") checkPassword();
});

updateTime();
setInterval(updateTime, 1000);

(async function init() {
  await loadManifest();
  renderAssets();

  // Nếu người dùng mở thẳng vào profile từ thao tác trước đó, vẫn giữ nhạc đúng.
  bgMusic.loop = true;
})();
