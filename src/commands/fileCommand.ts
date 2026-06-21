import { createIgnore, createLicense } from "@/action/fileAction";
import {
  IgnoreOption,
  ignores,
  LicenseOption,
  licenses,
  opensourceUrl,
} from "@/interfaces/option";
import { Command, Option } from "commander";
import open from "open";
import pc from "picocolors";
import { AbstractCommand } from "./abstractCommand";
import {
  getFileInfo,
  formatFileSize,
  compareFiles,
  findFiles,
  findFilesByExtension,
  findLargeFiles,
  findRecentFiles,
  findDuplicateFiles,
  getFileTypeStats,
  batchRenameFiles,
  touchFile,
  getFilePermissions,
  calculateFileHash,
  readFileHead,
  readFileTail,
  countLines,
  searchInFile,
  findEmptyFiles,
  findHiddenFiles,
  getDirectorySize,
  exists,
  readFile,
  copyFile,
  moveFile,
  deleteFile,
  writeFile,
  getExtension,
  getFileNameWithoutExt,
} from "@/util/fileUtil";

export class FileCommand extends AbstractCommand {
  public load(program: Command): void {
    const fileCmd = program.command("file").description("文件相关操作");

    fileCmd
      .command("lic")
      .description("添加一个license")
      .addOption(
        new Option("-l, --license <license>", "license类型").choices(licenses),
      )
      .option("-o, --open", "查看协议类型")
      .action((item: LicenseOption) => {
        if (item.open) {
          open(opensourceUrl);
          return;
        }
        if (licenses.includes(item.license)) {
          createLicense(item.license);
        } else {
          console.log(
            pc.red(`输入不合法,请输入-l 加${licenses.join(",")}中的一个!`),
          );
          return;
        }
      });

    fileCmd
      .command("ig")
      .description("添加ignore")
      .addOption(
        new Option("-l, --lang <lang>", "编程语言名称").choices(ignores),
      )
      .action((item: IgnoreOption) => {
        if (!item.lang) {
          console.log(pc.red("请添加 -l 参数"));
          return;
        }
        createIgnore(item.lang);
      });

    fileCmd
      .command("info")
      .description("查看文件详细信息")
      .argument("<file>", "文件路径")
      .action((file) => {
        const info = getFileInfo(file);
        if (!info) {
          console.log(pc.red(`文件不存在或无法访问: ${file}`));
          return;
        }

        console.log(pc.green("文件信息:\n"));
        console.log(pc.cyan(`  名称: ${info.name}`));
        console.log(pc.cyan(`  路径: ${info.path}`));
        console.log(pc.cyan(`  大小: ${formatFileSize(info.size)}`));
        console.log(pc.cyan(`  类型: ${info.isFile ? "文件" : "目录"}`));
        console.log(pc.cyan(`  创建时间: ${info.created.toLocaleString()}`));
        console.log(pc.cyan(`  修改时间: ${info.modified.toLocaleString()}`));
        console.log(pc.cyan(`  访问时间: ${info.accessed.toLocaleString()}`));
        console.log(pc.cyan(`  权限: ${info.permissions}`));
      });

    fileCmd
      .command("find")
      .description("查找文件")
      .argument("[dir]", "搜索目录", ".")
      .option("-p, --pattern <pattern>", "文件名模式（支持 * 和 ?）")
      .option("-e, --ext <ext>", "按扩展名查找")
      .option("-r, --recent <days>", "查找最近N天修改的文件")
      .option("-s, --size <size>", "查找大于指定大小的文件（字节）")
      .action((dir, opts) => {
        let files: string[] = [];

        if (opts.pattern) {
          files = findFiles(dir, opts.pattern);
        } else if (opts.ext) {
          files = findFilesByExtension(dir, opts.ext);
        } else if (opts.recent) {
          files = findRecentFiles(dir, parseInt(opts.recent));
        } else if (opts.size) {
          files = findLargeFiles(dir, parseInt(opts.size));
        } else {
          console.log(pc.red("请指定搜索条件: -p, -e, -r 或 -s"));
          return;
        }

        if (files.length === 0) {
          console.log(pc.yellow("未找到匹配的文件"));
          return;
        }

        console.log(pc.green(`找到 ${files.length} 个文件:\n`));
        files.forEach((file) => {
          const info = getFileInfo(file);
          if (info) {
            console.log(`${info.name} (${formatFileSize(info.size)})`);
          }
        });
      });

    fileCmd
      .command("compare")
      .description("比较两个文件是否相同")
      .argument("<file1>", "文件1路径")
      .argument("<file2>", "文件2路径")
      .action((file1, file2) => {
        if (!exists(file1)) {
          console.log(pc.red(`文件不存在: ${file1}`));
          return;
        }

        if (!exists(file2)) {
          console.log(pc.red(`文件不存在: ${file2}`));
          return;
        }

        const isSame = compareFiles(file1, file2);
        if (isSame) {
          console.log(pc.green("✓ 两个文件内容相同"));
        } else {
          console.log(pc.red("✗ 两个文件内容不同"));
        }
      });

    fileCmd
      .command("hash")
      .description("计算文件哈希")
      .argument("<file>", "文件路径")
      .option("-a, --algorithm <algo>", "哈希算法", "md5")
      .action((file, opts) => {
        if (!exists(file)) {
          console.log(pc.red(`文件不存在: ${file}`));
          return;
        }

        const hash = calculateFileHash(file, opts.algorithm);
        if (hash) {
          console.log(pc.green(`${opts.algorithm.toUpperCase()}: ${hash}`));
        } else {
          console.log(pc.red("计算哈希失败"));
        }
      });

    fileCmd
      .command("duplicate")
      .description("查找重复文件")
      .argument("[dir]", "搜索目录", ".")
      .action((dir) => {
        console.log(pc.cyan("正在查找重复文件..."));
        const duplicates = findDuplicateFiles(dir);

        if (duplicates.size === 0) {
          console.log(pc.green("未找到重复文件"));
          return;
        }

        console.log(pc.yellow(`找到 ${duplicates.size} 组重复文件:\n`));
        let groupIndex = 1;

        for (const [hash, files] of duplicates) {
          console.log(pc.cyan(`组 ${groupIndex++} (MD5: ${hash}):`));
          files.forEach((file) => {
            const info = getFileInfo(file);
            if (info) {
              console.log(`  ${info.name} (${formatFileSize(info.size)})`);
            }
          });
          console.log("");
        }
      });

    fileCmd
      .command("types")
      .description("统计文件类型")
      .argument("[dir]", "统计目录", ".")
      .action((dir) => {
        console.log(pc.cyan("正在统计文件类型..."));
        const stats = getFileTypeStats(dir);

        if (Object.keys(stats).length === 0) {
          console.log(pc.yellow("目录为空"));
          return;
        }

        console.log(pc.green("文件类型统计:\n"));

        // 按数量排序
        const sorted = Object.entries(stats).sort(
          (a, b) => b[1].count - a[1].count,
        );

        sorted.forEach(([ext, stat]) => {
          console.log(
            `${pc.cyan(ext.padEnd(15))} ${String(stat.count).padStart(5)} 个文件  ${formatFileSize(stat.size).padStart(10)}`,
          );
        });
      });

    fileCmd
      .command("rename")
      .description("批量重命名文件")
      .argument("[dir]", "目标目录", ".")
      .option("-p, --pattern <pattern>", "查找模式（正则表达式）")
      .option("-r, --replacement <replacement>", "替换字符串")
      .option("-n, --dry-run", "预览模式，不实际重命名")
      .action((dir, opts) => {
        if (!opts.pattern || opts.replacement === undefined) {
          console.log(pc.red("请指定 -p 和 -r 参数"));
          return;
        }

        try {
          const regex = new RegExp(opts.pattern);

          if (opts.dryRun) {
            console.log(pc.cyan("预览模式:"));
            const count = batchRenameFiles(dir, regex, opts.replacement);
            console.log(pc.green(`将重命名 ${count} 个文件`));
          } else {
            const count = batchRenameFiles(dir, regex, opts.replacement);
            console.log(pc.green(`✓ 已重命名 ${count} 个文件`));
          }
        } catch (error) {
          console.log(
            pc.red(
              `正则表达式错误: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });

    fileCmd
      .command("touch")
      .description("创建文件或更新时间戳")
      .argument("<file>", "文件路径")
      .option("-t, --time <timestamp>", "时间戳（毫秒）")
      .action((file, opts) => {
        const timestamp = opts.time ? parseInt(opts.time) : undefined;
        const success = touchFile(file, timestamp);

        if (success) {
          console.log(pc.green(`✓ 已更新文件时间戳: ${file}`));
        } else {
          console.log(pc.red(`更新时间戳失败: ${file}`));
        }
      });

    fileCmd
      .command("perm")
      .description("查看文件权限")
      .argument("<file>", "文件路径")
      .action((file) => {
        if (!exists(file)) {
          console.log(pc.red(`文件不存在: ${file}`));
          return;
        }

        const perms = getFilePermissions(file);
        if (perms) {
          console.log(pc.green(`文件权限: ${file}\n`));
          console.log(pc.cyan(`  可读: ${perms.readable ? "✓" : "✗"}`));
          console.log(pc.cyan(`  可写: ${perms.writable ? "✓" : "✗"}`));
          console.log(pc.cyan(`  可执行: ${perms.executable ? "✓" : "✗"}`));
        } else {
          console.log(pc.red("获取权限信息失败"));
        }
      });

    fileCmd
      .command("head")
      .description("读取文件前N行")
      .argument("<file>", "文件路径")
      .option("-n, --lines <lines>", "行数", "10")
      .action((file, opts) => {
        const content = readFileHead(file, parseInt(opts.lines));
        if (content !== null) {
          console.log(content);
        } else {
          console.log(pc.red(`读取文件失败: ${file}`));
        }
      });

    fileCmd
      .command("tail")
      .description("读取文件后N行")
      .argument("<file>", "文件路径")
      .option("-n, --lines <lines>", "行数", "10")
      .action((file, opts) => {
        const content = readFileTail(file, parseInt(opts.lines));
        if (content !== null) {
          console.log(content);
        } else {
          console.log(pc.red(`读取文件失败: ${file}`));
        }
      });

    fileCmd
      .command("lines")
      .description("统计文件行数")
      .argument("<file>", "文件路径")
      .action((file) => {
        const count = countLines(file);
        if (count > 0) {
          console.log(pc.green(`文件行数: ${count}`));
        } else {
          console.log(pc.red(`读取文件失败或文件为空: ${file}`));
        }
      });

    fileCmd
      .command("search")
      .description("在文件中搜索内容")
      .argument("<file>", "文件路径")
      .argument("<keyword>", "搜索关键词")
      .option("-i, --ignore-case", "忽略大小写")
      .action((file, keyword, opts) => {
        const matches = searchInFile(file, keyword, opts.ignoreCase);

        if (matches.length === 0) {
          console.log(pc.yellow("未找到匹配内容"));
          return;
        }

        console.log(pc.green(`找到 ${matches.length} 个匹配:\n`));
        matches.forEach((line, index) => {
          console.log(`${pc.cyan(`${index + 1}:`)} ${line}`);
        });
      });

    fileCmd
      .command("empty")
      .description("查找空文件")
      .argument("[dir]", "搜索目录", ".")
      .action((dir) => {
        const files = findEmptyFiles(dir);

        if (files.length === 0) {
          console.log(pc.green("未找到空文件"));
          return;
        }

        console.log(pc.green(`找到 ${files.length} 个空文件:\n`));
        files.forEach((file) => {
          console.log(file);
        });
      });

    fileCmd
      .command("hidden")
      .description("查找隐藏文件")
      .argument("[dir]", "搜索目录", ".")
      .action((dir) => {
        const files = findHiddenFiles(dir);

        if (files.length === 0) {
          console.log(pc.green("未找到隐藏文件"));
          return;
        }

        console.log(pc.green(`找到 ${files.length} 个隐藏文件:\n`));
        files.forEach((file) => {
          console.log(file);
        });
      });

    fileCmd
      .command("size")
      .description("统计目录大小")
      .argument("[dir]", "目录路径", ".")
      .action((dir) => {
        const size = getDirectorySize(dir);
        console.log(pc.green(`目录大小: ${formatFileSize(size)}`));
      });

    fileCmd
      .command("copy")
      .description("复制文件")
      .argument("<src>", "源文件路径")
      .argument("<dest>", "目标文件路径")
      .action((src, dest) => {
        if (!exists(src)) {
          console.log(pc.red(`源文件不存在: ${src}`));
          return;
        }

        const success = copyFile(src, dest);
        if (success) {
          console.log(pc.green(`✓ 已复制: ${src} -> ${dest}`));
        } else {
          console.log(pc.red("复制失败"));
        }
      });

    fileCmd
      .command("move")
      .description("移动文件")
      .argument("<src>", "源文件路径")
      .argument("<dest>", "目标文件路径")
      .action((src, dest) => {
        if (!exists(src)) {
          console.log(pc.red(`源文件不存在: ${src}`));
          return;
        }

        const success = moveFile(src, dest);
        if (success) {
          console.log(pc.green(`✓ 已移动: ${src} -> ${dest}`));
        } else {
          console.log(pc.red("移动失败"));
        }
      });

    fileCmd
      .command("rm")
      .description("删除文件")
      .argument("<file>", "文件路径")
      .action((file) => {
        if (!exists(file)) {
          console.log(pc.red(`文件不存在: ${file}`));
          return;
        }

        const success = deleteFile(file);
        if (success) {
          console.log(pc.green(`✓ 已删除: ${file}`));
        } else {
          console.log(pc.red("删除失败"));
        }
      });

    fileCmd
      .command("cat")
      .description("查看文件内容")
      .argument("<file>", "文件路径")
      .option("-n, --number", "显示行号")
      .action((file, opts) => {
        const content = readFile(file);
        if (content === null) {
          console.log(pc.red(`读取文件失败: ${file}`));
          return;
        }

        if (opts.number) {
          const lines = content.split("\n");
          lines.forEach((line, index) => {
            console.log(`${pc.cyan(`${index + 1}:`)} ${line}`);
          });
        } else {
          console.log(content);
        }
      });

    fileCmd
      .command("write")
      .description("写入文件内容")
      .argument("<file>", "文件路径")
      .argument("<content>", "文件内容")
      .option("-a, --append", "追加模式")
      .action((file, content, opts) => {
        const success = writeFile(file, content, opts.append);
        if (success) {
          console.log(pc.green(`✓ 已写入: ${file}`));
        } else {
          console.log(pc.red("写入失败"));
        }
      });

    fileCmd
      .command("ext")
      .description("获取文件扩展名")
      .argument("<file>", "文件路径")
      .action((file) => {
        const ext = getExtension(file);
        if (ext) {
          console.log(pc.green(`扩展名: ${ext}`));
        } else {
          console.log(pc.yellow("文件没有扩展名"));
        }
      });

    fileCmd
      .command("name")
      .description("获取文件名（不含扩展名）")
      .argument("<file>", "文件路径")
      .action((file) => {
        const name = getFileNameWithoutExt(file);
        console.log(pc.green(`文件名: ${name}`));
      });
  }
}
