#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { Lexer, MittiSyntaxError } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { MittiRuntimeError } from "./runtime";

function runSource(src: string, interp: Interpreter) {
  const tokens = new Lexer(src).tokenize();
  const program = new Parser(tokens).parseProgram();
  interp.run(program);
}

function runFile(filePath: string) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Xato: fayl topilmadi: ${filePath}`);
    process.exit(1);
  }
  const src = fs.readFileSync(resolved, "utf-8");
  const interp = new Interpreter();
  interp.currentFilePath = resolved;
  try {
    runSource(src, interp);
  } catch (e) {
    if (e instanceof MittiSyntaxError || e instanceof MittiRuntimeError) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }
}

function startRepl() {
  console.log("Mitti REPL v0.2 — chiqish uchun 'exit' yoki Ctrl+D");
  const interp = new Interpreter();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });

  let buffer = "";
  let inBlock = false;

  rl.prompt();
  rl.on("line", (line) => {
    if (!inBlock && (line.trim() === "exit" || line.trim() === "quit")) {
      rl.close();
      return;
    }

    if (line.trimEnd().endsWith(":")) {
      inBlock = true;
      buffer += line + "\n";
      rl.setPrompt("... ");
      rl.prompt();
      return;
    }

    if (inBlock) {
      if (line.trim() === "") {
        // blok tugadi -> to'liq bufferni ishga tushiramiz
        inBlock = false;
        rl.setPrompt("> ");
        execAndPrint(buffer, interp);
        buffer = "";
        rl.prompt();
        return;
      }
      buffer += line + "\n";
      rl.prompt();
      return;
    }

    execAndPrint(line, interp);
    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\nXayr!");
    process.exit(0);
  });
}

function execAndPrint(src: string, interp: Interpreter) {
  if (src.trim() === "") return;
  try {
    // Ifoda bo'lsa natijasini avtomatik chop etamiz (masalan `x * 2`)
    const tokens = new Lexer(src).tokenize();
    const program = new Parser(tokens).parseProgram();
    let lastVal: unknown = undefined;
    const originalRun = interp.run.bind(interp);
    // Har bir statementni bajarib, oxirgisi ExprStmt bo'lsa natijasini ko'rsatamiz
    for (let i = 0; i < program.body.length; i++) {
      const stmt = program.body[i];
      if (i === program.body.length - 1 && stmt.kind === "ExprStmt") {
        const { evalForRepl } = replEvalHelper(interp);
        const val = evalForRepl(stmt.expression);
        lastVal = val;
      } else {
        originalRun({ kind: "Program", body: [stmt] });
      }
    }
    if (lastVal !== undefined && lastVal !== null) {
      console.log(stringifyForRepl(lastVal));
    }
  } catch (e) {
    if (e instanceof MittiSyntaxError || e instanceof MittiRuntimeError) {
      console.log(e.message);
    } else {
      console.log("Kutilmagan xato: " + (e as Error).message);
    }
  }
}

// REPL uchun interpreter ichidagi private evalExpr'ga kirish kerak emas —
// buning o'rniga oddiy yechim: expression statementni alohida bajarib,
// natijasini environment orqali chiqaramiz.
function replEvalHelper(interp: Interpreter) {
  return {
    evalForRepl(expr: import("./ast").Expr) {
      // Vaqtinchalik o'zgaruvchiga yozib, keyin o'qib olamiz (hack, lekin ishlaydi)
      const tmpName = "__repl_tmp__";
      const assign: import("./ast").AssignExpr = {
        kind: "AssignExpr",
        operator: "=",
        target: { kind: "Identifier", name: tmpName, line: expr.line },
        value: expr,
        line: expr.line,
      };
      interp.run({ kind: "Program", body: [{ kind: "ExprStmt", expression: assign, line: expr.line }] });
      return interp.globals.get(tmpName, expr.line);
    },
  };
}

function stringifyForRepl(v: unknown): string {
  // interpreter.ts dagi stringify bilan bir xil formatlash uchun runtime'dan foydalanamiz
  const { stringify } = require("./runtime");
  return stringify(v);
}

// ============ ENTRY POINT ============

const args = process.argv.slice(2);
if (args.length === 0) {
  startRepl();
} else if (args[0] === "-v" || args[0] === "--version") {
  console.log("Mitti v0.2.0");
} else if (args[0] === "-h" || args[0] === "--help") {
  console.log("Mitti dasturlash tili — v0.2.0");
  console.log("Ishlatish: mitti [fayl.mt]");
  console.log("Variantlar:");
  console.log("  -v, --version    Versiyani ko'rsatish");
  console.log("  -h, --help       Yordam");
} else {
  runFile(args[0]);
}
