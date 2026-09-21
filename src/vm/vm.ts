import * as fs from "fs";
import { Chunk, OpCode } from "./opcodes.js";
import { VMFunction } from "./compiler.js";
import {
  MittiValue,
  MittiObject,
  NativeFunction,
  MittiRuntimeError,
  isTruthy,
  stringify,
  typeName,
} from "../runtime.js";

/** Call frame — funksiya chaqiruvi holati */
interface CallFrame {
  /** Bajarilayotgan chunk */
  chunk: Chunk;
  /** Instruction pointer (joriy bayt indeksi) */
  ip: number;
  /** Frame'ga tegishli lokal o'zgaruvchilar */
  locals: MittiValue[];
  /** Funksiya nomi (xatoliklar uchun) */
  name: string;
}

/**
 * Stack-asosidagi Bytecode Virtual Machine.
 */
export class VM {
  private stack: MittiValue[] = [];
  private globals: Map<string, MittiValue> = new Map();
  private frames: CallFrame[] = [];

  constructor() {
    this.installBuiltins();
  }

  /** Dasturni bajarish */
  run(chunk: Chunk): void {
    this.frames.push({ chunk, ip: 0, locals: [], name: chunk.name });
    this.execute();
  }

  // ============ ASOSIY BAJARISH SIKLI ============

