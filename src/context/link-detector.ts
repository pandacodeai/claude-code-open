/**
 * 链接检测和预处理
 * 自动提取用户消息中的 URL，获取内容并注入上下文
 */

/**
 * 从文本中提取 URL
 * 先剥离 Markdown 链接语法，避免重复提取
 * 过滤掉不需要处理的 URL（图片、已知的 GitHub blob 等）
 * @param text 用户消息文本
 * @returns URL 列表（最多 3 个）
 */
export function extractUrls(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // 先剥离 Markdown 链接语法 [text](url)，提取其中的 url
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const markdownUrls: string[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const url = match[2];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      markdownUrls.push(url);
    }
  }

  // 匹配纯文本中的 URL（http/https）
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const textUrls: string[] = [];
  
  while ((match = urlRegex.exec(text)) !== null) {
    textUrls.push(match[0]);
  }

  // 合并去重
  const uniqueUrls = new Set([...markdownUrls, ...textUrls]);
  const allUrls = Array.from(uniqueUrls);

  // 过滤不需要处理的 URL
  const filtered = allUrls.filter(url => isUrlWorthFetching(url));

  // 最多返回 3 个
  return filtered.slice(0, 3);
}

/**
 * 判断 URL 是否值得获取
 * 排除：图片、视频、音频、PDF、GitHub blob（已在 context 中）、内网地址等
 * @param url URL 字符串
 * @returns 是否值得获取
 */
export function isUrlWorthFetching(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // 排除：过短的 URL（< 15 字符）
    if (url.length < 15) {
      return false;
    }

    // 排除：localhost 和内网地址
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // 排除：二进制文件扩展名（图片、视频、音频、压缩包等）
    const pathname = urlObj.pathname.toLowerCase();
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico',
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
      '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
      '.exe', '.dmg', '.pkg', '.deb', '.rpm', '.apk',
    ];
    if (binaryExtensions.some(ext => pathname.endsWith(ext))) {
      return false;
    }

    // 排除：GitHub blob 路径（已经通过 context 加载）
    if (
      hostname === 'github.com' &&
      pathname.includes('/blob/')
    ) {
      return false;
    }

    // 排除：图片托管服务
    const imageHosts = [
      'i.imgur.com',
      'imgur.com',
      'i.redd.it',
      'pbs.twimg.com',
      'cdn.discordapp.com',
    ];
    if (imageHosts.includes(hostname)) {
      return false;
    }

    return true;
  } catch {
    // URL 解析失败，不处理
    return false;
  }
}
