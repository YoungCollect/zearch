export {}
console.log(
  "You may find that having is not so pleasing a thing as wanting. This is not logical, but it is often true."
)
// 加载屏蔽列表
const blockList = ["zhihu.com", "quora.com", "reddit.com"];

// 防抖函数，避免频繁执行
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

console.log('Block site content script loaded');
    
// 屏蔽函数
function blockSites() {
  // 使用更通用的选择器来匹配Google搜索结果
  const selectors = [
    'div.g', // 传统选择器
    'div[data-hveid]', // 新的搜索结果容器
    'div[jscontroller]', // 带有jscontroller的div
    'div[jsname]', // 带有jsname的div
    'div[data-ved]', // 带有data-ved的div
    'div[jsaction]' // 带有jsaction的div
  ];
  
  let results: NodeListOf<Element> | null = null;
  
  // 尝试不同的选择器
  for (const selector of selectors) {
    results = document.querySelectorAll(selector);
    if (results.length > 0) break;
  }
  
  if (!results || results.length === 0) return;
  
  results.forEach(result => {
    // 检查是否已经被处理过
    if (result.hasAttribute('data-blocked')) return;
    
    const link = result.querySelector('a[href]');
    if (!link) return;

    const url = link.getAttribute('href');
    if (!url) return;
    
    // 更精确的域名匹配
    const urlObj = new URL(url, window.location.origin);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const domain of blockList) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        result.style.display = 'none';
        result.setAttribute('data-blocked', 'true');
        console.log(`Blocked: ${hostname}`);
        break;
      }
    }
  });
}

// 使用防抖的blockSites函数
const debouncedBlockSites = debounce(blockSites, 100);

// 初始执行
blockSites();

// 防止 Google 动态加载时漏掉，监听 DOM 变化
const observer = new MutationObserver((mutations) => {
  // 检查是否有新的搜索结果被添加
  const hasNewResults = mutations.some(mutation => {
    return Array.from(mutation.addedNodes).some(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        return element.matches && (
          element.matches('div.g') ||
          element.matches('div[data-hveid]') ||
          element.matches('div[jscontroller]') ||
          element.matches('div[jsname]') ||
          element.matches('div[data-ved]') ||
          element.matches('div[jsaction]')
        );
      }
      return false;
    });
  });
  
  if (hasNewResults) {
    debouncedBlockSites();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 监听页面滚动，处理懒加载的内容
let scrollTimeout: NodeJS.Timeout;
document.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(blockSites, 200);
});

