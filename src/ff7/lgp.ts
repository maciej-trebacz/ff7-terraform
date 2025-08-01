// LGP Archive management class
// Created by mav, lookup & conflict parts ported from Python source by Niema Moshiri
// https://github.com/niemasd/PyFF7

import {Parser} from 'binary-parser';

const LOOKUP_VALUE_MAX = 30;
const NUM_LOOKTAB_ENTRIES = LOOKUP_VALUE_MAX * LOOKUP_VALUE_MAX; // 900 entries
const DEFAULT_CREATOR = "SQUARESOFT";
const DEFAULT_TERMINATOR = "FINAL FANTASY7";

const lgpConflictLocation = new Parser()
    .string('folderName', {
        length: 128,
        stripNull: true
    })
    .uint16le('tocIndex')

const lgpConflict = new Parser()
    .uint16le('numLocations')
    .array('folders', {
        type: lgpConflictLocation,
        length: 'numLocations'
    })

const lgpLookupEntry = new Parser()
    .uint16le('tocIndex')
    .uint16le('fileCount')

const lgpToc = new Parser()
    .string('filename', {
        length: 20,
        stripNull: true
    })
    .uint32le('offset')
    .pointer('filesize', {
        type: 'uint32le',
        offset: function() {
            return (this.offset as number) + 20;
        }
    })
    .uint8('check')
    .uint16le('conflictIndex')

const lgpParser = new Parser()
    .string('creator', {
        length: 12,
        stripNull: true
    })
    .uint32le('numFiles')
    .array('toc', {
        type: lgpToc,
        length: 'numFiles'
    })
    .array('lookupEntries', {
        type: lgpLookupEntry,
        length: NUM_LOOKTAB_ENTRIES
    })
    .uint16le('numConflicts')
    .array('conflicts', {
        type: lgpConflict,
        length: 'numConflicts'
    })

declare global {
    interface String {
        charCode: () => number;
    }
}

interface TOCEntry {
    filename: string;
    offset: number;
    newOffset: number;
    filesize: number;
    check: number;
    conflictIndex: number;
}

interface LookupEntry {
    tocIndex: number;
    fileCount: number;
}

interface ConflictLocation {
    folderName: string;
    tocIndex: number;
}

interface Conflict {
    numLocations: number;
    folders: ConflictLocation[];
}

interface LGPArchive {
    creator: string;
    numFiles: number;
    toc: TOCEntry[];
    lookupEntries: LookupEntry[];
    numConflicts: number;
    conflicts: Conflict[];
}

String.prototype.charCode = function(): number {
    return this.charCodeAt(0);
}

export class LGP {
    archive: LGPArchive;
    data: Uint8Array;
    modified: {[key: string]: Uint8Array} = {};

    constructor(data: ArrayBuffer) {
        this.data = new Uint8Array(data);
        this.archive = lgpParser.parse(this.data);
    }

    getCharLookupValue(char: string) {
        if (char.length !== 1) throw Error("Invalid length for char lookup: " + char);
        if (char === '.') return -1;
        if (char === '_') return 10;
        if (char === '-') return 11;
        if (char >= '0' && char <= '9') return char.charCode() - '0'.charCode();
        if (char >= 'A' && char <= 'z') return char.toLowerCase().charCode() - 'a'.charCode();
        throw Error("Invalid charater in filename: " + char);
    }

    getDataOffset() {
        let size = 0;
        size += 12; // creator
        size += 4; // numFiles
        size += this.archive.toc.length * 27; // toc
        size += NUM_LOOKTAB_ENTRIES * 4; // lookupEntries
        size += 2; // numConflicts
        this.archive.conflicts.forEach(conflict => {
            size += 2; // numLocations
            size += conflict.numLocations * 130;
        })
        return size;
    }    
    
    getSize() {
        let size = this.getDataOffset();
        this.archive.toc.forEach(file => {
            size += 24; // filename + filesize
            size += file.filesize;
        })
        size += DEFAULT_TERMINATOR.length;
        return size;
    }