  private execute(): void {
    while (true) {
      const frame = this.currentFrame();
      if (!frame) return;

      const op = this.readByte(frame);

      switch (op) {
        case OpCode.OP_CONSTANT: {
          const idx = this.readByte(frame);
          this.push(frame.chunk.constants[idx] as MittiValue);
          break;
        }

        case OpCode.OP_NULL:  this.push(null);  break;
        case OpCode.OP_TRUE:  this.push(true);  break;
        case OpCode.OP_FALSE: this.push(false); break;

        case OpCode.OP_POP:
          this.pop();
          break;

        // Arifmetik
        case OpCode.OP_ADD: {
          const b = this.pop();
          const a = this.pop();
          if (typeof a === "number" && typeof b === "number") {
            this.push(a + b);
          } else if (typeof a === "string" || typeof b === "string") {
            this.push(stringify(a) + stringify(b));
          } else {
            this.runtimeError(`'+' operatori uchun son yoki satr kerak, '${typeName(a)}' va '${typeName(b)}' keldi`, frame);
          }
          break;
        }

        case OpCode.OP_SUB: {
          const b = this.popNum(frame, "-");
          const a = this.popNum(frame, "-");
          this.push(a - b);
          break;
        }
        case OpCode.OP_MUL: {
          const b = this.popNum(frame, "*");
          const a = this.popNum(frame, "*");
          this.push(a * b);
          break;
        }
        case OpCode.OP_DIV: {
          const b = this.popNum(frame, "/");
          const a = this.popNum(frame, "/");
          if (b === 0) this.runtimeError("Nolga bo'lish xatosi", frame);
          this.push(a / b);
          break;
        }
        case OpCode.OP_MOD: {
          const b = this.popNum(frame, "%");
          const a = this.popNum(frame, "%");
          this.push(a % b);
          break;
        }
        case OpCode.OP_POW: {
          const b = this.popNum(frame, "**");
          const a = this.popNum(frame, "**");
          this.push(Math.pow(a, b));
          break;
        }
        case OpCode.OP_NEGATE: {
          const v = this.popNum(frame, "negativ");
          this.push(-v);
          break;
        }
        case OpCode.OP_NOT: {
          this.push(!isTruthy(this.pop()));
          break;
        }

        // Taqqoslash
        case OpCode.OP_EQUAL: {
          const b = this.pop();
          const a = this.pop();
          this.push(this.valuesEqual(a, b));
          break;
        }
        case OpCode.OP_NOT_EQUAL: {
          const b = this.pop();
          const a = this.pop();
          this.push(!this.valuesEqual(a, b));
          break;
        }
        case OpCode.OP_GREATER: {
          const b = this.popNum(frame, ">");
          const a = this.popNum(frame, ">");
          this.push(a > b);
          break;
        }
        case OpCode.OP_GREATER_EQUAL: {
          const b = this.popNum(frame, ">=");
          const a = this.popNum(frame, ">=");
          this.push(a >= b);
          break;
        }
        case OpCode.OP_LESS: {
          const b = this.popNum(frame, "<");
          const a = this.popNum(frame, "<");
          this.push(a < b);
          break;
        }
        case OpCode.OP_LESS_EQUAL: {
          const b = this.popNum(frame, "<=");
          const a = this.popNum(frame, "<=");
          this.push(a <= b);
          break;
        }

        // Global o'zgaruvchilar
        case OpCode.OP_DEFINE_GLOBAL: {
          const idx = this.readByte(frame);
          const name = frame.chunk.constants[idx] as string;
          const val = this.pop();
          this.globals.set(name, val);
          break;
        }
        case OpCode.OP_GET_GLOBAL: {
          const idx = this.readByte(frame);
          const name = frame.chunk.constants[idx] as string;
          if (!this.globals.has(name)) {
            this.runtimeError(`Aniqlanmagan o'zgaruvchi: '${name}'`, frame);
          }
          this.push(this.globals.get(name)!);
          break;
        }
        case OpCode.OP_SET_GLOBAL: {
          const idx = this.readByte(frame);
          const name = frame.chunk.constants[idx] as string;
          const val = this.peek(0);
          this.globals.set(name, val);
          break;
        }

        // Lokal o'zgaruvchilar
        case OpCode.OP_GET_LOCAL: {
          const slot = this.readByte(frame);
          this.push(frame.locals[slot] ?? null);
          break;
        }
        case OpCode.OP_SET_LOCAL: {
          const slot = this.readByte(frame);
          frame.locals[slot] = this.peek(0);
          break;
        }

        // Sakrash
        case OpCode.OP_JUMP: {
          const high = this.readByte(frame);
          const low = this.readByte(frame);
          frame.ip += (high << 8) | low;
          break;
        }
        case OpCode.OP_JUMP_IF_FALSE: {
          const high = this.readByte(frame);
          const low = this.readByte(frame);
          if (!isTruthy(this.peek(0))) {
            frame.ip += (high << 8) | low;
          }
          break;
        }
        case OpCode.OP_JUMP_IF_TRUE: {
          const high = this.readByte(frame);
          const low = this.readByte(frame);
          if (isTruthy(this.peek(0))) {
            frame.ip += (high << 8) | low;
          }
          break;
        }
        case OpCode.OP_LOOP: {
          const high = this.readByte(frame);
          const low = this.readByte(frame);
          frame.ip -= (high << 8) | low;
          break;
        }

        // Funksiya chaqiruvi
        case OpCode.OP_CALL: {
          const argCount = this.readByte(frame);
          const callee = this.stack[this.stack.length - 1 - argCount];
          this.callValue(callee, argCount, frame);
          break;
        }

        case OpCode.OP_RETURN: {
          const result = this.pop();
          this.frames.pop();
          this.push(result);
          if (this.frames.length === 0) return;
          break;
        }

        // Massiv va obyekt
        case OpCode.OP_BUILD_ARRAY: {
          const count = this.readByte(frame);
          const arr: MittiValue[] = new Array(count);
          for (let i = count - 1; i >= 0; i--) {
            arr[i] = this.pop();
          }
          this.push(arr);
          break;
        }
        case OpCode.OP_BUILD_OBJECT: {
          const count = this.readByte(frame);
          const obj = new MittiObject();
          const pairs: [MittiValue, MittiValue][] = [];
          for (let i = 0; i < count; i++) {
            const val = this.pop();
            const key = this.pop();
            pairs.unshift([key, val]);
          }
          for (const [k, v] of pairs) {
            obj.map.set(stringify(k), v);
          }
          this.push(obj);
          break;
        }

        // Indekslash
        case OpCode.OP_GET_INDEX: {
          const key = this.pop();
          const obj = this.pop();
          this.push(this.getIndex(obj, key, frame));
          break;
        }
        case OpCode.OP_SET_INDEX: {
          const key = this.pop();
          const obj = this.pop();
          const val = this.peek(0);
          this.setIndex(obj, key, val, frame);
          break;
        }

        case OpCode.OP_CONCAT: {
          const b = this.pop();
          const a = this.pop();
          this.push(stringify(a) + stringify(b));
          break;
        }

        case OpCode.OP_PRINT: {
          const v = this.pop();
          process.stdout.write(stringify(v) + "\n");
          this.push(null);
          break;
        }

        case OpCode.OP_HALT:
          return;

        default:
          this.runtimeError(`Noma'lum opcode: ${op}`, frame);
      }
    }
  }

  // ============ YORDAMCHI METODLAR ============

  private currentFrame(): CallFrame | undefined {
    return this.frames[this.frames.length - 1];
  }

  private readByte(frame: CallFrame): number {
    return frame.chunk.code[frame.ip++];
  }

  private push(val: MittiValue): void {
    this.stack.push(val);
  }

  private pop(): MittiValue {
    return this.stack.pop() ?? null;
  }

  private peek(distance: number): MittiValue {
    return this.stack[this.stack.length - 1 - distance];
  }

