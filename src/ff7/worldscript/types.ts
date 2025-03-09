// AST Node Interfaces
export interface BaseExpression {
  type: string;
}

export interface LiteralExpression extends BaseExpression {
  type: 'Literal';
  value: string | number | boolean;
}

export interface IdentifierExpression extends BaseExpression {
  type: 'Identifier';
  name: string;
}

export interface MemberExpression extends BaseExpression {
  type: 'Member';
  object: Expression;
  property: IdentifierExpression;
}

export interface FunctionCallExpression extends BaseExpression {
  type: 'FunctionCall';
  callee: Expression;
  arguments: Expression[];
}

export interface BinaryExpression extends BaseExpression {
  type: 'Binary';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseExpression {
  type: 'Unary';
  operator: string;
  operand: Expression;
}

export interface IndexExpression extends BaseExpression {
  type: 'Index';
  base: Expression;
  index: Expression;
}

export type Expression = 
  | LiteralExpression
  | IdentifierExpression
  | MemberExpression
  | FunctionCallExpression
  | BinaryExpression
  | UnaryExpression
  | IndexExpression;

export interface BaseStatement {
  type: string;
}

export interface ExpressionStatement extends BaseStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface IfStatement extends BaseStatement {
  type: 'If';
  condition: Expression;
  thenBranch: Statement[];
}

export interface GotoStatement extends BaseStatement {
  type: 'Goto';
  label: string;
}

export interface LabelStatement extends BaseStatement {
  type: 'Label';
  label: string;
}

export interface AssignmentStatement extends BaseStatement {
  type: 'Assignment';
  left: Expression;
  right: Expression;
}

export interface ReturnStatement extends BaseStatement {
  type: 'Return';
}

export interface BlockStatement extends BaseStatement {
  type: 'Block';
  body: Statement[];
}

// Define Statement as a discriminated union
export type Statement = 
  | ExpressionStatement
  | IfStatement
  | GotoStatement
  | LabelStatement
  | AssignmentStatement
  | ReturnStatement
  | BlockStatement;

// Compiler types
export interface Token {
  type: string;
  value: string;
}

// Instruction type for code generation
export type Instruction = 
  | { type: 'instruction'; mnemonic: string; codeParams: string[] }
  | { type: 'label'; label: string };