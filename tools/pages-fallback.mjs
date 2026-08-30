import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dir = join("dist", "turbo-store", "browser");
await copyFile(join(dir, "index.html"), join(dir, "404.html"));
await writeFile(join(dir, ".nojekyll"), "");
console.log("Wrote 404.html and .nojekyll");
