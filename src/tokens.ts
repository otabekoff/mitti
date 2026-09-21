export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  IDENT = "IDENT",

  // Keywords
  TRUE = "TRUE",
  FALSE = "FALSE",
  NULL = "NULL",
  IF = "IF",
  ELIF = "ELIF",
  ELSE = "ELSE",
  WHILE = "WHILE",
  FOR = "FOR",
  IN = "IN",
  FUNC = "FUNC",
  RETURN = "RETURN",
  BREAK = "BREAK",
  CONTINUE = "CONTINUE",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  // Operators / punctuation
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  PERCENT = "PERCENT",

  EQ = "EQ", // =
  EQEQ = "EQEQ", // ==
  NEQ = "NEQ", // !=
  LT = "LT",
  GT = "GT",
  LTE = "LTE",
  GTE = "GTE",

  PLUS_EQ = "PLUS_EQ", // +=
  MINUS_EQ = "MINUS_EQ", // -=
  STAR_EQ = "STAR_EQ", // *=
  SLASH_EQ = "SLASH_EQ", // /=

  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",

  COMMA = "COMMA",
  COLON = "COLON",
  DOT = "DOT",

  NEWLINE = "NEWLINE",
  INDENT = "INDENT",
  DEDENT = "DEDENT",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  null: TokenType.NULL,
  if: TokenType.IF,
  elif: TokenType.ELIF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  for: TokenType.FOR,
  in: TokenType.IN,
  func: TokenType.FUNC,
  return: TokenType.RETURN,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
};
