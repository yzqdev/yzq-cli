import { copy, vendorFile } from "@/util/fileUtil";
import { Command } from "commander";
import pc from 'picocolors'
import { AbstractCommand } from "./abstractCommand";
export type pm2Type = "java" | "node" | "go";
export interface Pm2Option {
  lang: pm2Type;
}
export class ConfCommand extends AbstractCommand {
  public load(program: Command): void {
    let confCommand = program.command("conf").description("配置文件");
    confCommand
      .command("pm2")
      .description("pm2配置文件")
      .option("-l, --lang <lang>")
      .action((option: Pm2Option) => {
        if (option.lang) {
          switch (option.lang) {
            case "java":
              copy(vendorFile("blog.json", "pm2"), "blog.json");
              break;
            case "node":
              copy(vendorFile("node.json", "pm2"), "node.json");
              break;
            default:
                copy(vendorFile("go.json", "pm2"), "go.json");
              break;
          }
          console.log(pc.cyan(`生成pm2配置文件${option.lang}.json成功`))
        }
      });
  }
}
