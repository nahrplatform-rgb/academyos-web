import sharp from 'sharp';
import { PeopleInputError } from './people';

export const photoUploadLimit = 512 * 1024;
export const photoRequestLimit = Math.ceil(photoUploadLimit / 3) * 4 + 1024;

export async function normalizePlayerPhoto(value: string) {
    try {
        const input = Buffer.from(value, 'base64');
        if (!input.length || input.length > photoUploadLimit || input.toString('base64') !== value) throw new PeopleInputError();
        const decoder = sharp(input, { limitInputPixels: 8000000, failOn: 'warning' });
        const info = await decoder.metadata();
        if (!['jpeg','png','webp'].includes(info.format) || (info.pages ?? 1) !== 1) throw new PeopleInputError();
        const image = await decoder.rotate().resize(192,192,{fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:65}).toBuffer();
        if (image.length > 20000) throw new PeopleInputError();
        return image.toString('base64');
    } catch {
        throw new PeopleInputError();
    }
}
