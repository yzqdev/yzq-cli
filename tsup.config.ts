import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/"],
  splitting: true,
  sourcemap: false,
  minify: true,
  dts: false,
  format:"esm",
  clean: true,
});
