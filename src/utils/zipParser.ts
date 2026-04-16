export interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  dataOffset: number;
}

export function parseZipEntries(bytes: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let i = 0;
  while (i < bytes.length - 4) {
    if (bytes[i] === 0x50 && bytes[i+1] === 0x4b && bytes[i+2] === 0x03 && bytes[i+3] === 0x04) {
      const compressionMethod = bytes[i+8] | (bytes[i+9] << 8);
      const compressedSize = bytes[i+18] | (bytes[i+19] << 8) | (bytes[i+20] << 16) | (bytes[i+21] << 24);
      const uncompressedSize = bytes[i+22] | (bytes[i+23] << 8) | (bytes[i+24] << 16) | (bytes[i+25] << 24);
      const nameLen = bytes[i+26] | (bytes[i+27] << 8);
      const extraLen = bytes[i+28] | (bytes[i+29] << 8);
      const name = new TextDecoder().decode(bytes.slice(i+30, i+30+nameLen));
      const dataOffset = i + 30 + nameLen + extraLen;

      const gpFlag = bytes[i+6] | (bytes[i+7] << 8);
      let actualCompressedSize = compressedSize;

      if ((gpFlag & 0x08) && compressedSize === 0) {
        let scanPos = dataOffset;
        while (scanPos < bytes.length - 4) {
          if (bytes[scanPos] === 0x50 && bytes[scanPos+1] === 0x4b &&
              ((bytes[scanPos+2] === 0x03 && bytes[scanPos+3] === 0x04) ||
               (bytes[scanPos+2] === 0x01 && bytes[scanPos+3] === 0x02))) {
            actualCompressedSize = scanPos - dataOffset;
            if (actualCompressedSize >= 16 &&
                bytes[scanPos-16] === 0x50 && bytes[scanPos-15] === 0x4b &&
                bytes[scanPos-14] === 0x07 && bytes[scanPos-13] === 0x08) {
              actualCompressedSize -= 16;
            } else if (actualCompressedSize >= 12) {
              actualCompressedSize -= 12;
            }
            break;
          }
          scanPos++;
        }
        if (scanPos >= bytes.length - 4) actualCompressedSize = bytes.length - dataOffset;
      }

      if (!name.endsWith('/')) {
        entries.push({
          name,
          compressionMethod,
          compressedSize: actualCompressedSize || compressedSize,
          uncompressedSize,
          dataOffset
        });
      }
      i = dataOffset + (actualCompressedSize || compressedSize);
    } else if (bytes[i] === 0x50 && bytes[i+1] === 0x4b && bytes[i+2] === 0x01 && bytes[i+3] === 0x02) {
      break;
    } else {
      i++;
    }
  }
  return entries;
}

export async function decompressEntry(bytes: Uint8Array, entry: ZipEntry): Promise<string> {
  const raw = bytes.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize);
  if (entry.compressionMethod === 0) return new TextDecoder().decode(raw);
  if (entry.compressionMethod === 8) {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(raw);
    writer.close();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) { result.set(c, offset); offset += c.length; }
    return new TextDecoder().decode(result);
  }
  throw new Error('Unsupported compression method: ' + entry.compressionMethod);
}

export async function extractFromZip(arrayBuf: ArrayBuffer): Promise<{ jsonText: string; ymlText: string | null }> {
  const bytes = new Uint8Array(arrayBuf);
  const files = parseZipEntries(bytes);
  let dialogTarget: ZipEntry | null = null;
  let ymlTarget: ZipEntry | null = null;

  for (const f of files) {
    const name = f.name.toLowerCase();
    if (!dialogTarget && (name === 'dialog.json' || name.endsWith('/dialog.json'))) dialogTarget = f;
    if (!ymlTarget && (name === 'botcontent.yml' || name.endsWith('/botcontent.yml'))) ymlTarget = f;
  }
  if (!dialogTarget) {
    for (const f of files) {
      if (f.name.toLowerCase().endsWith('.json')) { dialogTarget = f; break; }
    }
  }
  if (!dialogTarget) throw new Error('No dialog.json or .json file found in the ZIP archive.');

  const jsonText = await decompressEntry(bytes, dialogTarget);
  let ymlText: string | null = null;
  if (ymlTarget) {
    try { ymlText = await decompressEntry(bytes, ymlTarget); } catch { /* ignore */ }
  }
  return { jsonText, ymlText };
}

export async function extractBotContentFromZip(arrayBuf: ArrayBuffer): Promise<{ ymlText: string | null }> {
  const bytes = new Uint8Array(arrayBuf);
  const files = parseZipEntries(bytes);
  let ymlTarget: ZipEntry | null = null;
  for (const f of files) {
    const name = f.name.toLowerCase();
    if (!ymlTarget && (name === 'botcontent.yml' || name.endsWith('/botcontent.yml'))) ymlTarget = f;
  }
  let ymlText: string | null = null;
  if (ymlTarget) { try { ymlText = await decompressEntry(bytes, ymlTarget); } catch { /* ignore */ } }
  return { ymlText };
}
