import * as childProcess from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { createLogger } from "./createLogger";
import { getRootDir, hasGemfile } from "./utils";

const debug = createLogger("bundlerCompletionProvider");

export function extractGems({ rootDir }: { rootDir: string }): string[] {
  const file = path.resolve(path.join(__dirname, "..", "src", "gem_files.rb"));
  const cmd = "bundle";
  const args = ["exec", "ruby", file];

  debug("command:", cmd, args);

  const response = childProcess.spawnSync(cmd, args, {
    cwd: rootDir,
    env: process.env,
  });

  if (response.status !== 0) {
    debug("command failed", { status: response.status });
    debug("stdout:", response.stdout.toString());
    debug("stderr:", response.stderr.toString());
    return [];
  }

  try {
    const imports: string[] = JSON.parse(response.stdout.toString());
    return imports;
  } catch (error) {
    debug("failed to parse JSON", { error });
    return [];
  }
}

export function bundlerCompletionProvider(
  document: vscode.TextDocument,
  position: vscode.Position,
  _token: vscode.CancellationToken,
  _context: vscode.CompletionContext,
): vscode.ProviderResult<vscode.CompletionItem[]> {
  const rootDir = getRootDir({ document });
  debug("rootDir:", rootDir);

  if (!hasGemfile(rootDir)) {
    debug("no Gemfile");
    return [];
  }

  const { text: line } = document.lineAt(position.line);
  const cursorPosition = position.character;
  const regex = /^\s*require (?:"([a-z0-9-_]*)"|'([a-z0-9-_]*)')$/i;
  const matches = line.match(regex);

  if (!matches) {
    debug("line doesn't match");
    return [];
  }

  const input = matches[1] ?? matches[2];
  const openQuotePosition = Math.max(line.indexOf("'"), line.indexOf('"'));
  const closeQuotePosition = Math.max(
    line.lastIndexOf("'"),
    line.lastIndexOf('"'),
  );

  debug("line:", line);
  debug({
    openQuotePosition,
    closeQuotePosition,
    cursorPosition,
  });

  const validCursor =
    cursorPosition > openQuotePosition && cursorPosition <= closeQuotePosition;

  if (!validCursor) {
    debug("cursor is not inside quotes");
    return [];
  }

  const gems = extractGems({ rootDir }).filter(
    (gem) => gem.startsWith(input) && gem !== input,
  );

  debug("gems:", gems);

  return gems.map((gem) => {
    const item = new vscode.CompletionItem(
      gem,
      vscode.CompletionItemKind.Module,
    );
    item.range = new vscode.Range(position, position);
    return item;
  });
}
