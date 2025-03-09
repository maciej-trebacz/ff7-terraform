import { OpcodeDefinition, Opcodes, Mnemonic, Namespace } from "./opcodes";

// AST Node Interfaces
interface BaseExpression {
  type: string;
}

interface LiteralExpression extends BaseExpression {
  type: 'Literal';
  value: string | number | boolean;
}

interface IdentifierExpression extends BaseExpression {
  type: 'Identifier';
  name: string;
}

interface MemberExpression extends BaseExpression {
  type: 'Member';
  object: Expression;
  property: IdentifierExpression;
}

interface FunctionCallExpression extends BaseExpression {
  type: 'FunctionCall';
  callee: Expression;
  arguments: Expression[];
}

interface BinaryExpression extends BaseExpression {
  type: 'Binary';
  operator: string;
  left: Expression;
  right: Expression;
}

interface UnaryExpression extends BaseExpression {
  type: 'Unary';
  operator: string;
  operand: Expression;
}

interface IndexExpression extends BaseExpression {
  type: 'Index';
  base: Expression;
  index: Expression;
}

type Expression = 
  | LiteralExpression
  | IdentifierExpression
  | MemberExpression
  | FunctionCallExpression
  | BinaryExpression
  | UnaryExpression
  | IndexExpression;

interface BaseStatement {
  type: string;
}

interface ExpressionStatement extends BaseStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

interface IfStatement extends BaseStatement {
  type: 'If';
  condition: Expression;
  thenBranch: Statement[];
}

interface GotoStatement extends BaseStatement {
  type: 'Goto';
  label: string;
}

interface LabelStatement extends BaseStatement {
  type: 'Label';
  label: string;
}

interface AssignmentStatement extends BaseStatement {
  type: 'Assignment';
  left: Expression;
  right: Expression;
}

interface ReturnStatement extends BaseStatement {
  type: 'Return';
}

interface BlockStatement extends BaseStatement {
  type: 'Block';
  body: Statement[];
}

// Define Statement as a discriminated union
type Statement = 
  | ExpressionStatement
  | IfStatement
  | GotoStatement
  | LabelStatement
  | AssignmentStatement
  | ReturnStatement
  | BlockStatement;

// Compiler types
interface Token {
  type: string;
  value: string;
}

// Instruction type for code generation
type Instruction = 
  | { type: 'instruction'; mnemonic: string; codeParams: string[] }
  | { type: 'label'; label: string };

// Enum Mappings
const specialByteMap: Record<string, string> = {
  0: 'entity_mesh_x_coord',
  1: 'entity_mesh_y_coord',
  2: 'entity_coord_in_mesh_x',
  3: 'entity_coord_in_mesh_y',
  4: 'entity_direction',
  5: 'unknown_5',
  6: 'last_field_id',
  7: 'map_options',
  8: 'player_entity_model_id',
  9: 'current_entity_model_id',
  10: 'check_if_riding_chocobo',
  11: 'battle_result',
  12: 'prompt_window_result',
  13: 'unknown_13',
  14: 'unknown_14',
  15: 'unknown_15',
  16: 'random_8bit_number'
};

const savemapMapping: Record<string, string> = {
  0xBA4: 'game_progress',
  0xBF9: 'chocobo_rating_1',
  0xBFA: 'chocobo_rating_2',
  0xBFB: 'chocobo_rating_3',
  0xBFC: 'chocobo_rating_4',
  // 0xC21: 'own_chocobo_stable',
  // 0xC22: 'chocobos_on_map_on_map',
  // 0xC23: 'vehicle_display',
  // 0xC1F: 'weapons_killed',
  // 0xD73: 'yuffie_flags',
  // 0xEF4: 'submarine_color_flags',
  // 0xF2A: 'submarine_flags'
};

const modelsMapping: Record<string, string> = {
  0: 'cloud',
  1: 'tifa',
  2: 'cid',
  3: 'highwind',
  4: 'wild_chocobo',
  5: 'tiny_bronco',
  6: 'buggy',
  7: 'junon_cannon',
  8: 'cargo_ship',
  9: 'highwind_propellers',
  10: 'diamond_weapon',
  11: 'ultima_weapon',
  12: 'fort_condor',
  13: 'submarine',
  14: 'gold_saucer',
  15: 'rocket_town_rocket',
  16: 'rocket_town',
  17: 'sunken_gelnika',
  18: 'underwater_reactor',
  19: 'chocobo',
  20: 'midgar_cannon',
  21: 'unknown_21',
  22: 'unknown_22',
  23: 'unknown_23',
  24: 'north_crater_barrier',
  25: 'ancient_forest',
  26: 'key_of_the_ancients',
  27: 'unknown_27',
  28: 'red_submarine',
  29: 'ruby_weapon',
  30: 'emerald_weapon',
  65535: 'system'
};

// Opcode IDs for model-related opcodes
const modelMnemonics = [Mnemonic.DIST_MODEL, Mnemonic.LOAD_MODEL, Mnemonic.SET_ENTITY, Mnemonic.FACE_MODEL, Mnemonic.MOVE_TO_MODEL];
const modelOpcodes = modelMnemonics.map(mnemonic => Object.entries(Opcodes).find(([_, opcode]) => opcode.mnemonic === mnemonic)?.[1]);

const fieldsMapping: Record<string, string> = {
  0: 'other_worldmap',
  1: 'midgar_sector_5_gate',
  2: 'kalm',
  3: 'chocobo_farm',
  4: 'mythril_mines_from_swamp',
  5: 'mythril_mines_from_condor',
  6: 'fort_condor',
  7: 'junon',
  8: 'temple_of_the_ancients',
  9: 'old_mans_house',
  10: 'weapon_seller',
  11: 'mideel',
  12: 'quadra_magic_cave',
  13: 'costa_del_sol',
  14: 'mt_corel',
  15: 'north_corel',
  16: 'corel_desert',
  17: 'gongaga',
  18: 'cosmo_canyon',
  19: 'nibelheim_south',
  20: 'rocket_town_south',
  21: 'lucrecias_cave',
  22: 'hp_mp_cave',
  23: 'plains_outside_wutai',
  24: 'mime_cave',
  25: 'bone_village',
  26: 'corral_valley_cave',
  27: 'icicle_village_south',
  28: 'chocobo_sage_house',
  29: 'knights_of_the_round_cave',
  30: 'underwater_reactor',
  31: 'sunken_gelnika',
  32: 'impaled_zolom',
  33: 'yuffie_encounter',
  34: 'plains_outside_wutai_2',
  35: 'plains_outside_wutai_3',
  36: 'cargo_ship',
  37: 'costa_del_sol_harbor',
  38: 'costa_del_sol_harbor_2',
  39: 'junon_dock',
  40: 'tiny_bronco_crash',
  41: 'highwind_bridge',
  42: 'submarine_bridge',
  43: 'nibelheim_north',
  44: 'mt_nibel_from_rocket_town',
  45: 'highwind_bridge_2',
  46: 'mt_nibel_from_nibelheim',
  47: 'icicle_village_north',
  48: 'great_glacier',
  49: 'rocket_town_north',
  50: 'highwind_bridge_3',
  51: 'highwind_bridge_4',
  52: 'highwind_bridge_5',
  53: 'diamond_weapon_encounter',
  54: 'submarine_bridge_2',
  55: 'ancient_forest',
  56: 'submarine_bridge_3',
  57: 'corral_valley',
  58: 'forgotten_capital',
  59: 'highwind_deck',
  60: 'gaeas_cliff_base',
  61: 'great_glacier_2',
  62: 'great_glacier_3',
  63: 'great_glacier_4',
  64: 'great_glacier_5'
};

