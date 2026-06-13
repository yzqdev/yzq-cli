import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";

export function showTree(dir: string, prefix = "") {
  if (!fs.existsSync(dir)) {
    console.log(pc.red(`目录不存在: ${dir}`));
    return;
  }
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    console.log(pc.cyan(path.basename(dir)));
    return;
  }

  const entries = fs.readdirSync(dir).filter((e) => !e.startsWith("."));
  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";
    const fullPath = path.join(dir, entry);
    const isDir = fs.statSync(fullPath).isDirectory();

    console.log(`${prefix}${connector}${isDir ? pc.blue(entry) : entry}`);
    if (isDir) {
      showTree(fullPath, prefix + childPrefix);
    }
  });
}

interface DirStats {
  size: number;
  files: number;
  dirs: number;
}

function collectDirStats(dir: string): DirStats {
  const stats: DirStats = { size: 0, files: 0, dirs: 0 };
  if (!fs.existsSync(dir)) return stats;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    stats.size = stat.size;
    stats.files = 1;
    return stats;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const s = fs.statSync(fullPath);
    if (s.isDirectory()) {
      stats.dirs++;
      const child = collectDirStats(fullPath);
      stats.size += child.size;
      stats.files += child.files;
      stats.dirs += child.dirs;
    } else {
      stats.size += s.size;
      stats.files++;
    }
  }
  return stats;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function padStr(str: string, len: number): string {
  const visibleLen = str.replace(/\x1B\[[0-9;]*m/g, "").length;
  return str + " ".repeat(Math.max(0, len - visibleLen));
}

export function printDirSize(dir: string) {
  const start = performance.now();
  const stats = collectDirStats(dir);
  const elapsed = (performance.now() - start).toFixed(0);
  const resolved = path.resolve(dir);

  const label = "  路径: ";
  const sizeLabel = "  大小: ";
  const filesLabel = "  文件: ";
  const dirsLabel = "  目录: ";
  const timeLabel = "  耗时: ";
  const labelLen = 9;

  const w = 44;
  const line = pc.gray("─".repeat(w));
  console.log(`\n${line}`);
  console.log(`${pc.bold(pc.cyan("  📁  目录信息"))}`);
  console.log(line);
  console.log(`${pc.gray(padStr(label, labelLen))} ${resolved}`);
  console.log(
    `${pc.gray(padStr(sizeLabel, labelLen))} ${pc.yellow(formatSize(stats.size))}`,
  );
  console.log(
    `${pc.gray(padStr(filesLabel, labelLen))} ${pc.green(`${stats.files} 个文件`)}`,
  );
  console.log(
    `${pc.gray(padStr(dirsLabel, labelLen))} ${pc.blue(`${stats.dirs} 个目录`)}`,
  );
  console.log(
    `${pc.gray(padStr(timeLabel, labelLen))} ${pc.gray(`${elapsed}ms`)}`,
  );
  console.log(`${line}\n`);
}

export function findEmptyDirs(dir: string, result: string[] = []): string[] {
  if (!fs.existsSync(dir)) return result;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return result;

  const entries = fs.readdirSync(dir);
  if (entries.length === 0) {
    result.push(dir);
    return result;
  }
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    findEmptyDirs(path.join(dir, entry), result);
  }
  return result;
}

export function printEmptyDirs(dir: string) {
  const emptyDirs = findEmptyDirs(dir);
  if (emptyDirs.length === 0) {
    console.log(pc.green("未找到空文件夹"));
    return;
  }
  console.log(pc.cyan(`找到 ${emptyDirs.length} 个空文件夹:`));
  emptyDirs.forEach((d) => console.log(`  ${d}`));
}

const CLEAN_DIRS = ["node_modules", ".cache", ".temp", "__pycache__"];
const CLEAN_FILES = [
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  "*.log",
  ".ehthumbs.db",
];

function matchGlob(filename: string, pattern: string): boolean {
  if (pattern.startsWith("*")) {
    return filename.endsWith(pattern.slice(1));
  }
  return filename === pattern;
}

function cleanDir(dir: string, dryRun: boolean): string[] {
  const cleaned: string[] = [];
  if (!fs.existsSync(dir)) return cleaned;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return cleaned;

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const s = fs.statSync(fullPath);

    if (s.isDirectory()) {
      if (CLEAN_DIRS.includes(entry)) {
        if (dryRun) {
          cleaned.push(fullPath);
        } else {
          fs.rmSync(fullPath, { recursive: true, force: true });
          cleaned.push(fullPath);
        }
      } else {
        cleaned.push(...cleanDir(fullPath, dryRun));
      }
    } else {
      if (CLEAN_FILES.some((p) => matchGlob(entry, p))) {
        if (dryRun) {
          cleaned.push(fullPath);
        } else {
          fs.unlinkSync(fullPath);
          cleaned.push(fullPath);
        }
      }
    }
  }
  return cleaned;
}

export function printCleanResult(dir: string, dryRun: boolean) {
  const files = cleanDir(dir, dryRun);
  if (files.length === 0) {
    console.log(pc.green(dryRun ? "未发现可清理的内容" : "未清理任何内容"));
    return;
  }
  const action = dryRun ? "将清理" : "已清理";
  console.log(pc.cyan(`${action} ${files.length} 项:`));
  files.forEach((f) => console.log(`  ${f}`));
}
