import { Command } from "commander";
import pc from "picocolors";
import { AbstractCommand } from "./abstractCommand";
import {
  ping,
  checkPort,
  httpRequest,
  getLocalIP,
  getPublicIP,
  dnsResolve,
  networkSpeedTest,
  formatBytes,
  formatTime,
} from "@/util/netUtil";

export class NetCommand extends AbstractCommand {
  public load(program: Command): void {
    const netCmd = program.command("net").description("网络相关工具");

    netCmd
      .command("ping")
      .description("Ping 检测")
      .argument("<host>", "目标主机")
      .option("-t, --timeout <timeout>", "超时时间(毫秒)", "3000")
      .action(async (host, opts) => {
        console.log(pc.cyan(`正在 Ping ${host} ...`));
        const startTime = Date.now();
        const result = await ping(host, parseInt(opts.timeout));
        const latency = Date.now() - startTime;

        if (result) {
          console.log(pc.green(`✓ ${host} 可达`));
          console.log(pc.cyan(`  延迟: ${latency}ms`));
        } else {
          console.log(pc.red(`✗ ${host} 不可达或请求超时`));
        }
      });

    netCmd
      .command("port")
      .description("端口检测")
      .argument("<host>", "目标主机")
      .argument("<port>", "端口号")
      .option("-t, --timeout <timeout>", "超时时间(毫秒)", "2000")
      .action(async (host, port, opts) => {
        console.log(pc.cyan(`正在检测 ${host}:${port} ...`));
        const result = await checkPort(
          host,
          parseInt(port),
          parseInt(opts.timeout),
        );

        if (result) {
          console.log(pc.green(`✓ 端口 ${port} 开放`));
        } else {
          console.log(pc.red(`✗ 端口 ${port} 关闭或不可达`));
        }
      });

    netCmd
      .command("http")
      .description("HTTP 请求测试")
      .argument("<url>", "请求地址")
      .option("-m, --method <method>", "请求方法", "GET")
      .action(async (url, opts) => {
        console.log(pc.cyan(`正在请求 ${url} ...`));
        try {
          const result = await httpRequest(
            url,
            opts.method.toUpperCase() as "GET" | "POST" | "HEAD",
          );
          console.log(pc.green(`✓ 请求成功`));
          console.log(pc.cyan(`  状态码: ${result.status}`));
          console.log(pc.cyan(`  响应时间: ${result.time}ms`));
          console.log(pc.cyan(`  响应大小: ${formatBytes(result.size)}`));
        } catch (error) {
          console.log(
            pc.red(
              `✗ 请求失败: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });

    netCmd
      .command("ip")
      .description("获取 IP 地址")
      .option("-p, --public", "获取公网 IP")
      .action(async (opts) => {
        if (opts.public) {
          console.log(pc.cyan("正在获取公网 IP ..."));
          try {
            const publicIP = await getPublicIP();
            console.log(pc.green(`✓ 公网 IP: ${publicIP}`));
          } catch (error) {
            console.log(
              pc.red(
                `✗ 获取公网 IP 失败: ${error instanceof Error ? error.message : String(error)}`,
              ),
            );
          }
        } else {
          const localIPs = getLocalIP();
          if (localIPs.length > 0) {
            console.log(pc.green("✓ 本机 IP 地址:"));
            localIPs.forEach((ip) => {
              console.log(pc.cyan(`  ${ip}`));
            });
          } else {
            console.log(pc.red("✗ 未找到本机 IP 地址"));
          }
        }
      });

    netCmd
      .command("dns")
      .description("DNS 解析")
      .argument("<domain>", "域名")
      .action(async (domain) => {
        console.log(pc.cyan(`正在解析 ${domain} ...`));
        try {
          const addresses = await dnsResolve(domain);
          console.log(pc.green(`✓ ${domain} 解析结果:`));
          addresses.forEach((addr) => {
            console.log(pc.cyan(`  ${addr}`));
          });
        } catch (error) {
          console.log(
            pc.red(
              `✗ DNS 解析失败: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });

    netCmd
      .command("speed")
      .description("网络速度测试")
      .option("-u, --url <url>", "测试 URL")
      .option("-d, --duration <duration>", "测试时长(秒)", "10")
      .action(async (opts) => {
        console.log(pc.cyan("正在测试网络速度 ..."));
        console.log(pc.yellow("请稍候，这可能需要一些时间..."));

        try {
          const result = await networkSpeedTest(
            opts.url || "https://speed.cloudflare.com/__down?bytes=10000000",
            parseInt(opts.duration),
          );

          console.log(pc.green("✓ 速度测试完成"));
          console.log(pc.cyan(`  下载速度: ${result.speed} Mbps`));
          console.log(pc.cyan(`  下载大小: ${formatBytes(result.total)}`));
          console.log(pc.cyan(`  耗时: ${formatTime(result.time)}`));
        } catch (error) {
          console.log(
            pc.red(
              `✗ 速度测试失败: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        }
      });
  }
}