const enumMaps: Record<string, { namespace: string, mapping: Record<number, string> }> = {
  'Special.player_entity_model_id': {
    namespace: 'Entities',
    mapping: modelsMapping
  },
};

export class Worldscript {
  private startingOffset: number;
  private opcodeLines: string[];
  private lineOffsets: number[];
  private jumpTargets: Set<number>;
  private stack: Expression[];
  private statements: Statement[];
  private mnemonicToOpcode: Record<string, OpcodeDefinition>;
  private debugMetadata: Map<number, string>;
  private debugMode: boolean = false;
  private stackHistory: Array<{ operation: string, stack: Expression[], line: number, offset: number }> = [];
  private processedLines: Set<number>;
  private labelCounter: number = 0; // Added for unique internal labels

  // Inverse mappings for compilation
  private modelsMappingInverse: Record<string, number> = Object.fromEntries(
    Object.entries(modelsMapping).map(([k, v]) => [v, parseInt(k)])
  );
  private fieldsMappingInverse: Record<string, number> = Object.fromEntries(
    Object.entries(fieldsMapping).map(([k, v]) => [v, parseInt(k)])
  );  

  // Define base addresses for namespaces
  private namespaceBases: Record<string, number> = {
    'Savemap': 0xBA4,
    'Special': 0x0,
    'Temp': 0x0
  };  

  constructor(startingOffset: number, debugMode: boolean = false) {
    this.startingOffset = startingOffset;
    this.mnemonicToOpcode = {};
    this.debugMetadata = new Map();
    this.debugMode = debugMode;
    this.processedLines = new Set();
    this.opcodeLines = [];
    this.lineOffsets = [];
    this.jumpTargets = new Set();
    this.stack = [];
    this.statements = [];
    for (const [_, value] of Object.entries(Opcodes)) {
      this.mnemonicToOpcode[value.mnemonic] = value;
    }
  }

  public decompile(opcodeString: string, includeMetadata: boolean = false): string {
    this.stackHistory = [];
    this.processedLines = new Set();
    this.opcodeLines = opcodeString.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    this.calculateOffsetsAndJumpTargets(includeMetadata);
    this.outputScriptWithOffsets();

    this.stack = [];
    this.statements = [];
    try {
      this.processCode(0, includeMetadata);
    } catch (error) {
      if (this.debugMode) {
        console.error("Stack history:");
        this.stackHistory.forEach((entry, index) => {
          console.error(`[${entry.offset.toString(16).padStart(4, '0')}] ${index + 1}. Line ${entry.line}: ${entry.operation}, Stack: [${entry.stack.map(e => JSON.stringify(e)).join(', ')}]`);
        });
      }
      throw error;
    }

    return this.generateCode();
  }

  private calculateOffsetsAndJumpTargets(includeMetadata: boolean) {
    this.lineOffsets = [];
    this.jumpTargets = new Set();
    let offset = this.startingOffset;

    for (let i = 0; i < this.opcodeLines.length; i++) {
      const line = this.opcodeLines[i];
      const tokens = this.parseLine(line, i + 1);
      const mnemonic = tokens[0];
      const codeParams = tokens.slice(1);
      const opcode = this.mnemonicToOpcode[mnemonic];

      if (!opcode) {
        throw new Error(`Unknown mnemonic: ${mnemonic} at line ${i + 1}`);
      }

      if (!opcode.mnemonic.startsWith('CALL_FN_') && codeParams.length !== opcode.codeParams) {
        throw new Error(
          `Invalid number of code parameters for ${mnemonic}: expected ${opcode.codeParams}, got ${codeParams.length} at line ${i + 1}`
        );
      }

      this.lineOffsets.push(offset);

      if (includeMetadata) {
        this.debugMetadata.set(offset, line);
      }

      if (opcode.mnemonic === Mnemonic.GOTO) {
        const target = parseInt(codeParams[0], 16);
        this.jumpTargets.add(target);
      }

      offset += 1;
      if (!opcode.mnemonic.startsWith('CALL_FN_')) {
        offset += codeParams.length;
      }
    }

    if (this.debugMode) {
      console.log("Line offsets:", this.lineOffsets.map(o => o.toString(16)));
      console.log("Jump targets:", Array.from(this.jumpTargets).map(t => t.toString(16)));
    }
  }

  private outputScriptWithOffsets() {
    if (this.debugMode) {
      console.log("\nScript with offsets:");
      for (let i = 0; i < this.opcodeLines.length; i++) {
        const offset = this.lineOffsets[i];
        const isJumpTarget = this.jumpTargets.has(offset) ? "*" : " ";
        console.log(`[${offset.toString(16).padStart(4, '0')}]${isJumpTarget} Line ${(i + 1).toString().padStart(2, ' ')}: ${this.opcodeLines[i]}`);
      }
      console.log("\nJump targets:", Array.from(this.jumpTargets).map(t => t.toString(16)));
      console.log("");
    }
  }

  private logStackState(operation: string, lineNumber: number, offset: number) {
    if (this.debugMode) {
      this.stackHistory.push({
        operation,
        stack: [...this.stack],
        line: lineNumber,
        offset
      });
    }
  }

  private parseLine(line: string, lineNumber: number): string[] {
    const tokens = line.split(' ');
    if (tokens[0].startsWith('CALL_FN_')) {
      const funcId = tokens[0].slice(8);
      if (!funcId || isNaN(parseInt(funcId, 10))) {
        throw new Error(`Invalid CALL_FN_ format at line ${lineNumber}`);
      }
      return ['CALL_FN_', funcId];
    }
    return tokens;
  }

  private processCode(startLine: number, includeMetadata: boolean) {
    let i = startLine;
    while (i < this.opcodeLines.length) {
      if (this.processedLines.has(i)) {
        i++;
        continue;
      }
      const { statement, nextLine } = this.processSingleLine(i, includeMetadata);
      if (statement) {
        this.statements.push(statement);
      }
      i = nextLine !== null ? nextLine : i + 1;
    }
  }

