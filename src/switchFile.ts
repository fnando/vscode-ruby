import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { debug } from "./debug";

function isRails(rootDir: string): boolean {
  return (
    isFile(path.join(rootDir, "config/environment.rb")) &&
    isDir(path.join(rootDir, "app"))
  );
}

function isDir(path: string): boolean {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    return false;
  }
}

function isFile(path: string): boolean {
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

function findImplementationCandidate({
  relativePath,
  rootDir,
}: {
  relativePath: string;
  rootDir: string;
}) {
  const implementationPath = relativePath.replace(
    /^(test|spec)\/(.*?)_(test|spec)\.rb$/,
    "$2.rb",
  );

  return isRails(rootDir)
    ? path.join("app", implementationPath)
    : path.join("lib", implementationPath);
}

function findTestCandidate({
  relativePath,
  rootDir,
}: {
  relativePath: string;
  rootDir: string;
}) {
  const hasSpecDir = isDir(path.join(rootDir, "spec"));
  const targetPath = relativePath.replace(/^(app|lib)\/(.*?)\.rb$/, "$2");

  return hasSpecDir
    ? path.join("spec", `${targetPath}_spec.rb`)
    : path.join("test", `${targetPath}_test.rb`);
}

export function findCandidate({
  document,
  rootDir,
}: {
  document: vscode.TextDocument;
  rootDir: string;
}) {
  const relativePath = path.relative(rootDir, document.fileName);

  return relativePath.match(/^(test|spec)\//)
    ? findImplementationCandidate({ rootDir, relativePath })
    : findTestCandidate({ rootDir, relativePath });
}

export async function switchFile({
  document,
}: {
  document: vscode.TextDocument;
}) {
  const rootDir = getRootDir({ document });
  const candidate = findCandidate({ document, rootDir });
  const candidateExists = isFile(path.join(rootDir, candidate));
  const isTestFile = candidate.match(/^(test|spec)\//);
  const isSpecFile = candidate.match(/^spec\//);

  debug("root dir:", rootDir);
  debug("candidate:", candidate);
  debug("candidate exists:", candidateExists);

  if (candidateExists) {
    debug("opening candidate");

    vscode.window.showTextDocument(
      vscode.Uri.file(path.join(rootDir, candidate)),
    );

    return;
  }

  const newFile = vscode.Uri.file(path.join(rootDir, candidate)).with({
    scheme: "untitled",
  });

  const textDocument = await vscode.workspace.openTextDocument(newFile);
  let contents = "# frozen_string_literal: true\n\n";

  if (isTestFile) {
    contents += isSpecFile
      ? `require "spec_helper"\n\n`
      : `require "test_helper"\n\n`;
  }

  const editor = await vscode.window.showTextDocument(textDocument);
  editor.edit((edit) => {
    edit.insert(new vscode.Position(0, 0), contents);
  });
}
