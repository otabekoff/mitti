import * as A from "../ast.js";
import {
  WASM_MAGIC,
  WASM_VERSION,
  WasmValType,
  WasmSection,
  WasmOp,
  WasmExportDesc,
  encodeULEB128,
  encodeSLEB128,
  encodeString,
  encodeVector,
  createSection,
} from "./encoder.js";

interface WasmLocal {
  name: string;
  index: number;
}

interface FuncInfo {
  name: string;
  funcIndex: number;
  typeIndex: number;
  paramCount: number;
}

/**
 * Mitti AST'ni to'g'ridan-to'g'ri WebAssembly (.wasm) binar moduliga kompilyatsiya qiluvchi sinf.
 */
export class WasmCompiler {
  private functions: Map<string, FuncInfo> = new Map();
  private nextFuncIndex: number = 1; // 0 = env.print import qilingan funksiya
  private types: number[][] = [];

  /**
   * Program AST'ni WebAssembly binary (Uint8Array) formatiga o'tkazish
   */
  compile(program: A.Program): Uint8Array {
    this.functions.clear();
    this.nextFuncIndex = 1;
    this.types = [];

    // Type 0: (i32) -> void (print uchun)
    const printType = [
      WasmValType.func,
      ...encodeVector([[WasmValType.i32]]), // 1 ta i32 param
      ...encodeVector([]),                   // 0 ta natija
    ];
    this.types.push(printType);

    // Dasturdagi funksiyalarni ajratib olamiz
    const userFuncDecls: A.FunctionDecl[] = [];
    const topLevelStmts: A.Stmt[] = [];

    for (const stmt of program.body) {
      if (stmt.kind === "FunctionDecl") {
        userFuncDecls.push(stmt);
      } else {
        topLevelStmts.push(stmt);
      }
    }

    // Har bir user funksiya uchun Type va FuncInfo ro'yxatdan o'tkazamiz
    for (const fn of userFuncDecls) {
      const paramTypes = fn.params.map(() => WasmValType.i32);
      const fnType = [
        WasmValType.func,
        ...encodeVector(paramTypes.map((t) => [t])),
        ...encodeVector([[WasmValType.i32]]), // har doim i32 qaytaradi
      ];
      const typeIdx = this.types.length;
      this.types.push(fnType);

      this.functions.set(fn.name, {
        name: fn.name,
        funcIndex: this.nextFuncIndex++,
        typeIndex: typeIdx,
        paramCount: fn.params.length,
      });
    }

    // Asosiy dastur (main) uchun Type: () -> i32
    const mainType = [
      WasmValType.func,
      ...encodeVector([]),
      ...encodeVector([[WasmValType.i32]]),
    ];
    const mainTypeIdx = this.types.length;
    this.types.push(mainType);
    const mainFuncIndex = this.nextFuncIndex++;

    // 1. Type Section
    const typeSection = createSection(WasmSection.Type, encodeVector(this.types));

    // 2. Import Section: env.print: (i32) -> void
    const importEntry = [
      ...encodeString("env"),
      ...encodeString("print"),
      0x00, // function import
      ...encodeULEB128(0), // type 0
    ];
    const importSection = createSection(WasmSection.Import, encodeVector([importEntry]));

    // 3. Function Section: har bir yaratilgan funksiya qaysi type'ga tegishli
    const funcTypeIndices: number[][] = [];
    for (const fn of userFuncDecls) {
      const info = this.functions.get(fn.name)!;
      funcTypeIndices.push(encodeULEB128(info.typeIndex));
    }
    // main uchun type
    funcTypeIndices.push(encodeULEB128(mainTypeIdx));
    const funcSection = createSection(WasmSection.Function, encodeVector(funcTypeIndices));

    // 4. Export Section: funksiyalarni eksport qilish
    const exportEntries: number[][] = [];
    for (const [name, info] of this.functions.entries()) {
      exportEntries.push([
        ...encodeString(name),
        WasmExportDesc.Func,
        ...encodeULEB128(info.funcIndex),
      ]);
    }
    // main funksiyasini ham eksport qilamiz
    exportEntries.push([
      ...encodeString("main"),
      WasmExportDesc.Func,
      ...encodeULEB128(mainFuncIndex),
    ]);
    const exportSection = createSection(WasmSection.Export, encodeVector(exportEntries));

    // 5. Code Section: funksiya tanalari
    const codeBodies: number[][] = [];

    // Har bir user funksiya kodi
    for (const fn of userFuncDecls) {
      const bodyBytes = this.compileFunctionBody(fn.params.map((p) => p.name), fn.body.body, true);
      codeBodies.push(bodyBytes);
    }

    // main funksiya kodi
    const mainBodyBytes = this.compileFunctionBody([], topLevelStmts, false);
    codeBodies.push(mainBodyBytes);

    const codeSection = createSection(WasmSection.Code, encodeVector(codeBodies));

    // To'liq modulni yig'amiz
    const moduleBytes = [
      ...WASM_MAGIC,
      ...WASM_VERSION,
      ...typeSection,
      ...importSection,
      ...funcSection,
      ...exportSection,
      ...codeSection,
    ];

    return new Uint8Array(moduleBytes);
  }

