import type { MittiValue } from "../runtime.js";

/**
 * VM bayt-kod operatsiyalari (OpCode).
 * Har bir opcode bitta bayt (integer) sifatida saqlanadi.
 */
export enum OpCode {
  // Konstantalar
  OP_CONSTANT,      // [idx] — konstantalar jadvalidan qiymat yuklash
  OP_NULL,          // null qiymat yuklash
  OP_TRUE,          // true yuklash
  OP_FALSE,         // false yuklash

  // Stack operatsiyalari
  OP_POP,           // stack'dan bitta qiymat o'chirish

  // Arifmetik operatsiyalar (ikki argument stack'dan)
  OP_ADD,
  OP_SUB,
  OP_MUL,
  OP_DIV,
  OP_MOD,
  OP_POW,
  OP_NEGATE,        // unar minus (bitta argument)
  OP_NOT,           // mantiqiy inkor

  // Taqqoslash operatsiyalari
  OP_EQUAL,
  OP_NOT_EQUAL,
  OP_GREATER,
  OP_GREATER_EQUAL,
  OP_LESS,
  OP_LESS_EQUAL,

  // Mantiqiy operatsiyalar (qisqa baholash uchun JUMP ishlatiladi)
  OP_AND,
  OP_OR,

  // Global o'zgaruvchilar
  OP_DEFINE_GLOBAL, // [idx] — konstantalar jadvalidagi nomni global sifatida aniqlash
  OP_GET_GLOBAL,    // [idx] — global o'zgaruvchini o'qish
  OP_SET_GLOBAL,    // [idx] — global o'zgaruvchiga yozish

  // Lokal o'zgaruvchilar (call frame ichida slot orqali)
  OP_GET_LOCAL,     // [slot] — lokal o'zgaruvchini o'qish
  OP_SET_LOCAL,     // [slot] — lokal o'zgaruvchiga yozish

  // Sakrash buyruqlari
  OP_JUMP,          // [offset_high, offset_low] — so'zsiz sakrash
  OP_JUMP_IF_FALSE, // [offset_high, offset_low] — false bo'lsa sakrash (stack'dan POP qilmaydi)
  OP_LOOP,          // [offset_high, offset_low] — orqaga sakrash (sikl uchun)
  OP_JUMP_IF_TRUE,  // [offset_high, offset_low] — true bo'lsa sakrash (OR uchun)

  // Funksiya chaqiruvi
  OP_CALL,          // [argCount] — funksiya chaqiruvi
  OP_RETURN,        // funksiyadan qaytish

  // Massiv va obyekt yaratish
  OP_BUILD_ARRAY,   // [count] — stack'dan count ta elementdan massiv yaratish
  OP_BUILD_OBJECT,  // [count] — stack'dan count*2 ta (key+value) juftilikdan obyekt yaratish

  // Indekslash
  OP_GET_INDEX,     // obj[key] — stack'dan key va obj olib, indekslangan qiymatni qaytarish
  OP_SET_INDEX,     // obj[key] = val — stack'dan val, key, obj olib, o'rnatish

  // Xususiy
  OP_CONCAT,        // satr birlashtirish (+ operatori satrlar uchun)
  OP_PRINT,         // print() built-in uchun maxsus opcode
  OP_HALT,          // dastur tugashi
}

/**
 * Bir blok bayt-kod: asosiy dastur yoki funksiya tanasi.
 */
export interface Chunk {
  /** Bayt-kod ketma-ketligi (OpCode va argumentlar integers sifatida) */
  code: number[];
  /** Konstantalar jadvali: sonlar, satrlar, funksiyalar */
  constants: MittiValue[];
  /** Har bir bayt uchun manba qator raqami (debuglash uchun) */
  lines: number[];
  /** Chunk nomi (dastur yoki funksiya nomi) */
  name: string;
}

/** Yangi bo'sh chunk yaratish */
export function makeChunk(name: string): Chunk {
  return { code: [], constants: [], lines: [], name };
}

/** Chunkga bayt qo'shish */
export function writeChunk(chunk: Chunk, byte: number, line: number): void {
  chunk.code.push(byte);
  chunk.lines.push(line);
}

/** Konstantalar jadvaliga qiymat qo'shish, indeksini qaytarish */
export function addConstant(chunk: Chunk, value: MittiValue): number {
  chunk.constants.push(value);
  return chunk.constants.length - 1;
}

