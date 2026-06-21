import * as fs from "fs";
import * as path from "path";

/**
 * 文件夹信息接口
 */
export interface FolderInfo {
  name: string;
  path: string;
  size: number;
  fileCount: number;
  folderCount: number;
  created: Date;
  modified: Date;
}

/**
 * 获取文件夹大小
 * @param dirPath 文件夹路径
 * @returns 文件夹大小（字节）
 */
export function getFolderSize(dirPath: string): number {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += getFolderSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch (error) {
    return 0;
  }
}

/**
 * 统计文件夹信息
 * @param dirPath 文件夹路径
 * @returns 文件夹信息
 */
export function getFolderInfo(dirPath: string): FolderInfo | null {
  try {
    const stats = fs.statSync(dirPath);

    if (!stats.isDirectory()) {
      return null;
    }

    let fileCount = 0;
    let folderCount = 0;
    let totalSize = 0;

    const traverse = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const itemStats = fs.statSync(itemPath);

        if (itemStats.isDirectory()) {
          folderCount++;
          traverse(itemPath);
        } else {
          fileCount++;
          totalSize += itemStats.size;
        }
      }
    };

    traverse(dirPath);

    return {
      name: path.basename(dirPath),
      path: dirPath,
      size: totalSize,
      fileCount,
      folderCount,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 列出文件夹内容
 * @param dirPath 文件夹路径
 * @param recursive 是否递归
 * @returns 文件路径数组
 */
export function listFolder(
  dirPath: string,
  recursive: boolean = false,
): string[] {
  const result: string[] = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      result.push(itemPath);

      if (recursive) {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          result.push(...listFolder(itemPath, recursive));
        }
      }
    }

    return result;
  } catch (error) {
    return [];
  }
}

/**
 * 搜索文件
 * @param dirPath 文件夹路径
 * @param pattern 文件名模式（支持通配符）
 * @returns 匹配的文件路径数组
 */
export function searchFiles(dirPath: string, pattern: string): string[] {
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

  traverse(dirPath);
  return result;
}

/**
 * 查找大文件
 * @param dirPath 文件夹路径
 * @param minSize 最小文件大小（字节）
 * @returns 大文件路径数组
 */
export function findLargeFiles(dirPath: string, minSize: number): string[] {
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

  traverse(dirPath);
  return result;
}

/**
 * 查找最近修改的文件
 * @param dirPath 文件夹路径
 * @param days 天数
 * @returns 最近修改的文件路径数组
 */
export function findRecentFiles(dirPath: string, days: number): string[] {
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

  traverse(dirPath);
  return result;
}

/**
 * 按扩展名分类文件
 * @param dirPath 文件夹路径
 * @returns 按扩展名分组的文件对象
 */
export function groupFilesByExtension(
  dirPath: string,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  const traverse = (currentPath: string) => {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          traverse(itemPath);
        } else {
          const ext = path.extname(item).toLowerCase() || "no-extension";
          if (!result[ext]) {
            result[ext] = [];
          }
          result[ext].push(itemPath);
        }
      }
    } catch (error) {
      // 忽略无权访问的目录
    }
  };

  traverse(dirPath);
  return result;
}

/**
 * 创建目录结构
 * @param dirPath 目录路径
 */
export function createDirectories(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 清空目录
 * @param dirPath 目录路径
 */
export function clearDirectory(dirPath: string): void {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      fs.rmSync(itemPath, { recursive: true, force: true });
    }
  } catch (error) {
    // 忽略错误
  }
}

/**
 * 删除目录
 * @param dirPath 目录路径
 * @returns 是否成功
 */
export function removeDirectory(dirPath: string): boolean {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 重命名目录
 * @param oldPath 旧路径
 * @param newPath 新路径
 * @returns 是否成功
 */
export function renameDirectory(oldPath: string, newPath: string): boolean {
  try {
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 移动目录
 * @param src 源目录
 * @param dest 目标目录
 * @returns 是否成功
 */
export function moveDirectory(src: string, dest: string): boolean {
  try {
    if (fs.existsSync(src)) {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.renameSync(src, dest);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 复制目录
 * @param src 源目录
 * @param dest 目标目录
 * @returns 是否成功
 */
export function copyDirectory(src: string, dest: string): boolean {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);

    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 比较两个目录
 * @param dir1 目录1
 * @param dir2 目录2
 * @returns 差异信息
 */
export function compareDirectories(
  dir1: string,
  dir2: string,
): {
  onlyInDir1: string[];
  onlyInDir2: string[];
  different: string[];
} {
  const result = {
    onlyInDir1: [] as string[],
    onlyInDir2: [] as string[],
    different: [] as string[],
  };

  const getFiles = (dir: string): Map<string, string> => {
    const files = new Map<string, string>();

    const traverse = (currentPath: string, relativePath: string = "") => {
      try {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stats = fs.statSync(itemPath);
          const relPath = path.join(relativePath, item);

          if (stats.isDirectory()) {
            traverse(itemPath, relPath);
          } else {
            files.set(relPath, itemPath);
          }
        }
      } catch (error) {
        // 忽略错误
      }
    };

    traverse(dir);
    return files;
  };

  try {
    const files1 = getFiles(dir1);
    const files2 = getFiles(dir2);

    // 查找只在dir1中的文件
    for (const [relPath] of files1) {
      if (!files2.has(relPath)) {
        result.onlyInDir1.push(relPath);
      }
    }

    // 查找只在dir2中的文件
    for (const [relPath] of files2) {
      if (!files1.has(relPath)) {
        result.onlyInDir2.push(relPath);
      }
    }

    // 查找不同的文件
    for (const [relPath, filePath1] of files1) {
      if (files2.has(relPath)) {
        const filePath2 = files2.get(relPath)!;
        const content1 = fs.readFileSync(filePath1);
        const content2 = fs.readFileSync(filePath2);

        if (!content1.equals(content2)) {
          result.different.push(relPath);
        }
      }
    }

    return result;
  } catch (error) {
    return result;
  }
}

/**
 * 获取目录树结构
 * @param dirPath 目录路径
 * @param prefix 前缀
 * @returns 目录树字符串
 */
export function getDirectoryTree(dirPath: string, prefix: string = ""): string {
  let result = "";

  try {
    const items = fs.readdirSync(dirPath);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      const isLast = i === items.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const newPrefix = prefix + (isLast ? "    " : "│   ");

      result += `${prefix}${connector}${item}\n`;

      if (stats.isDirectory()) {
        result += getDirectoryTree(itemPath, newPrefix);
      }
    }

    return result;
  } catch (error) {
    return result;
  }
}