  /**
   * Funksiya tanasini kompilatsiya qilish
   */
  private compileFunctionBody(params: string[], stmts: A.Stmt[], isUserFunc: boolean): number[] {
    const locals: WasmLocal[] = [];
    // Parametrlar avtomatik dastlabki lokal indekslarni oladi
    for (let i = 0; i < params.length; i++) {
      locals.push({ name: params[i], index: i });
    }

    // Qo'shimcha lokal o'zgaruvchilarni topish (Assignment statement orqali)
    const extraLocals: string[] = [];
    const findLocals = (s: A.Stmt) => {
      if (s.kind === "ExprStmt" && s.expression.kind === "AssignExpr") {
        if (s.expression.target.kind === "Identifier") {
          const name = s.expression.target.name;
          if (!locals.some((l) => l.name === name) && !extraLocals.includes(name)) {
            extraLocals.push(name);
          }
        }
      } else if (s.kind === "IfStmt") {
        s.thenBranch.body.forEach(findLocals);
        if (s.elseBranch) {
          if (s.elseBranch.kind === "IfStmt") findLocals(s.elseBranch);
          else s.elseBranch.body.forEach(findLocals);
        }
      } else if (s.kind === "WhileStmt") {
        s.body.body.forEach(findLocals);
      } else if (s.kind === "BlockStmt") {
        s.body.forEach(findLocals);
      }
    };
    stmts.forEach(findLocals);

    for (const name of extraLocals) {
      locals.push({ name, index: locals.length });
    }

    // Funksiya ichidagi buyruqlar kodi
    const instructions: number[] = [];
    for (const s of stmts) {
      instructions.push(...this.compileStmt(s, locals));
    }

    // Agar funksiya oxirida return bo'lmasa, default return qo'shamiz
    if (isUserFunc) {
      instructions.push(WasmOp.i32_const, ...encodeSLEB128(0), WasmOp.return);
    } else {
      // main uchun oxirida 0 qaytaradi
      instructions.push(WasmOp.i32_const, ...encodeSLEB128(0), WasmOp.return);
    }
    instructions.push(WasmOp.end);

    // Qo'shimcha lokallar soni (parametrlardan tashqari)
    const localDeclCount = extraLocals.length;
    let localDecls: number[] = [];
    if (localDeclCount > 0) {
      localDecls = [
        ...encodeULEB128(1), // 1 ta lokal guruhi
        ...encodeULEB128(localDeclCount),
        WasmValType.i32,
      ];
    } else {
      localDecls = encodeULEB128(0);
    }

    const fullFuncBody = [...localDecls, ...instructions];
    const fullLen = encodeULEB128(fullFuncBody.length);
    return [...fullLen, ...fullFuncBody];
  }

  // ============ STATEMENTS ============

  private compileStmt(stmt: A.Stmt, locals: WasmLocal[]): number[] {
    switch (stmt.kind) {
      case "ExprStmt": {
        // print call bo'lsa void qaytaradi, drop shart emas
        if (stmt.expression.kind === "CallExpr" && stmt.expression.callee.kind === "Identifier" && stmt.expression.callee.name === "print") {
          return this.compileExpr(stmt.expression, locals);
        }
        // Oddiy assign statement bo'lsa
        if (stmt.expression.kind === "AssignExpr") {
          return this.compileExpr(stmt.expression, locals);
        }
        // Boshqa ifodalar natijasini drop qilamiz
        return [...this.compileExpr(stmt.expression, locals), WasmOp.drop];
      }

      case "ReturnStmt": {
        if (stmt.value) {
          return [...this.compileExpr(stmt.value, locals), WasmOp.return];
        }
        return [WasmOp.i32_const, ...encodeSLEB128(0), WasmOp.return];
      }

      case "IfStmt": {
        const condBytes = this.compileExpr(stmt.condition, locals);
        const thenBytes = stmt.thenBranch.body.flatMap((s) => this.compileStmt(s, locals));
        let elseBytes: number[] = [];
        if (stmt.elseBranch) {
          if (stmt.elseBranch.kind === "IfStmt") {
            elseBytes = this.compileStmt(stmt.elseBranch, locals);
          } else {
            elseBytes = stmt.elseBranch.body.flatMap((s) => this.compileStmt(s, locals));
          }
        }

        if (elseBytes.length > 0) {
          return [
            ...condBytes,
            WasmOp.if,
            WasmValType.void,
            ...thenBytes,
            WasmOp.else,
            ...elseBytes,
            WasmOp.end,
          ];
        }
        return [
          ...condBytes,
          WasmOp.if,
          WasmValType.void,
          ...thenBytes,
          WasmOp.end,
        ];
      }

      case "WhileStmt": {
        // block $outer (void)
        //   loop $inner (void)
        //     cond
        //     i32.eqz
        //     br_if 1 (break)
        //     body
        //     br 0 (continue)
        //   end
        // end
        const condBytes = this.compileExpr(stmt.condition, locals);
        const bodyBytes = stmt.body.body.flatMap((s) => this.compileStmt(s, locals));

        return [
          WasmOp.block,
          WasmValType.void,
          WasmOp.loop,
          WasmValType.void,
          ...condBytes,
          WasmOp.i32_eqz,
          WasmOp.br_if,
          ...encodeULEB128(1), // break out of block
          ...bodyBytes,
          WasmOp.br,
          ...encodeULEB128(0), // repeat loop
          WasmOp.end,
          WasmOp.end,
        ];
      }

      case "BlockStmt":
        return stmt.body.flatMap((s) => this.compileStmt(s, locals));

      default:
        return [];
    }
  }

