import axios from "axios";
import { Command } from "commander";
import pc from "picocolors";
import { AbstractCommand } from "./abstractCommand";
import { Poetry } from "@/interfaces/word";

export class WordCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("word")
      .description("获取诗词")
      .addHelpText("after", "例子: yzq word")
      .action(async () => {
        try {
          const res = await axios.get<Poetry>(
            "https://v1.jinrishici.com/all.json",
          );
          console.log(pc.cyan(res.data.content));
        } catch {
          console.log(pc.red("获取诗词失败,请检查网络连接"));
        }
      });
  }
}
