import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "*://www.google.com/search*",
    "*://www.google.co.uk/search*",
    "*://www.google.ca/search*",
    "*://www.google.com.au/search*",
    "*://www.google.de/search*",
    "*://www.google.fr/search*",
    "*://www.google.it/search*",
    "*://www.google.es/search*",
    "*://www.google.co.jp/search*",
    "*://www.google.co.kr/search*",
    "*://www.google.com.br/search*",
    "*://www.google.ru/search*",
    "*://www.google.com.mx/search*",
    "*://www.google.co.in/search*"
  ],
  run_at: "document_end"
}

import { storageManager, type ExtensionSettings } from "../utils/storage"

// 当前设置
let settings: ExtensionSettings | null = null

// 通知防抖
let notificationTimeout: NodeJS.Timeout | null = null
let pendingNotifications: { [key: string]: number } = {}

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

// 监听来自popup和background的消息
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
  } else if (message.action === 'pageLoaded') {
    // 页面加载完成，重新初始化
    if (settings && settings.isEnabled) {
      setTimeout(() => {
        blockSites()
      }, 500)
    }
  } else if (message.action === 'settingsChanged') {
    // 设置发生变化，重新加载设置
    initialize()
  }
})

// 检查是否为UI元素（避免处理Chrome底部导航等）
function isUIElement(element: Element): boolean {
  // 检查是否在搜索结果区域外
  const searchContainer = document.querySelector('#search, #rso, .srg')
  if (searchContainer && !searchContainer.contains(element)) {
    return true
  }

  // 检查是否为导航、分页等UI元素
  const uiSelectors = [
    '[role="navigation"]',
    '.paging',
    '#botstuff',
    '#bottomads',
    '.commercial-unit-desktop-top',
    '.commercial-unit-desktop-rhs',
    '[data-ved][aria-label*="页面"]',
    '[data-ved][aria-label*="下一页"]',
    '[data-ved][aria-label*="上一页"]'
  ]

  for (const selector of uiSelectors) {
    if (element.matches(selector) || element.closest(selector)) {
      return true
    }
  }

  // 检查是否包含分页相关文本
  const text = element.textContent?.toLowerCase() || ''
  const paginationKeywords = ['下一页', 'next', '上一页', 'previous', '页面', 'page']
  if (paginationKeywords.some(keyword => text.includes(keyword)) && text.length < 50) {
    return true
  }

  return false
}

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

  const hideButton = document.createElement('button')
  hideButton.textContent = '隐藏'
  hideButton.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    margin-left: auto;
  `

  // 添加点击事件处理
  hideButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    // 隐藏整个搜索结果项
    const resultElement = indicator.closest('[data-zearch-blocked]')
    if (resultElement) {
      resultElement.style.display = 'none'
    }
  })

  const container = document.createElement('div')
  container.style.cssText = `
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
  `

  const icon = document.createElement('span')
  icon.textContent = '🚫'
  icon.style.fontSize = '14px'

  const text = document.createElement('span')
  text.textContent = `已屏蔽 ${domain}`

  container.appendChild(icon)
  container.appendChild(text)
  container.appendChild(hideButton)
  indicator.appendChild(container)

  return indicator
}

// 应用不同的屏蔽模式
function applyBlockMode(element: Element, domain: string, mode: 'hide' | 'dim' | 'replace') {
  switch (mode) {
    case 'hide':
      element.style.display = 'none'
      break

    case 'dim':
      element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'
      element.style.opacity = '0.3'
      element.style.transform = 'scale(0.95)'
      element.style.filter = 'grayscale(100%)'

      // 添加屏蔽提示
      const dimIndicator = createBlockedIndicator(domain)
      element.insertBefore(dimIndicator, element.firstChild)
      break

    case 'replace':
      // 保存原始内容
      const originalContent = element.innerHTML
      element.setAttribute('data-zearch-original', originalContent)

      // 创建替换内容
      const replaceContainer = document.createElement('div')
      replaceContainer.style.cssText = `
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `

      const icon = document.createElement('div')
      icon.textContent = '🚫'
      icon.style.cssText = 'font-size: 24px; margin-bottom: 8px;'

      const title = document.createElement('div')
      title.textContent = '已屏蔽网站'
      title.style.cssText = 'font-weight: 600; margin-bottom: 4px;'

      const domainText = document.createElement('div')
      domainText.textContent = domain
      domainText.style.cssText = 'font-size: 14px; margin-bottom: 12px;'

      const showButton = document.createElement('button')
      showButton.textContent = '显示内容'
      showButton.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      `

      // 添加点击事件处理
      showButton.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const original = element.getAttribute('data-zearch-original')
        if (original) {
          element.innerHTML = original
          element.removeAttribute('data-zearch-original')
          element.removeAttribute('data-zearch-blocked')
        }
      })

      replaceContainer.appendChild(icon)
      replaceContainer.appendChild(title)
      replaceContainer.appendChild(domainText)
      replaceContainer.appendChild(showButton)

      // 替换内容
      element.innerHTML = ''
      element.appendChild(replaceContainer)
      break
  }
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

  // 使用更精确的选择器来匹配Google搜索结果，避免选择到Chrome UI
  const selectors = [
    '#search .g', // 主要搜索结果
    '#search div[data-hveid]', // 新的搜索结果容器
    '#rso .g', // 搜索结果组中的结果
    '#rso > div > div', // 搜索结果的直接子元素
    '.srg > .g', // 搜索结果组中的结果
    '.rc', // 结果容器
    '[data-ved][jsaction*="click"]' // 带有特定属性的可点击元素
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

    // 过滤掉Chrome UI元素和非搜索结果元素
    if (isUIElement(result)) return;

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
        let shouldBlock = false

        // 默认所有规则都是正则表达式
        try {
          const regex = new RegExp(site.domain, 'i')
          shouldBlock = regex.test(hostname)
        } catch (error) {
          console.warn('Zearch: Invalid regex pattern:', site.domain)
          continue
        }

        if (shouldBlock) {
          // 根据屏蔽模式应用不同的处理
          const displayName = site.description || site.domain
          applyBlockMode(result, displayName, settings.blockMode)

          // 标记为已屏蔽
          result.setAttribute('data-zearch-blocked', site.domain)

          // 更新统计
          updateStats(site.domain)
          blockedCount++

          console.log(`Zearch: Blocked ${hostname} using regex: ${site.domain}`)
          break;
        }
      }
    } catch (error) {
      console.warn('Zearch: Error processing URL:', url, error)
    }
  });

  if (blockedCount > 0) {
    console.log(`Zearch: Blocked ${blockedCount} results`)

    // 发送通知消息到background script (使用防抖)
    if (settings.showNotifications) {
      // 累积通知数据
      const blockedElements = document.querySelectorAll('[data-zearch-blocked]')
      blockedElements.forEach(element => {
        const domain = element.getAttribute('data-zearch-blocked')
        if (domain) {
          const site = settings.blockedSites.find(s => s.domain === domain)
          const displayName = site?.description || domain
          pendingNotifications[displayName] = (pendingNotifications[displayName] || 0) + 1
        }
      })

      // 清除之前的定时器
      if (notificationTimeout) {
        clearTimeout(notificationTimeout)
      }

      // 设置新的定时器，延迟发送通知
      notificationTimeout = setTimeout(() => {
        const totalBlocked = Object.values(pendingNotifications).reduce((sum, count) => sum + count, 0)
        const domains = Object.keys(pendingNotifications)

        if (totalBlocked > 0) {
          const message = domains.length === 1
            ? `已屏蔽 ${totalBlocked} 个来自 ${domains[0]} 的搜索结果`
            : `已屏蔽 ${totalBlocked} 个来自 ${domains.length} 个网站的搜索结果`

          chrome.runtime.sendMessage({
            action: 'showNotification',
            domain: domains.join(', '),
            count: totalBlocked,
            message: message
          }).catch(() => {
            // 忽略错误
          })
        }

        // 清空待发送通知
        pendingNotifications = {}
      }, 1000) // 1秒后发送通知
    }
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

    // 恢复样式
    element.style.display = ''
    element.style.opacity = ''
    element.style.transform = ''
    element.style.filter = ''
    element.style.transition = ''

    // 恢复替换模式的原始内容
    const originalContent = element.getAttribute('data-zearch-original')
    if (originalContent) {
      element.innerHTML = originalContent
      element.removeAttribute('data-zearch-original')
    }

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

