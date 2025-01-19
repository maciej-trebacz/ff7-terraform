import { get_parser } from './worldscript_parser';
import { Opcodes } from './opcodes';
import { Compiler } from './compiler';

const worldscriptParser = get_parser();

interface Opcode {
    num: number;
    name: string;
    stackParams: number;
    codeParams: number;
}

interface Instruction {
    name: string;
    code: number;
    params: string[];
    offset: number;
}

export class WorldScript {
    opcodes: number[];
    offset: number;

    constructor(opcodes: number[], offset: number) {
        this.opcodes = opcodes;
        this.offset = offset;
    }

    private opcode(opcode: number): Opcode {
        if (!(opcode in Opcodes)) throw new Error("Invalid opcode: " + opcode);
        const data = Opcodes[opcode];
        return {
            num: opcode,
            name: data[0],
            stackParams: data[1],
            codeParams: data[2]
        }
    }

    decompile(): string {
        let opcode: Opcode;
        const jumps = [];
        const labels = [];
        const instructions: Instruction[] = [];

        // First pass - convert opcodes to higher-level instructions
        for (let pos = 0; pos < this.opcodes.length; pos++) {
            let word = this.opcodes[pos];

            // RunFunction opcode can use codes from 0x204 to 0x2FF
            if (0x204 <= word && word < 0x300) 
                opcode = this.opcode(0x204)

            else 
                opcode = this.opcode(word);

            const instruction: Instruction = {
                name: opcode.name,
                code: word,
                params: [],
                offset: pos,
            }

            // Handle stack parameters
            if (opcode.stackParams > 0) {
                // AskQuestion opcode is weird because it always has a WaitForWindowReady opcode after params list
                const paramsNum = opcode.num === 0x326 ? opcode.stackParams + 1 : opcode.stackParams;
                let stored;

                for (let i = 0; i < paramsNum; i++) {
                    // Remove the parameter from instructions stack
                    const param = instructions.pop()

                    // Store the opcode before AskQuestion so it can be readded later
                    if (opcode.num === 0x326 && i === 0) {
                        stored = param;
                        continue;
                    }

                    // Negation
                    if (param.code === 0x15)
                        instruction.params.push(`-${param.params[0]}`)

                    // Two parameter arthmetic
                    else if (param.code >= 0x30 && param.code <= 0xc0) 
                        instruction.params.push(`${param.params[0]} ${param.name} ${param.params[1]}`)

                    // Value
                    else if (param.code === 0x110)
                        instruction.params.push(param.params[0])
                    
                    // SetWaitFrames
                    else if (param.code === 0x305)
                        instruction.params.push(param.params[0])

                    // Everything else
                    else
                        instruction.params.push(`${param.name}(${param.params.join(', ')})`)
                }

                instruction.params.reverse()

                if (stored) {
                    instructions.push(stored);
                }
            }

            // Handle code parameters
            if (opcode.codeParams > 0) {
                for (let i = 0; i < opcode.codeParams; i++) {
                    pos++
                    word = this.opcodes[pos];
                    if (opcode.num === 0x200) { // GoTo
                        const offset = word - this.offset
                        if (!labels.includes(offset)) {
                            labels.push(offset)
                        }
                        const idx = labels.indexOf(offset) + 1
                        instruction.params.push(`LABEL_${idx}`)

                    }
                    else if (opcode.num === 0x201) { // If
                        jumps.push(word - this.offset)
                    }
                    else
                        instruction.params.push('' + word)
                }
            }

            // For RunFunction opcodes add function ID as a parameter
            if (opcode.num === 0x204)
                instruction.params.push('' + (word - 0x204))

            // Add instruction to the list
            instructions.push(instruction);
        }

        // Second pass - convert instructions to code
        let out = ''
        let indent = 0;
        instructions.forEach(instruction => {
            function emit(code: string) {
                out += `${"  ".repeat(indent)}${code}\n`
            }

            // Insert EndIf hint for the compiler
            jumps.forEach(jump => {
                if (instruction.offset === jump) {
                    indent--
                    emit(`EndIf`)
                }
            });            

            // Handle labels
            if (labels.includes(instruction.offset)) {
                const idx = labels.indexOf(instruction.offset) + 1
                emit(`@LABEL_${idx}`)
            }

            // Skip ResetStack instructions
            if (instruction.code === 0x100) 
                return;

            // GoTo statements
            else if (instruction.code === 0x200)
                emit(`${instruction.name} @${instruction.params[0]}`)

            // If statements
            else if (instruction.code === 0x201)
                emit(`${instruction.name} ${instruction.params[0]} Then`)
            
            // End statements
            else if (instruction.code === 0x203)
                emit(`${instruction.name}`)
            
            else {
                emit(`${instruction.name}(${instruction.params.join(', ')})`)
            }

            // Indent everything after If opcode
            if (instruction.code === 0x201)
                indent++
        })

        return out;
    }

    compile(code: string): number[] {
        const tree = worldscriptParser.parse(code);

        // Add ResetStack opcodes
        const compiler = new Compiler()
        compiler.addResets(tree)
        compiler.compileTree(tree.children)
        compiler.applyJumps()

        return compiler.out;
    }
}