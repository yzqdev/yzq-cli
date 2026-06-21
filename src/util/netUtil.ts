import * as net from "net";
import * as dns from "dns";
import * as http from "http";
import * as https from "https";
import * as os from "os";
import axios from "axios";

/**
 * Ping 检测
 * @param host 主机地址
 * @param timeout 超时时间（毫秒）
 * @returns Promise<boolean>
 */
export function ping(host: string, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = net.createConnection({ host, port: 80, timeout });

    socket.on("connect", () => {
      const latency = Date.now() - startTime;
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * 端口检测
 * @param host 主机地址
 * @param port 端口号
 * @param timeout 超时时间（毫秒）
 * @returns Promise<boolean>
 */
export function checkPort(
  host: string,
  port: number,
  timeout: number = 2000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout });

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * HTTP 请求测试
 * @param url 请求地址
 * @param method 请求方法
 * @returns Promise<{status: number, time: number, headers: Record<string, string>}>
 */
export async function httpRequest(
  url: string,
  method: "GET" | "POST" | "HEAD" = "GET",
): Promise<{
  status: number;
  time: number;
  headers: Record<string, string>;
  size: number;
}> {
  const startTime = Date.now();
  try {
    const response = await axios({
      method,
      url,
      timeout: 10000,
      validateStatus: () => true,
    });
    const time = Date.now() - startTime;
    return {
      status: response.status,
      time,
      headers: response.headers as Record<string, string>,
      size: JSON.stringify(response.data).length,
    };
  } catch (error) {
    throw new Error(
      `HTTP请求失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 获取本机IP地址
 * @returns 本机IP地址列表
 */
export function getLocalIP(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  return ips;
}

/**
 * 获取公网IP地址
 * @returns 公网IP地址
 */
export async function getPublicIP(): Promise<string> {
  try {
    const response = await axios.get("https://api.ipify.org?format=json", {
      timeout: 5000,
    });
    return response.data.ip;
  } catch (error) {
    throw new Error(
      `获取公网IP失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * DNS 解析
 * @param domain 域名
 * @returns Promise<string[]>
 */
export function dnsResolve(domain: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    dns.resolve4(domain, (err, addresses) => {
      if (err) {
        reject(new Error(`DNS解析失败: ${err.message}`));
      } else {
        resolve(addresses);
      }
    });
  });
}

/**
 * 网络速度测试
 * @param url 测试URL
 * @param duration 测试时长（秒）
 * @returns Promise<{speed: number, total: number, time: number}>
 */
export async function networkSpeedTest(
  url: string = "https://speed.cloudflare.com/__down?bytes=10000000",
  duration: number = 10,
): Promise<{ speed: number; total: number; time: number }> {
  const startTime = Date.now();
  let totalBytes = 0;

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    const request = protocol.get(url, (response) => {
      response.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
      });

      response.on("end", () => {
        const endTime = Date.now();
        const timeInSeconds = (endTime - startTime) / 1000;
        const speedInMbps = (totalBytes * 8) / (timeInSeconds * 1024 * 1024);

        resolve({
          speed: Math.round(speedInMbps * 100) / 100,
          total: totalBytes,
          time: Math.round(timeInSeconds * 1000),
        });
      });
    });

    request.on("error", (err) => {
      reject(new Error(`网络速度测试失败: ${err.message}`));
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error("网络速度测试超时"));
    });
  });
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 格式化时间
 * @param milliseconds 毫秒数
 * @returns 格式化后的字符串
 */
export function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
}
