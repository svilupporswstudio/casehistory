import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PLUGIN_DIR = path.join(__dirname, 'casehistory');
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'casehistory-db.json');

const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.mo', '.db', '.ico', '.webp']);

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function collectRawFilesForZip(
  dirPath: string,
  archivePrefix = 'casehistory',
): Promise<Array<{ archiveName: string; data: Buffer }>> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const collected: Array<{ archiveName: string; data: Buffer }> = [];

  for (const entry of entries) {
    if (entry.name === 'Thumbs.db') continue;
    const fullPath = path.join(dirPath, entry.name);
    const archiveName = `${archivePrefix}/${entry.name}`;
    if (entry.isDirectory()) {
      const nested = await collectRawFilesForZip(fullPath, archiveName);
      collected.push(...nested);
    } else if (entry.isFile()) {
      const data = await fs.readFile(fullPath);
      collected.push({ archiveName, data });
    }
  }
  return collected;
}

function createZipBuffer(files: Array<{ archiveName: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.archiveName, 'utf8');
    const compressed = zlib.deflateRawSync(file.data);
    const checksum = crc32(file.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirSize, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, endRecord]);
}

async function collectPluginFiles(dirPath: string, relativeBase = ''): Promise<Array<{
  path: string;
  name: string;
  size: number;
  lines: number;
  isBinary: boolean;
  content: string | null;
  previewUrl?: string;
}>> {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const results: Array<{
    path: string;
    name: string;
    size: number;
    lines: number;
    isBinary: boolean;
    content: string | null;
    previewUrl?: string;
  }> = [];

  for (const entry of entries) {
    if (entry.name === 'Thumbs.db') continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const nested = await collectPluginFiles(fullPath, relPath);
      results.push(...nested);
    } else if (entry.isFile()) {
      const stat = await fs.stat(fullPath);
      const ext = path.extname(entry.name).toLowerCase();
      const isBinary = BINARY_EXTENSIONS.has(ext);
      if (isBinary) {
        results.push({
          path: relPath,
          name: entry.name,
          size: stat.size,
          lines: 0,
          isBinary: true,
          content: null,
          previewUrl: ext === '.png' || ext === '.jpg' ? `/plugin-assets/${relPath}` : undefined,
        });
      } else {
        const text = await fs.readFile(fullPath, 'utf-8');
        results.push({
          path: relPath,
          name: entry.name,
          size: stat.size,
          lines: text.split(/\r?\n/).length,
          isBinary: false,
          content: text,
        });
      }
    }
  }

  return results.sort((a, b) => a.path.localeCompare(b.path));
}

async function readSavedState(): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeSavedState(data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Serve extracted plugin image assets safely (e.g. casehistory/img/prodotti.png)
  app.use('/plugin-assets', express.static(PLUGIN_DIR));

  app.get('/api/plugin-files', async (_req, res) => {
    try {
      const files = await collectPluginFiles(PLUGIN_DIR);
      res.json({ files });
    } catch {
      res.status(500).json({ error: 'Impossibile leggere i file del plugin' });
    }
  });

  app.get('/api/plugin-archive', async (_req, res) => {
    try {
      const files = await collectRawFilesForZip(PLUGIN_DIR);
      const zipBuffer = createZipBuffer(files);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="casehistory-plugin-wp-1.4.zip"');
      res.send(zipBuffer);
    } catch {
      res.status(500).json({ error: 'Errore nella generazione archivio zip del plugin' });
    }
  });

  app.get('/api/state', async (_req, res) => {
    const state = await readSavedState();
    res.json({ state });
  });

  app.put('/api/state', async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || !Array.isArray(body.caseHistories)) {
      res.status(400).json({ error: 'Payload stato non valido' });
      return;
    }
    try {
      await writeSavedState(body);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Errore nel salvataggio su disco' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Case History Studio server listening on http://localhost:${PORT}`);
  });
}

startServer();
