#!/usr/bin/env node
import * as commander from "commander";

import { CommandLoader } from "./commands/loader";
import { version } from "../package.json"; // assert { type: "json" };
/**
 * 初始
 */
function bootstrap() {
  const program = new commander.Command();
  program.name("yzq");
  program
    .version(version, "-v, --version", "当前版本.")
    .usage("<command> [options]")
    .helpOption("-h, --help", "如何使用");
  CommandLoader.load(program);
  program.parse(process.argv);
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

bootstrap();
