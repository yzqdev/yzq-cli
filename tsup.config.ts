import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/"],
  splitting: false,
  sourcemap: false,
  minify: true,
  dts: true,
  format:"esm",
  clean: true,
});
