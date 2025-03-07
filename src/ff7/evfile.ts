import { Parser } from 'binary-parser';
import { Opcodes, Mnemonic } from './worldscript/opcodes';

const opcodes = new Parser()
    .array('', {
        type: 'uint16le',
        readUntil: function(byte: number): boolean {
            return byte === 0x203;
        }        
    });

const fn = new Parser()
    .uint16le('header')
    .uint16le('offset')
    .pointer('opcodes', {
        type: opcodes,
        offset: function(): number {
            return 0x400 + (this.offset as number * 2);
        }
    });

const evParser = new Parser()
    .uint32le('dummyfn')
    .array('functions', {
        type: fn,
        length: 0xff
    });

interface AbstractFunction {
    header: number;
    offset: number;
    id?: number;
    opcodes?: number[];
    aliasId?: number;
    script: string;
}

export enum FunctionType {
    System = 0,
    Model = 1,
    Mesh = 2,
}

export interface SystemFunction extends AbstractFunction {
    type: FunctionType.System;
}

export interface ModelFunction extends AbstractFunction {
    type: FunctionType.Model;
    modelId: number;
}

export interface MeshFunction extends AbstractFunction {
    type: FunctionType.Mesh;
    x: number;
    y: number;
}

export type FF7Function = SystemFunction | ModelFunction | MeshFunction;

export class EvFile {
    functions: FF7Function[];

    constructor(data: Uint8Array) {
        const parsedData = evParser.parse(data);
        this.functions = [];

        const addFn = (data: Partial<FF7Function>): void => {
            const originalFn = this.functions.find(func => func.offset === data.offset);
            if (originalFn) {
                data.offset = originalFn.offset;
                data.aliasId = originalFn.id;
                delete data.opcodes;
            } else {
                data.script = this.decodeOpcodes(data.opcodes!);
            }
            this.functions.push(data as FF7Function);
        }

        parsedData.functions.forEach((fn: FF7Function) => {
            if (fn.header === 0xFFFF) return;

            const type: FunctionType = fn.header >> 14;
            if (type === FunctionType.System) {
                addFn({
                    type: FunctionType.System,
                    id: fn.header & 0xFF,
                    offset: fn.offset,
                    opcodes: fn.opcodes,
                });
            }
            else if (type === FunctionType.Model) {
                addFn({
                    type: FunctionType.Model,
                    id: fn.header & 0xFF,
                    modelId: (fn.header >> 8) & 0x3F,
                    offset: fn.offset,
                    opcodes: fn.opcodes,
                });
            }
            else if (type === FunctionType.Mesh) {
                const meshCoords = (fn.header >> 4) & 0x3FF;
                addFn({
                    type: FunctionType.Mesh,
                    id: fn.header & 0xF,
                    x: Math.floor(meshCoords / 36),
                    y: meshCoords % 36,
                    offset: fn.offset,
                    opcodes: fn.opcodes,
                });
            }
        });
    }

    decodeOpcodes(opcodes: number[]): string {
        const out = [];

        for (let i = 0; i < opcodes.length; i++) {
            const opcode = opcodes[i];
            if (!(opcode in Opcodes)) continue;

            const def = Opcodes[opcode];
            if (def.codeParams === 0) {
                out.push(def.mnemonic);
            } else {
                const params = [];
                for (let j = 0; j < def.codeParams; j++) {
                    i++;

                    // Two or four hex digits
                    params.push(opcodes[i].toString(16).toUpperCase().padStart(opcodes[i] < 0x100 ? 2 : 4, '0'));
                }
                out.push(`${def.mnemonic} ${params.join(' ')}`);
            }
        }
        
        return out.join("\n");
    }

    encodeOpcodes(script: string): Uint8Array {
        const lines = script.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Create a reverse lookup from mnemonic to opcode
        const mnemonicToOpcode = new Map<Mnemonic, number>();
        for (const [code, def] of Object.entries(Opcodes)) {
            mnemonicToOpcode.set(def.mnemonic, parseInt(code));
        }

        // Pre-calculate total size: each opcode and parameter is 2 bytes
        let totalSize = 0;
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const [mnemonic] = lines[lineNum].split(' ');
            const opcode = mnemonicToOpcode.get(mnemonic as Mnemonic);
            if (opcode === undefined) {
                throw new Error(`Line ${lineNum + 1}: Unknown mnemonic "${mnemonic}"`);
            }
            const def = Opcodes[opcode];
            totalSize += 2; // opcode
            totalSize += def.codeParams * 2; // parameters
        }

