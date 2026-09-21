import { Token, TokenType, KEYWORDS } from "./tokens.js";

class MittiSyntaxError extends Error {
  constructor(message: string, public line: number, public col: number) {
    super(`Sintaksis xatosi (${line}-qator, ${col}-ustun): ${message}`);
  }
}

export { MittiSyntaxError };

/**
 * Lexer/tokenizer. Python uslubida indentatsiyani kuzatib boradi:
 * har bir mantiqiy qator boshida bo'sh joylar sonini hisoblab,
 * INDENT / DEDENT tokenlarini chiqaradi.
 */
export class Lexer {
  private src: string;
  private pos = 0;
  private line = 1;
  private col = 1;
  private tokens: Token[] = [];
  private indentStack: number[] = [0];
  // Qavslar ichida bo'lsak (parens depth > 0) yangi qator NEWLINE hisoblanmaydi
  private parenDepth = 0;
  private atLineStart = true;

  constructor(src: string) {
    // Tab -> 4 space (soddalik uchun)
    this.src = src.replace(/\t/g, "    ");
  }

  tokenize(): Token[] {
    while (this.pos < this.src.length) {
      if (this.atLineStart && this.parenDepth === 0) {
        this.handleIndentation();
        if (this.pos >= this.src.length) break;
      }
      const ch = this.peek();

      if (ch === "\n") {
        this.advance();
        if (this.parenDepth === 0) {
          this.pushToken(TokenType.NEWLINE, "\\n");
          this.atLineStart = true;
        }
        continue;
      }

      if (ch === " " || ch === "\r") {
        this.advance();
        continue;
      }

      if (ch === "#") {
        while (this.pos < this.src.length && this.peek() !== "\n") this.advance();
        continue;
      }

      if (this.isDigit(ch)) {
        this.readNumber();
        continue;
      }

      if (ch === '"' || ch === "'") {
        this.readString(ch);
        continue;
      }

      if (this.isIdentStart(ch)) {
        this.readIdentifier();
        continue;
      }

      this.readOperator();
    }

    // Fayl oxirida ochiq qatorni yopamiz
    if (this.tokens.length && this.tokens[this.tokens.length - 1].type !== TokenType.NEWLINE) {
      this.pushToken(TokenType.NEWLINE, "\\n");
    }
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.pushToken(TokenType.DEDENT, "");
    }
    this.pushToken(TokenType.EOF, "");
    return this.tokens;
  }

  private handleIndentation() {
    const lineStartPos = this.pos;
    let spaces = 0;
    while (this.peek() === " ") {
      spaces++;
      this.advance();
    }
    // Bo'sh qator yoki faqat izohli qatorni o'tkazib yuboramiz (indent hisoblanmaydi)
    if (this.peek() === "\n" || this.peek() === "#" || this.pos >= this.src.length) {
      this.atLineStart = false; // asosiy tsikl \n ni o'zi qayta ishlaydi
      return;
    }
    this.atLineStart = false;

    const current = this.indentStack[this.indentStack.length - 1];
    if (spaces > current) {
      this.indentStack.push(spaces);
      this.pushToken(TokenType.INDENT, "");
    } else if (spaces < current) {
      while (this.indentStack.length > 1 && spaces < this.indentStack[this.indentStack.length - 1]) {
        this.indentStack.pop();
        this.pushToken(TokenType.DEDENT, "");
      }
      if (this.indentStack[this.indentStack.length - 1] !== spaces) {
        throw new MittiSyntaxError("noto'g'ri indentatsiya (bo'sh joylar soni mos kelmadi)", this.line, this.col);
      }
    }
    void lineStartPos;
  }

  private peek(offset = 0): string {
    return this.src[this.pos + offset] ?? "";
  }

  private advance(): string {
    const ch = this.src[this.pos];
    this.pos++;
    if (ch === "\n") {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return ch;
  }

  private isDigit(ch: string) {
    return ch >= "0" && ch <= "9";
  }

  private isIdentStart(ch: string) {
    return /[A-Za-z_]/.test(ch);
  }

  private isIdentPart(ch: string) {
    return /[A-Za-z0-9_]/.test(ch);
  }

  private pushToken(type: TokenType, value: string) {
    this.tokens.push({ type, value, line: this.line, col: this.col });
  }

  private readNumber() {
    const startLine = this.line, startCol = this.col;
    let value = "";
    while (this.isDigit(this.peek())) value += this.advance();
    if (this.peek() === "." && this.isDigit(this.peek(1))) {
      value += this.advance();
      while (this.isDigit(this.peek())) value += this.advance();
    }
    this.tokens.push({ type: TokenType.NUMBER, value, line: startLine, col: startCol });
  }

  private readString(quote: string) {
    const startLine = this.line, startCol = this.col;
    this.advance(); // ochuvchi qo'shtirnoq
    let value = "";
    while (this.pos < this.src.length && this.peek() !== quote) {
      let ch = this.advance();
      if (ch === "\\") {
        const next = this.advance();
        switch (next) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "\\": value += "\\"; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += next;
        }
      } else {
        value += ch;
      }
    }
    if (this.peek() !== quote) {
      throw new MittiSyntaxError("satr yopilmagan (tirnoq topilmadi)", startLine, startCol);
    }
    this.advance(); // yopuvchi qo'shtirnoq
    this.tokens.push({ type: TokenType.STRING, value, line: startLine, col: startCol });
  }

  private readIdentifier() {
    const startLine = this.line, startCol = this.col;
    let value = "";
    while (this.isIdentPart(this.peek())) value += this.advance();
    const type = KEYWORDS[value] ?? TokenType.IDENT;
    this.tokens.push({ type, value, line: startLine, col: startCol });
  }

  private readOperator() {
    const startLine = this.line, startCol = this.col;
    const two = this.peek() + this.peek(1);
    const twoCharMap: Record<string, TokenType> = {
      "==": TokenType.EQEQ,
      "!=": TokenType.NEQ,
      "<=": TokenType.LTE,
      ">=": TokenType.GTE,
      "+=": TokenType.PLUS_EQ,
      "-=": TokenType.MINUS_EQ,
      "*=": TokenType.STAR_EQ,
      "/=": TokenType.SLASH_EQ,
    };
    if (twoCharMap[two]) {
      this.advance();
      this.advance();
      this.tokens.push({ type: twoCharMap[two], value: two, line: startLine, col: startCol });
      return;
    }

    const one = this.peek();
    const oneCharMap: Record<string, TokenType> = {
      "+": TokenType.PLUS,
      "-": TokenType.MINUS,
      "*": TokenType.STAR,
      "/": TokenType.SLASH,
      "%": TokenType.PERCENT,
      "=": TokenType.EQ,
      "<": TokenType.LT,
      ">": TokenType.GT,
      "(": TokenType.LPAREN,
      ")": TokenType.RPAREN,
      "[": TokenType.LBRACKET,
      "]": TokenType.RBRACKET,
      "{": TokenType.LBRACE,
      "}": TokenType.RBRACE,
      ",": TokenType.COMMA,
      ":": TokenType.COLON,
      ".": TokenType.DOT,
    };
    if (oneCharMap[one]) {
      if (one === "(" || one === "[" || one === "{") this.parenDepth++;
      if (one === ")" || one === "]" || one === "}") this.parenDepth = Math.max(0, this.parenDepth - 1);
      this.advance();
      this.tokens.push({ type: oneCharMap[one], value: one, line: startLine, col: startCol });
      return;
    }

    throw new MittiSyntaxError(`kutilmagan belgi: '${one}'`, startLine, startCol);
  }
}
