import {Command} from "commander";
import pc from "picocolors";
import compressing from 'compressing'
import {AbstractCommand} from "./abstractCommand";
import {  vendorFile} from "@/util/fileUtil";

export class PkgCommand extends AbstractCommand {
    public load(program: Command): void {
        program
            .command("pkg")
            .description("获取诗词")
            .addHelpText("after", "例子: yzq word ")
            .action(async () => {
                try {
                   let yarn3=  vendorFile("yarn3.zip", "zip")
                    await compressing.zip.uncompress(yarn3, process.cwd())

                } catch (e) {
                    console.log(pc.red(e.toString()))
                }
            });
    }
}