        // Create buffer and DataView
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        let offset = 0;

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            const [mnemonic, ...params] = line.split(' ');

            // Find the opcode for this mnemonic
            const opcode = mnemonicToOpcode.get(mnemonic as Mnemonic);
            if (opcode === undefined) {
                throw new Error(`Line ${lineNum + 1}: Unknown mnemonic "${mnemonic}"`);
            }

            const def = Opcodes[opcode];
            
            // Write opcode as 16-bit little-endian
            view.setUint16(offset, opcode, true);
            offset += 2;

            // Validate and parse parameters
            if (def.codeParams > 0) {
                if (params.length !== def.codeParams) {
                    throw new Error(
                        `Line ${lineNum + 1}: ${mnemonic} requires ${def.codeParams} parameter(s), but got ${params.length}`
                    );
                }

                for (const param of params) {
                    // Validate hex format - must be exactly 2 or 4 digits since all values are 16-bit
                    if (!/^[0-9A-Fa-f]{2}([0-9A-Fa-f]{2})?$/.test(param)) {
                        throw new Error(
                            `Line ${lineNum + 1}: Invalid parameter format "${param}". Expected exactly 2 or 4 hex digits`
                        );
                    }

                    const value = parseInt(param, 16);
                    // Write parameter as 16-bit little-endian
                    view.setUint16(offset, value, true);
                    offset += 2;
                }
            } else if (params.length > 0) {
                throw new Error(
                    `Line ${lineNum + 1}: ${mnemonic} doesn't accept parameters, but got ${params.length}`
                );
            }
        }

        return new Uint8Array(buffer);
    }

    getSystemFunctions(): SystemFunction[] {
        return this.functions.filter((fn): fn is SystemFunction => fn.type === FunctionType.System);
    }

    getModelFunctions(): ModelFunction[] {
        return this.functions.filter((fn): fn is ModelFunction => fn.type === FunctionType.Model);
    }

    getMeshFunctions(): MeshFunction[] {
        return this.functions.filter((fn): fn is MeshFunction => fn.type === FunctionType.Mesh);
    }

    private calculateHeader(fn: FF7Function): number {
        if (fn.type === FunctionType.System) {
            return fn.id;
        } else if (fn.type === FunctionType.Model) {
            return (1 << 14) | (fn.modelId << 8) | fn.id;
        } else { // mesh
            return (2 << 14) | ((Math.floor(fn.x) + Math.floor(fn.y) * 36) << 4) | fn.id;
        }
    }

    writeFile() {
        const out = new Uint8Array(0x7000);
        const view = new DataView(out.buffer);

        // Write initial return instruction at offset 0x400
        view.setUint16(0x400, 0xCB, true);
        let codeOffset = 0x402; // Start after initial return

        // Sort functions by their header value
        const sortedFunctions = [...this.functions].sort((a, b) => {
            return this.calculateHeader(a) - this.calculateHeader(b);
        });

        // Write call table (0x400 bytes = 256 entries of 4 bytes each)
        let tableOffset = 0;
        
        // First entry is 0 (matching original FF7 data)
        view.setUint16(tableOffset, 0, true);
        view.setUint16(tableOffset + 2, 1, true); // Points to first instruction after initial return
        tableOffset += 4;

        // Write actual function entries
        sortedFunctions.forEach(fn => {
            const header = this.calculateHeader(fn);

            // Write function header and instruction pointer
            view.setUint16(tableOffset, header, true);
            view.setUint16(tableOffset + 2, (codeOffset - 0x400) / 2, true);
            tableOffset += 4;

            // Write function opcodes
            fn.opcodes.forEach(opcode => {
                view.setUint16(codeOffset, opcode, true);
                codeOffset += 2;
            });
        });

        // Fill remaining call table entries with 0xFFFF/0
        while (tableOffset < 0x400) {
            view.setUint16(tableOffset, 0xFFFF, true);
            view.setUint16(tableOffset + 2, 0, true);
            tableOffset += 4;
        }

        return out;
    }
}