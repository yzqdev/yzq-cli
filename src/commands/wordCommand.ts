import got from "got";
import { Command } from "commander";
import pc from "picocolors";
import { AbstractCommand } from "./abstractCommand";
import { Poetry } from "@/interfaces/word";

export class WordCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("word")
      .description("获取诗词")
      .addHelpText("after", "例子: yzq word ")
      .action(async () => {
        let res: Poetry = await got(
          "https://v1.jinrishici.com/all.json"
        ).json();
        console.log(pc.cyan(res.content));
      });
  }
}
