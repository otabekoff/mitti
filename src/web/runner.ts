import * as A from "../ast.js";
import { Lexer, MittiSyntaxError } from "../lexer.js";
import { Parser } from "../parser.js";
import {
  Environment,
  MittiValue,
  MittiObject,
  MittiFunction,
  NativeFunction,
  MittiRuntimeError,
  MittiTypeError,
  MittiUserException,
  CallFrame,
  ReturnSignal,
  BreakSignal,
  ContinueSignal,
  isTruthy,
  stringify,
  typeName,
  checkType,
} from "../runtime.js";

/**
 * Brauzer va Web muhitlari uchun toza Mitti interpretatori.
 * Node.js qaramliklarisiz (fs, path-siz) ishlaydi.
 */
export class WebInterpreter {
  public globals = new Environment();
  public callStack: CallFrame[] = [];
  private output: (s: string) => void;

  constructor(output: (s: string) => void = (s) => console.log(s)) {
    this.output = output;
    this.installBuiltins();
  }

  run(program: A.Program): void {
    for (const stmt of program.body) {
      this.execStmt(stmt, this.globals);
    }
  }

  private execBlock(block: A.BlockStmt, env: Environment): void {
    for (const stmt of block.body) {
      this.execStmt(stmt, env);
    }
  }