  private processSingleLine(lineIndex: number, includeMetadata: boolean): { statement: Statement | null; nextLine: number | null } {
    // Skip processing if the line has already been processed
    if (this.processedLines.has(lineIndex)) {
      return { statement: null, nextLine: null };
    }
  
    this.processedLines.add(lineIndex);
    const offset = this.lineOffsets[lineIndex];
    const statements: Statement[] = [];
    if (this.jumpTargets.has(offset)) {
      statements.push({ type: 'Label', label: `label_${offset.toString(16)}` });
    }
  
    const line = this.opcodeLines[lineIndex];
    const tokens = this.parseLine(line, lineIndex + 1);
    const mnemonic = tokens[0];
    const codeParams = tokens.slice(1);
    const opcode = this.mnemonicToOpcode[mnemonic];
    const lineNumber = lineIndex + 1;
    this.logStackState(`Before ${mnemonic}`, lineNumber, offset);
  
    let nextLine: number | null = null;
    let statement: Statement | null = null;
  
    if (opcode.mnemonic === Mnemonic.RESET || opcode.mnemonic === Mnemonic.NOP) {
      // No statement generated
    } else if (opcode.mnemonic === Mnemonic.GOTO) {
      const target = parseInt(codeParams[0], 16);
      statement = { type: 'Goto', label: `label_${target.toString(16)}` };
      nextLine = this.findLineByOffset(target);
    } else if (opcode.mnemonic === Mnemonic.GOTO_IF_FALSE) {
      const condition = this.stack.pop() as Expression;
      const targetOffset = parseInt(codeParams[0], 16);
      const targetLine = this.findLineByOffset(targetOffset);
      if (targetLine === -1) {
        throw new Error(`Target offset ${targetOffset.toString(16)} not found at line ${lineNumber}`);
      }
      const thenBranch: Statement[] = [];
      let j = lineIndex + 1;
      while (j < this.opcodeLines.length && this.lineOffsets[j] < targetOffset) {
        const result = this.processSingleLine(j, includeMetadata);
        if (result.statement) {
          thenBranch.push(result.statement);
        }
        j++;
      }
      statement = { type: 'If', condition, thenBranch };
      nextLine = targetLine;
    } else {
      this.handleOpcode(opcode, codeParams, lineNumber, offset, statements);
    }
  
    this.logStackState(`After ${mnemonic}`, lineNumber, offset);
  
    // If we have a statement from one of the special cases and statements from handleOpcode or a label
    if (statement && statements.length > 0) {
      // Add the statement to the end of the statements array
      statements.push(statement);
      statement = null;
    }
  
    // Return all statements or the single statement
    if (statements.length > 1) {
      // If we have multiple statements, return them as a block
      return { statement: { type: 'Block', body: statements }, nextLine };
    } else if (statements.length === 1) {
      return { statement: statements[0], nextLine };
    } else {
      return { statement, nextLine };
    }
  }

  private findLineByOffset(offset: number): number {
    return this.lineOffsets.indexOf(offset);
  }

  private handleOpcode(opcode: OpcodeDefinition, codeParams: string[], lineNumber: number, _offset: number, statements: Statement[]) {
    if (opcode.mnemonic === Mnemonic.RETURN) {
      statements.push({ type: 'Return' });
    } else if (opcode.mnemonic === Mnemonic.CALL_FN_) {
      if (this.stack.length === 0) {
        throw new Error(`Stack underflow for CALL_FN_ at line ${lineNumber}`);
      }
      const param = this.stack.pop() as Expression;
      const funcId = codeParams[0];
      const callExpr: FunctionCallExpression = {
        type: 'FunctionCall',
        callee: { type: 'Member', object: { type: 'Identifier', name: 'System' }, property: { type: 'Identifier', name: 'call_function' } },
        arguments: [{ type: 'Literal', value: funcId }, param]
      };
      statements.push({ type: 'ExpressionStatement', expression: callExpr });
    } else if (opcode.mnemonic === Mnemonic.WRITE) {
      if (this.stack.length < 2) {
        throw new Error(`Stack underflow for WRITE at line ${lineNumber}`);
      }
      const right = this.stack.pop() as Expression;
      const left = this.stack.pop() as Expression;
      const assignment: AssignmentStatement = {
        type: 'Assignment',
        left,
        right
      };
      statements.push(assignment);
    } else if (opcode.mnemonic.startsWith('PUSH_')) {
      const expr = this.generatePushExpression(opcode, codeParams);
      this.stack.push(expr);
    } else if (opcode.mnemonic === Mnemonic.WAIT && this.stack.length > 0 && 
               this.stack[this.stack.length - 1].type === 'FunctionCall' && 
               (this.stack[this.stack.length - 1] as FunctionCallExpression).callee.type === 'Member') {
      const topExpr = this.stack[this.stack.length - 1] as FunctionCallExpression;
      const callee = topExpr.callee as MemberExpression;
      const property = callee.property as IdentifierExpression;
      
      if (property.name === 'wait_frames' && 
          callee.object.type === 'Identifier' && 
          (callee.object as IdentifierExpression).name === 'System') {
        this.stack.pop();
        const callExpr: FunctionCallExpression = {
          type: 'FunctionCall',
          callee: { 
            type: 'Member', 
            object: { type: 'Identifier', name: 'System' }, 
            property: { type: 'Identifier', name: 'wait' } 
          },
          arguments: topExpr.arguments
        };
        statements.push({ type: 'ExpressionStatement', expression: callExpr });
      } else {
        const params: Expression[] = [];
        if (this.stack.length < opcode.stackParams) {
          throw new Error(`Stack underflow for ${opcode.mnemonic} at line ${lineNumber}`);
        }
        for (let j = 0; j < opcode.stackParams; j++) {
          params.push(this.stack.pop() as Expression);
        }
        params.reverse();
        const callExpr: FunctionCallExpression = {
          type: 'FunctionCall',
          callee: { type: 'Member', object: { type: 'Identifier', name: opcode.namespace }, property: { type: 'Identifier', name: opcode.name } },
          arguments: params
        };
        statements.push({ type: 'ExpressionStatement', expression: callExpr });
      }
    } else if (opcode.pushesResult) {
      const params: Expression[] = [];
      if (this.stack.length < opcode.stackParams) {
        throw new Error(`Stack underflow for ${opcode.mnemonic} at line ${lineNumber}`);
      }
      for (let j = 0; j < opcode.stackParams; j++) {
        params.push(this.stack.pop() as Expression);
      }
      params.reverse();
      let expr: Expression;
      if (opcode.namespace === Namespace.Math) {
        expr = this.generateMathExpression(opcode, params);
      } else {
        expr = {
          type: 'FunctionCall',
          callee: { type: 'Member', object: { type: 'Identifier', name: opcode.namespace }, property: { type: 'Identifier', name: opcode.name } },
          arguments: params
        };
      }
      this.stack.push(expr);
    } else {
      const params: Expression[] = [];
      if (this.stack.length < opcode.stackParams) {
        throw new Error(`Stack underflow for ${opcode.mnemonic} at line ${lineNumber}`);
      }
      for (let j = 0; j < opcode.stackParams; j++) {
        params.push(this.stack.pop() as Expression);
      }
      params.reverse();
      const callExpr: FunctionCallExpression = {
        type: 'FunctionCall',
        callee: { type: 'Member', object: { type: 'Identifier', name: opcode.namespace }, property: { type: 'Identifier', name: opcode.name } },
        arguments: params
      };
      statements.push({ type: 'ExpressionStatement', expression: callExpr });
    }
  }

