import * as A from "../ast.js";
import { Chunk, OpCode, makeChunk, writeChunk, addConstant } from "./opcodes.js";
import { MittiValue, MittiRuntimeError } from "../runtime.js";

/**
 * Lokal o'zgaruvchi yozuvi (kompilyatsiya vaqtida)
 */
interface Local {
  name: string;
  depth: number;
}

/**
 * Patch qilish uchun sakrash joyi (if/while uchun)
 */
interface JumpPatch {
  offset: number;
}

/**
 * AST → Bayt-kod kompilyatori.
 */
export class Compiler {
  private chunk: Chunk;
  private locals: Local[] = [];
  private scopeDepth: number = 0;
  private currentLine: number = 0;
  public isFunction: boolean = false;

  constructor(name: string = "<asosiy>", isFunction: boolean = false) {
    this.chunk = makeChunk(name);
    this.isFunction = isFunction;
    if (isFunction) {
      // slot 0 har doim chaqirilayotgan funksiyaning o'zi
      this.locals.push({ name: "", depth: 0 });
    }
  }

  /** Dasturni kompilatsiya qilib, tayyor Chunk qaytaradi */
  compile(program: A.Program): Chunk {
    for (const stmt of program.body) {
      this.compileStmt(stmt);
    }
    this.emit(OpCode.OP_HALT);
    return this.chunk;
  }

  // ============ STATEMENTS ============

  private compileStmt(stmt: A.Stmt): void {
    this.currentLine = (stmt as { line?: number }).line ?? this.currentLine;

    switch (stmt.kind) {
      case "ExprStmt":
        this.compileExpr(stmt.expression);
        this.emit(OpCode.OP_POP);
        break;

      case "FunctionDecl":
        this.compileFunctionDecl(stmt);
        break;

      case "ReturnStmt":
        if (stmt.value) {
          this.compileExpr(stmt.value);
        } else {
          this.emit(OpCode.OP_NULL);
        }
        this.emit(OpCode.OP_RETURN);
        break;

      case "BreakStmt":
        this.emit(OpCode.OP_HALT);
        break;

      case "ContinueStmt":
        this.emit(OpCode.OP_HALT);
        break;

      case "BlockStmt":
        for (const s of stmt.body) this.compileStmt(s);
        break;

      case "IfStmt":
        this.compileIf(stmt);
        break;

      case "WhileStmt":
        this.compileWhile(stmt);
        break;

      case "ForStmt":
        this.compileFor(stmt);
        break;

      case "ImportStmt":
        this.emit(OpCode.OP_NULL);
        this.emitNamedDefine(stmt.alias ?? (stmt.specifiers?.[0]?.local ?? stmt.source));
        break;

      case "TryStmt":
        for (const s of stmt.tryBlock.body) this.compileStmt(s);
        break;

      case "RaiseStmt":
        this.compileExpr(stmt.argument);
        this.emit(OpCode.OP_POP);
        break;

      default:
        break;
    }
  }

  private compileFunctionDecl(stmt: A.FunctionDecl): void {
    const fnChunk = compileFunction(stmt.name, stmt.params, stmt.body);
    const fnConst = new VMFunction(stmt.name, stmt.params.map((p) => p.name), fnChunk);
    const idx = addConstant(this.chunk, fnConst as unknown as MittiValue);
    this.emitBytes(OpCode.OP_CONSTANT, idx);

    if (this.isFunction) {
      const slot = this.addLocal(stmt.name);
      this.emitBytes(OpCode.OP_SET_LOCAL, slot);
      this.emit(OpCode.OP_POP);
    } else {
      this.emitNamedDefine(stmt.name);
    }
  }

  private compileIf(stmt: A.IfStmt): void {
    this.compileExpr(stmt.condition);

    // Shart false bo'lsa else'ga sakrash
    const thenJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
    this.emit(OpCode.OP_POP); // true bo'lsa shart qiymatini tozalaymiz

    for (const s of stmt.thenBranch.body) this.compileStmt(s);

    const elseJump = this.emitJump(OpCode.OP_JUMP);
    this.patchJump(thenJump);
    this.emit(OpCode.OP_POP); // false bo'lsa shart qiymatini tozalaymiz

    if (stmt.elseBranch) {
      if (stmt.elseBranch.kind === "IfStmt") {
        this.compileIf(stmt.elseBranch);
      } else {
        for (const s of stmt.elseBranch.body) this.compileStmt(s);
      }
    }

    this.patchJump(elseJump);
  }

