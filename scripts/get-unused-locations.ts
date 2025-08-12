#!/usr/bin/env node
// @ts-nocheck

import fs from 'fs';
import path from 'path';
import { fieldsMapping } from '../src/ff7/worldscript/constants';
import { fileURLToPath } from 'url';

function isBinaryExtension(filePath: string): boolean {
  const binaryExtensions = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg',
    '.ico', '.ttf', '.otf', '.woff', '.woff2', '.eot',
    '.wav', '.mp3', '.mp4', '.mov', '.avi', '.mkv',
    '.zip', '.gz', '.bz2', '.7z', '.rar', '.tar',
    '.pdf', '.exe', '.dll', '.so', '.dylib', '.bin'
  ]);
  return binaryExtensions.has(path.extname(filePath).toLowerCase());
}

function listAllFilesRecursive(targetDir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listAllFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function readTextFiles(filePaths: string[]): Array<{ filePath: string; content: string }> {
  const files: Array<{ filePath: string; content: string }> = [];
  for (const filePath of filePaths) {
    if (isBinaryExtension(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      files.push({ filePath, content });
    } catch {
      // Ignore unreadable files
    }
  }
  return files;
}

function main(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dataDir = path.resolve(__dirname, '..', 'output');
  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    console.error(`Data directory not found: ${dataDir}`);
    process.exit(1);
  }

  const allFilePaths = listAllFilesRecursive(dataDir);
  const textFiles = readTextFiles(allFilePaths);

  const entries = Object.entries(fieldsMapping).sort((a, b) => Number(a[0]) - Number(b[0]));

  for (const [indexStr, fieldId] of entries) {
    const needle = `Fields.${fieldId}`;
    let found = false;
    for (const { content } of textFiles) {
      if (content.includes(needle)) {
        found = true;
        break;
      }
    }
    if (!found) {
      // Print: index and field_id
      console.log(`${indexStr},${fieldId}`);
    }
  }
}

main();


