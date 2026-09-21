/**
 * WebAssembly binar modulini Node.js muhitida ishga tushirish (runner).
 */
export async function runWasm(
  wasmBytes: Uint8Array,
  output: (s: string) => void = (s) => process.stdout.write(s + "\n")
): Promise<{ exports: Record<string, unknown>; exitCode: number }> {
  const importObject = {
    env: {
      print: (val: number) => {
        output(String(val));
      },
    },
  };

  const res = await WebAssembly.instantiate(wasmBytes, importObject);
  const instance = ("instance" in res ? (res as any).instance : res) as WebAssembly.Instance;
  const exports = instance.exports as Record<string, unknown>;

  let exitCode = 0;
  if (typeof exports.main === "function") {
    const result = (exports.main as () => number)();
    exitCode = typeof result === "number" ? result : 0;
  }

  return { exports, exitCode };
}
