export {}

import { storageManager, type ExtensionSettings } from "../utils/storage"

// 当前设置
let settings: ExtensionSettings | null = null

// 初始化
async function initialize() {
  try {
    settings = await storageManager.loadSettings()
    console.log('Zearch: Settings loaded', settings)

    // 如果启用，开始屏蔽
    if (settings.isEnabled) {
      initializeBlocking()
    }
  } catch (error) {
    console.error('Zearch: Failed to load settings', error)
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleBlocking') {
    if (settings) {
      settings.isEnabled = message.enabled
      if (settings.isEnabled) {
        initializeBlocking()
        blockSites()
      } else {
        cleanup()
      }
    }
  }
})

// 启动初始化
initialize()

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

// 创建屏蔽提示元素
function createBlockedIndicator(domain: string): HTMLElement {
  const indicator = document.createElement('div')
  indicator.className = 'zearch-blocked-indicator'
  indicator.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 4px 0;
    ">
      <span style="font-size: 14px;">🚫</span>
      <span>已屏蔽 ${domain}</span>
      <button onclick="this.parentElement.parentElement.style.display='none'"
              style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                cursor: pointer;
                margin-left: auto;
              ">
        隐藏
      </button>
    </div>
  `
  return indicator
}

// 更新统计数据
async function updateStats(domain: string) {
  try {
    await storageManager.updateBlockStats(domain)
  } catch (error) {
    console.error('Zearch: Failed to update stats', error)
  }
}

// 屏蔽函数
function blockSites() {
  if (!settings || !settings.isEnabled) return

  // 使用更通用的选择器来匹配Google搜索结果
  const selectors = [
    'div.g', // 传统选择器
    'div[data-hveid]', // 新的搜索结果容器
    'div[jscontroller]', // 带有jscontroller的div
    'div[jsname]', // 带有jsname的div
    'div[data-ved]', // 带有data-ved的div
    'div[jsaction]', // 带有jsaction的div
    '.srg > div', // 搜索结果组
    '.rc' // 结果容器
  ];

  let results: NodeListOf<Element> | null = null;

  // 尝试不同的选择器
  for (const selector of selectors) {
    results = document.querySelectorAll(selector);
    if (results.length > 0) break;
  }

  if (!results || results.length === 0) return;

  let blockedCount = 0

  results.forEach(result => {
    // 检查是否已经被处理过
    if (result.hasAttribute('data-zearch-processed')) return;
    result.setAttribute('data-zearch-processed', 'true')

    const link = result.querySelector('a[href]');
    if (!link) return;

    const url = link.getAttribute('href');
    if (!url) return;

    try {
      // 更精确的域名匹配
      const urlObj = new URL(url, window.location.origin);
      const hostname = urlObj.hostname.toLowerCase();

      for (const site of settings.blockedSites) {
        const domain = site.domain.toLowerCase()
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          // 创建视觉反馈
          const indicator = createBlockedIndicator(domain)

          // 添加淡出动画
          result.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'
          result.style.opacity = '0.3'
          result.style.transform = 'scale(0.95)'
          result.style.filter = 'grayscale(100%)'

          // 插入屏蔽提示
          result.insertBefore(indicator, result.firstChild)

          // 标记为已屏蔽
          result.setAttribute('data-zearch-blocked', domain)

          // 更新统计
          updateStats(domain)
          blockedCount++

          console.log(`Zearch: Blocked ${hostname}`)
          break;
        }
      }
    } catch (error) {
      console.warn('Zearch: Error processing URL:', url, error)
    }
  });

  if (blockedCount > 0) {
    console.log(`Zearch: Blocked ${blockedCount} results`)
  }
}

// 使用防抖的blockSites函数
const debouncedBlockSites = debounce(blockSites, 150);

// 清理函数
function cleanup() {
  // 移除所有屏蔽标记和样式
  const blockedElements = document.querySelectorAll('[data-zearch-blocked]')
  blockedElements.forEach(element => {
    element.removeAttribute('data-zearch-blocked')
    element.removeAttribute('data-zearch-processed')
    element.style.opacity = ''
    element.style.transform = ''
    element.style.filter = ''
    element.style.transition = ''

    // 移除屏蔽提示
    const indicator = element.querySelector('.zearch-blocked-indicator')
    if (indicator) {
      indicator.remove()
    }
  })

  console.log('Zearch: Cleanup completed')
}

// 初始化屏蔽功能
function initializeBlocking() {
  console.log('Zearch: Initializing blocking...')

  // 初始执行
  setTimeout(blockSites, 100)

  // 防止 Google 动态加载时漏掉，监听 DOM 变化
  if (window.zearchObserver) {
    window.zearchObserver.disconnect()
  }

  window.zearchObserver = new MutationObserver((mutations) => {
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
            element.matches('div[jsaction]') ||
            element.matches('.srg > div') ||
            element.matches('.rc')
          );
        }
        return false;
      });
    });

    if (hasNewResults && settings && settings.isEnabled) {
      debouncedBlockSites();
    }
  });

  window.zearchObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 监听页面滚动，处理懒加载的内容
  if (window.zearchScrollHandler) {
    document.removeEventListener('scroll', window.zearchScrollHandler)
  }

  window.zearchScrollHandler = debounce(() => {
    if (settings && settings.isEnabled) {
      blockSites()
    }
  }, 300)

  document.addEventListener('scroll', window.zearchScrollHandler)

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && settings && settings.isEnabled) {
      setTimeout(blockSites, 100)
    }
  })
}

// 扩展全局对象以避免类型错误
declare global {
  interface Window {
    zearchObserver?: MutationObserver
    zearchScrollHandler?: () => void
  }
}

console.log('Zearch: Content script loaded')

