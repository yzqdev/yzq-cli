import { Command } from "commander";
import pc from "picocolors";
import { AbstractCommand } from "./abstractCommand";
import {
  getEnv,
  setEnv,
  unsetEnv,
  hasEnv,
  getAllEnv,
  searchEnv,
  formatEnvVar,
  getPath,
  addToPath,
  getPlatformEnv,
} from "@/util/envUtil";

export class EnvCommand extends AbstractCommand {
  public load(program: Command): void {
    const envCmd = program.command("env").description("环境变量相关工具");

    envCmd
      .command("get")
      .description("获取环境变量")
      .argument("[name]", "变量名（不指定则显示所有）")
      .option("-s, --search <keyword>", "搜索关键词")
      .action((name, opts) => {
        if (opts.search) {
          const results = searchEnv(opts.search);
          if (results.length === 0) {
            console.log(pc.yellow(`未找到包含 "${opts.search}" 的环境变量`));
            return;
          }

          console.log(pc.green(`找到 ${results.length} 个匹配的环境变量:\n`));
          results.forEach((env) => {
            console.log(formatEnvVar(env.name, env.value));
          });
          return;
        }

        if (!name) {
          const envVars = getAllEnv();
          const keys = Object.keys(envVars).sort();

          console.log(pc.green(`所有环境变量 (${keys.length} 个):\n`));
          keys.forEach((key) => {
            console.log(formatEnvVar(key, envVars[key]));
          });
          return;
        }

        const value = getEnv(name);
        if (value === undefined) {
          console.log(pc.yellow(`环境变量 ${name} 不存在`));
          return;
        }

        console.log(pc.green(`${name}=${value}`));
      });

    envCmd
      .command("set")
      .description("设置环境变量（仅当前进程）")
      .argument("<name>", "变量名")
      .argument("<value>", "变量值")
      .action((name, value) => {
        setEnv(name, value);
        console.log(pc.green(`✓ 已设置 ${name}=${value}`));
      });

    envCmd
      .command("unset")
      .description("删除环境变量（仅当前进程）")
      .argument("<name>", "变量名")
      .action((name) => {
        if (!hasEnv(name)) {
          console.log(pc.yellow(`环境变量 ${name} 不存在`));
          return;
        }

        unsetEnv(name);
        console.log(pc.green(`✓ 已删除环境变量 ${name}`));
      });

    envCmd
      .command("has")
      .description("检查环境变量是否存在")
      .argument("<name>", "变量名")
      .action((name) => {
        const exists = hasEnv(name);
        if (exists) {
          console.log(pc.green(`✓ 环境变量 ${name} 存在`));
        } else {
          console.log(pc.red(`✗ 环境变量 ${name} 不存在`));
        }
      });

    envCmd
      .command("path")
      .description("查看或修改 PATH")
      .option("-a, --add <path>", "添加路径到 PATH")
      .action((opts) => {
        if (opts.add) {
          addToPath(opts.add);
          console.log(pc.green(`✓ 已添加 ${opts.add} 到 PATH`));
          return;
        }

        const pathValue = getPath();
        if (pathValue) {
          console.log(pc.green("PATH:"));
          const paths = pathValue.split(
            process.platform === "win32" ? ";" : ":",
          );
          paths.forEach((p, i) => {
            console.log(pc.cyan(`  ${i + 1}. ${p}`));
          });
        } else {
          console.log(pc.red("未找到 PATH 环境变量"));
        }
      });

    envCmd
      .command("platform")
      .description("查看平台相关环境变量")
      .action(() => {
        const platformEnv = getPlatformEnv();
        console.log(pc.green("平台环境变量:\n"));
        console.log(pc.cyan(`  平台: ${platformEnv.platform}`));
        console.log(pc.cyan(`  架构: ${platformEnv.arch}`));
        console.log(pc.cyan(`  主目录: ${platformEnv.home || "未设置"}`));
        console.log(pc.cyan(`  临时目录: ${platformEnv.temp || "未设置"}`));
        console.log(pc.cyan(`  Shell: ${platformEnv.shell || "未设置"}`));
      });

    envCmd
      .command("search")
      .description("搜索环境变量")
      .argument("<keyword>", "搜索关键词")
      .action((keyword) => {
        const results = searchEnv(keyword);
        if (results.length === 0) {
          console.log(pc.yellow(`未找到包含 "${keyword}" 的环境变量`));
          return;
        }

        console.log(pc.green(`找到 ${results.length} 个匹配的环境变量:\n`));
        results.forEach((env) => {
          console.log(formatEnvVar(env.name, env.value));
        });
      });
  }
}
