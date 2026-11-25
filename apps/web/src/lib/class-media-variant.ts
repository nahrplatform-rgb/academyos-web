import sharp from 'sharp';
import { classMediaLimits } from './class-media-limits';

const contentTypes = new Map([
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
]);
const pngEnd = Buffer.from('0000000049454e44ae426082', 'hex');

function hasFileBoundary(body: Buffer, type: string) {
  if (type === 'image/jpeg') return body.at(-2) === 0xff && body.at(-1) === 0xd9;
  if (type === 'image/png') return body.subarray(-pngEnd.length).equals(pngEnd);
  return body.length >= 12 && body.readUInt32LE(4) === body.length - 8;
}

export class ClassMediaVariantError extends Error {
  constructor(public readonly code: 'too_large' | 'invalid_variant') {
    super(code);
  }
}

export async function readClassMediaVariant(
  stream: ReadableStream<Uint8Array>,
  variant: 'main' | 'thumbnail',
) {
  const limit = variant === 'main' ? classMediaLimits.storedBytes : classMediaLimits.thumbnailBytes;
  return validateClassMediaVariant(await readClassMediaBytes(stream, limit), variant);
}

export async function readClassMediaBytes(stream: ReadableStream<Uint8Array>, limit: number) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel().catch(() => {});
        throw new ClassMediaVariantError('too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, length);
}

export async function validateClassMediaVariant(body: Buffer, variant: 'main' | 'thumbnail') {
  const axis = variant === 'main' ? classMediaLimits.mainAxis : classMediaLimits.thumbnailAxis;
  const limit = variant === 'main' ? classMediaLimits.storedBytes : classMediaLimits.thumbnailBytes;
  if (body.byteLength > limit) throw new ClassMediaVariantError('too_large');
  try {
    const decoder = sharp(body, { failOn: 'warning', limitInputPixels: axis * axis });
    const info = await decoder.metadata();
    const type = contentTypes.get(info.format);
    if (!type || !hasFileBoundary(body, type) || !info.width || !info.height || info.width > axis || info.height > axis ||
      (info.pages ?? 1) !== 1 || info.exif || info.iptc || info.xmp || info.comments?.length ||
      (info.orientation ?? 1) !== 1) throw new ClassMediaVariantError('invalid_variant');
    await decoder.stats();
    return { body, type, width: info.width, height: info.height };
  } catch {
    throw new ClassMediaVariantError('invalid_variant');
  }
}
