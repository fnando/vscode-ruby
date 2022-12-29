import * as vscode from "vscode";
import { createLogger } from "./createLogger";
import { wrapText } from "./utils";

const debug = createLogger("annotateGemfile");

export function annotateGemfile({
  editor,
  ...params
}: {
  editor: vscode.TextEditor;
  summary: string;
  name: string;
  line: number;
  url: string;
}) {
  const line = editor.document.lineAt(params.line);
  const previousLineText = (
    params.line - 1 >= 0 ? editor.document.lineAt(params.line - 1).text : ""
  ).trim();
  const spaces = line.text.match(/^(?<spaces>\s+)/)?.groups?.spaces ?? "";

  debug("line:", line.text);
  debug("previous line:", previousLineText);

  let annotation = "";

  if (previousLineText && !previousLineText.endsWith(" do")) {
    annotation += "\n";
  }

  annotation += wrapText({ text: params.summary, indent: spaces });
  annotation += `\n${spaces}# ${params.url}`;
  annotation += "\n";

  editor.edit((edit) => {
    const position = new vscode.Position(params.line, 0);
    edit.insert(position, annotation);
  });
}
