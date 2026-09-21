import { Token, TokenType as T } from "./tokens.js";
import * as A from "./ast.js";
import { MittiSyntaxError } from "./lexer.js";

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parseProgram(): A.Program {
    const body: A.Stmt[] = [];
    this.skipNewlines();
    while (!this.check(T.EOF)) {
      body.push(this.statement());
      this.skipNewlines();
    }
    return { kind: "Program", body };
  }

  // ---------- yordamchi metodlar ----------

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private check(type: T): boolean {
    return this.peek().type === type;
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    if (this.pos < this.tokens.length - 1) this.pos++;
    return t;
  }

  private match(...types: T[]): boolean {
    if (types.includes(this.peek().type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: T, message: string): Token {
    if (this.check(type)) return this.advance();
    const t = this.peek();
    throw new MittiSyntaxError(`${message} (topildi: ${t.type} '${t.value}')`, t.line, t.col);
  }

  private skipNewlines() {
    while (this.check(T.NEWLINE)) this.advance();
  }

  // ---------- statements ----------

  private statement(): A.Stmt {
    const t = this.peek();
    switch (t.type) {
      case T.IF: return this.ifStatement();
      case T.WHILE: return this.whileStatement();
      case T.FOR: return this.forStatement();
      case T.FUNC: return this.functionDecl();
      case T.RETURN: return this.returnStatement();
      case T.IMPORT: return this.importStatement();
      case T.FROM: return this.fromStatement();
      case T.TRY: return this.tryStatement();
      case T.RAISE:
      case T.THROW:
        return this.raiseStatement();
      case T.BREAK:
        this.advance();
        this.endOfStatement();
        return { kind: "BreakStmt", line: t.line };
      case T.CONTINUE:
        this.advance();
        this.endOfStatement();
        return { kind: "ContinueStmt", line: t.line };
      default:
        return this.exprStatement();
    }
  }

  private endOfStatement() {
    if (this.check(T.NEWLINE) || this.check(T.EOF)) {
      this.skipNewlines();
    }
  }

  private block(): A.BlockStmt {
    const line = this.peek().line;
    this.expect(T.COLON, "':' kutilgan edi");
    this.skipNewlines();
    this.expect(T.INDENT, "blok boshlanishi uchun indentatsiya kutilgan edi");
    const body: A.Stmt[] = [];
    this.skipNewlines();
    while (!this.check(T.DEDENT) && !this.check(T.EOF)) {
      body.push(this.statement());
      this.skipNewlines();
    }
    this.expect(T.DEDENT, "blok indentatsiyasi tugashi kutilgan edi");
    return { kind: "BlockStmt", body, line };
  }

  private ifStatement(): A.IfStmt {
    const line = this.advance().line; // 'if'
    const condition = this.expression();
    const thenBranch = this.block();
    let elseBranch: A.BlockStmt | A.IfStmt | null = null;
    if (this.check(T.ELIF)) {
      elseBranch = this.ifStatement();
    } else if (this.match(T.ELSE)) {
      elseBranch = this.block();
    }
    return { kind: "IfStmt", condition, thenBranch, elseBranch, line };
  }

  private whileStatement(): A.WhileStmt {
    const line = this.advance().line; // 'while'
    const condition = this.expression();
    const body = this.block();
    return { kind: "WhileStmt", condition, body, line };
  }

  private forStatement(): A.ForStmt {
    const line = this.advance().line; // 'for'
    const varName = this.expect(T.IDENT, "o'zgaruvchi nomi kutilgan edi").value;
    this.expect(T.IN, "'in' kutilgan edi");
    const iterable = this.expression();
    const body = this.block();
    return { kind: "ForStmt", varName, iterable, body, line };
  }

  private functionDecl(): A.FunctionDecl {
    const line = this.advance().line; // 'func'
    const name = this.expect(T.IDENT, "funksiya nomi kutilgan edi").value;
    this.expect(T.LPAREN, "'(' kutilgan edi");
    const params: string[] = [];
    if (!this.check(T.RPAREN)) {
      do {
        params.push(this.expect(T.IDENT, "parametr nomi kutilgan edi").value);
      } while (this.match(T.COMMA));
    }
    this.expect(T.RPAREN, "')' kutilgan edi");
    const body = this.block();
    return { kind: "FunctionDecl", name, params, body, line };
  }

  private returnStatement(): A.ReturnStmt {
    const line = this.advance().line; // 'return'
    let value: A.Expr | null = null;
    if (!this.check(T.NEWLINE) && !this.check(T.EOF) && !this.check(T.DEDENT)) {
      value = this.expression();
    }
    this.endOfStatement();
    return { kind: "ReturnStmt", value, line };
  }

  private importStatement(): A.ImportStmt {
    const t = this.advance(); // 'import'
    let source = "";
    if (this.check(T.STRING)) {
      source = this.advance().value;
    } else if (this.check(T.IDENT)) {
      source = this.advance().value;
    } else {
      throw new MittiSyntaxError("import dan so'ng modul nomi yoki fayl yo'li (satr) kutilgan edi", t.line, t.col);
    }

    let alias: string | undefined = undefined;
    if (this.check(T.AS)) {
      this.advance(); // 'as'
      alias = this.expect(T.IDENT, "'as' dan so'ng identifikator kutilgan edi").value;
    }

    this.endOfStatement();
    return {
      kind: "ImportStmt",
      source,
      isFrom: false,
      alias,
      line: t.line,
    };
  }

  private fromStatement(): A.ImportStmt {
    const t = this.advance(); // 'from'
    let source = "";
    if (this.check(T.STRING)) {
      source = this.advance().value;
    } else if (this.check(T.IDENT)) {
      source = this.advance().value;
    } else {
      throw new MittiSyntaxError("from dan so'ng modul nomi yoki fayl yo'li (satr) kutilgan edi", t.line, t.col);
    }

    this.expect(T.IMPORT, "modul manbasidan so'ng 'import' kutilgan edi");

    const specifiers: A.ImportSpecifier[] = [];
    do {
      const imported = this.expect(T.IDENT, "import qilinadigan nom kutilgan edi").value;
      let local = imported;
      if (this.check(T.AS)) {
        this.advance();
        local = this.expect(T.IDENT, "'as' dan so'ng identifikator kutilgan edi").value;
      }
      specifiers.push({ imported, local });
      if (this.check(T.COMMA)) {
        this.advance();
      } else {
        break;
      }
    } while (!this.check(T.NEWLINE) && !this.check(T.EOF));

    this.endOfStatement();
    return {
      kind: "ImportStmt",
      source,
      isFrom: true,
      specifiers,
      line: t.line,
    };
  }

  private tryStatement(): A.TryStmt {
    const line = this.advance().line; // 'try'
    const tryBlock = this.block();

    let catchVar: string | undefined = undefined;
    let exceptBlock: A.BlockStmt | undefined = undefined;
    let finallyBlock: A.BlockStmt | undefined = undefined;

    this.skipNewlines();
    if (this.check(T.EXCEPT)) {
      this.advance(); // 'except'
      if (this.check(T.IDENT)) {
        catchVar = this.advance().value;
      }
      exceptBlock = this.block();
    }

    this.skipNewlines();
    if (this.check(T.FINALLY)) {
      this.advance(); // 'finally'
      finallyBlock = this.block();
    }

    if (!exceptBlock && !finallyBlock) {
      throw new MittiSyntaxError("'try' dan so'ng kamida bitta 'except' yoki 'finally' bloki bo'lishi kerak", line, 1);
    }

    return {
      kind: "TryStmt",
      tryBlock,
      catchVar,
      exceptBlock,
      finallyBlock,
      line,
    };
  }

  private raiseStatement(): A.RaiseStmt {
    const line = this.advance().line; // 'raise' or 'throw'
    const argument = this.expression();
    this.endOfStatement();
    return { kind: "RaiseStmt", argument, line };
  }

  private exprStatement(): A.ExprStmt {
    const line = this.peek().line;
    const expr = this.expression();
    this.endOfStatement();
    return { kind: "ExprStmt", expression: expr, line };
  }

  // ---------- expressions (precedence climbing) ----------

  private expression(): A.Expr {
    return this.assignment();
  }

  private assignment(): A.Expr {
    const expr = this.or();
    const opMap: Partial<Record<T, string>> = {
      [T.EQ]: "=",
      [T.PLUS_EQ]: "+=",
      [T.MINUS_EQ]: "-=",
      [T.STAR_EQ]: "*=",
      [T.SLASH_EQ]: "/=",
    };
    if ([T.EQ, T.PLUS_EQ, T.MINUS_EQ, T.STAR_EQ, T.SLASH_EQ].includes(this.peek().type)) {
      const opTok = this.advance();
      const value = this.assignment();
      if (expr.kind !== "Identifier" && expr.kind !== "IndexExpr" && expr.kind !== "MemberExpr") {
        throw new MittiSyntaxError("bu ifodaga qiymat berib bo'lmaydi", opTok.line, opTok.col);
      }
      return { kind: "AssignExpr", operator: opMap[opTok.type]!, target: expr, value, line: opTok.line };
    }
    return expr;
  }

  private or(): A.Expr {
    let expr = this.and();
    while (this.check(T.OR)) {
      const line = this.advance().line;
      const right = this.and();
      expr = { kind: "LogicalExpr", operator: "or", left: expr, right, line };
    }
    return expr;
  }

  private and(): A.Expr {
    let expr = this.equality();
    while (this.check(T.AND)) {
      const line = this.advance().line;
      const right = this.equality();
      expr = { kind: "LogicalExpr", operator: "and", left: expr, right, line };
    }
    return expr;
  }

  private equality(): A.Expr {
    let expr = this.comparison();
    while (this.check(T.EQEQ) || this.check(T.NEQ)) {
      const opTok = this.advance();
      const right = this.comparison();
      expr = { kind: "BinaryExpr", operator: opTok.value, left: expr, right, line: opTok.line };
    }
    return expr;
  }

  private comparison(): A.Expr {
    let expr = this.additive();
    while ([T.LT, T.GT, T.LTE, T.GTE].includes(this.peek().type)) {
      const opTok = this.advance();
      const right = this.additive();
      expr = { kind: "BinaryExpr", operator: opTok.value, left: expr, right, line: opTok.line };
    }
    return expr;
  }

  private additive(): A.Expr {
    let expr = this.multiplicative();
    while (this.check(T.PLUS) || this.check(T.MINUS)) {
      const opTok = this.advance();
      const right = this.multiplicative();
      expr = { kind: "BinaryExpr", operator: opTok.value, left: expr, right, line: opTok.line };
    }
    return expr;
  }

  private multiplicative(): A.Expr {
    let expr = this.unary();
    while ([T.STAR, T.SLASH, T.PERCENT].includes(this.peek().type)) {
      const opTok = this.advance();
      const right = this.unary();
      expr = { kind: "BinaryExpr", operator: opTok.value, left: expr, right, line: opTok.line };
    }
    return expr;
  }

  private unary(): A.Expr {
    if (this.check(T.MINUS) || this.check(T.NOT)) {
      const opTok = this.advance();
      const argument = this.unary();
      return { kind: "UnaryExpr", operator: opTok.type === T.NOT ? "not" : "-", argument, line: opTok.line };
    }
    return this.callOrMember();
  }

  private callOrMember(): A.Expr {
    let expr = this.primary();
    for (;;) {
      if (this.check(T.LPAREN)) {
        const line = this.advance().line;
        const args: A.Expr[] = [];
        if (!this.check(T.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(T.COMMA));
        }
        this.expect(T.RPAREN, "')' kutilgan edi");
        expr = { kind: "CallExpr", callee: expr, args, line };
      } else if (this.check(T.LBRACKET)) {
        const line = this.advance().line;
        const index = this.expression();
        this.expect(T.RBRACKET, "']' kutilgan edi");
        expr = { kind: "IndexExpr", object: expr, index, line };
      } else if (this.check(T.DOT)) {
        const line = this.advance().line;
        const prop = this.expect(T.IDENT, "xususiyat nomi kutilgan edi").value;
        expr = { kind: "MemberExpr", object: expr, property: prop, line };
      } else {
        break;
      }
    }
    return expr;
  }

  private primary(): A.Expr {
    const t = this.peek();
    switch (t.type) {
      case T.NUMBER:
        this.advance();
        return { kind: "NumberLit", value: parseFloat(t.value), line: t.line };
      case T.STRING:
        this.advance();
        return { kind: "StringLit", value: t.value, line: t.line };
      case T.TRUE:
        this.advance();
        return { kind: "BoolLit", value: true, line: t.line };
      case T.FALSE:
        this.advance();
        return { kind: "BoolLit", value: false, line: t.line };
      case T.NULL:
        this.advance();
        return { kind: "NullLit", line: t.line };
      case T.IDENT:
        this.advance();
        return { kind: "Identifier", name: t.value, line: t.line };
      case T.FUNC:
        return this.functionExpr();
      case T.LPAREN: {
        this.advance();
        const expr = this.expression();
        this.expect(T.RPAREN, "')' kutilgan edi");
        return expr;
      }
      case T.LBRACKET:
        return this.arrayLit();
      case T.LBRACE:
        return this.objectLit();
      default:
        throw new MittiSyntaxError(`kutilmagan token: '${t.value || t.type}'`, t.line, t.col);
    }
  }

  private functionExpr(): A.FunctionExpr {
    const line = this.advance().line; // 'func'
    let name: string | null = null;
    if (this.check(T.IDENT)) name = this.advance().value;
    this.expect(T.LPAREN, "'(' kutilgan edi");
    const params: string[] = [];
    if (!this.check(T.RPAREN)) {
      do {
        params.push(this.expect(T.IDENT, "parametr nomi kutilgan edi").value);
      } while (this.match(T.COMMA));
    }
    this.expect(T.RPAREN, "')' kutilgan edi");
    const body = this.block();
    return { kind: "FunctionExpr", name, params, body, line };
  }

  private arrayLit(): A.ArrayLit {
    const line = this.advance().line; // '['
    const elements: A.Expr[] = [];
    this.skipNewlinesInsideBrackets();
    if (!this.check(T.RBRACKET)) {
      do {
        this.skipNewlinesInsideBrackets();
        elements.push(this.expression());
        this.skipNewlinesInsideBrackets();
      } while (this.match(T.COMMA) && (this.skipNewlinesInsideBrackets(), !this.check(T.RBRACKET)));
    }
    this.expect(T.RBRACKET, "']' kutilgan edi");
    return { kind: "ArrayLit", elements, line };
  }

  private objectLit(): A.ObjectLit {
    const line = this.advance().line; // '{'
    const keys: A.Expr[] = [];
    const values: A.Expr[] = [];
    this.skipNewlinesInsideBrackets();
    if (!this.check(T.RBRACE)) {
      do {
        this.skipNewlinesInsideBrackets();
        let key: A.Expr;
        if (this.check(T.IDENT)) {
          const kt = this.advance();
          key = { kind: "StringLit", value: kt.value, line: kt.line };
        } else {
          key = this.expression();
        }
        this.expect(T.COLON, "':' kutilgan edi");
        const value = this.expression();
        keys.push(key);
        values.push(value);
        this.skipNewlinesInsideBrackets();
      } while (this.match(T.COMMA) && (this.skipNewlinesInsideBrackets(), !this.check(T.RBRACE)));
    }
    this.expect(T.RBRACE, "'}' kutilgan edi");
    return { kind: "ObjectLit", keys, values, line };
  }

  // Lexer parenDepth ichida NEWLINE chiqarmaydi, lekin ehtiyot uchun qoldiramiz
  private skipNewlinesInsideBrackets() {
    while (this.check(T.NEWLINE)) this.advance();
  }
}
