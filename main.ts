#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import iconv from "iconv-lite";
import jschardet from "jschardet";
import json5 from "json5";
import { program } from "commander";
import { execSync } from "node:child_process";

interface Config {
  /** 额外正则替换 */
  ExtraReplaces: [string, string][];
  /** 需要格式化的文件后缀名 */
  FormatBasenames: string[];
  /** 需要直接复制的文件后缀名 */
  CopyBasenames: string[];
  /** 代码前缀行 */
  PrefixContent: string[];
  /** 是否替换宏定义 */
  ReplaceMacro: true;
}

interface Args {
  outputDir: string;
  depth: string;
  configPath: string;
}

program
  .argument("<sourceDir>")
  .option("-o, --outputDir <outputDir>", "Output directory", "./output")
  .option("-d, --depth <depth>", "Max depth of directories", "3")
  .option(
    "-c, --configPath <configPath>",
    "Config file written in JSON5",
    "tjformat.json5"
  );

program.parse(process.argv);
const options = program.opts() as Args;
const SourceDir = program.args[0];
const OutputDir = options.outputDir;

const clangConfig = json5
  .stringify({
    BasedOnStyle: "GNU",
    AlignEscapedNewlines: "Left",
    AllowAllArgumentsOnNextLine: false,
    AllowAllParametersOfDeclarationOnNextLine: false,
    AllowShortFunctionsOnASingleLine: "None",
    AlwaysBreakAfterDefinitionReturnType: "None",
    BinPackArguments: false,
    BinPackParameters: false,
    BreakBeforeBinaryOperators: "NonAssignment",
    BreakBeforeBraces: "Allman",
    ColumnLimit: 0,
    Cpp11BracedListStyle: true,
    IndentCaseLabels: true,
    IndentWidth: 4,
    SpaceBeforeParens: "ControlStatements",
    Standard: "c++11",
    Language: "Cpp",
    AllowAllConstructorInitializersOnNextLine: false,
    AlwaysBreakAfterReturnType: "None",
    KeepEmptyLinesAtTheStartOfBlocks: false,
    SpacesInParentheses: false,
  })
  .replace(/'/g, "")
  .replace(/([:,])/g, "$1 ");

const {
  ExtraReplaces,
  FormatBasenames,
  CopyBasenames,
  PrefixContent,
  ReplaceMacro,
} = json5.parse(fs.readFileSync(options.configPath, "utf-8")) as Config;

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

function formatCode(code: string) {
  if (ReplaceMacro) {
    const matches = [...code.matchAll(/^#define +([^ \n]+) +(.+)$/gm)]
      .map((line) => ({
        content: line[0],
        name: line[1],
        value: line[2],
      }))
      .reverse();
    code = matches.reduce((acc, { content, name, value }) => {
      const reg = new RegExp(`\\b${name}\\b`, "g");
      return acc.replace(content, "").replaceAll(reg, value);
    }, code);
  }
  code = ExtraReplaces.reduce((acc, [pattern, replacement]) => {
    const reg = new RegExp(pattern, "g");
    return acc.replaceAll(reg, replacement);
  }, code);
  return (
    PrefixContent.join("\n") +
    "\n" +
    execSync(`npx clang-format -style="${clangConfig}"`, {
      input: code,
      encoding: "utf-8",
    }).toString()
  );
}

function processFile(inputPath: string, outputPath: string) {
  console.log(`处理文件 ${path.basename(inputPath)}`);
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
  if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true });
  fs.mkdirSync(outputDir);
  fs.readdirSync(inputDir, { withFileTypes: true }).forEach((dirent) => {
    const { name } = dirent;
    if (name === path.basename(OutputDir)) return;
    const currentPath = path.join(inputDir, name);
    const outputPath = path.join(outputDir, name);
    if (dirent.isDirectory())
      processDir(currentPath, outputPath, maxDepth, depth + 1);
    else {
      const basename = path.extname(name).slice(1);
      if (FormatBasenames.includes(basename))
        processFile(currentPath, outputPath);
      else if (CopyBasenames.includes(basename)) {
        console.log(`复制文件 ${path.basename(currentPath)}`);
        fs.copyFileSync(currentPath, outputPath);
      }
    }
  });
}

processDir(SourceDir, OutputDir, Number(options.depth));
console.log("处理完成。");
