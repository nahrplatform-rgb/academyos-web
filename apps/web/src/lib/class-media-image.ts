import { classMediaLimits } from './class-media-limits';

export type ClassMediaImageType = 'image/jpeg' | 'image/png' | 'image/webp';
export type ClassMediaImageErrorCode =
  | 'source_too_large'
  | 'unsupported_type'
  | 'heic_requires_export'
  | 'invalid_image'
  | 'dimensions_exceeded'
  | 'decode_failed'
  | 'encode_failed'
  | 'output_too_large';

export class ClassMediaImageError extends Error {
  constructor(public readonly code: ClassMediaImageErrorCode) {
    super(code);
  }
}

export type ClassMediaImageInfo = {
  type: ClassMediaImageType;
  width: number;
  height: number;
};

export type PreparedClassMediaImage = {
  main: Blob;
  thumbnail: Blob;
  source: ClassMediaImageInfo;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

const headerLimit = 1024 * 1024;

function matches(bytes: Uint8Array, offset: number, signature: readonly number[]) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end));
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new ClassMediaImageError('invalid_image');
    while (bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const size = (bytes[offset] << 8) | bytes[offset + 1];
    if (size < 2 || offset + size > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (size < 8) throw new ClassMediaImageError('invalid_image');
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += size;
  }
  throw new ClassMediaImageError('invalid_image');
}

function webpDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 12) !== 'WEBP')
    throw new ClassMediaImageError('invalid_image');
  const chunk = ascii(bytes, 12, 16);
  if (chunk === 'VP8X') {
    if ((bytes[20] & 0x02) !== 0) throw new ClassMediaImageError('unsupported_type');
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }
  if (chunk === 'VP8L' && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    };
  }
  if (chunk === 'VP8 ' && matches(bytes, 23, [0x9d, 0x01, 0x2a])) {
    return {
      width: (bytes[27] << 8 | bytes[26]) & 0x3fff,
      height: (bytes[29] << 8 | bytes[28]) & 0x3fff,
    };
  }
  throw new ClassMediaImageError('invalid_image');
}

export async function inspectClassMediaImage(file: Blob): Promise<ClassMediaImageInfo> {
  if (file.size > classMediaLimits.sourceBytes) throw new ClassMediaImageError('source_too_large');
  if (file.size < 16) throw new ClassMediaImageError('invalid_image');

  const bytes = new Uint8Array(await file.slice(0, headerLimit).arrayBuffer());
  const heif = bytes.length >= 16 && ascii(bytes, 4, 8) === 'ftyp' &&
    /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(ascii(bytes, 8, 12));
  if (heif || /image\/(?:heic|heif)(?:-sequence)?/i.test(file.type))
    throw new ClassMediaImageError('heic_requires_export');

  let type: ClassMediaImageType;
  let dimensions: { width: number; height: number };
  if (matches(bytes, 0, [0xff, 0xd8, 0xff])) {
    type = 'image/jpeg';
    dimensions = jpegDimensions(bytes);
  } else if (matches(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    if (bytes.length < 24 || ascii(bytes, 12, 16) !== 'IHDR')
      throw new ClassMediaImageError('invalid_image');
    type = 'image/png';
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    dimensions = { width: header.getUint32(16), height: header.getUint32(20) };
  } else if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    type = 'image/webp';
    dimensions = webpDimensions(bytes);
  } else {
    throw new ClassMediaImageError('unsupported_type');
  }
  if (file.type && file.type.toLowerCase() !== type && file.type !== 'application/octet-stream')
    throw new ClassMediaImageError('unsupported_type');
  const { width, height } = dimensions;
  if (!width || !height) throw new ClassMediaImageError('invalid_image');
  if (width > classMediaLimits.sourceAxis || height > classMediaLimits.sourceAxis ||
      width * height > classMediaLimits.sourcePixels)
    throw new ClassMediaImageError('dimensions_exceeded');
  return { type, width, height };
}

function sizeWithin(width: number, height: number, limit: number) {
  const scale = Math.min(1, limit / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function encode(canvas: HTMLCanvasElement, type: 'image/jpeg' | 'image/webp', quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob || blob.type !== type) reject(new ClassMediaImageError('encode_failed'));
      else resolve(blob);
    }, type, quality);
  });
}

async function encodeWithin(canvas: HTMLCanvasElement, type: 'image/jpeg' | 'image/webp', limit: number) {
  for (const quality of [0.9, 0.85, 0.8]) {
    const blob = await encode(canvas, type, quality);
    if (blob.size <= limit) return blob;
  }
  throw new ClassMediaImageError('output_too_large');
}

export async function prepareClassMediaImage(
  file: Blob,
  options: { maxEdge?: number } = {},
): Promise<PreparedClassMediaImage> {
  const maxEdge = options.maxEdge ?? classMediaLimits.mainAxis;
  if (!Number.isInteger(maxEdge) || maxEdge < classMediaLimits.thumbnailAxis || maxEdge > classMediaLimits.mainAxis)
    throw new RangeError('Invalid image edge');
  const source = await inspectClassMediaImage(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ClassMediaImageError('decode_failed');
  }

  const mainCanvas = document.createElement('canvas');
  const thumbCanvas = document.createElement('canvas');
  try {
    if (!bitmap.width || !bitmap.height ||
        bitmap.width > classMediaLimits.sourceAxis || bitmap.height > classMediaLimits.sourceAxis ||
        bitmap.width * bitmap.height > classMediaLimits.sourcePixels)
      throw new ClassMediaImageError('dimensions_exceeded');
    const mainSize = sizeWithin(bitmap.width, bitmap.height, maxEdge);
    const thumbSize = sizeWithin(bitmap.width, bitmap.height, classMediaLimits.thumbnailAxis);
    mainCanvas.width = mainSize.width;
    mainCanvas.height = mainSize.height;
    thumbCanvas.width = thumbSize.width;
    thumbCanvas.height = thumbSize.height;
    const mainContext = mainCanvas.getContext('2d');
    const thumbContext = thumbCanvas.getContext('2d');
    if (!mainContext || !thumbContext) throw new ClassMediaImageError('encode_failed');
    mainContext.drawImage(bitmap, 0, 0, mainSize.width, mainSize.height);
    thumbContext.drawImage(bitmap, 0, 0, thumbSize.width, thumbSize.height);
    const outputType = source.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
    const main = await encodeWithin(mainCanvas, outputType, classMediaLimits.storedBytes);
    const thumbnail = await encodeWithin(thumbCanvas, outputType, classMediaLimits.thumbnailBytes);
    return {
      main,
      thumbnail,
      source,
      width: mainSize.width,
      height: mainSize.height,
      thumbnailWidth: thumbSize.width,
      thumbnailHeight: thumbSize.height,
    };
  } finally {
    bitmap.close();
    mainCanvas.width = 0;
    mainCanvas.height = 0;
    thumbCanvas.width = 0;
    thumbCanvas.height = 0;
  }
}
