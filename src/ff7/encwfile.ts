import {Parser} from 'binary-parser';

interface YuffieEncounter {
    cloudLevel: number;
    sceneId: number;
}

interface ChocoboRating {
    battleSceneId: number;
    rating: number;
}

interface EncounterRecord {
    rate: number;
    encounterId: number;
}

interface EncounterSet {
    normalEncounters: EncounterRecord[];
    backAttacks: EncounterRecord[];
    sideAttack: EncounterRecord;
    pincerAttack: EncounterRecord;
    chocoboEncounters: EncounterRecord[];
}

interface Regions {
    sets: EncounterSet[];
}

interface RandomEncounters {
    regions: Regions[];
}

interface EncWData {
    yuffieEncounters: YuffieEncounter[];
    chocoboRatings: ChocoboRating[];
    randomEncounters: RandomEncounters;
}

const yuffieEncounterEntry = new Parser()
    .uint16le('cloudLevel')
    .uint16le('sceneId');

const chocoboRatingEntry = new Parser()
    .uint16le('battleSceneId')
    .uint16le('rating');

const encounterRecord = new Parser()
    .uint16le('rate')
    .uint16le('encounterId');

const encounterSet = new Parser()
    .array('normalEncounters', {
        type: encounterRecord,
        length: 6
    })
    .array('backAttacks', {
        type: encounterRecord,
        length: 2
    })
    .nest('sideAttack', {
        type: encounterRecord
    })
    .nest('pincerAttack', {
        type: encounterRecord
    })
    .array('chocoboEncounters', {
        type: encounterRecord,
        length: 4
    });

const region = new Parser()
    .array('sets', {
        type: encounterSet,
        length: 4
    });

const randomEncounters = new Parser()
    .array('regions', {
        type: region,
        length: 16
    });

const encWParser = new Parser()
    .array('yuffieEncounters', {
        type: yuffieEncounterEntry,
        length: 8
    })
    .array('chocoboRatings', {
        type: chocoboRatingEntry,
        length: 32
    })
    .nest('randomEncounters', {
        type: randomEncounters
    });

export class EncWFile {
    data: EncWData;

    constructor(data: Buffer) {
        this.data = encWParser.parse(data);
    }

    getYuffieEncounter(index: number): YuffieEncounter {
        if (index < 0 || index >= 8) throw Error('Index must be in the range of 0-7.');
        return this.data.yuffieEncounters[index];
    }

    getChocoboRating(index: number): ChocoboRating {
        if (index < 0 || index >= 32) throw Error('Index must be in the range of 0-31.');
        return this.data.chocoboRatings[index];
    }

    getRandomEncounterTable(region: number, set: number): EncounterSet {
        if (region < 0 || region >= 16) throw Error('Region must be in the range of 0-15.');
        if (set < 0 || set >= 4) throw Error('Set must be in the range of 0-3.');
        return this.data.randomEncounters.regions[region].sets[set];
    }

    writeFile(): Buffer {
        const out = Buffer.alloc(0x8a0); // Total size: 32 + 128 + 2048 bytes
        let offset = 0;

        // Write Yuffie encounters
        this.data.yuffieEncounters.forEach((entry: YuffieEncounter) => {
            out.writeUInt16LE(entry.cloudLevel, offset);
            out.writeUInt16LE(entry.sceneId, offset + 2);
            offset += 4;
        });

        // Write Chocobo ratings
        this.data.chocoboRatings.forEach((entry: ChocoboRating) => {
            out.writeUInt16LE(entry.battleSceneId, offset);
            out.writeUInt16LE(entry.rating, offset + 2);
            offset += 4;
        });

        // Write random encounters
        for (let region = 0; region < 16; region++) {
            for (let set = 0; set < 4; set++) {
                const encounterSet = this.data.randomEncounters.regions[region].sets[set];
                
                // Write normal encounters
                encounterSet.normalEncounters.forEach((entry: EncounterRecord) => {
                    out.writeUInt16LE(entry.rate, offset);
                    out.writeUInt16LE(entry.encounterId, offset + 2);
                    offset += 4;
                });

                // Write back attacks
                encounterSet.backAttacks.forEach((entry: EncounterRecord) => {
                    out.writeUInt16LE(entry.rate, offset);
                    out.writeUInt16LE(entry.encounterId, offset + 2);
                    offset += 4;
                });

                // Write side attack
                out.writeUInt16LE(encounterSet.sideAttack.rate, offset);
                out.writeUInt16LE(encounterSet.sideAttack.encounterId, offset + 2);
                offset += 4;

                // Write pincer attack
                out.writeUInt16LE(encounterSet.pincerAttack.rate, offset);
                out.writeUInt16LE(encounterSet.pincerAttack.encounterId, offset + 2);
                offset += 4;

                // Write chocobo encounters
                encounterSet.chocoboEncounters.forEach((entry: EncounterRecord) => {
                    out.writeUInt16LE(entry.rate, offset);
                    out.writeUInt16LE(entry.encounterId, offset + 2);
                    offset += 4;
                });
            }
        }

        return out;
    }
}
