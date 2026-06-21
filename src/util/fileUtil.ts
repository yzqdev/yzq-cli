import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as os from "os";
import { fileURLToPath } from "url";

/**
 * 文件信息接口
 */
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
  permissions: string;
}

/**
 * 获取文件的路径
 * @param name 文件名称
 * @param folder  文件夹名称
 * @returns
 */
export function vendorFile(name: string, folder: string): string {
  const templateDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../vendor/" + folder,
    name,
  );

  return templateDir;
}
/**
 * @param {string | undefined} targetDir
 */
export function formatTargetDir(targetDir: string) {
  return targetDir?.trim().replace(/\/+$/g, "");
}

export function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * @param {string} projectName
 */
export function isValidPackageName(projectName: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName,
  );
}

/**
 * @param {string} projectName
 */
export function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-~]+/g, "-");
}

/**
 * @param {string} srcDir
 * @param {string} destDir
 */
export function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

/**
 * @param {string} path
 */
export function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

/**
 * @param {string} dir
 */
export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

/**
 * 检查文件或目录是否存在
 * @param filePath 文件路径
 * @returns 是否存在
 */
export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * 获取文件信息
 * @param filePath 文件路径
 * @returns 文件信息
 */
export function getFileInfo(filePath: string): FileInfo | null {
  try {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      permissions: (stats.mode & 0o777).toString(8),
    };
  } catch (error) {
    return null;
  }
}

/**
 * 获取文件大小
 * @param filePath 文件路径
 * @returns 文件大小（字节）
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 检查文件是否可读
 * @param filePath 文件路径
 * @returns 是否可读
 */
export function isReadable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 检查文件是否可写
 * @param filePath 文件路径
 * @returns 是否可写
 */
export function isWritable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 检查文件是否可执行
 * @param filePath 文件路径
 * @returns 是否可执行
 */
export function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取文件扩展名
 * @param filePath 文件路径
 * @returns 扩展名
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * 获取文件名（不含扩展名）
 * @param filePath 文件路径
 * @returns 文件名
 */
export function getFileNameWithoutExt(filePath: string): string {
  const basename = path.basename(filePath);
  const ext = path.extname(basename);
  return basename.slice(0, -ext.length);
}

/**
 * 读取文件内容
 * @param filePath 文件路径
 * @param encoding 编码格式
 * @returns 文件内容
 */
export function readFile(
  filePath: string,
  encoding: BufferEncoding = "utf-8",
): string | null {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    return null;
  }
}

/**
 * 写入文件内容
 * @param filePath 文件路径
 * @param content 文件内容
 * @param append 是否追加模式
 * @returns 是否成功
 */
