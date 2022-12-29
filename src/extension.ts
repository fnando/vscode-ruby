import * as vscode from "vscode";
import { debug } from "./debug";
import { switchFile } from "./switchFile";

export function activate(context: vscode.ExtensionContext) {
  debug("activating ruby file switcher");

  context.subscriptions.push(
    vscode.commands.registerCommand("rubyFileSwitcher.run", () => {
      debug("running ruby file switcher");

      if (vscode.window.activeTextEditor?.document) {
        switchFile({ document: vscode.window.activeTextEditor?.document });
      }
    }),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
