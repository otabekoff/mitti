// Mitti VS Code Extension Client
// Bu plagin VS Code ishga tushganda 'mitti lsp' jarayonini stdio orqali boshqaradi.

const { LanguageClient } = require("vscode-languageclient/node");
const path = require("path");

let client;

function activate(context) {
  // Mitti CLI / server faylini aniqlaymiz
  const serverModule = context.asAbsolutePath(path.join("..", "..", "dist", "main.js"));

  const serverOptions = {
    run: { command: "node", args: [serverModule, "lsp"] },
    debug: { command: "node", args: [serverModule, "lsp"] },
  };

  const clientOptions = {
    documentSelector: [{ scheme: "file", language: "mitti" }],
    synchronize: {
      fileEvents: [],
    },
  };

  client = new LanguageClient("mittiLanguageServer", "Mitti Language Server", serverOptions, clientOptions);
  client.start();
}

function deactivate() {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

module.exports = {
  activate,
  deactivate,
};
