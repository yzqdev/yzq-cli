import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index"],
  alias: {
    "@": "./src",
  },
  sourcemap: false,
  minify: false,
  dts: false,
  format: ["esm"],
  clean: true,
});