  private generatePushExpression(opcode: OpcodeDefinition, codeParams: string[]): Expression {
    const param = codeParams[0];
    const value = parseInt(param, 16);
    let address: number;
    let bit: number;
    let propertyName: string;
    let namespace: string;
    let base: number;
  
    switch (opcode.mnemonic) {
      case Mnemonic.PUSH_CONSTANT:
        return { type: 'Literal', value };
  
      case Mnemonic.PUSH_SAVEMAP_WORD:
      case Mnemonic.PUSH_SAVEMAP_BYTE:
        namespace = 'Savemap';
        base = this.namespaceBases[namespace]; // 0xBA4
        address = base + value;
        const savemapIndexExpr: IndexExpression = {
          type: 'Index',
          base: { type: 'Identifier', name: namespace },
          index: { type: 'Literal', value: `0x${address.toString(16).toUpperCase()}` }
        };
        propertyName = opcode.mnemonic === Mnemonic.PUSH_SAVEMAP_WORD ? 'word' : 'byte';
        return {
          type: 'Member',
          object: savemapIndexExpr,
          property: { type: 'Identifier', name: propertyName }
        };
  
      case Mnemonic.PUSH_SAVEMAP_BIT:
        namespace = 'Savemap';
        base = this.namespaceBases[namespace]; // 0xBA4
        address = base + Math.floor(value / 8);
        bit = value % 8;
        const savemapBitIndexExpr: IndexExpression = {
          type: 'Index',
          base: { type: 'Identifier', name: namespace },
          index: { type: 'Literal', value: `0x${address.toString(16).toUpperCase()}` }
        };
        const savemapBitMember: MemberExpression = {
          type: 'Member',
          object: savemapBitIndexExpr,
          property: { type: 'Identifier', name: 'bit' }
        };
        return {
          type: 'Index',
          base: savemapBitMember,
          index: { type: 'Literal', value: bit }
        };
  
      case Mnemonic.PUSH_TEMP_WORD:
      case Mnemonic.PUSH_TEMP_BYTE:
        namespace = 'Temp';
        base = this.namespaceBases[namespace]; // 0x0
        address = base + value;
        const tempIndexExpr: IndexExpression = {
          type: 'Index',
          base: { type: 'Identifier', name: namespace },
          index: { type: 'Literal', value: `0x${address.toString(16).toUpperCase()}` }
        };
        propertyName = opcode.mnemonic === Mnemonic.PUSH_TEMP_WORD ? 'word' : 'byte';
        return {
          type: 'Member',
          object: tempIndexExpr,
          property: { type: 'Identifier', name: propertyName }
        };
  
      case Mnemonic.PUSH_SPECIAL_BYTE:
      case Mnemonic.PUSH_SPECIAL_WORD:
      case Mnemonic.PUSH_SPECIAL_BIT:
        propertyName = specialByteMap[value] || `unknown_${param}`;
        return {
          type: 'Member',
          object: { type: 'Identifier', name: 'Special' },
          property: { type: 'Identifier', name: propertyName }
        };
  
      default:
        return {
          type: 'FunctionCall',
          callee: { type: 'Member', object: { type: 'Identifier', name: opcode.namespace }, property: { type: 'Identifier', name: opcode.name } },
          arguments: [{ type: 'Literal', value: `0x${value.toString(16).toUpperCase()}` }]
        };
    }
  }

  private generateMathExpression(opcode: OpcodeDefinition, params: Expression[]): Expression {
    if (params.length === 2) {
      const [left, right] = params;
      const operatorMap: Record<string, string> = {
        [Mnemonic.ADD]: '+',
        [Mnemonic.SUB]: '-',
        [Mnemonic.MUL]: '*',
        [Mnemonic.LT]: '<',
        [Mnemonic.GT]: '>',
        [Mnemonic.LE]: '<=',
        [Mnemonic.GE]: '>=',
        [Mnemonic.EQ]: '==',
        [Mnemonic.AND]: '&',
        [Mnemonic.OR]: '|',
        [Mnemonic.LAND]: 'and',
        [Mnemonic.LOR]: 'or',
        [Mnemonic.SHL]: '<<',
        [Mnemonic.SHR]: '>>'
      };
      const operator = operatorMap[opcode.mnemonic];
      if (operator) {
        return { type: 'Binary', operator, left, right };
      }
    }
    if (params.length === 1) {
      const operatorMap: Record<string, string> = {
        [Mnemonic.NEG]: '-',
        [Mnemonic.NOT]: '!'
      };
      const operator = operatorMap[opcode.mnemonic];
      if (operator) {
        return { type: 'Unary', operator, operand: params[0] };
      }
    }
    throw new Error(`Unsupported math operation: ${opcode.mnemonic}`);
  }

  private generateCode(): string {
    const lines = this.statements.map(stmt => this.generateNode(stmt, 0));
    return lines.join('\n');
  }

