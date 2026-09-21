import * as A from "./ast";
import {
  Environment,
  MittiValue,
  MittiObject,
  MittiFunction,
  NativeFunction,
  MittiRuntimeError,
  ReturnSignal,
  BreakSignal,
  ContinueSignal,
  isTruthy,
  stringify,
  typeName,
} from "./runtime";

export class Interpreter {
  public globals = new Environment();
  private output: (s: string) => void;

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
        const fn = new MittiFunction(stmt.name, stmt.params, stmt.body, env);
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
        const fn = new MittiFunction(expr.name, expr.params, expr.body, env);
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
      callEnv.define(fn.params[i], args[i] ?? null);
    }
    if (args.length > fn.params.length) {
      // ortiqcha argumentlarga ruxsat beramiz, lekin ular e'tiborga olinmaydi
    }
    try {
      this.execBlock(fn.body, callEnv);
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value;
      throw e;
    }
    void line;
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
  }
}
