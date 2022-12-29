import * as vscode from "vscode";
import { createLogger } from "./createLogger";
import { switchFile } from "./switchFile";
import { bundlerHoverProvider } from "./bundlerHoverProvider";
import { annotateGemfile } from "./annotateGemfile";
import { bundlerCompletionProvider } from "./bundlerCompletionProvider";

const debug = createLogger("extension");

export function activate(context: vscode.ExtensionContext) {
  debug("activating ruby file switcher");

  context.subscriptions.push(
    vscode.commands.registerCommand("rubyFileSwitcher.run", () => {
      debug("running ruby file switcher");

      if (vscode.window.activeTextEditor?.document) {
        switchFile({ document: vscode.window.activeTextEditor?.document });
      }
    }),

    vscode.commands.registerCommand(
      "annotateGemfile.run",
      (params: {
        summary: string;
        name: string;
        line: number;
        url: string;
      }) => {
        debug("running annotate gemfile", params);

        if (!vscode.window.activeTextEditor?.document) {
          return;
        }

        annotateGemfile({ ...params, editor: vscode.window.activeTextEditor });
      },
    ),

    vscode.languages.registerHoverProvider("ruby-bundler", {
      provideHover: bundlerHoverProvider,
    }),

    vscode.languages.registerCompletionItemProvider("ruby", {
      provideCompletionItems: bundlerCompletionProvider,
    }),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
