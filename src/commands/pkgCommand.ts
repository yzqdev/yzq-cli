import { Command } from "commander";
import pc from "picocolors";
import compressing from "compressing";
import { AbstractCommand } from "./abstractCommand";
import { vendorFile } from "@/util/fileUtil";

export class PkgCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("pkg")
      .description("解压yarn3到当前目录")
      .addHelpText("after", "例子: yzq pkg")
      .action(async () => {
        try {
          const yarn3 = vendorFile("yarn3.zip", "zip");
          await compressing.zip.uncompress(yarn3, process.cwd());
          console.log(pc.cyan("解压完成,yarn3已经就绪"));
        } catch (e) {
          console.log(
            pc.red(`解压失败: ${e instanceof Error ? e.message : e}`),
          );
        }
      });
  }
}