  private compileWhile(stmt: A.WhileStmt): void {
    const loopStart = this.chunk.code.length;

    this.compileExpr(stmt.condition);
    const exitJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
    this.emit(OpCode.OP_POP);

    for (const s of stmt.body.body) this.compileStmt(s);

    this.emitLoop(loopStart);

    this.patchJump(exitJump);
    this.emit(OpCode.OP_POP);
  }

  private compileFor(stmt: A.ForStmt): void {
    // 1. Iterable'ni hisoblaymiz va iterSlot'ga saqlaymiz
    this.compileExpr(stmt.iterable);
    const iterSlot = this.addLocal(`__iter_${this.locals.length}__`);
    this.emitBytes(OpCode.OP_SET_LOCAL, iterSlot);
    this.emit(OpCode.OP_POP);

    // 2. Indeksni 0 ga tenglaymiz va idxSlot'ga saqlaymiz
    this.emitConstant(0);
    const idxSlot = this.addLocal(`__idx_${this.locals.length}__`);
    this.emitBytes(OpCode.OP_SET_LOCAL, idxSlot);
    this.emit(OpCode.OP_POP);

    const loopStart = this.chunk.code.length;

    // 3. Shart: __idx__ < len(__iter__)
    this.emitBytes(OpCode.OP_GET_LOCAL, idxSlot);         // idx
    this.emitNamedGet("len");                             // len funksiyasi
    this.emitBytes(OpCode.OP_GET_LOCAL, iterSlot);        // iter
    this.emitBytes(OpCode.OP_CALL, 1);                    // len(iter)
    this.emit(OpCode.OP_LESS);                            // idx < len(iter)

    const exitJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
    this.emit(OpCode.OP_POP);

    // 4. Sikl o'zgaruvchisi: varName = __iter__[__idx__]
    this.emitBytes(OpCode.OP_GET_LOCAL, iterSlot);
    this.emitBytes(OpCode.OP_GET_LOCAL, idxSlot);
    this.emit(OpCode.OP_GET_INDEX);

    if (this.isFunction) {
      let varSlot = this.resolveLocal(stmt.varName);
      if (varSlot === -1) varSlot = this.addLocal(stmt.varName);
      this.emitBytes(OpCode.OP_SET_LOCAL, varSlot);
    } else {
      this.emitNamedSet(stmt.varName);
    }
    this.emit(OpCode.OP_POP);

    // 5. Tana
    for (const s of stmt.body.body) this.compileStmt(s);

    // 6. __idx__ += 1
    this.emitBytes(OpCode.OP_GET_LOCAL, idxSlot);
    this.emitConstant(1);
    this.emit(OpCode.OP_ADD);
    this.emitBytes(OpCode.OP_SET_LOCAL, idxSlot);
    this.emit(OpCode.OP_POP);

    // 7. Qaytish
    this.emitLoop(loopStart);

    this.patchJump(exitJump);
    this.emit(OpCode.OP_POP);
  }

  // ============ EXPRESSIONS ============

