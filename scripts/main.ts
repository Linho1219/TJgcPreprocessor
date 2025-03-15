import fs from "node:fs";
import path from "node:path";
import iconv from "iconv-lite";
import jschardet from "jschardet";
import { execSync } from "node:child_process";

import {
  SourceDir,
  OutputDir,
  ClangConfigPath,
  ExtraReplaces,
  FormatBasenames,
  CopyBasenames,
  PrefixContent,
} from "./config";

function readFile(inputPath: string) {
  const data = fs.readFileSync(inputPath);
  const charset = jschardet.detect(data).encoding;
  const content = iconv.decode(data, charset);
  return content.replaceAll("\r\n", "\n");
}

function writeFile(
  outputPath: string,
  content: string,
  { encoding = "gbk", eof = "crlf" } = {}
) {
  if (eof === "crlf") content = content.replaceAll("\n", "\r\n");
  const data = iconv.encode(content, encoding);
  fs.writeFileSync(outputPath, data);
}

function formatCode(code: string, configPath = ClangConfigPath) {
  code = ExtraReplaces.reduce((acc, [pattern, replacement]) => {
    const reg = new RegExp(pattern, "g");
    return acc.replaceAll(reg, replacement);
  }, code);
  return execSync(`clang-format -style=file:${configPath}`, {
    input: code,
    encoding: "utf-8",
  }).toString();
}

function processFile(inputPath: string, outputPath: string) {
  const code = readFile(inputPath);
  writeFile(outputPath, formatCode(code));
}

function processDir(
  inputDir: string,
  outputDir: string,
  maxDepth = 3,
  depth = 0
) {
  if (depth > maxDepth) return;
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.readdirSync(inputDir, { withFileTypes: true }).forEach((dirent) => {
    const { name } = dirent;
    const currentPath = path.join(inputDir, name);
    const outputPath = path.join(outputDir, name);
    if (dirent.isDirectory())
      processDir(currentPath, outputPath, maxDepth, depth + 1);
    else {
      const basename = path.extname(name).slice(1);
      if (FormatBasenames.includes(basename))
        processFile(currentPath, outputPath);
      else if (CopyBasenames.includes(basename))
        fs.copyFileSync(currentPath, outputPath);
    }
  });
}

processDir(SourceDir, OutputDir);
