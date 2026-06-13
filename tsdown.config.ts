import {defineConfig} from "tsdown";

export default defineConfig({
    entry: ["src/index"],
    alias: {
        "@": "./src",
    },
    sourcemap: false,
    minify: false,
    target: "es2020",
    dts: false,
    format: ["esm"],
    clean: true,
});
