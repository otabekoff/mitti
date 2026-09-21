import { Chunk, OpCode } from "./opcodes.js";
import { stringify } from "../runtime.js";

/**
 * Chunk bayt-kodini insonlar o'qiy oladigan matn ko'rinishiga o'tkazadi.
 * Chiqish formati: Offset  Line  OpCode  Parameters
 */
export function disassemble(chunk: Chunk, name: string): string {
  const lines: string[] = [];
  lines.push(`== ${name} ==`);
  lines.push(`${"Offset".padEnd(8)}${"Qator".padEnd(8)}${"OpCode".padEnd(24)}Parametrlar`);
  lines.push("-".repeat(64));

  let offset = 0;
  while (offset < chunk.code.length) {
    const result = disassembleInstruction(chunk, offset);
    lines.push(result.text);
    offset = result.next;
  }

  return lines.join("\n");
}

interface InstrResult {
  text: string;
  next: number;
}

function disassembleInstruction(chunk: Chunk, offset: number): InstrResult {
  const byte = chunk.code[offset];
  const line = chunk.lines[offset] ?? 0;
  const offsetStr = String(offset).padStart(4, "0");
  const lineStr = String(line).padEnd(8);

  const opName = OpCode[byte] ?? `NOMA'LUM(${byte})`;

  switch (byte) {
    // Parametrsiz opcodelar
    case OpCode.OP_NULL:
    case OpCode.OP_TRUE:
    case OpCode.OP_FALSE:
    case OpCode.OP_POP:
    case OpCode.OP_ADD:
    case OpCode.OP_SUB:
    case OpCode.OP_MUL:
    case OpCode.OP_DIV:
    case OpCode.OP_MOD:
    case OpCode.OP_POW:
    case OpCode.OP_NEGATE:
    case OpCode.OP_NOT:
    case OpCode.OP_EQUAL:
    case OpCode.OP_NOT_EQUAL:
    case OpCode.OP_GREATER:
    case OpCode.OP_GREATER_EQUAL:
    case OpCode.OP_LESS:
    case OpCode.OP_LESS_EQUAL:
    case OpCode.OP_AND:
    case OpCode.OP_OR:
    case OpCode.OP_CONCAT:
    case OpCode.OP_PRINT:
    case OpCode.OP_HALT:
    case OpCode.OP_GET_INDEX:
    case OpCode.OP_SET_INDEX:
    case OpCode.OP_RETURN:
      return {
        text: `${offsetStr}    ${lineStr}${opName}`,
        next: offset + 1,
      };

    // Bitta indeks argumenti (konstantalar jadvali uchun)
    case OpCode.OP_CONSTANT: {
      const idx = chunk.code[offset + 1];
      const val = chunk.constants[idx];
      const valStr = formatConstant(val);
      return {
        text: `${offsetStr}    ${lineStr}${opName.padEnd(24)}[${idx}] = ${valStr}`,
        next: offset + 2,
      };
    }

    case OpCode.OP_DEFINE_GLOBAL:
    case OpCode.OP_GET_GLOBAL:
    case OpCode.OP_SET_GLOBAL: {
      const idx = chunk.code[offset + 1];
      const name = chunk.constants[idx];
      return {
        text: `${offsetStr}    ${lineStr}${opName.padEnd(24)}'${name}'`,
        next: offset + 2,
      };
    }

    case OpCode.OP_GET_LOCAL:
    case OpCode.OP_SET_LOCAL: {
      const slot = chunk.code[offset + 1];
      return {
        text: `${offsetStr}    ${lineStr}${opName.padEnd(24)}slot=${slot}`,
        next: offset + 2,
      };
    }

    case OpCode.OP_CALL: {
      const argCount = chunk.code[offset + 1];
      return {
        text: `${offsetStr}    ${lineStr}${opName.padEnd(24)}arglar=${argCount}`,
        next: offset + 2,
      };
    }

    case OpCode.OP_BUILD_ARRAY:
    case OpCode.OP_BUILD_OBJECT: {
      const count = chunk.code[offset + 1];
      return {
        text: `${offsetStr}    ${lineStr}${opName.padEnd(24)}count=${count}`,
        next: offset + 2,
      };
    }

    // 2-bayt sakrash ofseti
    case OpCode.OP_JUMP:
    case OpCode.OP_JUMP_IF_FALSE:
    case OpCode.OP_JUMP_IF_TRUE:
    case OpCode.OP_LOOP: {
      const high = chunk.code[offset + 1];
      const low = chunk.code[offset + 2];
      const jumpOffset = (high << 8) | low;
      let target: number;
      if (byte === OpCode.OP_LOOP) {
        target = offset + 3 - jumpOffset;
      } else {
        target = offset + 3 + jumpOffset;
      }
      return {
        text: `${offsetStr}    ${lineStr}${opName.padEnd(24)}-> ${String(target).padStart(4, "0")}`,
        next: offset + 3,
      };
    }

    default:
      return {
        text: `${offsetStr}    ${lineStr}NOMA'LUM_OPCODE(${byte})`,
        next: offset + 1,
      };
  }
}

function formatConstant(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") return JSON.stringify(val);
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val && typeof val === "object" && "name" in val && "chunk" in val) {
    return `<funksiya ${(val as { name: string }).name}>`;
  }
  try {
    return stringify(val as import("../runtime.js").MittiValue);
  } catch {
    return String(val);
  }
}

