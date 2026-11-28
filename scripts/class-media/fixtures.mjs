import sharp from 'sharp';
import { copyFile, mkdir, open, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// This fixture is generated entirely from shapes and deterministic pixel noise.
// It contains no real photograph, identity or external artwork.
function groupOverlay(width, height) {
  const people = Array.from({ length: 14 }, (_, index) => {
    const x = 180 + index * 260;
    const shirt = ['#c93135', '#2472b0', '#e8c943', '#f4f4e9'][index % 4];
    return `<g transform="translate(${x} 440)">
      <circle cx="80" cy="75" r="55" fill="#d99e76" stroke="#2e2730" stroke-width="8"/>
      <path d="M25 160 Q80 125 135 160 L155 375 L5 375 Z" fill="${shirt}" stroke="#1d3140" stroke-width="8"/>
      <path d="M22 370 L65 370 L55 510 L5 510 Z M95 370 L138 370 L155 510 L105 510 Z" fill="#1b3348"/>
      <text x="80" y="255" text-anchor="middle" fill="#171f29" font-family="sans-serif" font-size="58">${index + 1}</text>
    </g>`;
  }).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 4096 3072">
    <path d="M0 2200 Q2048 1800 4096 2200" stroke="#f0f4ec" stroke-width="18" fill="none"/>
    <rect x="120" y="1120" width="3850" height="1500" rx="24" fill="none" stroke="#e9f0e6" stroke-width="14"/>
    ${people}
    <path d="M0 0 H460 V210 H0 Z" fill="#ed3540"/>
    <path d="M3636 0 H4096 V210 H3636 Z" fill="#2168ed"/>
    <text x="2048" y="2050" text-anchor="middle" fill="white" stroke="#233b35" stroke-width="4" paint-order="stroke" font-family="sans-serif" font-weight="bold" font-size="100">FICTIONAL TEAM • 1234567890</text>
    <g stroke="#fff" stroke-width="5">${Array.from({ length: 42 }, (_, n) => `<path d="M${180 + 90 * n} 2350 v${n % 2 ? 85 : 145}"/>`).join('')}</g>
  </svg>`);
}

function syntheticPixels(width, height) {
  const pixels = Buffer.allocUnsafe(width * height * 3);
  let seed = 0x6d2b79f5;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const noise = seed >>> 24;
      const sky = y < height * 0.44;
      const offset = (y * width + x) * 3;
      pixels[offset] = sky ? Math.min(255, 70 + (noise >> 1)) : Math.min(255, 20 + (noise >> 1));
      pixels[offset + 1] = sky ? Math.min(255, 105 + (noise >> 1)) : Math.min(255, 65 + (noise >> 1));
      pixels[offset + 2] = sky ? Math.min(255, 135 + (noise >> 1)) : Math.min(255, 15 + (noise >> 1));
    }
  }
  return pixels;
}

async function fixtureInfo(path) {
  const [file, image] = await Promise.all([stat(path), sharp(path).metadata()]);
  return { path, bytes: file.size, width: image.width, height: image.height,
    format: image.format, orientation: image.orientation ?? null, hasExif: Boolean(image.exif) };
}

/** Write only generated synthetic images into the supplied disposable directory. */
export async function createFixtures(directory) {
  await mkdir(directory, { recursive: true });
  const phonePath = join(directory, 'phone-group.jpg');
  const cameraPath = join(directory, 'camera-export.jpg');
  const width = 4096, height = 3072;
  const pixels = syntheticPixels(width, height);
  const source = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .composite([{ input: groupOverlay(width, height) }]).jpeg({ quality: 99, chromaSubsampling: '4:4:4' }).toBuffer();
  await writeFile(phonePath, source);
  await sharp(source).withMetadata({ orientation: 6 }).withExifMerge({
    IFD0: { Artist: 'Synthetic fixture' },
    IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '30/1 0/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '31/1 0/1 0/1' },
  }).jpeg({ quality: 99, chromaSubsampling: '4:4:4' }).toFile(cameraPath);

  const suitablePath = join(directory, 'suitable.jpg');
  const pngPath = join(directory, 'transparent.png');
  const webpPath = join(directory, 'transparent.webp');
  const brokenPath = join(directory, 'broken.jpg');
  const unsupportedPath = join(directory, 'unsupported.gif');
  const heicPath = join(directory, 'iphone.heic');
  const pixelLimitPath = join(directory, 'pixel-limit.png');
  const sourceLimitPath = join(directory, 'source-at-limit.jpg');
  const sourceOverLimitPath = join(directory, 'source-over-limit.jpg');
  await sharp(source).resize({ width: 1200 }).jpeg({ quality: 90 }).toFile(suitablePath);
  const alpha = { create: { width: 640, height: 480, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.35 } } };
  await sharp(alpha).png().toFile(pngPath);
  await sharp(alpha).webp().toFile(webpPath);
  await writeFile(brokenPath, Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00]));
  await writeFile(unsupportedPath, Buffer.from('GIF89a'));
  await writeFile(heicPath, Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    0, 0, 0, 0, 0x6d, 0x69, 0x66, 0x31, 0x68, 0x65, 0x69, 0x63]));
  await sharp({ create: { width: 6000, height: 5000, channels: 3, background: '#618c5f' } }).png().toFile(pixelLimitPath);
  for (const [path, size] of [[sourceLimitPath, 40_000_000], [sourceOverLimitPath, 40_000_001]]) {
    await copyFile(suitablePath, path);
    const file = await open(path, 'r+');
    try {
      await file.truncate(size);
    } finally {
      await file.close();
    }
  }
  return {
    phone: await fixtureInfo(phonePath),
    camera: await fixtureInfo(cameraPath),
    suitable: await fixtureInfo(suitablePath),
    png: await fixtureInfo(pngPath),
    webp: await fixtureInfo(webpPath),
    broken: { path: brokenPath, bytes: (await stat(brokenPath)).size },
    unsupported: { path: unsupportedPath, bytes: (await stat(unsupportedPath)).size },
    heic: { path: heicPath, bytes: (await stat(heicPath)).size },
    pixelLimit: await fixtureInfo(pixelLimitPath),
    sourceLimit: { path: sourceLimitPath, bytes: (await stat(sourceLimitPath)).size },
    sourceOverLimit: { path: sourceOverLimitPath, bytes: (await stat(sourceOverLimitPath)).size },
  };
}

/** Compare visible pixels after resizing the original and variants to a viewing width. */
export async function measureQuality(source, variants, viewingWidth = 1440) {
  const reference = await sharp(source).rotate().resize({ width: viewingWidth, withoutEnlargement: true })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const results = [];
  for (const variant of variants) {
    const measured = await sharp(variant.path).rotate()
      .resize(reference.info.width, reference.info.height, { fit: 'fill' })
      .removeAlpha().raw().toBuffer();
    let squaredError = 0;
    for (let index = 0; index < measured.length; index++) {
      squaredError += (reference.data[index] - measured[index]) ** 2;
    }
    const mse = squaredError / measured.length;
    results.push({ ...variant, bytes: (await stat(variant.path)).size, viewingWidth,
      rmse: Math.sqrt(mse), psnrDb: mse ? 10 * Math.log10(255 ** 2 / mse) : null });
  }
  return results;
}
