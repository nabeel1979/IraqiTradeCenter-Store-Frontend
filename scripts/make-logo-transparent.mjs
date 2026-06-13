import { Jimp } from 'jimp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const targets = [
  resolve(root, 'public/logo.png'),
  resolve(root, 'dist/logo.png'),
];

function isBackground(r, g, b, a) {
  if (a < 10) return true;
  // أبيض / فاتح جداً
  if (r > 238 && g > 238 && b > 238) return true;
  // أسود / داكن جداً (خلفية المربع)
  if (r < 28 && g < 28 && b < 28) return true;
  return false;
}

for (const file of targets) {
  const image = await Jimp.read(file);
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    if (isBackground(r, g, b, a)) {
      this.bitmap.data[idx + 3] = 0;
    }
  });
  await image.write(file);
  console.log('OK', file);
}
