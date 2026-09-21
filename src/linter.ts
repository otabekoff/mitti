import * as A from "./ast.js";

export interface LintDiagnostic {
  level: "xato" | "ogohlantirish";
  message: string;
  line: number;
}

// Tip nomlaridan literal tipini aniqlash
function literalType(expr: A.Expr): string | null {
  switch (expr.kind) {
    case "NumberLit": return Number.isInteger(expr.value) ? "int" : "float";
    case "StringLit": return "str";
    case "BoolLit": return "bool";
    case "NullLit": return "null";
    case "ArrayLit": return "list";
    case "ObjectLit": return "obj";
    default: return null; // murakkab ifoda — any
  }
}

// Annotatsiyaning ma'lum tiplariga tegishli literal tiplar
function typesCompatible(annotation: string, litType: string): boolean {
  if (annotation === "any") return true;
  if (annotation === "float" && litType === "int") return true; // int -> float muvofiq
  return annotation === litType;
}

// Scope — o'zgaruvchilar kuzatuvi
class Scope {
  private vars: Set<string> = new Set();
  constructor(public parent: Scope | null = null) {}

  define(name: string) { this.vars.add(name); }

  has(name: string): boolean {
    if (this.vars.has(name)) return true;
    return this.parent ? this.parent.has(name) : false;
  }
}

export class Linter {
  private diagnostics: LintDiagnostic[] = [];
  // Import qilingan nomlar: { nom -> ishlatildimi }
  private importedNames: Map<string, { used: boolean; line: number }> = new Map();

  lint(program: A.Program): LintDiagnostic[] {
    this.diagnostics = [];
    this.importedNames = new Map();

    const globalScope = new Scope();
    // Built-in funksiyalar va o'zgaruvchilar
    const builtins = [
      "print", "len", "range", "str", "int", "float", "type",
      "push", "pop", "keys", "values", "has",
      "upper", "lower", "split", "join", "trim",
      "abs", "min", "max", "round", "floor", "ceil", "sqrt", "pow",
      "input", "read_file", "write_file", "append_file", "file_exists", "remove_file",
    ];
    builtins.forEach((b) => globalScope.define(b));

    this.checkBlock(program.body, globalScope);

    // Ishlatilmagan importlar
    for (const [name, info] of this.importedNames) {
      if (!info.used) {
        this.warn(`'${name}' import qilingan, lekin ishlatilmagan`, info.line);
      }
    }

    return this.diagnostics;
  }

  private error(message: string, line: number) {
    this.diagnostics.push({ level: "xato", message, line });
  }

  private warn(message: string, line: number) {
    this.diagnostics.push({ level: "ogohlantirish", message, line });
  }

  private checkBlock(stmts: A.Stmt[], scope: Scope) {
    for (const stmt of stmts) {
      this.checkStmt(stmt, scope);
    }
  }

  private checkStmt(stmt: A.Stmt, scope: Scope) {
    switch (stmt.kind) {
      case "ExprStmt":
        this.checkExpr(stmt.expression, scope);
        break;

      case "BlockStmt": {
        const inner = new Scope(scope);
        this.checkBlock(stmt.body, inner);
        break;
      }

      case "IfStmt": {
        this.checkExpr(stmt.condition, scope);
        const thenScope = new Scope(scope);
        this.checkBlock(stmt.thenBranch.body, thenScope);
        if (stmt.elseBranch) {
          if (stmt.elseBranch.kind === "IfStmt") {
            this.checkStmt(stmt.elseBranch, scope);
          } else {
            const elseScope = new Scope(scope);
            this.checkBlock(stmt.elseBranch.body, elseScope);
          }
        }
        break;
      }

      case "WhileStmt": {
        this.checkExpr(stmt.condition, scope);
        const loopScope = new Scope(scope);
        this.checkBlock(stmt.body.body, loopScope);
        break;
      }

      case "ForStmt": {
        this.checkExpr(stmt.iterable, scope);
        const loopScope = new Scope(scope);
        loopScope.define(stmt.varName);
        this.checkBlock(stmt.body.body, loopScope);
        break;
      }

      case "FunctionDecl": {
        // Funksiya nomini scope'ga qo'shamiz
        scope.define(stmt.name);
        const fnScope = new Scope(scope);
        stmt.params.forEach((p) => fnScope.define(p.name));
        // Return tipi bo'lsa, return mavjudligini tekshiramiz
        if (stmt.returnType && stmt.returnType !== "any") {
          const hasReturn = this.hasReturnStmt(stmt.body.body);
          if (!hasReturn) {
            this.warn(
              `'${stmt.name}' funksiyasi '-> ${stmt.returnType}' return tipini e'lon qilgan, lekin 'return' topilmadi`,
              stmt.line
            );
          }
        }
        this.checkBlock(stmt.body.body, fnScope);
        break;
      }

      case "ReturnStmt":
        if (stmt.value) this.checkExpr(stmt.value, scope);
        break;

      case "ImportStmt": {
        if (stmt.isFrom && stmt.specifiers) {
          for (const spec of stmt.specifiers) {
            scope.define(spec.local);
            this.importedNames.set(spec.local, { used: false, line: stmt.line });
          }
        } else {
          const name = stmt.alias ?? this.moduleName(stmt.source);
          scope.define(name);
          this.importedNames.set(name, { used: false, line: stmt.line });
        }
        break;
      }

      case "TryStmt": {
        const tryScope = new Scope(scope);
        this.checkBlock(stmt.tryBlock.body, tryScope);
        if (stmt.exceptBlock) {
          const exceptScope = new Scope(scope);
          if (stmt.catchVar) exceptScope.define(stmt.catchVar);
          this.checkBlock(stmt.exceptBlock.body, exceptScope);
        }
        if (stmt.finallyBlock) {
          const finallyScope = new Scope(scope);
          this.checkBlock(stmt.finallyBlock.body, finallyScope);
        }
        break;
      }

      case "RaiseStmt":
        this.checkExpr(stmt.argument, scope);
        break;

      case "BreakStmt":
      case "ContinueStmt":
        break;
    }
  }

