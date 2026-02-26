/**
 * 导航守卫 - SSRF 防护
 * 阻止浏览器访问内网地址、本地文件和危险协议
 */

export interface NavigationGuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * 内网 IP 地址范围（CIDR 表示法）
 */
const PRIVATE_IP_RANGES = [
  // IPv4 私有地址
  { start: '127.0.0.0', end: '127.255.255.255', name: 'localhost' },
  { start: '10.0.0.0', end: '10.255.255.255', name: 'private-10' },
  { start: '172.16.0.0', end: '172.31.255.255', name: 'private-172' },
  { start: '192.168.0.0', end: '192.168.255.255', name: 'private-192' },
  { start: '169.254.0.0', end: '169.254.255.255', name: 'link-local' },
  // IPv6 私有地址和本地地址
  // 由于 IPv6 复杂性，这里用字符串前缀匹配
];

/**
 * 将 IP 地址字符串转换为数字（仅支持 IPv4）
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return -1;
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * 检查 IP 是否在指定范围内
 */
function isIpInRange(ip: string, start: string, end: string): boolean {
  const ipNum = ipToNumber(ip);
  if (ipNum === -1) return false;
  
  const startNum = ipToNumber(start);
  const endNum = ipToNumber(end);
  
  return ipNum >= startNum && ipNum <= endNum;
}

/**
 * 检查是否为内网 IPv6 地址
 */
function isPrivateIPv6(hostname: string): boolean {
  // IPv6 本地地址
  if (hostname === '::1' || hostname.toLowerCase() === 'localhost') {
    return true;
  }
  
  // IPv6 私有地址前缀
  const lowerHost = hostname.toLowerCase();
  if (lowerHost.startsWith('fc') || lowerHost.startsWith('fd')) {
    // fc00::/7 - Unique Local Addresses
    return true;
  }
  
  if (lowerHost.startsWith('fe80:')) {
    // fe80::/10 - Link-Local addresses
    return true;
  }
  
  return false;
}

/**
 * 获取当前 Web UI 的端口号（用于自身 UI 白名单）
 */
function getOwnWebPort(): number {
  return parseInt(process.env.CLAUDE_WEB_PORT || '3456');
}

/**
 * 检查 URL 是否指向自身 Web UI
 */
function isOwnWebUI(hostname: string, port: string): boolean {
  const ownPort = getOwnWebPort();
  const targetPort = port ? parseInt(port) : (hostname === 'localhost' ? 80 : 80);
  if (targetPort !== ownPort) return false;
  const localHosts = ['localhost', '127.0.0.1', '::1', 'localhost.localdomain'];
  return localHosts.includes(hostname);
}

/**
 * 检查导航是否被允许
 * @param url 要访问的 URL
 * @returns 导航守卫结果
 */
export function isNavigationAllowed(url: string): NavigationGuardResult {
  try {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol.toLowerCase();
    const hostname = parsedUrl.hostname.toLowerCase();

    // 0. 允许访问自身 Web UI（自我感知）
    if (isOwnWebUI(hostname, parsedUrl.port)) {
      return { allowed: true };
    }

    // 1. 阻止 file:// 协议
    if (protocol === 'file:') {
      return {
        allowed: false,
        reason: 'Navigation to file:// URLs is blocked for security reasons (local file access)',
      };
    }

    // 2. 阻止 chrome://, chrome-extension://, edge://, brave:// 等浏览器内部协议
    const blockedProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'brave:', 'opera:', 'vivaldi:'];
    if (blockedProtocols.some(p => protocol.startsWith(p))) {
      return {
        allowed: false,
        reason: `Navigation to ${protocol}// URLs is blocked (browser internal protocol)`,
      };
    }

    // 3. 阻止 about:// 协议（除了 about:blank）
    if (protocol === 'about:') {
      if (url.toLowerCase() !== 'about:blank') {
        return {
          allowed: false,
          reason: 'Navigation to about:// URLs (except about:blank) is blocked',
        };
      }
    }

    // 4. 检查 IPv4 内网地址
    // 检查是否为 IP 地址格式
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (ipv4Pattern.test(hostname)) {
      for (const range of PRIVATE_IP_RANGES) {
        if (isIpInRange(hostname, range.start, range.end)) {
          return {
            allowed: false,
            reason: `Navigation to private IP address ${hostname} is blocked (SSRF protection - ${range.name})`,
          };
        }
      }
    }

    // 5. 检查 IPv6 内网地址
    if (hostname.includes(':') || isPrivateIPv6(hostname)) {
      if (isPrivateIPv6(hostname)) {
        return {
          allowed: false,
          reason: `Navigation to private IPv6 address ${hostname} is blocked (SSRF protection)`,
        };
      }
    }

    // 6. 检查 localhost 主机名变体
    const localhostVariants = ['localhost', 'localhost.localdomain'];
    if (localhostVariants.includes(hostname)) {
      return {
        allowed: false,
        reason: `Navigation to ${hostname} is blocked (SSRF protection - localhost access)`,
      };
    }

    // 7. 检查其他常见内网域名
    const internalDomains = ['.local', '.internal', '.lan', '.corp'];
    if (internalDomains.some(domain => hostname.endsWith(domain))) {
      return {
        allowed: false,
        reason: `Navigation to internal domain ${hostname} is blocked (SSRF protection)`,
      };
    }

    // 所有检查通过，允许导航
    return { allowed: true };

  } catch (error) {
    // URL 解析失败
    return {
      allowed: false,
      reason: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
