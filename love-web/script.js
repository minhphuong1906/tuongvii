const passwordInput = document.getElementById("passwordInput");
const lockScreen = document.getElementById("lockScreen");
const profileScreen = document.getElementById("profileScreen");
const messageScreen = document.getElementById("messageScreen");
const albumScreen = document.getElementById("albumScreen");
const giftScreen = document.getElementById("giftScreen");
const errorMsg = document.getElementById("errorMsg");
const bgMusic = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
const finalWish = document.getElementById("finalWish");

function setActive(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function showSection(id) {
  const map = {
    lockScreen,
    profileScreen,
    messageScreen,
    albumScreen,
    giftScreen
  };
  setActive(map[id]);
}

function pressKey(num) {
  if (passwordInput.value.length < 6) {
    passwordInput.value += num;
  }
}

function clearAll() {
  passwordInput.value = "";
}

function backspace() {
  passwordInput.value = passwordInput.value.slice(0, -1);
}

function checkPassword() {
  if (passwordInput.value === "010711") {
    errorMsg.classList.remove("show");
    showSection("profileScreen");
    playMusic();
  } else {
    errorMsg.classList.add("show");
    passwordInput.value = "";
  }
}

function playMusic() {
  bgMusic.volume = 0.25;
  bgMusic.play().then(() => {
    musicBtn.textContent = "⏸";
  }).catch(() => {
    musicBtn.textContent = "▶";
  });
}

function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
    musicBtn.textContent = "⏸";
  } else {
    bgMusic.pause();
    musicBtn.textContent = "▶";
  }
}

function openGift() {
  finalWish.classList.remove("hidden");
}

function updateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric"
  });

  document.getElementById("time").textContent = time;
  document.getElementById("date").textContent = date;
}

updateTime();
setInterval(updateTime, 1000);

document.addEventListener("keydown", (e) => {
  if (lockScreen.classList.contains("active")) {
    if (e.key >= "0" && e.key <= "9") pressKey(e.key);
    if (e.key === "Backspace") backspace();
    if (e.key === "Enter") checkPassword();
    if (e.key === "Escape") clearAll();
  }
});
