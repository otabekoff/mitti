// ===== Expressions =====

export type Expr =
  | NumberLit
  | StringLit
  | BoolLit
  | NullLit
  | Identifier
  | ArrayLit
  | ObjectLit
  | UnaryExpr
  | BinaryExpr
  | LogicalExpr
  | AssignExpr
  | CallExpr
  | IndexExpr
  | MemberExpr
  | FunctionExpr;

export interface NumberLit { kind: "NumberLit"; value: number; line: number; }
export interface StringLit { kind: "StringLit"; value: string; line: number; }
export interface BoolLit { kind: "BoolLit"; value: boolean; line: number; }
export interface NullLit { kind: "NullLit"; line: number; }
export interface Identifier { kind: "Identifier"; name: string; line: number; }
export interface ArrayLit { kind: "ArrayLit"; elements: Expr[]; line: number; }
export interface ObjectLit { kind: "ObjectLit"; keys: Expr[]; values: Expr[]; line: number; }

export interface UnaryExpr { kind: "UnaryExpr"; operator: string; argument: Expr; line: number; }
export interface BinaryExpr { kind: "BinaryExpr"; operator: string; left: Expr; right: Expr; line: number; }
export interface LogicalExpr { kind: "LogicalExpr"; operator: "and" | "or"; left: Expr; right: Expr; line: number; }

export interface AssignExpr { kind: "AssignExpr"; operator: string; target: Expr; value: Expr; line: number; }

export interface CallExpr { kind: "CallExpr"; callee: Expr; args: Expr[]; line: number; }
export interface IndexExpr { kind: "IndexExpr"; object: Expr; index: Expr; line: number; }
export interface MemberExpr { kind: "MemberExpr"; object: Expr; property: string; line: number; }
export interface FunctionExpr { kind: "FunctionExpr"; name: string | null; params: string[]; body: BlockStmt; line: number; }

// ===== Statements =====

export type Stmt =
  | ExprStmt
  | BlockStmt
  | IfStmt
  | WhileStmt
  | ForStmt
  | FunctionDecl
  | ReturnStmt
  | BreakStmt
  | ContinueStmt
  | ImportStmt;

export interface ImportSpecifier {
  imported: string;
  local: string;
}

export interface ImportStmt {
  kind: "ImportStmt";
  source: string;
  isFrom: boolean;
  specifiers?: ImportSpecifier[];
  alias?: string;
  line: number;
}

export interface ExprStmt { kind: "ExprStmt"; expression: Expr; line: number; }
export interface BlockStmt { kind: "BlockStmt"; body: Stmt[]; line: number; }
export interface IfStmt {
  kind: "IfStmt";
  condition: Expr;
  thenBranch: BlockStmt;
  elseBranch: BlockStmt | IfStmt | null;
  line: number;
}
export interface WhileStmt { kind: "WhileStmt"; condition: Expr; body: BlockStmt; line: number; }
export interface ForStmt { kind: "ForStmt"; varName: string; iterable: Expr; body: BlockStmt; line: number; }
export interface FunctionDecl { kind: "FunctionDecl"; name: string; params: string[]; body: BlockStmt; line: number; }
export interface ReturnStmt { kind: "ReturnStmt"; value: Expr | null; line: number; }
export interface BreakStmt { kind: "BreakStmt"; line: number; }
export interface ContinueStmt { kind: "ContinueStmt"; line: number; }

export interface Program { kind: "Program"; body: Stmt[]; }