  private compileExpr(expr: A.Expr): void {
    this.currentLine = expr.line ?? this.currentLine;

    switch (expr.kind) {
      case "NumberLit":
        this.emitConstant(expr.value);
        break;

      case "StringLit":
        this.emitConstant(expr.value);
        break;

      case "BoolLit":
        this.emit(expr.value ? OpCode.OP_TRUE : OpCode.OP_FALSE);
        break;

      case "NullLit":
        this.emit(OpCode.OP_NULL);
        break;

      case "Identifier":
        this.compileIdentifierGet(expr.name, expr.line);
        break;

      case "UnaryExpr":
        this.compileExpr(expr.argument);
        if (expr.operator === "-") this.emit(OpCode.OP_NEGATE);
        else if (expr.operator === "not") this.emit(OpCode.OP_NOT);
        break;

      case "BinaryExpr":
        this.compileBinary(expr);
        break;

      case "LogicalExpr":
        this.compileLogical(expr);
        break;

      case "AssignExpr":
        this.compileAssign(expr);
        break;

      case "CallExpr":
        this.compileCall(expr);
        break;

      case "ArrayLit":
        for (const el of expr.elements) this.compileExpr(el);
        this.emitBytes(OpCode.OP_BUILD_ARRAY, expr.elements.length);
        break;

      case "ObjectLit":
        for (let i = 0; i < expr.keys.length; i++) {
          this.compileExpr(expr.keys[i]);
          this.compileExpr(expr.values[i]);
        }
        this.emitBytes(OpCode.OP_BUILD_OBJECT, expr.keys.length);
        break;

      case "IndexExpr":
        this.compileExpr(expr.object);
        this.compileExpr(expr.index);
        this.emit(OpCode.OP_GET_INDEX);
        break;

      case "MemberExpr":
        this.compileExpr(expr.object);
        this.emitConstant(expr.property);
        this.emit(OpCode.OP_GET_INDEX);
        break;

      case "FunctionExpr":
        this.compileFunctionExpr(expr);
        break;

      default:
        break;
    }
  }

  private compileBinary(expr: A.BinaryExpr): void {
    this.compileExpr(expr.left);
    this.compileExpr(expr.right);

    switch (expr.operator) {
      case "+":  this.emit(OpCode.OP_ADD);           break;
      case "-":  this.emit(OpCode.OP_SUB);           break;
      case "*":  this.emit(OpCode.OP_MUL);           break;
      case "/":  this.emit(OpCode.OP_DIV);           break;
      case "%":  this.emit(OpCode.OP_MOD);           break;
      case "**": this.emit(OpCode.OP_POW);           break;
      case "==": this.emit(OpCode.OP_EQUAL);         break;
      case "!=": this.emit(OpCode.OP_NOT_EQUAL);     break;
      case ">":  this.emit(OpCode.OP_GREATER);       break;
      case ">=": this.emit(OpCode.OP_GREATER_EQUAL); break;
      case "<":  this.emit(OpCode.OP_LESS);          break;
      case "<=": this.emit(OpCode.OP_LESS_EQUAL);    break;
      default:   break;
    }
  }

  private compileLogical(expr: A.LogicalExpr): void {
    if (expr.operator === "and") {
      this.compileExpr(expr.left);
      const jump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
      this.emit(OpCode.OP_POP);
      this.compileExpr(expr.right);
      this.patchJump(jump);
    } else {
      this.compileExpr(expr.left);
      const jump = this.emitJump(OpCode.OP_JUMP_IF_TRUE);
      this.emit(OpCode.OP_POP);
      this.compileExpr(expr.right);
      this.patchJump(jump);
    }
  }

  private compileAssign(expr: A.AssignExpr): void {
    const target = expr.target;

    if (expr.operator === "=") {
      this.compileExpr(expr.value);
    } else {
      // +=, -=, *=, /=
      if (target.kind === "Identifier") {
        this.compileIdentifierGet(target.name, expr.line);
      } else if (target.kind === "IndexExpr") {
        this.compileExpr(target.object);
        this.compileExpr(target.index);
        this.emit(OpCode.OP_GET_INDEX);
      } else if (target.kind === "MemberExpr") {
        this.compileExpr(target.object);
        this.emitConstant(target.property);
        this.emit(OpCode.OP_GET_INDEX);
      }
      this.compileExpr(expr.value);
      switch (expr.operator) {
        case "+=": this.emit(OpCode.OP_ADD); break;
        case "-=": this.emit(OpCode.OP_SUB); break;
        case "*=": this.emit(OpCode.OP_MUL); break;
        case "/=": this.emit(OpCode.OP_DIV); break;
        default: break;
      }
    }

    if (target.kind === "Identifier") {
      if (this.isFunction) {
        let localSlot = this.resolveLocal(target.name);
        if (localSlot === -1) {
          localSlot = this.addLocal(target.name);
        }
        this.emitBytes(OpCode.OP_SET_LOCAL, localSlot);
      } else {
        this.emitNamedSet(target.name);
      }
    } else if (target.kind === "IndexExpr") {
      this.compileExpr(target.object);
      this.compileExpr(target.index);
      this.emit(OpCode.OP_SET_INDEX);
    } else if (target.kind === "MemberExpr") {
      this.compileExpr(target.object);
      this.emitConstant(target.property);
      this.emit(OpCode.OP_SET_INDEX);
    }
  }

