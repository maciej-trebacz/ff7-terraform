/// <reference types="node" />

declare module "binary-parser" {
    interface ParserOptions {
        length?: number | string | ((item: any) => number);
        assert?: number | string | ((item: number | string) => boolean);
        lengthInBytes?: number | string | ((item: any) => number);
        type?: string | Parser;
        formatter?: (item: any) => any;
        encoding?: string;
        readUntil?: "eof" | ((item: any, buffer: Buffer) => boolean);
        greedy?: boolean;
        choices?: {
            [key: number]: string | Parser;
        };
        defaultChoice?: string | Parser;
        zeroTerminated?: boolean;
        clone?: boolean;
        stripNull?: boolean;
        key?: string;
        tag?: string | ((item: any) => number);
        offset?: number | string | ((item: any) => number);
        wrapper?: (buffer: Buffer) => Buffer;
    }
    declare type Types = PrimitiveTypes | ComplexTypes;
    declare type ComplexTypes = "bit" | "string" | "buffer" | "array" | "choice" | "nest" | "seek" | "pointer" | "saveOffset" | "wrapper" | "";
    declare type Endianness = "be" | "le";
    declare type PrimitiveTypes = "uint8" | "uint16le" | "uint16be" | "uint32le" | "uint32be" | "uint64le" | "uint64be" | "int8" | "int16le" | "int16be" | "int32le" | "int32be" | "int64le" | "int64be" | "floatle" | "floatbe" | "doublele" | "doublebe";
    export declare class Parser {
        varName: string;
        type: Types;
        options: ParserOptions;
        next?: Parser;
        head?: Parser;
        compiled?: Function;
        endian: Endianness;
        constructorFn?: Function;
        alias?: string;
        useContextVariables: boolean;
        constructor();
        static start(): Parser;
        private primitiveGenerateN;
        private primitiveN;
        private useThisEndian;
        uint8(varName: string, options?: ParserOptions): this;
        uint16(varName: string, options?: ParserOptions): this;
        uint16le(varName: string, options?: ParserOptions): this;
        uint16be(varName: string, options?: ParserOptions): this;
        uint32(varName: string, options?: ParserOptions): this;
        uint32le(varName: string, options?: ParserOptions): this;
        uint32be(varName: string, options?: ParserOptions): this;
        int8(varName: string, options?: ParserOptions): this;
        int16(varName: string, options?: ParserOptions): this;
        int16le(varName: string, options?: ParserOptions): this;
        int16be(varName: string, options?: ParserOptions): this;
        int32(varName: string, options?: ParserOptions): this;
        int32le(varName: string, options?: ParserOptions): this;
        int32be(varName: string, options?: ParserOptions): this;
        private bigIntVersionCheck;
        int64(varName: string, options?: ParserOptions): this;
        int64be(varName: string, options?: ParserOptions): this;
        int64le(varName: string, options?: ParserOptions): this;
        uint64(varName: string, options?: ParserOptions): this;
        uint64be(varName: string, options?: ParserOptions): this;
        uint64le(varName: string, options?: ParserOptions): this;
        floatle(varName: string, options?: ParserOptions): this;
        floatbe(varName: string, options?: ParserOptions): this;
        doublele(varName: string, options?: ParserOptions): this;
        doublebe(varName: string, options?: ParserOptions): this;
        private bitN;
        bit1(varName: string, options?: ParserOptions): this;
        bit2(varName: string, options?: ParserOptions): this;
        bit3(varName: string, options?: ParserOptions): this;
        bit4(varName: string, options?: ParserOptions): this;
        bit5(varName: string, options?: ParserOptions): this;
        bit6(varName: string, options?: ParserOptions): this;
        bit7(varName: string, options?: ParserOptions): this;
        bit8(varName: string, options?: ParserOptions): this;
        bit9(varName: string, options?: ParserOptions): this;
        bit10(varName: string, options?: ParserOptions): this;
        bit11(varName: string, options?: ParserOptions): this;
        bit12(varName: string, options?: ParserOptions): this;
        bit13(varName: string, options?: ParserOptions): this;
        bit14(varName: string, options?: ParserOptions): this;
        bit15(varName: string, options?: ParserOptions): this;
        bit16(varName: string, options?: ParserOptions): this;
        bit17(varName: string, options?: ParserOptions): this;
        bit18(varName: string, options?: ParserOptions): this;
        bit19(varName: string, options?: ParserOptions): this;
        bit20(varName: string, options?: ParserOptions): this;
        bit21(varName: string, options?: ParserOptions): this;
        bit22(varName: string, options?: ParserOptions): this;
        bit23(varName: string, options?: ParserOptions): this;
        bit24(varName: string, options?: ParserOptions): this;
        bit25(varName: string, options?: ParserOptions): this;
        bit26(varName: string, options?: ParserOptions): this;
        bit27(varName: string, options?: ParserOptions): this;
        bit28(varName: string, options?: ParserOptions): this;
        bit29(varName: string, options?: ParserOptions): this;
        bit30(varName: string, options?: ParserOptions): this;
        bit31(varName: string, options?: ParserOptions): this;
        bit32(varName: string, options?: ParserOptions): this;
        namely(alias: string): this;
        skip(length: ParserOptions["length"], options?: ParserOptions): this;
        seek(relOffset: ParserOptions["length"], options?: ParserOptions): this;
        string(varName: string, options: ParserOptions): this;
        buffer(varName: string, options: ParserOptions): this;
        wrapped(varName: string | ParserOptions, options?: ParserOptions): this;
        array(varName: string, options: ParserOptions): this;
        choice(varName: string | ParserOptions, options?: ParserOptions): this;
        nest(varName: string | ParserOptions, options?: ParserOptions): this;
        pointer(varName: string, options: ParserOptions): this;
        saveOffset(varName: string, options?: ParserOptions): this;
        endianness(endianness: "little" | "big"): this;
        endianess(endianess: "little" | "big"): this;
        useContextVars(useContextVariables?: boolean): this;
        create(constructorFn: Function): this;
        private getContext;
        getCode(): string;
        private addRawCode;
        private addAliasedCode;
        private resolveReferences;
        compile(): void;
        sizeOf(): number;
        parse(buffer: Buffer | Uint8Array): any;
        private setNextParser;
        private generate;
        private generateAssert;
        private generateNext;
        private generateBit;
        private generateSeek;
        private generateString;
        private generateBuffer;
        private generateArray;
        private generateChoiceCase;
        private generateChoice;
        private generateNest;
        private generateWrapper;
        private generateFormatter;
        private generatePointer;
        private generateSaveOffset;
    }
    export {};
}