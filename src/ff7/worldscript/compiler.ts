import { Opcodes } from "./opcodes";
import {Tree, Token} from './worldscript_parser'

export class Compiler {
  out: number[] = [];
  offset = 0;
  pos = 0;
  opcodes: Record<string, any[]>;
  stack: any[] = [];
  jumps: any[] = [];
  labels: any[] = [];
  ifs: number[] = [];
  line = 0;

  constructor() {
    this.opcodes = {...Object.fromEntries(Object.entries(Opcodes).filter(([_, v]) => v).map(([k, v]) => [v[0], [parseInt(k), v[1], v[2], v[3]]]))};
    this.line = 0;
    this.pos = 0;
    this.ifs = [];
    this.jumps = [];
    this.labels = [];    
  }

  error(msg: string) {
    console.error(`${msg} while parsing line ${this.line}`)
  }

  emit(value) {
    this.out.push(value)
    this.pos += 1;
  }
  
  parseValue(value) {
    // TODO: Check if value is an instance
    if (value instanceof Token && !parseInt(value.value, 10)) {
      if (value.value.length > 2 && value.value.substring(0, 2) === '0x') {
        return parseInt(value.value, 16);
    //   } else if (value in this.constants) {
    //     return parseInt(this.constants[value]);
      }
    } else {
      return parseInt(value, 10);
    }
  }
  
  emitValue(value) {
    this.emit(this.parseValue(value));
  }
  
  emitOpcode(code) {
    const opcode = this.opcodes[code];
    this.emit(opcode[0]);
  }
  
  emitExpression(item) {
    let expressions = {
      'expr_lt': 0x60,
      'expr_gt': 0x61,
      'expr_le': 0x62,
      'expr_ge': 0x63,
      'expr_eq': 0x70,
      'expr_neg': 0x15,
      'expr_add': 0x40,
      'expr_sub': 0x41,
      'expr_mul': 0x30,
      'expr_shl': 0x50,
      'expr_shr': 0x51,
      'expr_and': 0xb0,
      'expr_or': 0xc0,
    };
    let opcode = Opcodes[expressions[item.data]];
    this.opcode(opcode[0], item);
  }

  opcode(opcode, args) {
    if (this.opcodes[opcode][0] === 0x204) {  // RunModelFunction:
      let value = args.children.pop();
      this.compileTree(args.children, opcode);
      this.emit(0x204 + parseInt(value.children[0].value));
      return;
    }
  
    this.compileTree(args.children, opcode);
    this.emitOpcode(opcode);
    if (this.opcodes[opcode][0] === 0x114) {  // SavemapBit
      let address = this.parseValue(args.children[0].children[0].value);
      let bit = parseInt(args.children[1].children[0].value, 0);
      this.emitValue((address - 0xBA4) * 8 + bit);
    } else if (this.opcodes[opcode][0] === 0x118 || this.opcodes[opcode][0] === 0x11c) {  // SavemapByte/SavemapWord
      let address = this.parseValue(args.children[0].children[0].value);
      this.emitValue(address - 0xBA4);
    } else if (this.opcodes[opcode][0] === 0x201) {  // If
      this.ifs.push(this.pos);
      this.emitValue(0xCDAB);  // Placeholder value
    } else if (this.opcodes[opcode][2] > 0) {
      this.emitValue(parseInt(args.children[0].children[0].value));
    }
  }

  addResets(tree) {
    const newChildren = [];
    tree.children.forEach((item) => {
      if (item.children) {
        if (item.data === "if_stmt") {
          newChildren.push("ResetStack");
        } else if (item.data === "opcode") {
          const opcode = Object.values(Opcodes).find(
            (op) => op[0] === item.children[0].value
          );
          if (opcode && opcode[1] > 0) {
            newChildren.push("ResetStack");
          }
        }
      }
      newChildren.push(item);
    });
    tree.children = newChildren;
    console.log(tree.children);
  }

  applyJumps() {
    for (let i = 0; i < this.jumps.length; i++) {
      let jump = this.jumps[i];
      let label = null;
      for (let j = 0; j < this.labels.length; j++) {
        let l = this.labels[j];
        if (l[1] === jump[1] && l[2] === jump[2]) {
          label = l;
          break;
        }
      }
      if (label === null) {
        this.error("Label #" + jump[2] + " not found");
      }

      let value = Buffer.alloc(2);
      value.writeUInt16LE(label[0] + this.offset);
      this.out[jump[0] * 2] = value[0];
      this.out[jump[0] * 2 + 1] = value[1];
    }
  }

  compileTree(tree, parent = null) {
    for (let index = 0; index < tree.length; index++) {
      let item = tree[index];
  
    //   debugger
      if (parent === null && item !== 'ResetStack') {
        this.line += 1;
      }
  
      if (item.value === 'End') {
        this.emitOpcode('End');
      } else if (item.value === 'EndIf') {
        if (this.ifs.length === 0) {
          this.error("EndIf without a matching If");
        }
  
        let pos = this.ifs.pop();
        this.jumps.push([pos, 'if', pos]);
        this.labels.push([this.pos, 'if', pos]);
      } else if (item === 'ResetStack' || item.value === 'ResetStack') {
        this.emitOpcode(Opcodes[0x100][0]);
      } else if (item instanceof Token && item[0] === '#') {
        continue;
      } else if (item.data === 'newline') {
        if (index === 0 || !(tree[index - 1] instanceof Tree) || tree[index - 1].data !== 'newline') {
          this.line -= 1;
        }
  
        continue;
      } else if (item.data === 'if_stmt') {
        let opcode = Opcodes[0x201][0];
        this.opcode(opcode, item);
      } else if (item.data === 'goto_stmt') {
        this.emitOpcode(Opcodes[0x200][0]);
        this.jumps.push([this.pos, 'label', parseInt(item.children[0].value)]);
        this.emitValue(0xCDAB);  // Placeholder value
      } else if (item.data === 'label') {
        this.labels.push([this.pos, 'label', parseInt(item.children[0].value)]);
      } else if (item.data.length > 4 && item.data.substring(0, 5) === 'expr_') {
        this.emitExpression(item);
      } else if (item.data === 'value' || item.data === 'variable') {
        if (parent && this.opcodes[parent][2] > 0) {
          continue;
        }
  
        this.emitOpcode(Opcodes[0x110][0]);
        this.emitValue(parseInt(item.children[0].value));
      } else if (item.data === 'opcode') {
        let opcode = item.children[0].value;
        let args = item.children[1];
        if (!this.opcodes.hasOwnProperty(opcode)) {
          debugger
          this.error('Unknown opcode: ' + opcode);
        }
  
        this.opcode(opcode, args);
      }
    }
  }
}
