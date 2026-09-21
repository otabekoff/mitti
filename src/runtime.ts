import * as A from "./ast.js";

export type MittiValue =
  | number
  | string
  | boolean
  | null
  | MittiValue[]
  | MittiObject
  | MittiFunction
  | NativeFunction;

export class MittiObject {
  map: Map<string, MittiValue> = new Map();
}

export class MittiFunction {
  constructor(
    public name: string | null,
    public params: string[],
    public body: A.BlockStmt,
    public closure: Environment
  ) {}
}

export class NativeFunction {
  constructor(public name: string, public fn: (args: MittiValue[]) => MittiValue) {}
}

export interface CallFrame {
  fnName: string;
  file?: string;
  line: number;
}

export class MittiRuntimeError extends Error {
  public callStack: CallFrame[] = [];
  public rawMessage: string;

  constructor(message: string, public line: number) {
    super(`Ishga tushirish xatosi (${line}-qator): ${message}`);
    this.rawMessage = message;
  }

  formatWithStack(file?: string, sourceLines?: string[]): string {
    const parts: string[] = [];
    parts.push(`Xatolik: ${this.rawMessage}`);
    if (file) {
      parts.push(`  fayl: ${file}, ${this.line}-qatorda`);
    } else {
      parts.push(`  ${this.line}-qatorda`);
    }

    if (sourceLines && this.line > 0 && this.line <= sourceLines.length) {
      const codeLine = sourceLines[this.line - 1];
      parts.push(`    ${this.line} | ${codeLine}`);
    }

    if (this.callStack.length > 0) {
      parts.push("Traceback (chaqiruvlar steki):");
      for (let i = this.callStack.length - 1; i >= 0; i--) {
        const frame = this.callStack[i];
        const fStr = frame.file ? `${frame.file}:` : "";
        parts.push(`  -> ${frame.fnName} (${fStr}${frame.line}-qator)`);
      }
    }
    return parts.join("\n");
  }
}

export class MittiUserException extends Error {
  public callStack: CallFrame[] = [];

  constructor(public value: MittiValue, public line: number) {
    super(`Maxsus xatolik (${line}-qator): ${stringify(value)}`);
  }

  formatWithStack(file?: string, sourceLines?: string[]): string {
    const parts: string[] = [];
    parts.push(`Maxsus xatolik: ${stringify(this.value)}`);
    if (file) {
      parts.push(`  fayl: ${file}, ${this.line}-qatorda`);
    } else {
      parts.push(`  ${this.line}-qatorda`);
    }

    if (sourceLines && this.line > 0 && this.line <= sourceLines.length) {
      const codeLine = sourceLines[this.line - 1];
      parts.push(`    ${this.line} | ${codeLine}`);
    }

    if (this.callStack.length > 0) {
      parts.push("Traceback (chaqiruvlar steki):");
      for (let i = this.callStack.length - 1; i >= 0; i--) {
        const frame = this.callStack[i];
        const fStr = frame.file ? `${frame.file}:` : "";
        parts.push(`  -> ${frame.fnName} (${fStr}${frame.line}-qator)`);
      }
    }
    return parts.join("\n");
  }
}

// Funksiyadan return/break/continue chiqishi uchun signal sinflar
export class ReturnSignal {
  constructor(public value: MittiValue) {}
}
export class BreakSignal {}
export class ContinueSignal {}

export class Environment {
  private vars: Map<string, MittiValue> = new Map();
  constructor(public parent: Environment | null = null) {}

  define(name: string, value: MittiValue) {
    this.vars.set(name, value);
  }

  has(name: string): boolean {
    if (this.vars.has(name)) return true;
    return this.parent ? this.parent.has(name) : false;
  }

  get(name: string, line: number): MittiValue {
    if (this.vars.has(name)) return this.vars.get(name)!;
    if (this.parent) return this.parent.get(name, line);
    throw new MittiRuntimeError(`aniqlanmagan o'zgaruvchi: '${name}'`, line);
  }

  // = operatori: agar o'zgaruvchi biror ota-environmentda bo'lsa o'shani yangilaydi,
  // aks holda joriy environmentda yangi o'zgaruvchi yaratadi (Python semantikasiga yaqin).
  assign(name: string, value: MittiValue, line: number) {
    let env: Environment | null = this;
    while (env) {
      if (env.vars.has(name)) {
        env.vars.set(name, value);
        return;
      }
      env = env.parent;
    }
    this.vars.set(name, value);
    void line;
  }

  getLocalVars(): Map<string, MittiValue> {
    return new Map(this.vars);
  }
}

export function isTruthy(v: MittiValue): boolean {
  if (v === null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function typeName(v: MittiValue): string {
  if (v === null) return "null";
  if (typeof v === "number") return "son";
  if (typeof v === "string") return "satr";
  if (typeof v === "boolean") return "mantiqiy";
  if (Array.isArray(v)) return "massiv";
  if (v instanceof MittiObject) return "obyekt";
  if (v instanceof MittiFunction || v instanceof NativeFunction) return "funksiya";
  return "noma'lum";
}

export function stringify(v: MittiValue, seen: Set<unknown> = new Set()): string {
  if (v === null) return "null";
  if (typeof v === "string") return v;
  if (typeof v === "number") return numberToStr(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) {
    if (seen.has(v)) return "[...]";
    seen.add(v);
    return "[" + v.map((x) => inspect(x, seen)).join(", ") + "]";
  }
  if (v instanceof MittiObject) {
    if (seen.has(v)) return "{...}";
    seen.add(v);
    const parts: string[] = [];
    for (const [k, val] of v.map.entries()) parts.push(`${k}: ${inspect(val, seen)}`);
    return "{" + parts.join(", ") + "}";
  }
  if (v instanceof MittiFunction) return `<funksiya ${v.name ?? "anonim"}>`;
  if (v instanceof NativeFunction) return `<built-in funksiya ${v.name}>`;
  return String(v);
}

// array/object ichida string'lar tirnoq bilan ko'rsatiladi (print bilan farqi shu)
function inspect(v: MittiValue, seen: Set<unknown>): string {
  if (typeof v === "string") return JSON.stringify(v);
  return stringify(v, seen);
}

function numberToStr(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toString();
}