  private generateNode(node: Statement | Expression, indent: number, _parent: Statement | Expression | null = null, argIndex: number = 0): string {
    const indentation = '  '.repeat(indent);
    if (node.type === 'Literal') {
      if (_parent?.type === 'FunctionCall' && (_parent as FunctionCallExpression).callee.type === 'Member') {
        const callee = (_parent as FunctionCallExpression).callee as MemberExpression;
        const property = callee.property as IdentifierExpression;

        // For enter_field calls, use fieldsMapping
        if (property.name === 'enter_field' && argIndex === 0) {
          const value = (node as LiteralExpression).value;
          if (typeof value === 'number' && fieldsMapping[value]) {
            return `Fields.${fieldsMapping[value]}`;
          }
        }
  
        if (property.name === 'call_function' && argIndex === 1) {
          const value = (node as LiteralExpression).value;
          if (typeof value === 'number' && modelsMapping[value]) {
            return `Entities.${modelsMapping[value]}`;
          }
        }

        // For model related opcodes, use modelOpcodes
        const modelArgument = modelOpcodes.find(opcode => opcode.name === property.name);
        if (modelArgument) {
          const value = (node as LiteralExpression).value;
          if (typeof value === 'number' && modelsMapping[value]) {
            return `Entities.${modelsMapping[value]}`;
          }
        }
      }
      return `${(node as LiteralExpression).value}`;
    } else if (node.type === 'Identifier') {
      return `${(node as IdentifierExpression).name}`;
    } else if (node.type === 'Member') {
      const memberNode = node as MemberExpression;
      return `${this.generateNode(memberNode.object, 0, node)}.${this.generateNode(memberNode.property, 0, node)}`;
    } else if (node.type === 'Index') {
      const indexNode = node as IndexExpression;
      const base = this.generateNode(indexNode.base, 0, node);
      const index = this.generateNode(indexNode.index, 0, node);
      return `${base}[${index}]`;
    } else if (node.type === 'FunctionCall') {
      const callNode = node as FunctionCallExpression;
      const callee = this.generateNode(callNode.callee, 0, node);
      const args = callNode.arguments.map((arg, index) => this.generateNode(arg, 0, node, index)).join(', ');
      return `${callee}(${args})`;
    } else if (node.type === 'Binary') {
      const binNode = node as BinaryExpression;
      const left = this.generateNode(binNode.left, 0, node);
      const rightExpr = binNode.right;
      let right = this.generateNode(rightExpr, 0, node);
      if (binNode.operator === '==' && binNode.left.type === 'Member' && binNode.left.object.type === 'Identifier' &&
          enumMaps[left] && rightExpr.type === 'Literal' && typeof rightExpr.value === 'number') {
        const enumValue = enumMaps[left].mapping[rightExpr.value];
        if (enumValue) right = enumMaps[left].namespace + '.' + enumValue;
      }
      return `${left} ${binNode.operator} ${right}`;
    } else if (node.type === 'Unary') {
      const unaryNode = node as UnaryExpression;
      const operand = this.generateNode(unaryNode.operand, 0, node);
      return `${unaryNode.operator}${operand}`;
    } else if (node.type === 'If') {
      const ifNode = node as IfStatement;
      const condition = this.generateNode(ifNode.condition, 0, node);
      const thenBranch = ifNode.thenBranch.map(stmt => this.generateNode(stmt, indent + 1, node)).join('\n');
      return `${indentation}if ${condition} then\n${thenBranch}\n${indentation}end`;
    } else if (node.type === 'Goto') {
      return `${indentation}goto ${(node as GotoStatement).label}`;
    } else if (node.type === 'Label') {
      return `${indentation}::${(node as LabelStatement).label}::`;
    } else if (node.type === 'ExpressionStatement') {
      return `${indentation}${this.generateNode((node as ExpressionStatement).expression, 0, node)}`;
    } else if (node.type === 'Assignment') {
      const assignNode = node as AssignmentStatement;
      const left = this.generateNode(assignNode.left, 0, node);
      const right = this.generateNode(assignNode.right, 0, node);
      return `${indentation}${left} = ${right}`;
    } else if (node.type === 'Return') {
      return `${indentation}return`;
    } else if (node.type === 'Block') {
      // This is a special case to handle multiple statements (when there's a label and a statement from handleOpcode)
      const blockNode = node as BlockStatement;
      const body = blockNode.body.map(stmt => this.generateNode(stmt, indent, node)).join('\n');
      return `${indentation}${body}`;
    }
    return '';
  }

  public getStackState(): Expression[] {
    return [...this.stack];
  }

  public getStackHistory(): Array<{ operation: string, stack: Expression[], line: number, offset: number }> {
    return this.stackHistory;
  }
  public compile(luaCode: string): string {
    this.labelCounter = 0; // Reset label counter for each compilation
    const tokens = this.tokenize(luaCode);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const processedAst = this.addResets(ast);
    const instructions = this.generateInstructions(processedAst);
    const resolvedInstructions = this.resolveLabels(instructions);
    return resolvedInstructions
      .map(inst => inst.mnemonic + (inst.codeParams.length > 0 ? ' ' + inst.codeParams.map(param => param.toUpperCase()).join(' ') : ''))
      .join('\n');
  }
  
  private addResets(ast: Statement[]): Statement[] {
    const processedAst: Statement[] = [];

    const addReset = (ast: Statement[]) => {
      ast.push({ type: 'ExpressionStatement', expression: { 
        type: 'FunctionCall', 
        callee: { 
          type: 'Member', 
          object: { type: 'Identifier', name: 'System' }, 
          property: { type: 'Identifier', name: 'reset_stack' } 
        }, 
        arguments: [] 
      }});
    }
    
    for (const stmt of ast) {
      // Add RESET before If statements
      if (stmt.type === 'If') {
        addReset(processedAst);
        
        // Process the condition and then branch recursively
        const ifStmt = stmt as IfStatement;
        ifStmt.thenBranch = this.addResets(ifStmt.thenBranch);
        processedAst.push(ifStmt);
      } 
      // Add RESET before function calls with stack params
      else if (stmt.type === 'ExpressionStatement' && 
               stmt.expression.type === 'FunctionCall') {
        const expr = stmt.expression as FunctionCallExpression;
        if (expr.callee.type === 'Member') {
          const callee = expr.callee as MemberExpression;
          const objectName = (callee.object as IdentifierExpression).name;
          const functionName = (callee.property as IdentifierExpression).name;
          
          // Check if this function has stack params
          const opcode = Object.values(Opcodes).find(
            op => op.namespace === objectName && op.name === functionName && op.stackParams > 0
          );
          
          if (opcode || (objectName === 'System' && functionName === 'call_function') || 
              (objectName === 'Memory' && functionName === 'write')) {
            addReset(processedAst);
          }
        }
        processedAst.push(stmt);
      } 
      else if (stmt.type === 'Assignment') {
        addReset(processedAst);
        processedAst.push(stmt);
      }
      else {
        processedAst.push(stmt);
      }
    }
    
    return processedAst;
  }

