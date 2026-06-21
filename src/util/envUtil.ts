import { execSync } from "child_process";

/**
 * 环境变量信息接口
 */
export interface EnvVarInfo {
  name: string;
  value: string;
  scope?: "user" | "system" | "process";
}

/**
 * 获取环境变量
 * @param name 环境变量名
 * @returns 环境变量值
 */
export function getEnv(name: string): string | undefined {
  return process.env[name];
}

/**
 * 设置环境变量（仅当前进程）
 * @param name 环境变量名
 * @param value 环境变量值
 */
export function setEnv(name: string, value: string): void {
  process.env[name] = value;
}

/**
 * 删除环境变量（仅当前进程）
 * @param name 环境变量名
 */
export function unsetEnv(name: string): void {
  delete process.env[name];
}

/**
 * 检查环境变量是否存在
 * @param name 环境变量名
 * @returns 是否存在
 */
export function hasEnv(name: string): boolean {
  return name in process.env;
}

/**
 * 获取所有环境变量
 * @returns 环境变量对象
 */
export function getAllEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

/**
 * 获取环境变量列表
 * @returns 环境变量数组
 */
export function getEnvList(): EnvVarInfo[] {
  const envList: EnvVarInfo[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      envList.push({
        name: key,
        value,
        scope: "process",
      });
    }
  }

  return envList;
}

/**
 * 批量设置环境变量
 * @param vars 环境变量对象
 */
export function setEnvBatch(vars: Record<string, string>): void {
  for (const [key, value] of Object.entries(vars)) {
    process.env[key] = value;
  }
}

/**
 * 批量删除环境变量
 * @param names 环境变量名数组
 */
export function unsetEnvBatch(names: string[]): void {
  for (const name of names) {
    delete process.env[name];
  }
}

/**
 * 搜索环境变量
 * @param keyword 搜索关键词
 * @returns 匹配的环境变量数组
 */
export function searchEnv(keyword: string): EnvVarInfo[] {
  const lowerKeyword = keyword.toLowerCase();
  const result: EnvVarInfo[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      if (
        key.toLowerCase().includes(lowerKeyword) ||
        value.toLowerCase().includes(lowerKeyword)
      ) {
        result.push({
          name: key,
          value,
          scope: "process",
        });
      }
    }
  }

  return result;
}

/**
 * 导出环境变量到对象
 * @param filter 过滤函数
 * @returns 过滤后的环境变量对象
 */
export function exportEnv(
  filter?: (key: string, value: string) => boolean,
): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      if (!filter || filter(key, value)) {
        env[key] = value;
      }
    }
  }

  return env;
}

/**
 * 获取系统PATH
 * @returns PATH值
 */
export function getPath(): string | undefined {
  return process.env.PATH || process.env.Path;
}

/**
 * 添加到PATH（仅当前进程）
 * @param newPath 要添加的路径
 */
export function addToPath(newPath: string): void {
  const currentPath = getPath();
  const separator = process.platform === "win32" ? ";" : ":";

  if (currentPath) {
    process.env.PATH = `${newPath}${separator}${currentPath}`;
  } else {
    process.env.PATH = newPath;
  }
}

/**
 * 获取平台特定的环境变量
 * @returns 平台信息
 */
export function getPlatformEnv(): {
  platform: string;
  arch: string;
  home: string | undefined;
  temp: string | undefined;
  shell: string | undefined;
} {
  return {
    platform: process.platform,
    arch: process.arch,
    home: process.env.HOME || process.env.USERPROFILE,
    temp: process.env.TMPDIR || process.env.TEMP || process.env.TMP,
    shell: process.env.SHELL || process.env.ComSpec,
  };
}

/**
 * 格式化环境变量
 * @param name 变量名
 * @param value 变量值
 * @param maxLength 最大显示长度
 * @returns 格式化后的字符串
 */
export function formatEnvVar(
  name: string,
  value: string,
  maxLength: number = 80,
): string {
  if (value.length > maxLength) {
    return `${name}=${value.substring(0, maxLength)}...`;
  }
  return `${name}=${value}`;
}
