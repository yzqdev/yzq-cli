import { defineBuildConfig } from "unbuild";
import { URL, fileURLToPath } from "url";

export default defineBuildConfig({
  entries: ["./src/index"],
  // entries: ["src/"],
  alias: {
    "@":fileURLToPath(new URL("./src",import.meta.url))
  },
  rollup: {
    emitCJS: false,
    inlineDependencies:true,
  },
  clean: true,
  declaration: false,
  failOnWarn:false
});