  // ============ EXPRESSIONS ============

  private compileExpr(expr: A.Expr, locals: WasmLocal[]): number[] {
    switch (expr.kind) {
      case "NumberLit":
        return [WasmOp.i32_const, ...encodeSLEB128(expr.value)];

      case "BoolLit":
        return [WasmOp.i32_const, ...encodeSLEB128(expr.value ? 1 : 0)];

      case "NullLit":
        return [WasmOp.i32_const, ...encodeSLEB128(0)];

      case "Identifier": {
        const local = locals.find((l) => l.name === expr.name);
        if (local) {
          return [WasmOp.local_get, ...encodeULEB128(local.index)];
        }
        // Agar o'zgaruvchi topilmasa 0 qaytaramiz
        return [WasmOp.i32_const, ...encodeSLEB128(0)];
      }

      case "UnaryExpr": {
        const arg = this.compileExpr(expr.argument, locals);
        if (expr.operator === "-") {
          return [WasmOp.i32_const, ...encodeSLEB128(0), ...arg, WasmOp.i32_sub];
        }
        if (expr.operator === "not") {
          return [...arg, WasmOp.i32_eqz];
        }
        return arg;
      }

      case "BinaryExpr": {
        const left = this.compileExpr(expr.left, locals);
        const right = this.compileExpr(expr.right, locals);

        switch (expr.operator) {
          case "+":  return [...left, ...right, WasmOp.i32_add];
          case "-":  return [...left, ...right, WasmOp.i32_sub];
          case "*":  return [...left, ...right, WasmOp.i32_mul];
          case "/":  return [...left, ...right, WasmOp.i32_div_s];
          case "%":  return [...left, ...right, WasmOp.i32_rem_s];
          case "==": return [...left, ...right, WasmOp.i32_eq];
          case "!=": return [...left, ...right, WasmOp.i32_ne];
          case "<":  return [...left, ...right, WasmOp.i32_lt_s];
          case "<=": return [...left, ...right, WasmOp.i32_le_s];
          case ">":  return [...left, ...right, WasmOp.i32_gt_s];
          case ">=": return [...left, ...right, WasmOp.i32_ge_s];
          default:   return [...left, ...right, WasmOp.i32_add];
        }
      }

      case "AssignExpr": {
        const valBytes = this.compileExpr(expr.value, locals);
        if (expr.target.kind === "Identifier") {
          let local = locals.find((l) => l.name === (expr.target as A.Identifier).name);
          if (!local) {
            local = { name: (expr.target as A.Identifier).name, index: locals.length };
            locals.push(local);
          }
          if (expr.operator === "=") {
            return [...valBytes, WasmOp.local_set, ...encodeULEB128(local.index)];
          }
          // +=, -=, *=, /=
          const getVal = [WasmOp.local_get, ...encodeULEB128(local.index)];
          let op = WasmOp.i32_add;
          if (expr.operator === "-=") op = WasmOp.i32_sub;
          if (expr.operator === "*=") op = WasmOp.i32_mul;
          if (expr.operator === "/=") op = WasmOp.i32_div_s;

          return [...getVal, ...valBytes, op, WasmOp.local_set, ...encodeULEB128(local.index)];
        }
        return valBytes;
      }

      case "CallExpr": {
        // print() built-in funksiyasi -> call 0 (env.print)
        if (expr.callee.kind === "Identifier" && expr.callee.name === "print") {
          const argBytes = expr.args.length > 0 ? this.compileExpr(expr.args[0], locals) : [WasmOp.i32_const, ...encodeSLEB128(0)];
          return [...argBytes, WasmOp.call, ...encodeULEB128(0)];
        }

        // Foydalanuvchi funksiyasi chaqiruvi
        if (expr.callee.kind === "Identifier" && this.functions.has(expr.callee.name)) {
          const info = this.functions.get(expr.callee.name)!;
          const argBytes = expr.args.flatMap((a) => this.compileExpr(a, locals));
          return [...argBytes, WasmOp.call, ...encodeULEB128(info.funcIndex)];
        }

        return [WasmOp.i32_const, ...encodeSLEB128(0)];
      }

      default:
        return [WasmOp.i32_const, ...encodeSLEB128(0)];
    }
  }
}