  private tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const regex = /\s*(::|<=|>=|==|!=|<<|>>|<|>|or|and|!|-|\+|\*|\/|\[|\]|\w+|\d+|[\.\(\),=:])\s*/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      const value = match[1];
      if (value === '::') tokens.push({ type: 'label_delim', value });
      else if (['<=', '>=', '==', '!=', '<', '>', 'or', 'and', '!', '-', '+', '<<', '>>', '*', '/'].includes(value)) tokens.push({ type: 'operator', value });
      else if (value.match(/^\d+$/)) tokens.push({ type: 'number', value });
      else if (value.match(/^0x[0-9a-fA-F]+$/)) tokens.push({ type: 'number', value });
      else if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        if (['if', 'then', 'end', 'goto', 'return'].includes(value)) tokens.push({ type: 'keyword', value });
        else tokens.push({ type: 'identifier', value });
      }
      else if (['.', '(', ')', ',', '=', '[', ']'].includes(value)) tokens.push({ type: 'punct', value });
      else throw new Error(`Unknown token: ${value}`);
    }
    return tokens;
  }

  private generateInstructions(ast: Statement[]): Instruction[] {
    const instructions: Instruction[] = [];
    ast.forEach(stmt => instructions.push(...this.generateStatement(stmt)));
    return instructions;
  }

  private generateAssignmentStatement(stmt: AssignmentStatement): Instruction[] {
    const leftInstructions = this.generateExpression(stmt.left);
    const rightInstructions = this.generateExpression(stmt.right);
    return [...leftInstructions, ...rightInstructions, { type: 'instruction', mnemonic: 'WRITE', codeParams: [] }];
  }  

  private generateStatement(stmt: Statement): Instruction[] {
    switch (stmt.type) {
      case 'If': return this.generateIfStatement(stmt);
      case 'Goto': return [{ type: 'instruction', mnemonic: 'GOTO', codeParams: [stmt.label] }];
      case 'Label': return [{ type: 'label', label: stmt.label }];
      case 'Return': return [{ type: 'instruction', mnemonic: 'RETURN', codeParams: [] }];
      case 'ExpressionStatement': return this.generateExpressionStatement(stmt);
      case 'Assignment': return this.generateAssignmentStatement(stmt);
      case 'Block': throw new Error('Block statements are not supported in this context.');
      default: throw new Error(`Unsupported statement type: ${(stmt as any).type}`);
    }
  }

  private generateIfStatement(stmt: IfStatement): Instruction[] {
    const labelEnd = `__end_if_${this.labelCounter++}`; // Unique internal label
    const instructions: Instruction[] = [];
    instructions.push(...this.generateExpression(stmt.condition));
    instructions.push({ type: 'instruction', mnemonic: 'GOTO_IF_FALSE', codeParams: [labelEnd] });
    stmt.thenBranch.forEach(branchStmt => instructions.push(...this.generateStatement(branchStmt)));
    instructions.push({ type: 'label', label: labelEnd });
    return instructions;
  }

  private generateExpressionStatement(stmt: ExpressionStatement): Instruction[] {
    const expr = stmt.expression;
    if (expr.type !== 'FunctionCall') throw new Error(`Expression statement must be a function call, got: ${expr.type}`);
    const callee = expr.callee as MemberExpression;
    const objectName = (callee.object as IdentifierExpression).name;
    const functionName = (callee.property as IdentifierExpression).name;

    if (objectName === 'System' && functionName === 'call_function') {
      if (expr.arguments.length !== 2) throw new Error('System.call_function expects exactly two arguments.');
      const [funcIdExpr, paramExpr] = expr.arguments;
      if (funcIdExpr.type !== 'Literal' || typeof funcIdExpr.value !== 'number') throw new Error('First argument to System.call_function must be a numeric literal.');
      const funcId = funcIdExpr.value;
      const instructions = this.generateExpression(paramExpr);
      instructions.push({ type: 'instruction', mnemonic: `CALL_FN_${funcId}`, codeParams: [] });
      return instructions;
    } else if (objectName === 'Memory' && functionName === 'write') {
      if (expr.arguments.length !== 2) throw new Error('Memory.write expects exactly two arguments.');
      const [addressExpr, valueExpr] = expr.arguments;
      const instructions: Instruction[] = [];
      instructions.push(...this.generateExpression(addressExpr));
      instructions.push(...this.generateExpression(valueExpr));
      instructions.push({ type: 'instruction', mnemonic: 'WRITE', codeParams: [] });
      return instructions;
    } else if (objectName === 'System' && functionName === 'wait') {
      // Special case for System.wait() - generate both WAIT_FRAMES and WAIT opcodes
      if (expr.arguments.length !== 1) throw new Error('System.wait expects exactly one argument.');
      const frameCountExpr = expr.arguments[0];
      const instructions: Instruction[] = [];
      
      // Generate code to push the frame count
      instructions.push(...this.generateExpression(frameCountExpr));
      
      // Generate WAIT_FRAMES followed by WAIT
      instructions.push({ type: 'instruction', mnemonic: 'WAIT_FRAMES', codeParams: [] });
      instructions.push({ type: 'instruction', mnemonic: 'WAIT', codeParams: [] });
      
      return instructions;
    } else {
      const opcode = this.getOpcodeForFunctionCall(callee);
      if (opcode.pushesResult) throw new Error(`Function ${objectName}.${functionName} pushes a result and cannot be used as a statement.`);
      const instructions: Instruction[] = [];
      expr.arguments.forEach(arg => instructions.push(...this.generateExpression(arg)));
      instructions.push({ type: 'instruction', mnemonic: opcode.mnemonic, codeParams: [] });
      return instructions;
    }
  }

  private generateExpression(expr: Expression): Instruction[] {
    switch (expr.type) {
      case 'Literal': 
        return [{ type: 'instruction', mnemonic: 'PUSH_CONSTANT', codeParams: [Number(expr.value).toString(16).padStart(Number(expr.value) < 256 ? 2 : 4, '0')] }];
      case 'Identifier': 
        throw new Error('Bare identifiers are not supported in expressions.');
      case 'Member': 
        if (expr.object.type === 'Index' && expr.object.base.type === 'Identifier' && 
            ['Savemap', 'Special', 'Temp'].includes(expr.object.base.name) && 
            expr.object.index.type === 'Literal' && 
            expr.property.type === 'Identifier' && ['byte', 'word'].includes(expr.property.name)) {
          const namespace = expr.object.base.name;
          let address = expr.object.index.value;
          if (typeof address === "string" && address.startsWith('0x')) {
            address = parseInt(address.slice(2), 16);
          }
          const base = this.namespaceBases[namespace] || 0;
          const offset = address as number - base;
          if (offset < 0 || offset > 0xFFFF) throw new Error('Invalid offset');
          const mnemonic = expr.property.name === 'byte' ? `PUSH_${namespace.toUpperCase()}_BYTE` : `PUSH_${namespace.toUpperCase()}_WORD`;
          return [{ type: 'instruction', mnemonic, codeParams: [offset.toString(16).padStart(Number(offset) < 0x100 ? 2 : 4, '0')] }];
        } else if (expr.object.type === 'Identifier' && expr.object.name === 'Savemap') {
          const addressEntry = Object.entries(savemapMapping).find(([_, name]) => name === expr.property.name);
          if (addressEntry) {
            const address = parseInt(addressEntry[0]);
            const offset = address - 0xBA4;
            return [{ type: 'instruction', mnemonic: 'PUSH_SAVEMAP_WORD', codeParams: [offset.toString(16).padStart(Number(offset) < 0x100 ? 2 : 4, '0')] }];
          }
        } else if (expr.object.type === 'Identifier' && expr.object.name === 'Special') {
          if (expr.property.name.startsWith('unknown_')) {
            const value = expr.property.name.slice(8);
            return [{ type: 'instruction', mnemonic: 'PUSH_SPECIAL_BYTE', codeParams: [value] }];
          }
          const valueEntry = Object.entries(specialByteMap).find(([_, name]) => name === expr.property.name);
          if (valueEntry) return [{ type: 'instruction', mnemonic: 'PUSH_SPECIAL_BYTE', codeParams: [parseInt(valueEntry[0]).toString(16).padStart(2, '0')] }];
        } else if (expr.object.type === 'Identifier' && expr.object.name === 'Entities') {
          const id = this.modelsMappingInverse[expr.property.name];
          if (id !== undefined) return [{ type: 'instruction', mnemonic: 'PUSH_CONSTANT', codeParams: [id.toString(16).padStart(2, '0')] }];
        } else if (expr.object.type === 'Identifier' && expr.object.name === 'Fields') {
          const id = this.fieldsMappingInverse[expr.property.name];
          if (id !== undefined) return [{ type: 'instruction', mnemonic: 'PUSH_CONSTANT', codeParams: [id.toString(16).padStart(2, '0')] }];
        }
        throw new Error(`Unknown member expression: ${(expr.object as IdentifierExpression).name}.${expr.property.name}`);
      case 'Index':
        if (expr.base.type === 'Member' && expr.base.object.type === 'Index' && 
            expr.base.object.base.type === 'Identifier' && ['Savemap', 'Special', 'Temp'].includes(expr.base.object.base.name) && 
            expr.base.object.index.type === 'Literal' && 
            expr.base.property.type === 'Identifier' && expr.base.property.name === 'bit' && 
            expr.index.type === 'Literal' && typeof expr.index.value === 'number') {
          const namespace = expr.base.object.base.name;
          let address = expr.base.object.index.value;
          if (typeof address === "string" && address.startsWith('0x')) {
            address = parseInt(address.slice(2), 16);
          }
          const bit = expr.index.value;
          const base = this.namespaceBases[namespace] || 0;
          const offset = address as number - base;
          if (offset < 0 || offset > 0xFFFF) throw new Error('Invalid offset');
          if (bit < 0 || bit > 7) throw new Error('Bit index out of range');
          const value = (offset * 8) + bit;
          return [{ type: 'instruction', mnemonic: `PUSH_${namespace.toUpperCase()}_BIT`, codeParams: [value.toString(16).padStart(4, '0')] }];
        }
        throw new Error('Unsupported index expression in this context');
      case 'FunctionCall': 
        return this.generateFunctionCallExpression(expr);
      case 'Binary': 
        return this.generateBinaryExpression(expr);
      case 'Unary': 
        return this.generateUnaryExpression(expr);
      default: 
        throw new Error(`Unsupported expression type: ${(expr as any).type}`);
    }
  }

  private generateFunctionCallExpression(expr: FunctionCallExpression): Instruction[] {
    const callee = expr.callee as MemberExpression;
    const objectName = (callee.object as IdentifierExpression).name;
    const functionName = (callee.property as IdentifierExpression).name;

    // Handle special opcodes with code parameters
    if (['Savemap', 'Special', 'Temp'].includes(objectName) && ['bit', 'byte', 'word'].includes(functionName)) {
      const base = this.namespaceBases[objectName] || 0;
      if (functionName === 'bit') {
        if (expr.arguments.length !== 2) {
          throw new Error(`${objectName}.bit expects two arguments`);
        }
        const [addressExpr, bitExpr] = expr.arguments;
        if (addressExpr.type !== 'Literal' || bitExpr.type !== 'Literal') throw new Error('Arguments to bit must be literals');
        const address = Number(addressExpr.value);
        const bit = Number(bitExpr.value);
        const value = (address - base) * 8 + bit;
        return [{ type: 'instruction', mnemonic: `PUSH_${objectName.toUpperCase()}_BIT`, codeParams: [value.toString(16).padStart(Number(value) < 0x100 ? 2 : 4, '0')] }];
      } else if (functionName === 'byte' || functionName === 'word') {
        if (expr.arguments.length !== 1) throw new Error(`${objectName}.${functionName} expects one argument`);
        const addressExpr = expr.arguments[0];
        if (addressExpr.type !== 'Literal') throw new Error('Argument to byte/word must be a literal');
        const address = Number(addressExpr.value);
        const offset = address - base;
        const mnemonic = functionName === 'byte' ? `PUSH_${objectName.toUpperCase()}_BYTE` : `PUSH_${objectName.toUpperCase()}_WORD`;
        return [{ type: 'instruction', mnemonic, codeParams: [offset.toString(16).padStart(Number(offset) < 0x100 ? 2 : 4, '0')] }];
      }
    }

    const opcode = this.getOpcodeForFunctionCall(callee);
    if (!opcode.pushesResult) throw new Error(`Function ${objectName}.${functionName} does not push a result.`);
    const instructions: Instruction[] = [];
    expr.arguments.forEach(arg => instructions.push(...this.generateExpression(arg)));
    instructions.push({ type: 'instruction', mnemonic: opcode.mnemonic, codeParams: [] });
    return instructions;
  }

  private generateBinaryExpression(expr: BinaryExpression): Instruction[] {
    const leftInstructions = this.generateExpression(expr.left);
    const rightInstructions = this.generateExpression(expr.right);
    const operatorMnemonic: Record<string, string> = {
      '+': 'ADD', '-': 'SUB', '*': 'MUL', '<': 'LT', '>': 'GT', '<=': 'LE', '>=': 'GE', '==': 'EQ',
      '&': 'AND', '|': 'OR', 'and': 'LAND', 'or': 'LOR', '<<': 'SHL', '>>': 'SHR'
    };
    const mnemonic = operatorMnemonic[expr.operator];
    if (!mnemonic) throw new Error(`Unsupported operator: ${expr.operator}`);
    return [...leftInstructions, ...rightInstructions, { type: 'instruction', mnemonic, codeParams: [] }];
  }

  private generateUnaryExpression(expr: UnaryExpression): Instruction[] {
    const operandInstructions = this.generateExpression(expr.operand);
    const operatorMnemonic: Record<string, string> = {
      '-': 'NEG', '!': 'NOT'
    };
    const mnemonic = operatorMnemonic[expr.operator];
    if (!mnemonic) throw new Error(`Unsupported operator: ${expr.operator}`);
    return [...operandInstructions, { type: 'instruction', mnemonic, codeParams: [] }];
  }

  private getOpcodeForFunctionCall(callee: MemberExpression): OpcodeDefinition {
    const namespace = (callee.object as IdentifierExpression).name;
    const functionName = (callee.property as IdentifierExpression).name;
    if (namespace === 'Savemap' && functionName === 'bit') {
      return Opcodes[0x114];
    } else if (namespace === 'Savemap' && functionName === 'byte') {
      return Opcodes[0x118];
    } else if (namespace === 'Savemap' && functionName === 'word') {
      return Opcodes[0x11b];
    }
    const opcode = Object.values(Opcodes).find(op => op.namespace === namespace && op.name === functionName);
    if (!opcode) throw new Error(`Unknown function: ${namespace}.${functionName}`);
    return opcode;
  }

  private resolveLabels(instructions: Instruction[]): { mnemonic: string; codeParams: string[] }[] {
    const labelOffsets = new Map<string, number>();
    let offset = this.startingOffset;
    for (const inst of instructions) {
      if (inst.type === 'label') labelOffsets.set(inst.label, offset);
      else offset += this.getInstructionSize(inst);
    }
    const resolved: { mnemonic: string; codeParams: string[] }[] = [];
    for (const inst of instructions) {
      if (inst.type === 'instruction') {
        const codeParams = inst.codeParams.map(param => {
          if (labelOffsets.has(param)) {
            const targetOffset = labelOffsets.get(param)!;
            return targetOffset.toString(16).padStart(targetOffset < 0x100 ? 2 : 4, '0');
          }
          return param;
        });
        resolved.push({ mnemonic: inst.mnemonic, codeParams });
      }
    }
    return resolved;
  }

  private getInstructionSize(inst: Instruction): number {
    if (inst.type === 'label') return 0;
    return inst.mnemonic.startsWith('CALL_FN_') ? 1 : 1 + inst.codeParams.length;
  }  
}

