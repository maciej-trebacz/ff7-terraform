import { Expression, GotoStatement, IfStatement, LabelStatement, Statement, Token } from "./types";

/**
 * Parser class to convert tokens into an AST.
 */
export class Parser {
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
    return this.parseBinaryExpression(0);
  }

  private parseUnaryExpression(): Expression {
    const token = this.peek();
    
    // Check if we have a unary operator
    if (token && token.type === 'operator' && ['!', '-'].includes(token.value)) {
      const operator = this.consume('operator').value;
      const operand = this.parseUnaryExpression(); // Recursive to handle chained unary ops like !!a
      return { type: 'Unary', operator, operand };
    }
    
    // If no unary operator, parse a member/call expression.
    return this.parseMemberOrCall();
  }

  private parseBinaryExpression(minPrecedence: number): Expression {
    let left = this.parseUnaryExpression();
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