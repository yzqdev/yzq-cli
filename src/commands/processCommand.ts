import { Command } from "commander";
import pc from "picocolors";
import { AbstractCommand } from "./abstractCommand";
import {
  getProcessList,
  getProcessDetail,
  killProcess,
  getPortInfo,
  formatProcessInfo,
  formatPortInfo,
} from "@/util/processUtil";

export class ProcessCommand extends AbstractCommand {
  public load(program: Command): void {
    const processCmd = program
      .command("process")
      .alias("proc")
      .description("进程相关工具");

    processCmd
      .command("list")
      .alias("ls")
      .description("查看进程列表")
      .option("-n, --name <name>", "按名称过滤")
      .option("-p, --pid <pid>", "按 PID 过滤")
      .action((opts) => {
        try {
          let processes = getProcessList();

          if (opts.name) {
            processes = processes.filter((p) =>
              p.name.toLowerCase().includes(opts.name.toLowerCase()),
            );
          }

          if (opts.pid) {
            processes = processes.filter((p) => p.pid === parseInt(opts.pid));
          }

          if (processes.length === 0) {
            console.log(pc.yellow("未找到匹配的进程"));
            return;
          }

          console.log(pc.green(`找到 ${processes.length} 个进程:\n`));

          // 按内存使用排序
          processes.sort((a, b) => b.memory - a.memory);

          processes.forEach((proc) => {
            console.log(formatProcessInfo(proc));
          });
        } catch (error) {
          console.log(
            pc.red(
              `获取进程列表失败: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });

    processCmd
      .command("detail")
      .description("查看进程详情")
      .argument("<pid>", "进程 ID")
      .action((pid) => {
        try {
          const processInfo = getProcessDetail(parseInt(pid));

          if (!processInfo) {
            console.log(pc.yellow(`未找到 PID 为 ${pid} 的进程`));
            return;
          }

          console.log(pc.green("进程详情:\n"));
          console.log(pc.cyan(`  PID: ${processInfo.pid}`));
          console.log(pc.cyan(`  名称: ${processInfo.name}`));
          console.log(pc.cyan(`  状态: ${processInfo.status}`));
          console.log(pc.cyan(`  CPU: ${processInfo.cpu}%`));
          console.log(
            pc.cyan(`  内存: ${(processInfo.memory / 1024).toFixed(2)} MB`),
          );
          if (processInfo.command) {
            console.log(pc.cyan(`  命令: ${processInfo.command}`));
          }
        } catch (error) {
          console.log(
            pc.red(
              `获取进程详情失败: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });

    processCmd
      .command("kill")
      .description("结束进程")
      .argument("<pid>", "进程 ID")
      .option("-f, --force", "强制结束")
      .action((pid, opts) => {
        try {
          const success = killProcess(parseInt(pid), opts.force);

          if (success) {
            console.log(
              pc.green(`✓ 进程 ${pid} 已${opts.force ? "强制" : ""}结束`),
            );
          } else {
            console.log(pc.red(`✗ 结束进程 ${pid} 失败`));
          }
        } catch (error) {
          console.log(
            pc.red(
              `结束进程失败: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });

    processCmd
      .command("port")
      .description("查看端口占用")
      .argument("<port>", "端口号")
      .action((port) => {
        try {
          const portInfo = getPortInfo(parseInt(port));

          if (!portInfo) {
            console.log(pc.green(`端口 ${port} 未被占用`));
            return;
          }

          console.log(pc.yellow(`端口 ${port} 被占用:`));
          console.log(formatPortInfo(portInfo));
        } catch (error) {
          console.log(
            pc.red(
              `查询端口占用失败: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });
  }
}
