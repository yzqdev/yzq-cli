import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/"],
  splitting: false,
  sourcemap: false,
  minify: false,
  dts: false,
  format:['esm','cjs'],
  clean: true,
});
