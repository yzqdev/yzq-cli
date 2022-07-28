import pc from "picocolors";
import { Command } from "commander";
import { HelpCommand } from "./helpCommand";
import { WordCommand } from "./wordCommand";
import { FileCommand } from "./fileCommand";
import { ConfCommand } from "./confCommand";

export class CommandLoader {
  public static load(program: Command): void {
    new HelpCommand().load(program);
    new WordCommand().load(program);
    new FileCommand().load(program);
    new ConfCommand().load(program)
    this.handleInvalidCommand(program);
  }

  private static handleInvalidCommand(program: Command) {
    program.on("command:*", () => {
      console.error(
        `\n Invalid command: ${pc.red("%s")}`,
        program.args.join(" ")
      );
      console.log(`输入${pc.red("--help")}查看命令  \n`);
      process.exit(1);
    });
  }
}
