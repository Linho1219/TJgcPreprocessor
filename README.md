# TJgcPreprocessor

如果需要直接开始，请转到 [快速开始](#快速开始)。

> [!warning]
>
> 此项目由于 Node.js 的执行效率问题，已使用 Powershell 脚本重写并合入 [TJGCWorkbench](https://github.com/Linho1219/TJGCWorkbench)，故现停止维护。

> [!caution]
>
> 不保证本项目输出结果一定符合要求。请自行检查输出结果。使用本项目直接或间接导致失分的，项目作者概不负责。

## 简介

根据同济高级语言程序设计课程特化的代码格式化工具。功能包括：

- 检测源码编码，将其转换为 GBK
- 处理行尾，将其转换为 CRLF
- 按要求处理换行（包括花括号前换行、每行一句等）

同时可以配置：

- 输入输出路径
- 进行处理的文件扩展名
- 直接复制到输出到文件扩展名
- 在文件开头加入指定内容（学号姓名等）

使用 JSON5 书写配置文件。配置文件路径可以自定义。

## 快速开始

确保你已安装 Node.js。你可以在控制台输入 `node -v` 检查，如果输出版本号则表明成功安装。

执行下面命令：

```sh
npm i
npm tsc
npm i . -g
```

现在，你可以在任何地方使用它了：

```sh
tjformat -h
```

输出

```
Usage: main [options] <sourceDir>

Options:
  -o, --outputDir <outputDir>    Output directory (default: "./output")
  -d, --depth <depth>            Max depth of directories (default: "3")
  -c, --configPath <configPath>  Config file written in JSON5 (default: "tjformat.json5")
  -h, --help                     display help for command
```

**必须提供**一个以 JSON5 格式书写的配置文件。定义为：

```ts
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
```

例如：

```json5
{
  ExtraReplaces: [
    ["\\\\\\n/", ""], // 处理续行符
    ["((\\/\\/.*)?\\n)?\\s*(>>|<<)/", " $3 "], // 处理 <</>> 前额外折行
    ["(?<!\\/\\/.*)(>>|<<)\\s*\\n/", " $1 "], // 处理 <</>> 后额外折行
    ["(?<!\\/\\/.*(>>|<<).*)\\/\\/.*\\n/", ""], // 处理 <</>> 后单行注释
  ],
  FormatBasenames: ["cpp", "c", "h"],
  CopyBasenames: [],
  PrefixContent: ["/* 2459999 电信 张三 */"],
  ReplaceMacro: true,
}
```

假设将其存放在 `tjconfig.json5`，则可以使用：

```sh
tjformat .
```

格式化当前目录下的源文件。

完整命令示例：

```sh
tjformat ./source -o ./out -c config.json5 -d 5
```

> [!tip]
>
> 如果你觉得慢，那没办法，Node 是这样的。
