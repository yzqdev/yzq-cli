import { execSync, exec } from "child_process";
import * as net from "net";

/**
 * 进程信息接口
 */
export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
  command?: string;
}

/**
 * 端口占用信息接口
 */
export interface PortInfo {
  port: number;
  pid: number;
  processName: string;
  protocol: string;
}

/**
 * 获取进程列表
 * @returns 进程信息数组
 */
export function getProcessList(): ProcessInfo[] {
  try {
    const isWindows = process.platform === "win32";
    let command: string;

    if (isWindows) {
      command = "tasklist /FO CSV /NH";
    } else {
      command = "ps aux --no-headers";
    }

    const output = execSync(command, { encoding: "utf-8" });
    const lines = output.trim().split("\n");
    const processes: ProcessInfo[] = [];

    for (const line of lines) {
      if (isWindows) {
        // Windows格式: "进程名","PID","会话名","会话#","内存使用"
        const parts = line.split(",").map((p) => p.replace(/"/g, "").trim());
        if (parts.length >= 5) {
          processes.push({
            name: parts[0],
            pid: parseInt(parts[1]),
            cpu: 0,
            memory: parseInt(parts[4].replace(/[^\d]/g, "")) || 0,
            status: "running",
          });
        }
      } else {
        // Linux/Mac格式
        const parts = line.split(/\s+/);
        if (parts.length >= 11) {
          processes.push({
            name: parts[10],
            pid: parseInt(parts[1]),
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]),
            status: "running",
          });
        }
      }
    }

    return processes;
  } catch (error) {
    throw new Error(
      `获取进程列表失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 获取进程详情
 * @param pid 进程ID
 * @returns 进程详细信息
 */
export function getProcessDetail(pid: number): ProcessInfo | null {
  try {
    const isWindows = process.platform === "win32";
    let command: string;

    if (isWindows) {
      command = `tasklist /FI "PID eq ${pid}" /FO CSV /NH`;
    } else {
      command = `ps -p ${pid} -o pid,comm,%cpu,%mem,state,args --no-headers`;
    }

    const output = execSync(command, { encoding: "utf-8" }).trim();

    if (!output || output.includes("INFO:") || output.includes("No tasks")) {
      return null;
    }

    if (isWindows) {
      const parts = output.split(",").map((p) => p.replace(/"/g, "").trim());
      if (parts.length >= 5) {
        return {
          name: parts[0],
          pid: parseInt(parts[1]),
          cpu: 0,
          memory: parseInt(parts[4].replace(/[^\d]/g, "")) || 0,
          status: "running",
        };
      }
    } else {
      const parts = output.split(/\s+/);
      if (parts.length >= 7) {
        return {
          pid: parseInt(parts[0]),
          name: parts[1],
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3]),
          status: parts[4],
          command: parts.slice(5).join(" "),
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 结束进程
 * @param pid 进程ID
 * @param force 是否强制结束
 * @returns 是否成功
 */
export function killProcess(pid: number, force: boolean = false): boolean {
  try {
    const isWindows = process.platform === "win32";
    let command: string;

    if (isWindows) {
      command = force ? `taskkill /F /PID ${pid}` : `taskkill /PID ${pid}`;
    } else {
      command = force ? `kill -9 ${pid}` : `kill ${pid}`;
    }

    execSync(command, { encoding: "utf-8" });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 查询端口占用
 * @param port 端口号
 * @returns 端口占用信息
 */
export function getPortInfo(port: number): PortInfo | null {
  try {
    const isWindows = process.platform === "win32";
    let command: string;

    if (isWindows) {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} -P -n`;
    }

    const output = execSync(command, { encoding: "utf-8" }).trim();

    if (!output) {
      return null;
    }

    const lines = output.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      if (isWindows) {
        // Windows格式: TCP    0.0.0.0:80    0.0.0.0:0    LISTENING    1234
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const portPart = parts[1];
          const portMatch = portPart.match(/:(\d+)$/);
          if (portMatch) {
            return {
              port: parseInt(portMatch[1]),
              pid: parseInt(parts[4]),
              processName: "",
              protocol: parts[0],
            };
          }
        }
      } else {
        // Linux/Mac格式: node    1234  user  10u  IPv4  0x...  0t0  TCP *:80 (LISTEN)
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          return {
            port,
            pid: parseInt(parts[1]),
            processName: parts[0],
            protocol: parts[7] || "TCP",
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 检查端口是否被占用
 * @param port 端口号
 * @returns 是否被占用
 */
export function isPortOccupied(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(true);
    });

    server.once("listening", () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

/**
 * 获取可用端口
 * @param startPort 起始端口
 * @returns 可用端口号
 */
export async function getAvailablePort(
  startPort: number = 3000,
): Promise<number> {
  let port = startPort;

  while (port < 65535) {
    const isOccupied = await isPortOccupied(port);
    if (!isOccupied) {
      return port;
    }
    port++;
  }

  throw new Error("未找到可用端口");
}

/**
 * 获取进程CPU使用率
 * @param pid 进程ID
 * @returns CPU使用率
 */
export function getProcessCpuUsage(pid: number): number {
  try {
    const isWindows = process.platform === "win32";

    if (isWindows) {
      // Windows下获取CPU使用率比较复杂，这里返回0
      return 0;
    } else {
      const command = `ps -p ${pid} -o %cpu=`;
      const output = execSync(command, { encoding: "utf-8" }).trim();
      return parseFloat(output) || 0;
    }
  } catch (error) {
    return 0;
  }
}

/**
 * 获取进程内存使用
 * @param pid 进程ID
 * @returns 内存使用量（字节）
 */
export function getProcessMemoryUsage(pid: number): number {
  try {
    const isWindows = process.platform === "win32";

    if (isWindows) {
      const command = `tasklist /FI "PID eq ${pid}" /FO CSV /NH`;
      const output = execSync(command, { encoding: "utf-8" }).trim();

      if (!output || output.includes("INFO:") || output.includes("No tasks")) {
        return 0;
      }

      const parts = output.split(",").map((p) => p.replace(/"/g, "").trim());
      if (parts.length >= 5) {
        return parseInt(parts[4].replace(/[^\d]/g, "")) || 0;
      }
    } else {
      const command = `ps -p ${pid} -o rss=`;
      const output = execSync(command, { encoding: "utf-8" }).trim();
      return (parseInt(output) || 0) * 1024; // KB转字节
    }

    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 格式化进程信息
 * @param process 进程信息
 * @returns 格式化后的字符串
 */
export function formatProcessInfo(process: ProcessInfo): string {
  const memoryMB = (process.memory / 1024).toFixed(2);
  return `[${process.pid}] ${process.name} - CPU: ${process.cpu}% - Memory: ${memoryMB}MB`;
}

/**
 * 格式化端口信息
 * @param portInfo 端口信息
 * @returns 格式化后的字符串
 */
export function formatPortInfo(portInfo: PortInfo): string {
  return `${portInfo.protocol}:${portInfo.port} -> PID: ${portInfo.pid} (${portInfo.processName || "未知"})`;
}