/**
 * Parser class to convert tokens into an AST.
 */
class Parser {
  private tokens: Token[];
  private index: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | null {
    return this.index < this.tokens.length ? this.tokens[this.index] : null;
  }

  private consume(expectedType?: string): Token {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of input');
    if (expectedType && token.type !== expectedType) {
      throw new Error(`Expected ${expectedType}, got ${token.type}: ${token.value} at ${this.index}`);
    }
    this.index++;
    return token;
  }

  public parse(): Statement[] {
    const statements: Statement[] = [];
    while (this.peek()) {
      statements.push(this.parseStatement());
    }
    return statements;
  }

  private parseStatement(): Statement {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of input');
    switch (token.type) {
      case 'keyword':
        if (token.value === 'if') return this.parseIfStatement();
        if (token.value === 'goto') return this.parseGotoStatement();
        if (token.value === 'return') {
          this.consume('keyword');
          return { type: 'Return' };
        }
        break;
      case 'label_delim':
        return this.parseLabelStatement();
      default:
        const expr = this.parseExpression();
        if (this.peek()?.type === 'punct' && this.peek()?.value === '=') {
          this.consume('punct');
          const right = this.parseExpression();
          return { type: 'Assignment', left: expr, right };
        }
        return { type: 'ExpressionStatement', expression: expr };
    }
    throw new Error(`Unexpected token: ${token.type} ${token.value}`);
  }

