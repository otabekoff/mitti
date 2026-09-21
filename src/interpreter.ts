import * as fs from "fs";
import * as path from "path";
import * as A from "./ast.js";
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
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
} from "./runtime.js";

export class Interpreter {
  public globals = new Environment();
  public currentFilePath: string | null = null;
  public callStack: CallFrame[] = [];
  private output: (s: string) => void;
  private moduleCache: Map<string, MittiObject> = new Map();
  private loadingModules: Set<string> = new Set();

  constructor(output: (s: string) => void = (s) => process.stdout.write(s + "\n")) {
    this.output = output;
    this.installBuiltins();
  }

  run(program: A.Program) {
    for (const stmt of program.body) {
      this.execStmt(stmt, this.globals);
    }
  }

  // ============ STATEMENTS ============

  private execBlock(block: A.BlockStmt, env: Environment) {
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
        while (isTruthy(this.evalExpr(stmt.condition, env))) {
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

      case "ImportStmt": {
        const modObj = this.loadModule(stmt.source, stmt.line);
        if (stmt.isFrom) {
          if (stmt.specifiers) {
            for (const spec of stmt.specifiers) {
              if (!modObj.map.has(spec.imported)) {
                throw new MittiRuntimeError(`Modulda '${spec.imported}' topilmadi`, stmt.line);
              }
              env.define(spec.local, modObj.map.get(spec.imported)!);
            }
          }
        } else {
          let moduleName = stmt.alias;
          if (!moduleName) {
            if (stmt.source === "math" || stmt.source === "os" || stmt.source === "json") {
              moduleName = stmt.source;
            } else {
              moduleName = path.basename(stmt.source, path.extname(stmt.source));
            }
          }
          env.define(moduleName, modObj);
        }
        return;
      }

      case "TryStmt": {
        let errorCaught: unknown = null;
        try {
          this.execBlock(stmt.tryBlock, new Environment(env));
        } catch (e) {
          if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) {
            if (stmt.finallyBlock) {
              this.execBlock(stmt.finallyBlock, new Environment(env));
            }
            throw e;
          }
          errorCaught = e;
        }

        if (errorCaught) {
          if (stmt.exceptBlock) {
            const exceptEnv = new Environment(env);
            if (stmt.catchVar) {
              let errorVal: MittiValue;
              if (errorCaught instanceof MittiUserException) {
                errorVal = errorCaught.value;
              } else if (errorCaught instanceof MittiRuntimeError) {
                errorVal = errorCaught.rawMessage;
              } else if (errorCaught instanceof Error) {
                errorVal = errorCaught.message;
              } else {
                errorVal = String(errorCaught);
              }
              exceptEnv.define(stmt.catchVar, errorVal);
            }
            this.execBlock(stmt.exceptBlock, exceptEnv);
          } else {
            if (stmt.finallyBlock) {
              this.execBlock(stmt.finallyBlock, new Environment(env));
            }
            throw errorCaught;
          }
        }

        if (stmt.finallyBlock) {
          this.execBlock(stmt.finallyBlock, new Environment(env));
        }
        return;
      }

      case "RaiseStmt": {
        const val = this.evalExpr(stmt.argument, env);
        const exc = new MittiUserException(val, stmt.line);
        exc.callStack = [...this.callStack];
        throw exc;
      }
    }
  }

  private toIterable(v: MittiValue, line: number): MittiValue[] {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") return v.split("");
    if (v instanceof MittiObject) return Array.from(v.map.keys());
    throw new MittiRuntimeError(`'${typeName(v)}' turi bo'yicha iteratsiya qilib bo'lmaydi`, line);
  }

  // ============ EXPRESSIONS ============

  private evalExpr(expr: A.Expr, env: Environment): MittiValue {
    switch (expr.kind) {
      case "NumberLit": return expr.value;
      case "StringLit": return expr.value;
      case "BoolLit": return expr.value;
      case "NullLit": return null;

      case "Identifier":
        return env.get(expr.name, expr.line);

      case "ArrayLit":
        return expr.elements.map((e) => this.evalExpr(e, env));

      case "ObjectLit": {
        const obj = new MittiObject();
        for (let i = 0; i < expr.keys.length; i++) {
          const keyVal = this.evalExpr(expr.keys[i], env);
          obj.map.set(stringify(keyVal), this.evalExpr(expr.values[i], env));
        }
        return obj;
      }

      case "FunctionExpr": {
        const fn = new MittiFunction(expr.name, expr.params, expr.body, env, expr.returnType);
        if (expr.name) env.define(expr.name, fn);
        return fn;
      }

      case "UnaryExpr": {
        const val = this.evalExpr(expr.argument, env);
        if (expr.operator === "-") {
          if (typeof val !== "number") throw new MittiRuntimeError(`'-' operatori son talab qiladi, olindi: ${typeName(val)}`, expr.line);
          return -val;
        }
        if (expr.operator === "not") return !isTruthy(val);
        throw new MittiRuntimeError(`noma'lum unar operator: ${expr.operator}`, expr.line);
      }

      case "LogicalExpr": {
        const left = this.evalExpr(expr.left, env);
        if (expr.operator === "and") {
          return isTruthy(left) ? this.evalExpr(expr.right, env) : left;
        } else {
          return isTruthy(left) ? left : this.evalExpr(expr.right, env);
        }
      }

      case "BinaryExpr":
        return this.evalBinary(expr, env);

      case "AssignExpr":
        return this.evalAssign(expr, env);

      case "CallExpr":
        return this.evalCall(expr, env);

      case "IndexExpr": {
        const obj = this.evalExpr(expr.object, env);
        const idx = this.evalExpr(expr.index, env);
        return this.getIndex(obj, idx, expr.line);
      }

      case "MemberExpr": {
        const obj = this.evalExpr(expr.object, env);
        return this.getIndex(obj, expr.property, expr.line);
      }
    }
  }

  private evalBinary(expr: A.BinaryExpr, env: Environment): MittiValue {
    const left = this.evalExpr(expr.left, env);
    const right = this.evalExpr(expr.right, env);
    const op = expr.operator;

    if (op === "==") return this.valuesEqual(left, right);
    if (op === "!=") return !this.valuesEqual(left, right);

    if (op === "+") {
      if (typeof left === "string" || typeof right === "string") {
        if (typeof left === "number" || typeof left === "string") {
          if (typeof right === "number" || typeof right === "string") {
            return stringify(left) + stringify(right);
          }
        }
      }
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];
      if (typeof left === "number" && typeof right === "number") return left + right;
      throw new MittiRuntimeError(`'+' operatorini '${typeName(left)}' va '${typeName(right)}' uchun qo'llab bo'lmaydi`, expr.line);
    }

    if (["-", "*", "/", "%", "<", ">", "<=", ">="].includes(op)) {
      if (typeof left !== "number" || typeof right !== "number") {
        throw new MittiRuntimeError(`'${op}' operatori son talab qiladi, olindi: ${typeName(left)}, ${typeName(right)}`, expr.line);
      }
      switch (op) {
        case "-": return left - right;
        case "*": return left * right;
        case "/":
          if (right === 0) throw new MittiRuntimeError("nolga bo'lish mumkin emas", expr.line);
          return left / right;
        case "%": return left % right;
        case "<": return left < right;
        case ">": return left > right;
        case "<=": return left <= right;
        case ">=": return left >= right;
      }
    }

    throw new MittiRuntimeError(`noma'lum operator: ${op}`, expr.line);
  }

  private valuesEqual(a: MittiValue, b: MittiValue): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((v, i) => this.valuesEqual(v, b[i]));
    }
    if (a instanceof MittiObject && b instanceof MittiObject) {
      if (a.map.size !== b.map.size) return false;
      for (const [k, v] of a.map) {
        if (!b.map.has(k) || !this.valuesEqual(v, b.map.get(k)!)) return false;
      }
      return true;
    }
    return a === b;
  }

  private evalAssign(expr: A.AssignExpr, env: Environment): MittiValue {
    let newValue: MittiValue;

    if (expr.operator === "=") {
      newValue = this.evalExpr(expr.value, env);
    } else {
      const current = this.evalExpr(expr.target, env);
      const rhs = this.evalExpr(expr.value, env);
      const binOp = expr.operator[0]; // '+', '-', '*', '/'
      newValue = this.applyCompound(current, rhs, binOp, expr.line);
    }

    // Tip annotatsiyasi tekshiruvi: x: int = 10
    if (expr.typeAnnotation) {
      try {
        checkType(newValue, expr.typeAnnotation, expr.line,
          expr.target.kind === "Identifier" ? expr.target.name : undefined);
      } catch (e) {
        if (e instanceof MittiTypeError) {
          e.callStack = [...this.callStack];
        }
        throw e;
      }
    }

    const target = expr.target;
    if (target.kind === "Identifier") {
      env.assign(target.name, newValue, expr.line);
    } else if (target.kind === "IndexExpr") {
      const obj = this.evalExpr(target.object, env);
      const idx = this.evalExpr(target.index, env);
      this.setIndex(obj, idx, newValue, expr.line);
    } else if (target.kind === "MemberExpr") {
      const obj = this.evalExpr(target.object, env);
      this.setIndex(obj, target.property, newValue, expr.line);
    }
    return newValue;
  }

  private applyCompound(current: MittiValue, rhs: MittiValue, op: string, line: number): MittiValue {
    if (op === "+") {
      if (typeof current === "string" || typeof rhs === "string") return stringify(current) + stringify(rhs);
      if (Array.isArray(current) && Array.isArray(rhs)) return [...current, ...rhs];
    }
    if (typeof current !== "number" || typeof rhs !== "number") {
      throw new MittiRuntimeError(`'${op}=' operatorini '${typeName(current)}' uchun qo'llab bo'lmaydi`, line);
    }
    switch (op) {
      case "+": return current + rhs;
      case "-": return current - rhs;
      case "*": return current * rhs;
      case "/":
        if (rhs === 0) throw new MittiRuntimeError("nolga bo'lish mumkin emas", line);
        return current / rhs;
    }
    throw new MittiRuntimeError(`noma'lum compound operator: ${op}=`, line);
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
      if (!obj.map.has(k)) return null;
      return obj.map.get(k)!;
    }
    throw new MittiRuntimeError(`'${typeName(obj)}' turida indekslash mumkin emas`, line);
  }

  private setIndex(obj: MittiValue, key: MittiValue, value: MittiValue, line: number) {
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

  private evalCall(expr: A.CallExpr, env: Environment): MittiValue {
    const callee = this.evalExpr(expr.callee, env);
    const args = expr.args.map((a) => this.evalExpr(a, env));

    if (callee instanceof NativeFunction) {
      return callee.fn(args);
    }
    if (callee instanceof MittiFunction) {
      return this.callFunction(callee, args, expr.line);
    }
    throw new MittiRuntimeError(`'${typeName(callee)}' chaqirib bo'lmaydi (funksiya emas)`, expr.line);
  }

  private callFunction(fn: MittiFunction, args: MittiValue[], line: number): MittiValue {
    const callEnv = new Environment(fn.closure);
    for (let i = 0; i < fn.params.length; i++) {
      const param = fn.params[i];
      const argVal = args[i] ?? null;
      // Parametr tip tekshiruvi
      if (param.typeAnnotation) {
        try {
          checkType(argVal, param.typeAnnotation, line, param.name);
        } catch (e) {
          if (e instanceof MittiTypeError) {
            e.callStack = [...this.callStack];
          }
          throw e;
        }
      }
      callEnv.define(param.name, argVal);
    }
    this.callStack.push({
      fnName: fn.name ?? "<anonim>",
      file: this.currentFilePath ?? undefined,
      line,
    });
    try {
      this.execBlock(fn.body, callEnv);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        // Return tipi tekshiruvi
        if (fn.returnType) {
          try {
            checkType(e.value, fn.returnType, line, `${fn.name ?? "<anonim>"} return`);
          } catch (te) {
            if (te instanceof MittiTypeError) {
              te.callStack = [...this.callStack];
            }
            throw te;
          }
        }
        return e.value;
      }
      if (e instanceof MittiRuntimeError) {
        if (e.callStack.length === 0) e.callStack = [...this.callStack];
      } else if (e instanceof MittiUserException) {
        if (e.callStack.length === 0) e.callStack = [...this.callStack];
      }
      throw e;
    } finally {
      this.callStack.pop();
    }
    return null;
  }

  // ============ BUILT-IN FUNCTIONS ============

  private installBuiltins() {
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
      if (args.length === 1) {
        stop = args[0] as number;
      } else if (args.length === 2) {
        start = args[0] as number;
        stop = args[1] as number;
      } else if (args.length >= 3) {
        start = args[0] as number;
        stop = args[1] as number;
        step = args[2] as number;
      }
      const result: number[] = [];
      if (step > 0) for (let i = start; i < stop; i += step) result.push(i);
      else if (step < 0) for (let i = start; i > stop; i += step) result.push(i);
      return result;
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
      if (!Array.isArray(arr)) throw new MittiRuntimeError("push() birinchi argument sifatida massiv talab qiladi", 0);
      arr.push(args[1]);
      return arr;
    });
    def("pop", (args) => {
      const arr = args[0];
      if (!Array.isArray(arr)) throw new MittiRuntimeError("pop() birinchi argument sifatida massiv talab qiladi", 0);
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
      if (!Array.isArray(arr)) throw new MittiRuntimeError("join() birinchi argument sifatida massiv talab qiladi", 0);
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

    def("input", () => null); // Node muhitida sinxron input yo'q; kengaytirish mumkin

    def("read_file", (args) => {
      if (args.length === 0) throw new MittiRuntimeError("read_file() fayl yo'lini talab qiladi", 0);
      const p = String(args[0]);
      const resolved = this.resolvePath(p);
      if (!fs.existsSync(resolved)) throw new MittiRuntimeError(`Fayl topilmadi: '${p}'`, 0);
      return fs.readFileSync(resolved, "utf-8");
    });

    def("write_file", (args) => {
      if (args.length < 2) throw new MittiRuntimeError("write_file() fayl yo'li va kontent talab qiladi", 0);
      const p = String(args[0]);
      const content = stringify(args[1]);
      const resolved = this.resolvePath(p);
      fs.writeFileSync(resolved, content, "utf-8");
      return true;
    });

    def("append_file", (args) => {
      if (args.length < 2) throw new MittiRuntimeError("append_file() fayl yo'li va kontent talab qiladi", 0);
      const p = String(args[0]);
      const content = stringify(args[1]);
      const resolved = this.resolvePath(p);
      fs.appendFileSync(resolved, content, "utf-8");
      return true;
    });

    def("file_exists", (args) => {
      if (args.length === 0) return false;
      const p = String(args[0]);
      const resolved = this.resolvePath(p);
      return fs.existsSync(resolved);
    });

    def("remove_file", (args) => {
      if (args.length === 0) return false;
      const p = String(args[0]);
      const resolved = this.resolvePath(p);
      if (fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
        return true;
      }
      return false;
    });
  }

  public resolvePath(targetPath: string): string {
    if (path.isAbsolute(targetPath)) return targetPath;
    if (this.currentFilePath) {
      return path.resolve(path.dirname(this.currentFilePath), targetPath);
    }
    return path.resolve(process.cwd(), targetPath);
  }

  public loadModule(source: string, line: number): MittiObject {
    if (source === "math") return this.getMathModule();
    if (source === "os") return this.getOsModule();
    if (source === "json") return this.getJsonModule();

    let absPath = this.resolvePath(source);
    if (!fs.existsSync(absPath) && fs.existsSync(absPath + ".mt")) {
      absPath += ".mt";
    }

    if (!fs.existsSync(absPath)) {
      throw new MittiRuntimeError(`Modul fayli topilmadi: '${source}'`, line);
    }

    if (this.moduleCache.has(absPath)) {
      return this.moduleCache.get(absPath)!;
    }

    if (this.loadingModules.has(absPath)) {
      throw new MittiRuntimeError(`Aylanma (circular) import xatosi: '${source}'`, line);
    }

    this.loadingModules.add(absPath);
    const content = fs.readFileSync(absPath, "utf-8");
    const tokens = new Lexer(content).tokenize();
    const program = new Parser(tokens).parseProgram();

    const moduleEnv = new Environment(this.globals);
    const prevFile = this.currentFilePath;
    this.currentFilePath = absPath;

    try {
      for (const stmt of program.body) {
        this.execStmt(stmt, moduleEnv);
      }
    } finally {
      this.currentFilePath = prevFile;
      this.loadingModules.delete(absPath);
    }

    const modObj = new MittiObject();
    for (const [k, v] of moduleEnv.getLocalVars().entries()) {
      modObj.map.set(k, v);
    }

    this.moduleCache.set(absPath, modObj);
    return modObj;
  }

  private getMathModule(): MittiObject {
    if (this.moduleCache.has("__builtin_math__")) {
      return this.moduleCache.get("__builtin_math__")!;
    }
    const m = new MittiObject();
    m.map.set("pi", Math.PI);
    m.map.set("e", Math.E);
    m.map.set("sin", new NativeFunction("sin", (args) => Math.sin(args[0] as number)));
    m.map.set("cos", new NativeFunction("cos", (args) => Math.cos(args[0] as number)));
    m.map.set("tan", new NativeFunction("tan", (args) => Math.tan(args[0] as number)));
    m.map.set("log", new NativeFunction("log", (args) => Math.log(args[0] as number)));
    m.map.set("sqrt", new NativeFunction("sqrt", (args) => Math.sqrt(args[0] as number)));
    m.map.set("pow", new NativeFunction("pow", (args) => Math.pow(args[0] as number, args[1] as number)));
    m.map.set("abs", new NativeFunction("abs", (args) => Math.abs(args[0] as number)));
    m.map.set("round", new NativeFunction("round", (args) => Math.round(args[0] as number)));
    m.map.set("floor", new NativeFunction("floor", (args) => Math.floor(args[0] as number)));
    m.map.set("ceil", new NativeFunction("ceil", (args) => Math.ceil(args[0] as number)));
    m.map.set("random", new NativeFunction("random", () => Math.random()));
    m.map.set("min", new NativeFunction("min", (args) => Math.min(...(args as number[]))));
    m.map.set("max", new NativeFunction("max", (args) => Math.max(...(args as number[]))));

    this.moduleCache.set("__builtin_math__", m);
    return m;
  }

  private getOsModule(): MittiObject {
    if (this.moduleCache.has("__builtin_os__")) {
      return this.moduleCache.get("__builtin_os__")!;
    }
    const o = new MittiObject();
    o.map.set("platform", process.platform);
    o.map.set("arch", process.arch);
    o.map.set("cwd", new NativeFunction("cwd", () => process.cwd()));
    o.map.set("env", new NativeFunction("env", (args) => {
      if (args.length === 0) {
        const envObj = new MittiObject();
        for (const [k, v] of Object.entries(process.env)) {
          if (v !== undefined) envObj.map.set(k, v);
        }
        return envObj;
      }
      return process.env[String(args[0])] ?? null;
    }));

    this.moduleCache.set("__builtin_os__", o);
    return o;
  }

  private getJsonModule(): MittiObject {
    if (this.moduleCache.has("__builtin_json__")) {
      return this.moduleCache.get("__builtin_json__")!;
    }
    const j = new MittiObject();
    j.map.set("parse", new NativeFunction("parse", (args) => {
      try {
        const parsed = JSON.parse(String(args[0]));
        return this.toMittiValue(parsed);
      } catch (e) {
        throw new MittiRuntimeError("JSON parse xatosi: " + (e as Error).message, 0);
      }
    }));
    j.map.set("stringify", new NativeFunction("stringify", (args) => {
      const jsVal = this.toJsValue(args[0]);
      return JSON.stringify(jsVal);
    }));

    this.moduleCache.set("__builtin_json__", j);
    return j;
  }

  private toMittiValue(val: unknown): MittiValue {
    if (val === null || val === undefined) return null;
    if (typeof val === "number" || typeof val === "string" || typeof val === "boolean") return val;
    if (Array.isArray(val)) return val.map((x) => this.toMittiValue(x));
    if (typeof val === "object") {
      const obj = new MittiObject();
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        obj.map.set(k, this.toMittiValue(v));
      }
      return obj;
    }
    return String(val);
  }

  private toJsValue(val: MittiValue): unknown {
    if (val === null) return null;
    if (typeof val === "number" || typeof val === "string" || typeof val === "boolean") return val;
    if (Array.isArray(val)) return val.map((x) => this.toJsValue(x));
    if (val instanceof MittiObject) {
      const result: Record<string, unknown> = {};
      for (const [k, v] of val.map.entries()) {
        result[k] = this.toJsValue(v);
      }
      return result;
    }
    return stringify(val);
  }
}
