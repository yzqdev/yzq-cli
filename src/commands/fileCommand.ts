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

export class FileCommand extends AbstractCommand {
  public load(program: Command): void {
    let fileCmd = program.command("file").description("文件相关操作");
    fileCmd
      .command("lic")
      .description("添加一个license")
      .addOption(new Option("-l, --license <license>", "license类型").choices(licenses))

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
            pc.red(`输入不合法,请输入-l 加${licenses.join(",")}中的一个!`)
          );
          return;
        }
      });
    fileCmd
      .command("ig")
      .description("添加ignore")
      .addOption(new Option("-l, --lang <lang>", "编程语言名称").choices(ignores))
      .action((item: IgnoreOption) => {
        if (!item.lang) {
          console.log(pc.red("请添加 -l 参数"));
          return;
        }
        createIgnore(item.lang);
      });
  }
}