  private checkExpr(expr: A.Expr, scope: Scope) {
    switch (expr.kind) {
      case "Identifier": {
        // Import nomini ishlatilgan deb belgilaymiz
        if (this.importedNames.has(expr.name)) {
          this.importedNames.get(expr.name)!.used = true;
        }
        // Aniqlanmagan o'zgaruvchi
        if (!scope.has(expr.name)) {
          this.error(`aniqlanmagan o'zgaruvchi: '${expr.name}'`, expr.line);
        }
        break;
      }

      case "AssignExpr": {
        this.checkExpr(expr.value, scope);

        // Tip muvofiqlik tekshiruvi (faqat literal qiymatlar uchun)
        if (expr.typeAnnotation) {
          const litType = literalType(expr.value);
          if (litType !== null && !typesCompatible(expr.typeAnnotation, litType)) {
            this.error(
              `tip nomuvofiq: '${expr.typeAnnotation}' kutilgan, '${litType}' berildi` +
              (expr.target.kind === "Identifier" ? ` ('${expr.target.name}')` : ""),
              expr.line
            );
          }
        }

        // O'zgaruvchini scope'ga qo'shamiz
        if (expr.target.kind === "Identifier") {
          scope.define(expr.target.name);
        } else {
          this.checkExpr(expr.target, scope);
        }
        break;
      }

      case "BinaryExpr":
        this.checkExpr(expr.left, scope);
        this.checkExpr(expr.right, scope);
        break;

      case "UnaryExpr":
        this.checkExpr(expr.argument, scope);
        break;

      case "LogicalExpr":
        this.checkExpr(expr.left, scope);
        this.checkExpr(expr.right, scope);
        break;

      case "CallExpr":
        this.checkExpr(expr.callee, scope);
        expr.args.forEach((a) => this.checkExpr(a, scope));
        break;

      case "IndexExpr":
        this.checkExpr(expr.object, scope);
        this.checkExpr(expr.index, scope);
        break;

      case "MemberExpr":
        this.checkExpr(expr.object, scope);
        break;

      case "ArrayLit":
        expr.elements.forEach((e) => this.checkExpr(e, scope));
        break;

      case "ObjectLit":
        expr.keys.forEach((k) => this.checkExpr(k, scope));
        expr.values.forEach((v) => this.checkExpr(v, scope));
        break;

      case "FunctionExpr": {
        const fnScope = new Scope(scope);
        if (expr.name) {
          scope.define(expr.name);
          fnScope.define(expr.name);
        }
        expr.params.forEach((p) => fnScope.define(p.name));
        if (expr.returnType && expr.returnType !== "any") {
          const hasReturn = this.hasReturnStmt(expr.body.body);
          if (!hasReturn) {
            this.warn(
              `anonim funksiya '-> ${expr.returnType}' return tipini e'lon qilgan, lekin 'return' topilmadi`,
              expr.line
            );
          }
        }
        this.checkBlock(expr.body.body, fnScope);
        break;
      }

      // Literallar — tekshirish kerak emas
      case "NumberLit":
      case "StringLit":
      case "BoolLit":
      case "NullLit":
        break;
    }
  }

  // Blok ichida kamida bitta ReturnStmt borligini tekshiradi (yuza tekshiruv)
  private hasReturnStmt(stmts: A.Stmt[]): boolean {
    for (const stmt of stmts) {
      if (stmt.kind === "ReturnStmt") return true;
      if (stmt.kind === "IfStmt") {
        if (this.hasReturnStmt(stmt.thenBranch.body)) return true;
        if (stmt.elseBranch && stmt.elseBranch.kind === "BlockStmt" && this.hasReturnStmt(stmt.elseBranch.body)) return true;
      }
    }
    return false;
  }

  private moduleName(source: string): string {
    // "math", "os", "json" standart modullar; fayl uchun basename
    if (["math", "os", "json"].includes(source)) return source;
    const parts = source.replace(/\\/g, "/").split("/");
    const base = parts[parts.length - 1];
    return base.replace(/\.mt$/, "");
  }
}

