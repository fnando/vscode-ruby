import * as vscode from "vscode";
import * as childProcess from "child_process";
import { hasGemfile, getRootDir } from "./utils";
import { createLogger } from "./createLogger";

const debug = createLogger("bundlerHoverProvider");

export function bundlerHoverProvider(
  document: vscode.TextDocument,
  position: vscode.Position,
  _token: vscode.CancellationToken,
) {
  const { text: line } = document.lineAt(position.line);
  const matches = line.match(/^(?<indent>\s)*gem ["'](?<name>.*?)["'].*?$/);

  if (!matches) {
    debug("line doesn't match");
    return;
  }

  debug("line:", line);
  debug("matches:", matches?.groups);

  const name = matches.groups?.name ?? "";

  const rootDir = getRootDir({ document });

  let cmd = "ruby";
  const args: string[] = [];

  if (hasGemfile(rootDir)) {
    cmd = "bundle";
    args.push("exec", "ruby");
  }

  args.push("-r", "json");
  args.push(
    "-e",
    `gem "${name}"; spec = Gem.loaded_specs["${name}"]; puts JSON.dump(summary: spec.summary, url: spec.homepage, license: spec.license, metadata: spec.metadata, version: spec.version)`,
  );

  debug("cwd:", rootDir);
  debug("$PATH:", process.env.PATH?.split(process.env.PATHEXT ?? ":"));
  debug("running command:", cmd, args);

  const result = childProcess.spawnSync(cmd, args, {
    cwd: rootDir,
    env: process.env,
  });

  if (result.status !== 0) {
    debug("command failed", { status: result.status });
    debug("stdout:", result.stdout.toString());
    debug("stderr:", result.stderr.toString());
    return;
  }

  let spec: {
    version: string;
    summary: string;
    url: string;
    license: string;
    metadata: { [key: string]: string };
  } = {
    version: "",
    summary: "",
    url: "",
    license: "",
    metadata: {},
  };

  try {
    spec = JSON.parse(result.stdout.toString());
  } catch (error) {
    debug("failed to parse JSON", { error });
  }

  debug("spec:", spec);

  const url =
    [spec.metadata["source_code_uri"], spec.url].find(Boolean) ??
    `https://rubygems.org/gems/${name}`;

  const markdown = new vscode.MarkdownString();
  markdown.appendMarkdown(`**${name} (v${spec.version})**\n\n`);
  markdown.appendMarkdown(`${spec.summary}\n\n`);

  if (spec.license) {
    markdown.appendMarkdown(`License: ${spec.license}\n\n`);
  }

  markdown.appendMarkdown(`<${url}>\n\n`);

  const params = encodeURIComponent(
    JSON.stringify([
      {
        name,
        summary: spec.summary,
        url,
        line: position.line,
      },
    ]),
  );

  markdown.appendMarkdown(
    `[**Annotate**](command:annotateGemfile.run?${params})`,
  );

  markdown.isTrusted = true;

  return new vscode.Hover(markdown, new vscode.Range(position, position));
}