  private execStmt(stmt: A.Stmt, env: Environment): void {
    switch (stmt.kind) {
      case "ExprStmt":
        this.evalExpr(stmt.expression, env);
        return;

      case "IfStmt": {
        if (isTruthy(this.evalExpr(stmt.condition, env))) {
          this.execBlock(stmt.thenBranch, new Environment(env));
        } else if (stmt.elseBranch) {
          if (stmt.elseBranch.kind === "IfStmt") {
            this.execStmt(stmt.elseBranch, env);
          } else {
            this.execBlock(stmt.elseBranch, new Environment(env));
          }
        }
        return;
      }

      case "WhileStmt": {
        let iterations = 0;
        const maxIterations = 500000; // brauzer muzlab qolmasligi uchun himoya
        while (isTruthy(this.evalExpr(stmt.condition, env))) {
          if (++iterations > maxIterations) {
            throw new MittiRuntimeError("Cheksiz sikl aniqlandi (500,000 iteratsiya chegarasi)", stmt.line);
          }
          try {
            this.execBlock(stmt.body, new Environment(env));
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        return;
      }

      case "ForStmt": {
        const iterable = this.evalExpr(stmt.iterable, env);
        const items = this.toIterable(iterable, stmt.line);
        for (const item of items) {
          const loopEnv = new Environment(env);
          loopEnv.define(stmt.varName, item);
          try {
            this.execBlock(stmt.body, loopEnv);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        return;
      }

      case "FunctionDecl": {
        const fn = new MittiFunction(stmt.name, stmt.params, stmt.body, env, stmt.returnType);
        env.define(stmt.name, fn);
        return;
      }

      case "ReturnStmt": {
        const value = stmt.value ? this.evalExpr(stmt.value, env) : null;
        throw new ReturnSignal(value);
      }

      case "BreakStmt":
        throw new BreakSignal();

      case "ContinueStmt":
        throw new ContinueSignal();

      case "BlockStmt":
        this.execBlock(stmt, new Environment(env));
        return;

      case "TryStmt": {
        try {
          this.execBlock(stmt.tryBlock, new Environment(env));
        } catch (e) {
          if (stmt.exceptBlock) {
            const catchEnv = new Environment(env);
            if (stmt.catchVar) {
              const errVal = e instanceof MittiUserException ? e.value : (e as Error).message;
              catchEnv.define(stmt.catchVar, errVal);
            }
            this.execBlock(stmt.exceptBlock, catchEnv);
          } else {
            throw e;
          }
        } finally {
          if (stmt.finallyBlock) {
            this.execBlock(stmt.finallyBlock, new Environment(env));
          }
        }
        return;
      }

      case "RaiseStmt": {
        const val = this.evalExpr(stmt.argument, env);
        throw new MittiUserException(val, stmt.line);
      }

      default:
        return;
    }
  }

  private evalExpr(expr: A.Expr, env: Environment): MittiValue {
    switch (expr.kind) {
      case "NumberLit": return expr.value;
      case "StringLit": return expr.value;
      case "BoolLit": return expr.value;
      case "NullLit": return null;
      case "Identifier": return env.get(expr.name, expr.line);

      case "ArrayLit":
        return expr.elements.map((el) => this.evalExpr(el, env));

      case "ObjectLit": {
        const obj = new MittiObject();
        for (let i = 0; i < expr.keys.length; i++) {
          const k = stringify(this.evalExpr(expr.keys[i], env));
          const v = this.evalExpr(expr.values[i], env);
          obj.map.set(k, v);
        }
        return obj;
      }

      case "UnaryExpr": {
        const val = this.evalExpr(expr.argument, env);
        if (expr.operator === "-") {
          if (typeof val !== "number") throw new MittiRuntimeError("'-' son talab qiladi", expr.line);
          return -val;
        }
        if (expr.operator === "not") return !isTruthy(val);
        throw new MittiRuntimeError(`noma'lum unar operator '${expr.operator}'`, expr.line);
      }

      case "BinaryExpr": {
        const left = this.evalExpr(expr.left, env);
        const right = this.evalExpr(expr.right, env);
        return this.evalBinary(expr.operator, left, right, expr.line);
      }

      case "LogicalExpr": {
        const left = this.evalExpr(expr.left, env);
        if (expr.operator === "and") {
          if (!isTruthy(left)) return left;
          return this.evalExpr(expr.right, env);
        }
        if (expr.operator === "or") {
          if (isTruthy(left)) return left;
          return this.evalExpr(expr.right, env);
        }
        throw new MittiRuntimeError(`noma'lum mantiqiy operator`, expr.line);
      }

      case "AssignExpr":
        return this.evalAssign(expr, env);

      case "CallExpr":
        return this.evalCall(expr, env);

      case "IndexExpr": {
        const obj = this.evalExpr(expr.object, env);
        const key = this.evalExpr(expr.index, env);
        return this.getIndex(obj, key, expr.line);
      }

      case "MemberExpr": {
        const obj = this.evalExpr(expr.object, env);
        return this.getIndex(obj, expr.property, expr.line);
      }

      case "FunctionExpr":
        return new MittiFunction(expr.name, expr.params, expr.body, env, expr.returnType);

      default:
        throw new MittiRuntimeError("noma'lum ifoda turi", (expr as { line?: number }).line ?? 0);
    }
  }

  private evalBinary(op: string, left: MittiValue, right: MittiValue, line: number): MittiValue {
    if (op === "==") return this.valuesEqual(left, right);
    if (op === "!=") return !this.valuesEqual(left, right);

    if (op === "+") {
      if (typeof left === "number" && typeof right === "number") return left + right;
      if (typeof left === "string" || typeof right === "string") return stringify(left) + stringify(right);
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];
      throw new MittiRuntimeError("'+' faqat sonlar, satrlar yoki massivlar uchun ishlaydi", line);
    }

    if (typeof left !== "number" || typeof right !== "number") {
      throw new MittiRuntimeError(`'${op}' faqat sonlar uchun ishlaydi`, line);
    }

    switch (op) {
      case "-": return left - right;
      case "*": return left * right;
      case "/":
        if (right === 0) throw new MittiRuntimeError("Nolga bo'lish xatosi", line);
        return left / right;
      case "%": return left % right;
      case "**": return Math.pow(left, right);
      case "<": return left < right;
      case "<=": return left <= right;
      case ">": return left > right;
      case ">=": return left >= right;
      default:
        throw new MittiRuntimeError(`noma'lum operator '${op}'`, line);
    }
  }

  private evalAssign(expr: A.AssignExpr, env: Environment): MittiValue {
    let val = this.evalExpr(expr.value, env);

    if (expr.typeAnnotation) {
      checkType(val, expr.typeAnnotation, expr.line, expr.target.kind === "Identifier" ? expr.target.name : undefined);
    }

    if (expr.target.kind === "Identifier") {
      if (expr.operator === "=") {
        env.assign(expr.target.name, val, expr.line);
        return val;
      }
      const cur = env.get(expr.target.name, expr.line);
      const binaryOp = expr.operator.slice(0, -1);
      val = this.evalBinary(binaryOp, cur, val, expr.line);
      env.assign(expr.target.name, val, expr.line);
      return val;
    }

    if (expr.target.kind === "IndexExpr") {
      const obj = this.evalExpr(expr.target.object, env);
      const key = this.evalExpr(expr.target.index, env);
      this.setIndex(obj, key, val, expr.line);
      return val;
    }

    if (expr.target.kind === "MemberExpr") {
      const obj = this.evalExpr(expr.target.object, env);
      this.setIndex(obj, expr.target.property, val, expr.line);
      return val;
    }

    throw new MittiRuntimeError("noto'g'ri o'zgaruvchi manzili", expr.line);
  }

  private evalCall(expr: A.CallExpr, env: Environment): MittiValue {
    const callee = this.evalExpr(expr.callee, env);
    const args = expr.args.map((a) => this.evalExpr(a, env));

    if (callee instanceof NativeFunction) {
      return callee.fn(args);
    }
    if (callee instanceof MittiFunction) {
      return this.callFunction(callee, args, expr.line);
    }
    throw new MittiRuntimeError(`'${typeName(callee)}' chaqirib bo'lmaydi`, expr.line);
  }

  private callFunction(fn: MittiFunction, args: MittiValue[], line: number): MittiValue {
    const callEnv = new Environment(fn.closure);
    for (let i = 0; i < fn.params.length; i++) {
      const param = fn.params[i];
      const argVal = args[i] ?? null;
      if (param.typeAnnotation) {
        checkType(argVal, param.typeAnnotation, line, param.name);
      }
      callEnv.define(param.name, argVal);
    }

    this.callStack.push({ fnName: fn.name ?? "<anonim>", line });
    try {
      this.execBlock(fn.body, callEnv);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        if (fn.returnType) {
          checkType(e.value, fn.returnType, line, `${fn.name ?? "<anonim>"} return`);
        }
        return e.value;
      }
      throw e;
    } finally {
      this.callStack.pop();
    }
    return null;
  }

  private getIndex(obj: MittiValue, key: MittiValue, line: number): MittiValue {
    if (Array.isArray(obj)) {
      if (typeof key !== "number") throw new MittiRuntimeError("massiv indeksi son bo'lishi kerak", line);
      let i = key;
      if (i < 0) i += obj.length;
      if (i < 0 || i >= obj.length) throw new MittiRuntimeError(`indeks chegaradan tashqarida: ${key}`, line);
      return obj[i];
    }
    if (typeof obj === "string") {
      if (typeof key !== "number") throw new MittiRuntimeError("satr indeksi son bo'lishi kerak", line);
      let i = key;
      if (i < 0) i += obj.length;
      if (i < 0 || i >= obj.length) throw new MittiRuntimeError(`indeks chegaradan tashqarida: ${key}`, line);
      return obj[i];
    }
    if (obj instanceof MittiObject) {
      const k = stringify(key);
      return obj.map.has(k) ? obj.map.get(k)! : null;
    }
    throw new MittiRuntimeError(`'${typeName(obj)}' turida indekslash mumkin emas`, line);
  }

  private setIndex(obj: MittiValue, key: MittiValue, value: MittiValue, line: number): void {
    if (Array.isArray(obj)) {
      if (typeof key !== "number") throw new MittiRuntimeError("massiv indeksi son bo'lishi kerak", line);
      let i = key;
      if (i < 0) i += obj.length;
      if (i < 0 || i > obj.length) throw new MittiRuntimeError(`indeks chegaradan tashqarida: ${key}`, line);
      obj[i] = value;
      return;
    }
    if (obj instanceof MittiObject) {
      obj.map.set(stringify(key), value);
      return;
    }
    throw new MittiRuntimeError(`'${typeName(obj)}' turiga qiymat yozib bo'lmaydi`, line);
  }

  private toIterable(val: MittiValue, line: number): MittiValue[] {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split("");
    if (val instanceof MittiObject) return Array.from(val.map.keys());
    throw new MittiRuntimeError(`'${typeName(val)}' ustida sikl bajarib bo'lmaydi`, line);
  }

  private valuesEqual(a: MittiValue, b: MittiValue): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.valuesEqual(a[i], b[i])) return false;
      }
      return true;
    }
    return false;
  }

  private installBuiltins(): void {
    const def = (name: string, fn: (args: MittiValue[]) => MittiValue) => {
      this.globals.define(name, new NativeFunction(name, fn));
    };

    def("print", (args) => {
      this.output(args.map((a) => stringify(a)).join(" "));
      return null;
    });

    def("len", (args) => {
      const v = args[0];
      if (typeof v === "string") return v.length;
      if (Array.isArray(v)) return v.length;
      if (v instanceof MittiObject) return v.map.size;
      throw new MittiRuntimeError(`len() '${typeName(v)}' uchun ishlamaydi`, 0);
    });

    def("range", (args) => {
      let start = 0, stop = 0, step = 1;
      if (args.length === 1) stop = args[0] as number;
      else if (args.length === 2) { start = args[0] as number; stop = args[1] as number; }
      else if (args.length >= 3) { start = args[0] as number; stop = args[1] as number; step = args[2] as number; }
      const res: number[] = [];
      if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
      else if (step < 0) for (let i = start; i > stop; i += step) res.push(i);
      return res;
    });

    def("str", (args) => stringify(args[0]));
    def("int", (args) => {
      const v = args[0];
      if (typeof v === "number") return Math.trunc(v);
      if (typeof v === "string") {
        const n = parseInt(v, 10);
        if (Number.isNaN(n)) throw new MittiRuntimeError(`'${v}' ni songa aylantirib bo'lmadi`, 0);
        return n;
      }
      if (typeof v === "boolean") return v ? 1 : 0;
      throw new MittiRuntimeError(`int() '${typeName(v)}' uchun ishlamaydi`, 0);
    });
    def("float", (args) => {
      const v = args[0];
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = parseFloat(v);
        if (Number.isNaN(n)) throw new MittiRuntimeError(`'${v}' ni songa aylantirib bo'lmadi`, 0);
        return n;
      }
      throw new MittiRuntimeError(`float() '${typeName(v)}' uchun ishlamaydi`, 0);
    });
    def("type", (args) => typeName(args[0]));

    def("push", (args) => {
      const arr = args[0];
      if (!Array.isArray(arr)) throw new MittiRuntimeError("push() massiv talab qiladi", 0);
      arr.push(args[1]);
      return arr;
    });
    def("pop", (args) => {
      const arr = args[0];
      if (!Array.isArray(arr)) throw new MittiRuntimeError("pop() massiv talab qiladi", 0);
      return arr.pop() ?? null;
    });
    def("keys", (args) => {
      const obj = args[0];
      if (!(obj instanceof MittiObject)) throw new MittiRuntimeError("keys() obyekt talab qiladi", 0);
      return Array.from(obj.map.keys());
    });
    def("values", (args) => {
      const obj = args[0];
      if (!(obj instanceof MittiObject)) throw new MittiRuntimeError("values() obyekt talab qiladi", 0);
      return Array.from(obj.map.values());
    });
    def("has", (args) => {
      const obj = args[0];
      if (obj instanceof MittiObject) return obj.map.has(stringify(args[1]));
      if (Array.isArray(obj)) return obj.some((v) => this.valuesEqual(v, args[1]));
      return false;
    });

    def("upper", (args) => String(args[0]).toUpperCase());
    def("lower", (args) => String(args[0]).toLowerCase());
    def("split", (args) => String(args[0]).split(String(args[1] ?? " ")));
    def("join", (args) => {
      const arr = args[0];
      if (!Array.isArray(arr)) throw new MittiRuntimeError("join() massiv talab qiladi", 0);
      return arr.map((v) => stringify(v)).join(String(args[1] ?? ""));
    });
    def("trim", (args) => String(args[0]).trim());

    def("abs", (args) => Math.abs(args[0] as number));
    def("min", (args) => Math.min(...(args as number[])));
    def("max", (args) => Math.max(...(args as number[])));
    def("round", (args) => Math.round(args[0] as number));
    def("floor", (args) => Math.floor(args[0] as number));
    def("ceil", (args) => Math.ceil(args[0] as number));
    def("sqrt", (args) => Math.sqrt(args[0] as number));
    def("pow", (args) => Math.pow(args[0] as number, args[1] as number));
  }
}

/**
 * Brauzerda berilgan Mitti kodini to'liq bajarib, natijasini qaytaruvchi funksiya.
 */
export function executeMittiInBrowser(
  sourceCode: string,
  onOutput: (line: string) => void
): { success: boolean; error?: string } {
  try {
    const tokens = new Lexer(sourceCode).tokenize();
    const program = new Parser(tokens).parseProgram();
    const interp = new WebInterpreter(onOutput);
    interp.run(program);
    return { success: true };
  } catch (e) {
    let msg = "";
    if (e instanceof MittiSyntaxError) {
      msg = e.message;
    } else if (e instanceof MittiTypeError) {
      msg = e.formatWithStack(undefined, sourceCode.split("\n"));
    } else if (e instanceof MittiRuntimeError || e instanceof MittiUserException) {
      msg = e.formatWithStack(undefined, sourceCode.split("\n"));
    } else {
      msg = "Kutilmagan xato: " + (e as Error).message;
    }
    return { success: false, error: msg };
  }
}
