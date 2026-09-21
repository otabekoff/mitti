import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  Hover,
  Location,
  Range,
  Position,
  TextDocumentPositionParams,
  HoverParams,
  DefinitionParams,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Lexer, MittiSyntaxError } from "../lexer.js";
import { Parser } from "../parser.js";
import { Linter } from "../linter.js";
import * as A from "../ast.js";

export function startLanguageServer() {
  const connection = createConnection(process.stdin, process.stdout);
  const documents = new TextDocuments(TextDocument);

  connection.onInitialize((_params: InitializeParams): InitializeResult => {
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        completionProvider: {
          resolveProvider: false,
          triggerCharacters: [".", ":", ">", " "],
        },
        hoverProvider: true,
        definitionProvider: true,
      },
    };
  });

  // ================= 1. DIAGNOSTIKA (Real-vaqt tekshiruv) =================
  documents.onDidChangeContent((change: { document: TextDocument }) => {
    validateTextDocument(change.document);
  });

  function validateTextDocument(textDocument: TextDocument): void {
    const text = textDocument.getText();
    const diagnostics: Diagnostic[] = [];

    let tokens;
    try {
      tokens = new Lexer(text).tokenize();
    } catch (e) {
      if (e instanceof MittiSyntaxError) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: Math.max(0, e.line - 1), character: Math.max(0, e.col - 1) },
            end: { line: Math.max(0, e.line - 1), character: Math.max(0, e.col + 5) },
          },
          message: e.message,
          source: "mitti-syntax",
        });
      }
      connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
      return;
    }

    let program: A.Program;
    try {
      program = new Parser(tokens).parseProgram();
    } catch (e) {
      if (e instanceof MittiSyntaxError) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: Math.max(0, e.line - 1), character: Math.max(0, e.col - 1) },
            end: { line: Math.max(0, e.line - 1), character: Math.max(0, e.col + 5) },
          },
          message: e.message,
          source: "mitti-parser",
        });
      }
      connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
      return;
    }

    // Linter orqali semantik tekshiruv
    const lintResults = new Linter().lint(program);
    for (const d of lintResults) {
      const lineIndex = Math.max(0, d.line - 1);
      diagnostics.push({
        severity: d.level === "xato" ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
        range: {
          start: { line: lineIndex, character: 0 },
          end: { line: lineIndex, character: 200 },
        },
        message: d.message,
        source: "mitti-linter",
      });
    }

    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  }

  // ================= 2. AUTOCOMPLETION (Intellisense) =================
  const KEYWORD_ITEMS: CompletionItem[] = [
    { label: "func", kind: CompletionItemKind.Keyword, insertText: "func ${1:nom}(${2}):\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Funksiya e'loni" },
    { label: "return", kind: CompletionItemKind.Keyword, insertText: "return ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Qiymat qaytarish" },
    { label: "if", kind: CompletionItemKind.Keyword, insertText: "if ${1:shart}:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Shart operatori" },
    { label: "elif", kind: CompletionItemKind.Keyword, insertText: "elif ${1:shart}:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Qo'shimcha shart" },
    { label: "else", kind: CompletionItemKind.Keyword, insertText: "else:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Aks holda" },
    { label: "while", kind: CompletionItemKind.Keyword, insertText: "while ${1:shart}:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "While sikli" },
    { label: "for", kind: CompletionItemKind.Keyword, insertText: "for ${1:item} in ${2:iterable}:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "For sikli" },
    { label: "try", kind: CompletionItemKind.Keyword, insertText: "try:\n    ${1}\nexcept ${2:err}:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Xatolarni tutish" },
    { label: "except", kind: CompletionItemKind.Keyword, insertText: "except ${1:err}:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Except bloki" },
    { label: "finally", kind: CompletionItemKind.Keyword, insertText: "finally:\n    ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Finally bloki" },
    { label: "raise", kind: CompletionItemKind.Keyword, insertText: "raise ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Xato ko'tarish" },
    { label: "import", kind: CompletionItemKind.Keyword, insertText: "import \"${1:modul}\"${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Modul import qilish" },
    { label: "from", kind: CompletionItemKind.Keyword, insertText: "from \"${1:modul}\" import ${0}", insertTextFormat: InsertTextFormat.Snippet, detail: "Moduldan import" },
    { label: "break", kind: CompletionItemKind.Keyword, detail: "Sikldan chiqish" },
    { label: "continue", kind: CompletionItemKind.Keyword, detail: "Sikl davom ettirish" },
    { label: "true", kind: CompletionItemKind.Constant, detail: "Rost qiymat" },
    { label: "false", kind: CompletionItemKind.Constant, detail: "Yolg'on qiymat" },
    { label: "null", kind: CompletionItemKind.Constant, detail: "Bo'sh qiymat" },
  ];

  const TYPE_ITEMS: CompletionItem[] = [
    { label: "int", kind: CompletionItemKind.TypeParameter, detail: "Butun son tipi" },
    { label: "float", kind: CompletionItemKind.TypeParameter, detail: "Haqiqiy o'nli son tipi" },
    { label: "str", kind: CompletionItemKind.TypeParameter, detail: "Satr (matn) tipi" },
    { label: "bool", kind: CompletionItemKind.TypeParameter, detail: "Mantiqiy tip" },
    { label: "list", kind: CompletionItemKind.TypeParameter, detail: "Massiv (ro'yxat) tipi" },
    { label: "obj", kind: CompletionItemKind.TypeParameter, detail: "Lug'at / Obyekt tipi" },
    { label: "any", kind: CompletionItemKind.TypeParameter, detail: "Istalgan tip" },
  ];

  const BUILTIN_ITEMS: CompletionItem[] = [
    { label: "print", kind: CompletionItemKind.Function, insertText: "print(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "print(...args) -> null", documentation: "Konsolga ma'lumot chiqaradi." },
    { label: "len", kind: CompletionItemKind.Function, insertText: "len(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "len(val) -> int", documentation: "Satr, massiv yoki obyekt uzunligini qaytaradi." },
    { label: "range", kind: CompletionItemKind.Function, insertText: "range(${1:stop})", insertTextFormat: InsertTextFormat.Snippet, detail: "range(stop) yoki range(start, stop, step)", documentation: "Sonlar ketma-ketligi ro'yxatini yaratadi." },
    { label: "type", kind: CompletionItemKind.Function, insertText: "type(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "type(val) -> str", documentation: "Qiymatning turini matn ko'rinishida qaytaradi." },
    { label: "str", kind: CompletionItemKind.Function, insertText: "str(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "str(val) -> str", documentation: "Qiymatni satrga aylantiradi." },
    { label: "int", kind: CompletionItemKind.Function, insertText: "int(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "int(val) -> int", documentation: "Qiymatni butun songa aylantiradi." },
    { label: "float", kind: CompletionItemKind.Function, insertText: "float(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "float(val) -> float", documentation: "Qiymatni haqiqiy songa aylantiradi." },
    { label: "push", kind: CompletionItemKind.Function, insertText: "push(${1:arr}, ${2:elem})", insertTextFormat: InsertTextFormat.Snippet, detail: "push(arr, elem) -> list", documentation: "Massiv oxiriga yangi element qo'shadi." },
    { label: "pop", kind: CompletionItemKind.Function, insertText: "pop(${1:arr})", insertTextFormat: InsertTextFormat.Snippet, detail: "pop(arr) -> any", documentation: "Massiv oxirgi elementini o'chirib, uni qaytaradi." },
    { label: "keys", kind: CompletionItemKind.Function, insertText: "keys(${1:obj})", insertTextFormat: InsertTextFormat.Snippet, detail: "keys(obj) -> list", documentation: "Obyektning barcha kalitlarini ro'yxat sifatida qaytaradi." },
    { label: "values", kind: CompletionItemKind.Function, insertText: "values(${1:obj})", insertTextFormat: InsertTextFormat.Snippet, detail: "values(obj) -> list", documentation: "Obyektning barcha qiymatlarini ro'yxat sifatida qaytaradi." },
    { label: "has", kind: CompletionItemKind.Function, insertText: "has(${1:obj_or_arr}, ${2:key_or_val})", insertTextFormat: InsertTextFormat.Snippet, detail: "has(obj, key) -> bool", documentation: "Kalit yoki element mavjudligini tekshiradi." },
    { label: "upper", kind: CompletionItemKind.Function, insertText: "upper(${1:satr})", insertTextFormat: InsertTextFormat.Snippet, detail: "upper(str) -> str", documentation: "Satrni bosh harflarga o'tkazadi." },
    { label: "lower", kind: CompletionItemKind.Function, insertText: "lower(${1:satr})", insertTextFormat: InsertTextFormat.Snippet, detail: "lower(str) -> str", documentation: "Satrni kichik harflarga o'tkazadi." },
    { label: "split", kind: CompletionItemKind.Function, insertText: "split(${1:satr}, ${2:ajratuvchi})", insertTextFormat: InsertTextFormat.Snippet, detail: "split(str, sep) -> list", documentation: "Satrni ajratuvchi bo'yicha bo'lib massiv qaytaradi." },
    { label: "join", kind: CompletionItemKind.Function, insertText: "join(${1:arr}, ${2:boglovchi})", insertTextFormat: InsertTextFormat.Snippet, detail: "join(list, glue) -> str", documentation: "Massiv elementlarini bitta satrga birlashtiradi." },
    { label: "trim", kind: CompletionItemKind.Function, insertText: "trim(${1:satr})", insertTextFormat: InsertTextFormat.Snippet, detail: "trim(str) -> str", documentation: "Satr boshidagi va oxiridagi bo'sh joylarni tozalaydi." },
    { label: "abs", kind: CompletionItemKind.Function, insertText: "abs(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "abs(son) -> son", documentation: "Sonning mutlaq qiymatini qaytaradi." },
    { label: "sqrt", kind: CompletionItemKind.Function, insertText: "sqrt(${0})", insertTextFormat: InsertTextFormat.Snippet, detail: "sqrt(son) -> float", documentation: "Kvadrat ildizni hisoblaydi." },
    { label: "pow", kind: CompletionItemKind.Function, insertText: "pow(${1:asos}, ${2:daraja})", insertTextFormat: InsertTextFormat.Snippet, detail: "pow(a, b) -> son", documentation: "Darajaga oshirish." },
    { label: "read_file", kind: CompletionItemKind.Function, insertText: "read_file(${1:fayl_yoli})", insertTextFormat: InsertTextFormat.Snippet, detail: "read_file(path) -> str", documentation: "Fayl matnini o'qib qaytaradi." },
    { label: "write_file", kind: CompletionItemKind.Function, insertText: "write_file(${1:fayl_yoli}, ${2:matn})", insertTextFormat: InsertTextFormat.Snippet, detail: "write_file(path, content) -> bool", documentation: "Faylga matn yozadi (yangi yoki ustidan)." },
    { label: "append_file", kind: CompletionItemKind.Function, insertText: "append_file(${1:fayl_yoli}, ${2:matn})", insertTextFormat: InsertTextFormat.Snippet, detail: "append_file(path, content) -> bool", documentation: "Fayl oxiriga yangi ma'lumot qo'shadi." },
    { label: "file_exists", kind: CompletionItemKind.Function, insertText: "file_exists(${1:fayl_yoli})", insertTextFormat: InsertTextFormat.Snippet, detail: "file_exists(path) -> bool", documentation: "Fayl mavjudligini tekshiradi." },
    { label: "remove_file", kind: CompletionItemKind.Function, insertText: "remove_file(${1:fayl_yoli})", insertTextFormat: InsertTextFormat.Snippet, detail: "remove_file(path) -> bool", documentation: "Faylni o'chiradi." },
  ];

  connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) return [...KEYWORD_ITEMS, ...TYPE_ITEMS, ...BUILTIN_ITEMS];

    const userSymbols: CompletionItem[] = [];
    try {
      const tokens = new Lexer(document.getText()).tokenize();
      const program = new Parser(tokens).parseProgram();
      extractSymbolsFromAST(program.body, userSymbols);
    } catch {
      // Parse xatosi bo'lsa ham standart ro'yxat qaytadi
    }

    return [...userSymbols, ...KEYWORD_ITEMS, ...TYPE_ITEMS, ...BUILTIN_ITEMS];
  });

  function extractSymbolsFromAST(stmts: A.Stmt[], list: CompletionItem[], seen: Set<string> = new Set()) {
    for (const s of stmts) {
      if (s.kind === "FunctionDecl") {
        if (!seen.has(s.name)) {
          seen.add(s.name);
          const paramsStr = s.params.map((p) => p.typeAnnotation ? `${p.name}: ${p.typeAnnotation}` : p.name).join(", ");
          const retStr = s.returnType ? ` -> ${s.returnType}` : "";
          list.push({
            label: s.name,
            kind: CompletionItemKind.Function,
            detail: `func ${s.name}(${paramsStr})${retStr}`,
            documentation: `Foydalanuvchi funksiyasi (${s.line}-qatorda e'lon qilingan)`,
          });
        }
        extractSymbolsFromAST(s.body.body, list, seen);
      } else if (s.kind === "ExprStmt" && s.expression.kind === "AssignExpr") {
        const target = s.expression.target;
        if (target.kind === "Identifier" && !seen.has(target.name)) {
          seen.add(target.name);
          const typeStr = s.expression.typeAnnotation ? `: ${s.expression.typeAnnotation}` : "";
          list.push({
            label: target.name,
            kind: CompletionItemKind.Variable,
            detail: `${target.name}${typeStr}`,
            documentation: `O'zgaruvchi (${s.line}-qator)`,
          });
        }
      } else if (s.kind === "ForStmt") {
        if (!seen.has(s.varName)) {
          seen.add(s.varName);
          list.push({
            label: s.varName,
            kind: CompletionItemKind.Variable,
            detail: `for o'zgaruvchisi: ${s.varName}`,
          });
        }
        extractSymbolsFromAST(s.body.body, list, seen);
      } else if (s.kind === "IfStmt") {
        extractSymbolsFromAST(s.thenBranch.body, list, seen);
        if (s.elseBranch) {
          if (s.elseBranch.kind === "BlockStmt") extractSymbolsFromAST(s.elseBranch.body, list, seen);
          else extractSymbolsFromAST([s.elseBranch], list, seen);
        }
      } else if (s.kind === "WhileStmt") {
        extractSymbolsFromAST(s.body.body, list, seen);
      }
    }
  }

  // ================= 3. HOVER (Ma'lumot oynachasi) =================
  connection.onHover((params: HoverParams): Hover | null => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const word = getWordAtPosition(document, params.position);
    if (!word) return null;

    // 1. Built-in tekshiruvi
    const builtin = BUILTIN_ITEMS.find((b) => b.label === word);
    if (builtin) {
      return {
        contents: {
          kind: "markdown",
          value: `\`\`\`mitti\n${builtin.detail}\n\`\`\`\n---\n${builtin.documentation ?? ""}`,
        },
      };
    }

    // 2. Tiplar tekshiruvi
    const typeItem = TYPE_ITEMS.find((t) => t.label === word);
    if (typeItem) {
      return {
        contents: {
          kind: "markdown",
          value: `\`\`\`mitti\n(tip) ${typeItem.label}\n\`\`\`\n---\n${typeItem.detail ?? ""}`,
        },
      };
    }

    // 3. Foydalanuvchi kodi tekshiruvi
    try {
      const tokens = new Lexer(document.getText()).tokenize();
      const program = new Parser(tokens).parseProgram();
      const found = findSymbolInAST(program.body, word);
      if (found) {
        return {
          contents: {
            kind: "markdown",
            value: found,
          },
        };
      }
    } catch {
      // Parse xatosi bo'lsa davom etadi
    }

    return null;
  });

  function findSymbolInAST(stmts: A.Stmt[], name: string): string | null {
    for (const s of stmts) {
      if (s.kind === "FunctionDecl") {
        if (s.name === name) {
          const paramsStr = s.params.map((p) => p.typeAnnotation ? `${p.name}: ${p.typeAnnotation}` : p.name).join(", ");
          const retStr = s.returnType ? ` -> ${s.returnType}` : "";
          return `\`\`\`mitti\nfunc ${s.name}(${paramsStr})${retStr}\n\`\`\`\n*Foydalanuvchi funksiyasi (${s.line}-qator)*`;
        }
        for (const p of s.params) {
          if (p.name === name) {
            return `\`\`\`mitti\n(parametr) ${p.name}: ${p.typeAnnotation ?? "any"}\n\`\`\`\n*${s.name} funksiyasining parametri*`;
          }
        }
        const inner = findSymbolInAST(s.body.body, name);
        if (inner) return inner;
      } else if (s.kind === "ExprStmt" && s.expression.kind === "AssignExpr") {
        const target = s.expression.target;
        if (target.kind === "Identifier" && target.name === name) {
          const typeStr = s.expression.typeAnnotation ? `: ${s.expression.typeAnnotation}` : "";
          return `\`\`\`mitti\n(o'zgaruvchi) ${target.name}${typeStr}\n\`\`\`\n*${s.line}-qatorda e'lon qilingan*`;
        }
      } else if (s.kind === "ForStmt") {
        if (s.varName === name) {
          return `\`\`\`mitti\n(sikl o'zgaruvchisi) ${s.varName}\n\`\`\`\n*${s.line}-qator for sikli*`;
        }
        const inner = findSymbolInAST(s.body.body, name);
        if (inner) return inner;
      }
    }
    return null;
  }

  // ================= 4. GO TO DEFINITION =================
  connection.onDefinition((params: DefinitionParams): Location | null => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const word = getWordAtPosition(document, params.position);
    if (!word) return null;

    try {
      const text = document.getText();
      const tokens = new Lexer(text).tokenize();
      const program = new Parser(tokens).parseProgram();
      const targetLine = findDefinitionLine(program.body, word);
      if (targetLine !== null) {
        const lines = text.split("\n");
        const lineText = lines[targetLine - 1] ?? "";
        const col = Math.max(0, lineText.indexOf(word));
        return Location.create(
          document.uri,
          Range.create(Position.create(targetLine - 1, col), Position.create(targetLine - 1, col + word.length))
        );
      }
    } catch {
      // Ignorlash
    }

    return null;
  });

  function findDefinitionLine(stmts: A.Stmt[], name: string): number | null {
    for (const s of stmts) {
      if (s.kind === "FunctionDecl") {
        if (s.name === name) return s.line;
        for (const p of s.params) {
          if (p.name === name) return s.line;
        }
        const inner = findDefinitionLine(s.body.body, name);
        if (inner !== null) return inner;
      } else if (s.kind === "ExprStmt" && s.expression.kind === "AssignExpr") {
        if (s.expression.target.kind === "Identifier" && s.expression.target.name === name) {
          return s.line;
        }
      } else if (s.kind === "ForStmt") {
        if (s.varName === name) return s.line;
        const inner = findDefinitionLine(s.body.body, name);
        if (inner !== null) return inner;
      }
    }
    return null;
  }

  function getWordAtPosition(document: TextDocument, position: Position): string | null {
    const text = document.getText();
    const offset = document.offsetAt(position);
    let start = offset;
    while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
      start--;
    }
    let end = offset;
    while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
      end++;
    }
    if (start === end) return null;
    return text.substring(start, end);
  }

  documents.listen(connection);
  connection.listen();
}