  private compileCall(expr: A.CallExpr): void {
    this.compileExpr(expr.callee);
    for (const arg of expr.args) this.compileExpr(arg);
    this.emitBytes(OpCode.OP_CALL, expr.args.length);
  }

  private compileFunctionExpr(expr: A.FunctionExpr): void {
    const fnChunk = compileFunction(expr.name ?? "<anonim>", expr.params, expr.body);
    const fnConst = new VMFunction(expr.name ?? "<anonim>", expr.params.map((p) => p.name), fnChunk);
    const idx = addConstant(this.chunk, fnConst as unknown as MittiValue);
    this.emitBytes(OpCode.OP_CONSTANT, idx);
  }

  // ============ YORDAMCHI METODLAR ============

  private compileIdentifierGet(name: string, _line: number): void {
    if (this.isFunction) {
      const localSlot = this.resolveLocal(name);
      if (localSlot !== -1) {
        this.emitBytes(OpCode.OP_GET_LOCAL, localSlot);
        return;
      }
    }
    this.emitNamedGet(name);
  }

  private emit(byte: number): number {
    writeChunk(this.chunk, byte, this.currentLine);
    return this.chunk.code.length - 1;
  }

  private emitBytes(b1: number, b2: number): void {
    this.emit(b1);
    this.emit(b2);
  }

  private emitConstant(value: MittiValue): void {
    const idx = addConstant(this.chunk, value);
    this.emitBytes(OpCode.OP_CONSTANT, idx);
  }

  private emitNamedGet(name: string): void {
    const idx = addConstant(this.chunk, name);
    this.emitBytes(OpCode.OP_GET_GLOBAL, idx);
  }

  private emitNamedSet(name: string): void {
    const idx = addConstant(this.chunk, name);
    this.emitBytes(OpCode.OP_SET_GLOBAL, idx);
  }

  private emitNamedDefine(name: string): void {
    const idx = addConstant(this.chunk, name);
    this.emitBytes(OpCode.OP_DEFINE_GLOBAL, idx);
  }

  private emitJump(opcode: OpCode): JumpPatch {
    this.emit(opcode);
    this.emit(0xff);
    this.emit(0xff);
    return { offset: this.chunk.code.length - 2 };
  }

  private patchJump(patch: JumpPatch): void {
    const jump = this.chunk.code.length - patch.offset - 2;
    if (jump > 0xffff) {
      throw new MittiRuntimeError("Sakrash ofseti juda katta (>65535)", this.currentLine);
    }
    this.chunk.code[patch.offset] = (jump >> 8) & 0xff;
    this.chunk.code[patch.offset + 1] = jump & 0xff;
  }

  private emitLoop(loopStart: number): void {
    this.emit(OpCode.OP_LOOP);
    const offset = this.chunk.code.length - loopStart + 2;
    if (offset > 0xffff) {
      throw new MittiRuntimeError("Sikl ofseti juda katta", this.currentLine);
    }
    this.emit((offset >> 8) & 0xff);
    this.emit(offset & 0xff);
  }

  public addLocal(name: string): number {
    this.locals.push({ name, depth: this.scopeDepth });
    return this.locals.length - 1;
  }

  public resolveLocal(name: string): number {
    for (let i = this.locals.length - 1; i >= 0; i--) {
      if (this.locals[i].name === name) return i;
    }
    return -1;
  }
}

/**
 * Funksiyani alohida kompilatsiya qilish
 */
function compileFunction(name: string, params: A.TypedParam[], body: A.BlockStmt): Chunk {
  const compiler = new Compiler(name, true);
  for (const p of params) {
    compiler.addLocal(p.name);
  }
  for (const stmt of body.body) {
    compiler["compileStmt"](stmt);
  }
  compiler["emit"](OpCode.OP_NULL);
  compiler["emit"](OpCode.OP_RETURN);
  return compiler["chunk"];
}

export class VMFunction {
  constructor(
    public name: string,
    public params: string[],
    public chunk: Chunk
  ) {}
}
