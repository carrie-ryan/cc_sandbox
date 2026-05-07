function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Builds an uncompressed ZIP archive from the given files. */
export function buildZip(files: { name: string; content: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const entries = files.map(f => {
    const nameBytes = enc.encode(f.name);
    const data = enc.encode(f.content);
    return { nameBytes, data, crc: crc32(data), offset: 0 };
  });

  let pos = 0;
  for (const e of entries) {
    e.offset = pos;
    pos += 30 + e.nameBytes.length + e.data.length;
  }

  const centralOffset = pos;
  const centralSize = entries.reduce((s, e) => s + 46 + e.nameBytes.length, 0);
  const buf = new Uint8Array(centralOffset + centralSize + 22);
  const dv = new DataView(buf.buffer);

  // Local file entries
  for (const e of entries) {
    const p = e.offset;
    dv.setUint32(p, 0x04034b50, true);      // signature
    dv.setUint16(p + 4, 20, true);           // version needed
    dv.setUint16(p + 6, 0, true);            // flags
    dv.setUint16(p + 8, 0, true);            // STORE (no compression)
    dv.setUint16(p + 10, 0, true);           // mod time
    dv.setUint16(p + 12, 0, true);           // mod date
    dv.setUint32(p + 14, e.crc, true);
    dv.setUint32(p + 18, e.data.length, true);
    dv.setUint32(p + 22, e.data.length, true);
    dv.setUint16(p + 26, e.nameBytes.length, true);
    dv.setUint16(p + 28, 0, true);           // extra field length
    buf.set(e.nameBytes, p + 30);
    buf.set(e.data, p + 30 + e.nameBytes.length);
  }

  // Central directory
  pos = centralOffset;
  for (const e of entries) {
    dv.setUint32(pos, 0x02014b50, true);     // signature
    dv.setUint16(pos + 4, 20, true);         // version made by
    dv.setUint16(pos + 6, 20, true);         // version needed
    dv.setUint16(pos + 8, 0, true);          // flags
    dv.setUint16(pos + 10, 0, true);         // compression
    dv.setUint16(pos + 12, 0, true);         // mod time
    dv.setUint16(pos + 14, 0, true);         // mod date
    dv.setUint32(pos + 16, e.crc, true);
    dv.setUint32(pos + 20, e.data.length, true);
    dv.setUint32(pos + 24, e.data.length, true);
    dv.setUint16(pos + 28, e.nameBytes.length, true);
    dv.setUint16(pos + 30, 0, true);         // extra field length
    dv.setUint16(pos + 32, 0, true);         // comment length
    dv.setUint16(pos + 34, 0, true);         // disk number start
    dv.setUint16(pos + 36, 0, true);         // internal attributes
    dv.setUint32(pos + 38, 0, true);         // external attributes
    dv.setUint32(pos + 42, e.offset, true);  // local header offset
    buf.set(e.nameBytes, pos + 46);
    pos += 46 + e.nameBytes.length;
  }

  // End of central directory
  dv.setUint32(pos, 0x06054b50, true);
  dv.setUint16(pos + 4, 0, true);
  dv.setUint16(pos + 6, 0, true);
  dv.setUint16(pos + 8, entries.length, true);
  dv.setUint16(pos + 10, entries.length, true);
  dv.setUint32(pos + 12, centralSize, true);
  dv.setUint32(pos + 16, centralOffset, true);
  dv.setUint16(pos + 20, 0, true);

  return buf;
}
