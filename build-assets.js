const fs = require("fs");
const path = require("path");

const root = __dirname;
const assetsDir = path.join(root, "assets");

const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const audioExts = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full);
    }
  }

  return files;
}

function relPosix(absPath) {
  return path.relative(root, absPath).split(path.sep).join("/");
}

const files = walk(assetsDir);

const images = files
  .filter((file) => imageExts.has(path.extname(file).toLowerCase()))
  .map(relPosix);

const audios = files
  .filter((file) => audioExts.has(path.extname(file).toLowerCase()))
  .map(relPosix);

const manifest = { images, audios };

fs.writeFileSync(
  path.join(assetsDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log("Generated assets/manifest.json");
console.log(`Images: ${images.length}`);
console.log(`Audios: ${audios.length}`);
