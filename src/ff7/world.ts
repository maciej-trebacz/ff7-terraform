import {Lzss} from './lzss.ts';
import {Parser} from 'binary-parser';
import fs from 'fs';
import { LGP } from './lgp';

export class WorldArchive {
    lgp: LGP;

    constructor(filename: string) {
        this.lgp = new LGP(filename);
    }
}