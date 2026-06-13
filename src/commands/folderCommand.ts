import { Command } from "commander";
import pc from "picocolors";
import compressing from "compressing";
import fs from "node:fs"
import path from 'node:path'
import ora from "ora"
import { AbstractCommand } from "./abstractCommand";
import {
  printCleanResult,
  printDirSize,
  printEmptyDirs,
  showTree,
} from "@/action/folderAction";

export class FolderCommand extends AbstractCommand {
  public load(program: Command): void {
    const folderCmd = program.command("folder").description("文件夹相关操作");

    folderCmd
      .command("tree")
      .description("展示目录树结构")
      .option("-d, --dir <dir>", "目标目录", ".")
      .action((opts) => {
        showTree(opts.dir);
      });

    folderCmd
      .command("size")
      .description("计算文件夹大小")
      .option("-d, --dir <dir>", "目标目录", ".")
      .action((opts) => {
        printDirSize(opts.dir);
      });

    folderCmd
      .command("empty")
      .description("查找空文件夹")
      .option("-d, --dir <dir>", "目标目录", ".")
      .action((opts) => {
        printEmptyDirs(opts.dir);
      });

    folderCmd
      .command("clean")
      .description("清理无用文件 (node_modules, .DS_Store, .cache 等)")
      .option("-d, --dir <dir>", "目标目录", ".")
      .option("-n, --dry-run", "预览模式，不实际删除")
      .action((opts) => {
        printCleanResult(opts.dir, !!opts.dryRun);
      });

      folderCmd
          .command("zip")
          .description("压缩文件夹")
          .argument("<source>", "源文件夹路径")
          .option("-o, --output <output>", "输出压缩包路径 (默认: 源文件夹同名.zip)")
          .action(async (source, opts) => {
              // 1. 将相对路径统一转换为绝对路径，避免相对路径计算错误
              const absoluteSource = path.resolve(process.cwd(), source);

              // 2. 基础校验：判断源文件夹是否存在
              if (!fs.existsSync(absoluteSource)) {
                  console.log(pc.red(`❌ 错误: 源路径不存在 -> "${source}"`));
                  return;
              }

              const stats = fs.statSync(absoluteSource);
              if (!stats.isDirectory()) {
                  console.log(pc.red(`❌ 错误: 源路径不是一个文件夹 -> "${source}"`));
                  return;
              }

              // 3. 智能推导输出路径
              // 即使输入 . 或 ./，也能正确拿到当前文件夹的真实名称
              const folderName = path.basename(absoluteSource);
              const defaultOutput = path.join(path.dirname(absoluteSource), `${folderName}.zip`);
              const absoluteOutput = opts.output ? path.resolve(process.cwd(), opts.output) : defaultOutput;

              // 4. 使用 ora 开启炫酷的 Loading 动画
              const spinner = ora(`正在压缩文件夹: ${pc.yellow(folderName)} ...`).start();

              try {
                  // 执行压缩
                  await compressing.zip.compressDir(absoluteSource, absoluteOutput);

                  // 成功提示
                  spinner.succeed(pc.cyan(`压缩成功! 已保存至: ${pc.bold(absoluteOutput)}`));
              } catch (e) {
                  // 失败提示
                  spinner.fail(pc.red(`压缩失败!`));
                  console.error(pc.red(`原因: ${e instanceof Error ? e.message : String(e)}`));
              }
          });

    folderCmd
      .command("unzip")
      .description("解压文件")
      .argument("<source>", "压缩文件路径")
      .option("-o, --output <output>", "输出目录")
      .action(async (source, opts) => {
        try {
          const output = opts.output || source.replace(/\.(zip|tar|gz)$/, "");
          await compressing.zip.uncompress(source, output);
          console.log(pc.cyan(`解压成功: ${output}`));
        } catch (e) {
          console.log(
            pc.red(`解压失败: ${e instanceof Error ? e.message : e}`),
          );
        }
      });
  }
}
