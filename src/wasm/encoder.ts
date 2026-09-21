/**
 * WebAssembly binar formatining past darajali binar enkoderi.
 * Tashqi vositalarsiz (LLVM yoki Emscriptensiz) to'g'ridan-to'g'ri .wasm binar modulini generatsiya qiladi.
 */

export const WASM_MAGIC = [0x00, 0x61, 0x73, 0x6d]; // '\0asm'
export const WASM_VERSION = [0x01, 0x00, 0x00, 0x00]; // 1

export enum WasmValType {
  i32 = 0x7f,
  i64 = 0x7e,
  f32 = 0x7d,
  f64 = 0x7c,
  void = 0x40,
  func = 0x60,
}

export enum WasmSection {
  Custom = 0,
  Type = 1,
  Import = 2,
  Function = 3,
  Table = 4,
  Memory = 5,
  Global = 6,
  Export = 7,
  Start = 8,
  Element = 9,
  Code = 10,
  Data = 11,
}

export enum WasmOp {
  unreachable = 0x00,
  nop = 0x01,
  block = 0x02,
  loop = 0x03,
  if = 0x04,
  else = 0x05,
  end = 0x0b,
  br = 0x0c,
  br_if = 0x0d,
  return = 0x0f,
  call = 0x10,
  drop = 0x1a,

  local_get = 0x20,
  local_set = 0x21,
  local_tee = 0x22,

  i32_const = 0x41,
  i32_eqz = 0x45,
  i32_eq = 0x46,
  i32_ne = 0x47,
  i32_lt_s = 0x48,
  i32_gt_s = 0x4a,
  i32_le_s = 0x4c,
  i32_ge_s = 0x4e,

  i32_add = 0x6a,
  i32_sub = 0x6b,
  i32_mul = 0x6c,
  i32_div_s = 0x6d,
  i32_rem_s = 0x6f,
}

export enum WasmExportDesc {
  Func = 0x00,
  Table = 0x01,
  Mem = 0x02,
  Global = 0x03,
}

/**
 * Unsigned LEB128 enkoder (u32)
 */
export function encodeULEB128(val: number): number[] {
  const bytes: number[] = [];
  let v = Math.floor(Math.abs(val));
  do {
    let byte = v & 0x7f;
    v = Math.floor(v / 128);
    if (v !== 0) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (v !== 0);
  return bytes;
}

/**
 * Signed LEB128 enkoder (i32)
 */
export function encodeSLEB128(val: number): number[] {
  const bytes: number[] = [];
  let v = Math.floor(val);
  let more = true;
  while (more) {
    let byte = v & 0x7f;
    v >>= 7;
    const signBit = (byte & 0x40) !== 0;
    if ((v === 0 && !signBit) || (v === -1 && signBit)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    bytes.push(byte);
  }
  return bytes;
}

/**
 * UTF-8 satrni uzunligi bilan enkod qilish
 */
export function encodeString(str: string): number[] {
  const encoder = new TextEncoder();
  const utf8 = Array.from(encoder.encode(str));
  return [...encodeULEB128(utf8.length), ...utf8];
}

/**
 * Vektor (elementlar ro'yxati) enkod qilish: [uzunlik, ...elementlar]
 */
export function encodeVector(items: number[][]): number[] {
  const count = encodeULEB128(items.length);
  const body = items.flat();
  return [...count, ...body];
}

/**
 * WASM seksiya yaratish: [section_id, content_length, ...content]
 */
export function createSection(sectionId: WasmSection, content: number[]): number[] {
  const len = encodeULEB128(content.length);
  return [sectionId, ...len, ...content];
}