  private parseIfStatement(): IfStatement {
    this.consume('keyword'); // 'if'
    const condition = this.parseExpression();
    const nextToken = this.peek();
    if (!nextToken || nextToken.type !== 'keyword' || nextToken.value !== 'then') {
      throw new Error(`Expected 'then' after condition, got ${nextToken?.type || 'none'}: ${nextToken?.value || 'none'} at index ${this.index}`);
    }
    this.consume('keyword'); // 'then'
    const thenBranch: Statement[] = [];
    while (this.peek() && (this.peek()!.type !== 'keyword' || this.peek()!.value !== 'end')) {
      thenBranch.push(this.parseStatement());
    }
    this.consume('keyword'); // 'end'
    return { type: 'If', condition, thenBranch };
  }

  private parseGotoStatement(): GotoStatement {
    this.consume('keyword'); // 'goto'
    const label = this.consume('identifier').value;
    return { type: 'Goto', label };
  }

  private parseLabelStatement(): LabelStatement {
    this.consume('label_delim'); // '::'
    const label = this.consume('identifier').value;
    this.consume('label_delim'); // '::'
    return { type: 'Label', label };
  }

  private parseExpression(): Expression {
    return this.parseUnaryExpression();
  }

  private parseUnaryExpression(): Expression {
    const token = this.peek();
    
    // Check if we have a unary operator
    if (token && token.type === 'operator' && ['!', '-'].includes(token.value)) {
      const operator = this.consume('operator').value;
      const operand = this.parseUnaryExpression(); // Recursive to handle chained unary ops like !!a
      return { type: 'Unary', operator, operand };
    }
    
    // If no unary operator, parse as a binary expression
    return this.parseBinaryExpression(0);
  }

  private parseBinaryExpression(minPrecedence: number): Expression {
    let left = this.parseMemberOrCall();
    while (true) {
      const operatorToken = this.peek();
      if (!operatorToken || operatorToken.type !== 'operator') break;
      const operator = operatorToken.value;
      const precedence = this.getPrecedence(operator);
      if (precedence < minPrecedence) break;
      this.consume('operator');
      const right = this.parseBinaryExpression(precedence + 1);
      left = { type: 'Binary', operator, left, right };
    }
    return left;
  }

  private getPrecedence(operator: string): number {
    switch (operator) {
      case 'or':
        return 1;
      case 'and':
        return 2;
      case '<':
      case '>':
      case '<=':
      case '>=':
      case '==':
      case '!=':
        return 3;
      case '<<':
      case '>>':
        return 4;
      case '+':
      case '-':
        return 5;
      case '*':
      case '/':
        return 6;
      default:
        return 0;
    }
  }

  private parseMemberOrCall(): Expression {
    let expr = this.parsePrimary();
    while (this.peek() && (this.peek()!.value === '.' || this.peek()!.value === '[' || this.peek()!.value === '(')) {
      if (this.peek()!.value === '.') {
        this.consume('punct');
        const property = this.consume('identifier');
        expr = { type: 'Member', object: expr, property: { type: 'Identifier', name: property.value } };
      } else if (this.peek()!.value === '[') {
        this.consume('punct'); // '['
        const index = this.parseExpression();
        this.consume('punct'); // ']'
        expr = { type: 'Index', base: expr, index };
      } else if (this.peek()!.value === '(') {
        this.consume('punct');
        const args: Expression[] = [];
        if (this.peek() && this.peek()!.value !== ')') {
          args.push(this.parseExpression());
          while (this.peek() && this.peek()!.value === ',') {
            this.consume('punct');
            args.push(this.parseExpression());
          }
        }
        this.consume('punct'); // ')'
        expr = { type: 'FunctionCall', callee: expr, arguments: args };
      }
    }
    return expr;
  }

  private parsePrimary(): Expression {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of input');
    if (token.type === 'number') {
      this.consume('number');
      // Support both hex (0x) and decimal numbers
      return { 
        type: 'Literal', 
        value: token.value.startsWith('0x') ? 
          parseInt(token.value, 16) : 
          parseInt(token.value, 10) 
      };
    } else if (token.type === 'identifier') {
      this.consume('identifier');
      return { type: 'Identifier', name: token.value };
    } else if (token.type === 'punct' && token.value === '(') {
      this.consume('punct');
      const expr = this.parseExpression();
      this.consume('punct'); // ')'
      return expr;
    }
    throw new Error(`Unexpected token in primary expression: ${token.type} ${token.value}`);
  }
}