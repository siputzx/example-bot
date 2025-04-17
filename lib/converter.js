const crypto = require('crypto');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const webp = require('node-webpmux');
const { tmpdir } = require('os');
const { spawn } = require('child_process');

/**
 * Converts an image buffer to WebP format.
 * @param {Buffer} media - Image buffer.
 * @returns {Promise<Buffer>} WebP buffer.
 */
async function imageToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);

    try {
        await fs.writeFile(tmpFileIn, media);
        await new Promise((resolve, reject) => {
            ffmpeg(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
                ])
                .toFormat('webp')
                .save(tmpFileOut);
        });
        const buff = await fs.readFile(tmpFileOut);
        return buff;
    } finally {
        await Promise.all([fs.unlink(tmpFileOut).catch(() => {}), fs.unlink(tmpFileIn).catch(() => {})]);
    }
}

/**
 * Converts a video buffer to WebP format.
 * @param {Buffer} media - Video buffer.
 * @returns {Promise<Buffer>} WebP buffer.
 */
async function videoToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);

    try {
        await fs.writeFile(tmpFileIn, media);
        await new Promise((resolve, reject) => {
            ffmpeg(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                    '-loop', '0',
                    '-ss', '00:00:00',
                    '-t', '00:00:05',
                    '-preset', 'default',
                    '-an',
                    '-vsync', '0'
                ])
                .toFormat('webp')
                .save(tmpFileOut);
        });
        const buff = await fs.readFile(tmpFileOut);
        return buff;
    } finally {
        await Promise.all([fs.unlink(tmpFileOut).catch(() => {}), fs.unlink(tmpFileIn).catch(() => {})]);
    }
}

/**
 * Converts a WebP buffer to an image (JPEG/PNG).
 * @param {Buffer} media - WebP buffer.
 * @param {string} format - Output format ('jpg' or 'png').
 * @returns {Promise<Buffer>} Image buffer.
 */
