const SourceDir = "./source";
const OutputDir = "./output";
const ClangConfigPath = "./scripts/.clang-format";
/** 在运行 clang-format 前执行的替换；正则会自动添加 `g` 标志 */
const ExtraReplaces: [RegExp, string][] = [
  [/\\\n/, ""], // 处理续行符
  [/((\/\/.*)?\n)?\s*(>>|<<)/, " $3 "], // 处理 <</>> 前额外折行
  [/(?<!\/\/.*)(>>|<<)\s*\n/, " $1 "], // 处理 <</>> 后额外折行
  [/(?<!\/\/.*(>>|<<).*)\/\/.*\n/, ""], // 处理 <</>> 后单行注释
];
/** 处理的文件后缀名 */
const FormatBasenames: string[] = ["cpp", "c", "h"];
/** 直接复制的文件后缀名 */
const CopyBasenames: string[] = [];
/** 需要在文件开头添加的内容 */
const PrefixContent: string[] = [`/* 2453999 电信 张三 */`];

export {
  SourceDir,
  OutputDir,
  ClangConfigPath,
  ExtraReplaces,
  FormatBasenames,
  CopyBasenames,
  PrefixContent,
};