export function writeFile(
  filePath: string,
  content: string,
  append: boolean = false,
): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (append) {
      fs.appendFileSync(filePath, content, "utf-8");
    } else {
      fs.writeFileSync(filePath, content, "utf-8");
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 复制文件
 * @param src 源文件路径
 * @param dest 目标文件路径
 * @returns 是否成功
 */
export function copyFile(src: string, dest: string): boolean {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 移动文件
 * @param src 源文件路径
 * @param dest 目标文件路径
 * @returns 是否成功
 */
export function moveFile(src: string, dest: string): boolean {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.renameSync(src, dest);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 删除文件
 * @param filePath 文件路径
 * @returns 是否成功
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 获取文件MD5哈希（简单实现）
 * @param filePath 文件路径
 * @returns MD5哈希值
 */
export function getFileHash(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("md5").update(content).digest("hex");
  } catch (error) {
    return null;
  }
}

/**
 * 监听文件变化
 * @param filePath 文件路径
 * @param callback 回调函数
 * @returns 监听器
 */
export function watchFile(
  filePath: string,
  callback: (eventType: string, filename: string | null) => void,
): fs.FSWatcher {
  return fs.watch(filePath, callback);
}

/**
 * 批量读取文件
 * @param filePaths 文件路径数组
 * @returns 文件内容数组
 */
export function readFiles(filePaths: string[]): (string | null)[] {
  return filePaths.map((filePath) => readFile(filePath));
}

/**
 * 获取临时目录
 * @returns 临时目录路径
 */
export function getTempDir(): string {
  return os.tmpdir();
}

/**
 * 创建临时文件
 * @param prefix 文件前缀
 * @param ext 扩展名
 * @returns 临时文件路径
 */
export function createTempFile(
  prefix: string = "tmp",
  ext: string = ".tmp",
): string {
  const tempDir = getTempDir();
  const fileName = `${prefix}-${Date.now()}${ext}`;
  return path.join(tempDir, fileName);
}

/**
 * 比较两个文件是否相同
 * @param file1 文件1路径
 * @param file2 文件2路径
 * @returns 是否相同
 */
export function compareFiles(file1: string, file2: string): boolean {
  try {
    const content1 = fs.readFileSync(file1);
    const content2 = fs.readFileSync(file2);
    return content1.equals(content2);
  } catch (error) {
    return false;
  }
}

/**
 * 查找文件
 * @param dir 目录路径
 * @param pattern 文件名模式（支持通配符 * 和 ?）
 * @returns 匹配的文件路径数组
 */
export function findFiles(dir: string, pattern: string): string[] {
  const result: string[] = [];
  const regex = new RegExp(
    pattern.replace(/\*/g, ".*").replace(/\?/g, "."),
    "i",
  );

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);

        if (regex.test(item)) {
          result.push(itemPath);
        }

        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          traverse(itemPath);
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return result;
}

/**
 * 按扩展名查找文件
 * @param dir 目录路径
 * @param ext 扩展名（如 .txt, .js）
 * @returns 匹配的文件路径数组
 */
export function findFilesByExtension(dir: string, ext: string): string[] {
  const normalizedExt = ext.toLowerCase();
  const result: string[] = [];

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else if (path.extname(item).toLowerCase() === normalizedExt) {
          result.push(itemPath);
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return result;
}

/**
 * 查找大文件
 * @param dir 目录路径
 * @param minSize 最小文件大小（字节）
 * @returns 大文件路径数组
 */
export function findLargeFiles(dir: string, minSize: number): string[] {
  const result: string[] = [];

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else if (stats.size >= minSize) {
          result.push(itemPath);
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return result;
}

/**
 * 查找最近修改的文件
 * @param dir 目录路径
 * @param days 天数
 * @returns 最近修改的文件路径数组
 */
export function findRecentFiles(dir: string, days: number): string[] {
  const result: string[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else if (stats.mtime >= cutoffDate) {
          result.push(itemPath);
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return result;
}

/**
 * 查找重复文件（基于MD5哈希）
 * @param dir 目录路径
 * @returns 重复文件分组
 */
export function findDuplicateFiles(dir: string): Map<string, string[]> {
  const hashMap = new Map<string, string[]>();

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else {
          const hash = getFileHash(itemPath);
          if (hash) {
            const existing = hashMap.get(hash) || [];
            existing.push(itemPath);
            hashMap.set(hash, existing);
          }
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);

  // 只返回有重复的文件
  const duplicates = new Map<string, string[]>();
  for (const [hash, files] of hashMap) {
    if (files.length > 1) {
      duplicates.set(hash, files);
    }
  }

  return duplicates;
}

/**
 * 统计目录下文件类型
 * @param dir 目录路径
 * @returns 文件类型统计
 */
export function getFileTypeStats(
  dir: string,
): Record<string, { count: number; size: number }> {
  const stats: Record<string, { count: number; size: number }> = {};

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const itemStats = fs.statSync(itemPath);

        if (itemStats.isDirectory()) {
          traverse(itemPath);
        } else {
          const ext = path.extname(item).toLowerCase() || "no-extension";
          if (!stats[ext]) {
            stats[ext] = { count: 0, size: 0 };
          }
          stats[ext].count++;
          stats[ext].size += itemStats.size;
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return stats;
}

/**
 * 批量重命名文件
 * @param dir 目录路径
 * @param pattern 查找模式（正则）
 * @param replacement 替换字符串
 * @returns 重命名的文件数量
 */
export function batchRenameFiles(
  dir: string,
  pattern: RegExp,
  replacement: string,
): number {
  let count = 0;

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else {
          const newName = item.replace(pattern, replacement);
          if (newName !== item) {
            const newPath = path.join(currentPath, newName);
            fs.renameSync(itemPath, newPath);
            count++;
          }
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return count;
}

/**
 * 修改文件时间戳
 * @param filePath 文件路径
 * @param time 时间戳（毫秒）
 */
export function touchFile(filePath: string, time?: number): boolean {
  try {
    const timestamp = time || Date.now();
    const date = new Date(timestamp);
    fs.utimesSync(filePath, date, date);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取文件权限信息
 * @param filePath 文件路径
 * @returns 权限信息
 */
export function getFilePermissions(
  filePath: string,
): { readable: boolean; writable: boolean; executable: boolean } | null {
  try {
    fs.accessSync(filePath);
    return {
      readable: isReadable(filePath),
      writable: isWritable(filePath),
      executable: isExecutable(filePath),
    };
  } catch (error) {
    return null;
  }
}

/**
 * 计算文件哈希（支持多种算法）
 * @param filePath 文件路径
 * @param algorithm 算法（md5, sha1, sha256等）
 * @returns 哈希值
 */
export function calculateFileHash(
  filePath: string,
  algorithm: string = "md5",
): string | null {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash(algorithm).update(content).digest("hex");
  } catch (error) {
    return null;
  }
}

/**
 * 读取文件前N行
 * @param filePath 文件路径
 * @param lines 行数
 * @returns 文件内容
 */
export function readFileHead(filePath: string, lines: number): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const allLines = content.split("\n");
    return allLines.slice(0, lines).join("\n");
  } catch (error) {
    return null;
  }
}

/**
 * 读取文件后N行
 * @param filePath 文件路径
 * @param lines 行数
 * @returns 文件内容
 */
export function readFileTail(filePath: string, lines: number): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const allLines = content.split("\n");
    return allLines.slice(-lines).join("\n");
  } catch (error) {
    return null;
  }
}

/**
 * 统计文件行数
 * @param filePath 文件路径
 * @returns 行数
 */
export function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split("\n").length;
  } catch (error) {
    return 0;
  }
}

/**
 * 在文件中搜索内容
 * @param filePath 文件路径
 * @param keyword 搜索关键词
 * @param ignoreCase 是否忽略大小写
 * @returns 匹配的行
 */
export function searchInFile(
  filePath: string,
  keyword: string,
  ignoreCase: boolean = false,
): string[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const regex = new RegExp(keyword, ignoreCase ? "gi" : "g");

    return lines.filter((line) => regex.test(line));
  } catch (error) {
    return [];
  }
}

/**
 * 创建目录
 * @param dirPath 目录路径
 * @returns 是否成功
 */
export function createDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 删除目录
 * @param dirPath 目录路径
 * @param recursive 是否递归删除
 * @returns 是否成功
 */
export function removeDirectory(
  dirPath: string,
  recursive: boolean = true,
): boolean {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive, force: true });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 目录大小统计
 * @param dirPath 目录路径
 * @returns 目录大小（字节）
 */
export function getDirectorySize(dirPath: string): number {
  let totalSize = 0;

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dirPath);
  return totalSize;
}

/**
 * 查找空文件
 * @param dir 目录路径
 * @returns 空文件路径数组
 */
export function findEmptyFiles(dir: string): string[] {
  const result: string[] = [];

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else if (stats.size === 0) {
          result.push(itemPath);
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return result;
}

/**
 * 查找隐藏文件
 * @param dir 目录路径
 * @returns 隐藏文件路径数组
 */
export function findHiddenFiles(dir: string): string[] {
  const result: string[] = [];

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);

        // 检查是否是隐藏文件（以.开头）
        if (item.startsWith(".")) {
          result.push(itemPath);
        }

        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          traverse(itemPath);
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dir);
  return result;
}