async function webpToImage(media, format = 'jpg') {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${format}`);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        await fs.writeFile(tmpFileIn, media);
        await new Promise((resolve, reject) => {
            ffmpeg(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .toFormat(format)
                .save(tmpFileOut);
        });
        const buff = await fs.readFile(tmpFileOut);
        return buff;
    } finally {
        await Promise.all([fs.unlink(tmpFileOut).catch(() => {}), fs.unlink(tmpFileIn).catch(() => {})]);
    }
}

/**
 * Converts a WebP buffer to a video (MP4).
 * @param {Buffer} media - WebP buffer.
 * @returns {Promise<Buffer>} Video buffer.
 */
async function webpToVideo(media) {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        await fs.writeFile(tmpFileIn, media);
        await new Promise((resolve, reject) => {
            ffmpeg(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-ab', '128k',
                    '-ar', '44100',
                    '-crf', '32',
                    '-preset', 'slow'
                ])
                .toFormat('mp4')
                .save(tmpFileOut);
        });
        const buff = await fs.readFile(tmpFileOut);
        return buff;
    } finally {
        await Promise.all([fs.unlink(tmpFileOut).catch(() => {}), fs.unlink(tmpFileIn).catch(() => {})]);
    }
}

/**
 * Adds EXIF metadata to a WebP image.
 * @param {Buffer} media - Image buffer.
 * @param {Object} metadata - Metadata object with packname, author, and optional categories.
 * @returns {Promise<string>} Path to the output WebP file.
 */
async function writeExifImg(media, metadata) {
    let wMedia = await imageToWebp(media);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        await fs.writeFile(tmpFileIn, wMedia);
        if (metadata.packname || metadata.author) {
            const img = new webp.Image();
            const json = {
                'sticker-pack-id': 'https://github.com/Anantha26',
                'sticker-pack-name': metadata.packname,
                'sticker-pack-publisher': metadata.author,
                'emojis': metadata.categories || ['']
            };
            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);
            await img.load(tmpFileIn);
            img.exif = exif;
            await img.save(tmpFileOut);
        }
        return tmpFileOut;
    } finally {
        await fs.unlink(tmpFileIn).catch(() => {});
    }
}

/**
 * Adds EXIF metadata to a WebP video.
 * @param {Buffer} media - Video buffer.
 * @param {Object} metadata - Metadata object with packname, author, and optional categories.
 * @returns {Promise<string>} Path to the output WebP file.
 */
async function writeExifVid(media, metadata) {
    let wMedia = await videoToWebp(media);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        await fs.writeFile(tmpFileIn, wMedia);
        if (metadata.packname || metadata.author) {
            const img = new webp.Image();
            const json = {
                'sticker-pack-id': 'https://github.com/Anantha26',
                'sticker-pack-name': metadata.packname,
                'sticker-pack-publisher': metadata.author,
                'emojis': metadata.categories || ['']
            };
            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);
            await img.load(tmpFileIn);
            img.exif = exif;
            await img.save(tmpFileOut);
        }
        return tmpFileOut;
    } finally {
        await fs.unlink(tmpFileIn).catch(() => {});
    }
}

/**
 * Adds EXIF metadata to a media file (WebP, image, or video).
 * @param {Object} media - Media object with mimetype and data.
 * @param {Object} metadata - Metadata object with packname, author, and optional categories.
 * @returns {Promise<string>} Path to the output WebP file.
 */
async function writeExif(media, metadata) {
    let wMedia = /webp/.test(media.mimetype) ? media.data : /image/.test(media.mimetype) ? await imageToWebp(media.data) : /video/.test(media.mimetype) ? await videoToWebp(media.data) : '';
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        await fs.writeFile(tmpFileIn, wMedia);
        if (metadata.packname || metadata.author) {
            const img = new webp.Image();
            const json = {
                'sticker-pack-id': 'https://github.com/KirBotz',
                'sticker-pack-name': metadata.packname,
                'sticker-pack-publisher': metadata.author,
                'emojis': metadata.categories || ['']
            };
            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);
            await img.load(tmpFileIn);
            img.exif = exif;
            await img.save(tmpFileOut);
        }
        return tmpFileOut;
    } finally {
        await fs.unlink(tmpFileIn).catch(() => {});
    }
}

/**
 * Generic FFmpeg wrapper for processing media buffers.
 * @param {Buffer} buffer - Media buffer.
 * @param {string[]} args - FFmpeg arguments.
 * @param {string} ext - Input file extension.
 * @param {string} ext2 - Output file extension.
 * @returns {Promise<Object>} Object containing data, filename, and delete method.
 */
async function ffmpegWrapper(buffer, args = [], ext = '', ext2 = '') {
    const tmp = path.join(tmpdir(), `${+new Date()}.${ext}`);
    const out = `${tmp}.${ext2}`;

    try {
        await fs.writeFile(tmp, buffer);
        await new Promise((resolve, reject) => {
            spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
                .on('error', reject)
                .on('close', (code) => (code === 0 ? resolve() : reject(code)));
        });
        const data = await fs.readFile(out);
        return {
            data,
            filename: out,
            async delete() {
                await fs.unlink(out).catch(() => {});
            }
        };
    } finally {
        await fs.unlink(tmp).catch(() => {});
    }
}

/**
 * Converts audio to WhatsApp-compatible PTT (OGG).
 * @param {Buffer} buffer - Audio buffer.
 * @param {string} ext - File extension.
 * @returns {Promise<Object>} FFmpeg output.
 */
async function toPTT(buffer, ext) {
    return ffmpegWrapper(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on'], ext, 'ogg');
}

/**
 * Converts audio to WhatsApp-compatible audio (Opus).
 * @param {Buffer} buffer - Audio buffer.
 * @param {string} ext - File extension.
 * @returns {Promise<Object>} FFmpeg output.
 */
async function toAudio(buffer, ext) {
    return ffmpegWrapper(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext, 'opus');
}

/**
 * Converts video to WhatsApp-compatible video (MP4).
 * @param {Buffer} buffer - Video buffer.
 * @param {string} ext - File extension.
 * @returns {Promise<Object>} FFmpeg output.
 */
async function toVideo(buffer, ext) {
    return ffmpegWrapper(buffer, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4');
}

/**
 * Base By Siputzx
 * Created On 22/2/2024
 * Contact Me on wa.me/6288292024190
 * Supported By Gpt Assistant
 */

module.exports = {
    imageToWebp,
    videoToWebp,
    webpToImage,
    webpToVideo,
    writeExifImg,
    writeExifVid,
    writeExif,
    toAudio,
    toPTT,
    toVideo,
    ffmpeg: ffmpegWrapper
};