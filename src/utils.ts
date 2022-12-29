import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function isRails(rootDir: string): boolean {
  return (
    isFile(path.join(rootDir, "config/environment.rb")) &&
    isDir(path.join(rootDir, "app"))
  );
}

export function hasGemfile(rootDir: string) {
  return isFile(path.join(rootDir, "Gemfile"));
}

export function isDir(path: string): boolean {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    return false;
  }
}

export function isFile(path: string): boolean {
  try {
    return fs.statSync(path).isFile();
  } catch (error) {
    return false;
  }
}

function findRootDir({
  dirs,
  fileName,
}: {
  dirs: string[];
  fileName: string;
}): string {
  let parts = fileName.split("/").slice(0, -2);

  while (parts.length) {
    const dir = parts.join("/");

    if (dirs.includes(dir)) {
      return dir;
    }

    parts.pop();
  }

  return path.dirname(fileName);
}

export function getRootDir({ document }: { document: vscode.TextDocument }) {
  const dirs = vscode.workspace.workspaceFolders?.map(
    (folder) => folder.uri.path,
  ) ?? [path.dirname(document.fileName)];

  return findRootDir({ dirs, fileName: document.fileName });
}

export function wrapText({
  text,
  indent,
  columnSize = 80,
}: {
  text: string;
  indent: string;
  columnSize?: number;
}) {
  const words = text.replace(/\s+/gm, " ").trim().split(" ");
  const prefix = "#";
  const lines: string[] = [];
  let currentLine = indent + prefix;

  words.forEach((word) => {
    const nextInput = " " + word;

    if ((currentLine + nextInput).length <= columnSize) {
      currentLine += nextInput;
    } else {
      lines.push(currentLine.trimEnd());
      currentLine = indent + prefix + nextInput;
    }
  });

  lines.push(currentLine.trimEnd());

  return lines.join("\n");
}
