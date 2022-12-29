import * as vscode from "vscode";

let output: vscode.OutputChannel =
  vscode.window.createOutputChannel("rubyFileSwitcher");

export function log(...args: any[]) {
  args = args.map((item) => {
    if (item === "") {
      return "<empty string>";
    }

    if (["boolean", "string", "number"].includes(typeof item)) {
      return item.toString();
    }

    if (item === null) {
      return "null";
    }

    if (item === undefined) {
      return "undefined";
    }

    return JSON.stringify(item, null, 2);
  });

  output.appendLine(args.join(" "));
}

export function debug(...args: any) {
  const date = new Date().toLocaleTimeString();

  log(`[${date}]`, ...args);
}