  private popNum(frame: CallFrame, op: string): number {
    const v = this.pop();
    if (typeof v !== "number") {
      this.runtimeError(`'${op}' operatori son talab qiladi, '${typeName(v)}' keldi`, frame);
    }
    return v as number;
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

  private getIndex(obj: MittiValue, key: MittiValue, frame: CallFrame): MittiValue {
    if (Array.isArray(obj)) {
      if (typeof key !== "number") this.runtimeError("Massiv indeksi son bo'lishi kerak", frame);
      let i = key as number;
      if (i < 0) i += obj.length;
      if (i < 0 || i >= obj.length) this.runtimeError(`Indeks chegaradan tashqarida: ${key}`, frame);
      return obj[i];
    }
    if (typeof obj === "string") {
      if (typeof key !== "number") this.runtimeError("Satr indeksi son bo'lishi kerak", frame);
      let i = key as number;
      if (i < 0) i += obj.length;
      if (i < 0 || i >= obj.length) this.runtimeError(`Indeks chegaradan tashqarida: ${key}`, frame);
      return obj[i];
    }
    if (obj instanceof MittiObject) {
      const k = stringify(key);
      return obj.map.has(k) ? obj.map.get(k)! : null;
    }
    this.runtimeError(`'${typeName(obj)}' turida indekslash mumkin emas`, frame);
    return null;
  }

  private setIndex(obj: MittiValue, key: MittiValue, val: MittiValue, frame: CallFrame): void {
    if (Array.isArray(obj)) {
      if (typeof key !== "number") this.runtimeError("Massiv indeksi son bo'lishi kerak", frame);
      let i = key as number;
      if (i < 0) i += obj.length;
      if (i < 0 || i > obj.length) this.runtimeError(`Indeks chegaradan tashqarida: ${key}`, frame);
      obj[i] = val;
      return;
    }
    if (obj instanceof MittiObject) {
      obj.map.set(stringify(key), val);
      return;
    }
    this.runtimeError(`'${typeName(obj)}' turiga qiymat yozib bo'lmaydi`, frame);
  }

  private callValue(callee: MittiValue, argCount: number, frame: CallFrame): void {
    if (callee instanceof VMFunction) {
      if (callee.params.length !== argCount) {
        this.runtimeError(
          `'${callee.name}' funksiyasi ${callee.params.length} ta argument talab qiladi, ${argCount} ta berildi`,
          frame
        );
      }
      // Argumentlarni stack'dan olamiz
      const locals: MittiValue[] = new Array(argCount + 1);
      locals[0] = callee;
      for (let i = argCount; i >= 1; i--) {
        locals[i] = this.pop();
      }
      // Funksiya obyektini ham stack'dan olamiz
      this.pop();
      this.frames.push({ chunk: callee.chunk, ip: 0, locals, name: callee.name });
      return;
    }

    if (callee instanceof NativeFunction) {
      const args: MittiValue[] = new Array(argCount);
      for (let i = argCount - 1; i >= 0; i--) {
        args[i] = this.pop();
      }
      this.pop(); // callee funksiyani ham pop qilamiz
      const result = callee.fn(args);
      this.push(result);
      return;
    }

    this.runtimeError(`'${typeName(callee)}' chaqirib bo'lmaydi (funksiya emas)`, frame);
  }

  private runtimeError(msg: string, frame: CallFrame): never {
    const line = frame.chunk.lines[frame.ip - 1] ?? 0;
    throw new MittiRuntimeError(msg, line);
  }

  // ============ BUILT-IN FUNKSIYALAR ============

  private installBuiltins(): void {
    const def = (name: string, fn: (args: MittiValue[]) => MittiValue) => {
      this.globals.set(name, new NativeFunction(name, fn));
    };

    def("print", (args) => {
      process.stdout.write(args.map((a) => stringify(a)).join(" ") + "\n");
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
      if (args.length === 1) { stop = args[0] as number; }
      else if (args.length === 2) { start = args[0] as number; stop = args[1] as number; }
      else if (args.length >= 3) { start = args[0] as number; stop = args[1] as number; step = args[2] as number; }
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

    def("input", () => null);

    def("read_file", (args) => {
      const p = String(args[0]);
      if (!fs.existsSync(p)) throw new MittiRuntimeError(`Fayl topilmadi: '${p}'`, 0);
      return fs.readFileSync(p, "utf-8");
    });
    def("write_file", (args) => {
      fs.writeFileSync(String(args[0]), stringify(args[1]), "utf-8");
      return true;
    });
    def("append_file", (args) => {
      fs.appendFileSync(String(args[0]), stringify(args[1]), "utf-8");
      return true;
    });
    def("file_exists", (args) => fs.existsSync(String(args[0])));
    def("remove_file", (args) => {
      const p = String(args[0]);
      if (fs.existsSync(p)) { fs.unlinkSync(p); return true; }
      return false;
    });
  }
}