    getTOC() {
        const fileCount = new Array(NUM_LOOKTAB_ENTRIES).fill(0);
        const tocIndex = new Array(NUM_LOOKTAB_ENTRIES).fill(0);
        this.archive.toc.forEach((entry, i: number) => {
            const l1 = this.getCharLookupValue(entry.filename[0]);
            const l2 = this.getCharLookupValue(entry.filename[1]);
            const lookupIndex = l1 * LOOKUP_VALUE_MAX + l2 + 1;
            fileCount[lookupIndex]++;
            if (tocIndex[lookupIndex] === 0) {
                tocIndex[lookupIndex] += i + 1;
            }
        })
        return fileCount.map((count, index) => ({tocIndex: tocIndex[index], fileCount: count}));
    }

    getFile(name: string): Uint8Array | null {
        const entry = this.archive.toc.find(item => item.filename === name);
        if (!entry) return null;
        if (this.modified[name]) return this.modified[name];

        const out = new Uint8Array(entry.filesize);
        const offset = entry.offset + 24;
        out.set(this.data.slice(offset, offset + entry.filesize));
        return out;
    }

    setFile(name: string, data: Uint8Array) {
        const entry = this.archive.toc.find(item => item.filename === name);
        if (!entry) return false; 
        entry.filesize = data.length; 
        this.modified[name] = data;
        return true;
    }

    writeArchive(): ArrayBuffer {
        // The offset where the first file's data block will start
        let currentDataOffset = this.getDataOffset();

        // Loop through the TOC to assign the final offset to each file
        // and update the total size with the *new* file sizes.
        this.archive.toc.forEach(entry => {
            // If a file was modified, its size may have changed.
            // The filesize is already updated by our fixed setFile method.
            entry.newOffset = currentDataOffset;
            currentDataOffset += 24 + entry.filesize; // 24 bytes for file header (name + size)
        });

        // The final total size of the archive
        const totalSize = currentDataOffset + DEFAULT_TERMINATOR.length;

        const out = new ArrayBuffer(totalSize);
        const view = new DataView(out);
        const encoder = new TextEncoder();
        let pos = 0;

        // Write creator
        encoder.encodeInto(DEFAULT_CREATOR.padStart(12, '\0'), new Uint8Array(out, pos, 12));
        pos += 12;

        // Write number of files
        view.setUint32(pos, this.archive.toc.length, true);
        pos += 4;

        // Write main TOC entries using the 'newOffset' we calculated
        this.archive.toc.forEach(entry => {
            encoder.encodeInto(entry.filename.padEnd(20, '\0'), new Uint8Array(out, pos, 20));
            pos += 20;
            view.setUint32(pos, entry.newOffset, true); // Use the calculated offset
            pos += 4;
            view.setUint8(pos, entry.check);
            pos += 1;
            view.setUint16(pos, entry.conflictIndex, true);
            pos += 2;
        });

        // Write Lookup table entries
        const lookupTable = this.getTOC();
        lookupTable.forEach(({ tocIndex, fileCount }) => {
            view.setUint16(pos, tocIndex, true);
            pos += 2;
            view.setUint16(pos, fileCount, true);
            pos += 2;
        });
        
        // TODO: Write conflicts

        // --- Write the actual file data blocks ---
        this.archive.toc.forEach((entry) => {
            let currentFilePos = entry.newOffset;
            const data = this.getFile(entry.filename);
            if (!data) throw Error("Data not found for file: " + entry.filename);

            // Write the per-file header AT the start of its data block
            encoder.encodeInto(entry.filename.padEnd(20, '\0'), new Uint8Array(out, currentFilePos, 20));
            currentFilePos += 20;
            view.setUint32(currentFilePos, entry.filesize, true);
            currentFilePos += 4;
            
            // Now, set the file contents. 'data.length' will now match 'entry.filesize'.
            new Uint8Array(out, currentFilePos, entry.filesize).set(data);
        });

        // Write terminator at the very end of the file
        encoder.encodeInto(DEFAULT_TERMINATOR, new Uint8Array(out, currentDataOffset));

        return out;
    }
}