// Background script for Zearch extension

import { storageManager } from "./utils/storage"

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Zearch: Extension installed/updated', details)

  // 初始化存储
  try {
    await storageManager.loadSettings()
    console.log('Zearch: Settings initialized')
  } catch (error) {
    console.error('Zearch: Failed to initialize settings', error)
  }

  // 设置右键菜单
  chrome.contextMenus.create({
    id: 'zearch-block-current-domain',
    title: '屏蔽当前网站域名',
    contexts: ['page', 'selection', 'image', 'video', 'audio']
  })

  chrome.contextMenus.create({
    id: 'zearch-block-link-domain',
    title: '屏蔽链接域名',
    contexts: ['link']
  })
})

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let targetUrl = null
  let domain = null

  try {
    // 处理屏蔽当前网站域名
    if (info.menuItemId === 'zearch-block-current-domain' && tab?.url) {
      targetUrl = tab.url
      const url = new URL(targetUrl)
      domain = url.hostname.toLowerCase()
    }
    // 处理屏蔽链接域名
    else if (info.menuItemId === 'zearch-block-link-domain' && info.linkUrl) {
      targetUrl = info.linkUrl
      const url = new URL(targetUrl)
      domain = url.hostname.toLowerCase()
    }

    if (domain) {
      // 过滤掉一些不应该屏蔽的域名
      const excludedDomains = ['chrome://', 'chrome-extension://', 'moz-extension://', 'edge://', 'about:', 'file://']
      const isExcluded = excludedDomains.some(excluded => targetUrl.startsWith(excluded))

      if (isExcluded) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'Zearch',
          message: '无法屏蔽系统页面或扩展页面'
        })
        return
      }

      const success = await storageManager.addBlockedSite(domain)
      if (success) {
        // 通知用户
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'Zearch',
          message: `已添加 ${domain} 到屏蔽列表`
        })

        // 如果是屏蔽当前页面，询问是否关闭标签页
        if (info.menuItemId === 'zearch-block-current-domain' && tab?.id) {
          // 可以选择关闭当前标签页或者刷新页面
          // 这里我们选择刷新页面，让用户看到屏蔽效果
          chrome.tabs.reload(tab.id)
        }
      } else {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'Zearch',
          message: `${domain} 已在屏蔽列表中`
        })
      }
    }
  } catch (error) {
    console.error('Zearch: Failed to block domain', error)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon.png',
      title: 'Zearch',
      message: '屏蔽域名失败，请重试'
    })
  }
})

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    // 返回当前设置
    const settings = storageManager.getSettings()
    sendResponse(settings)
  } else if (message.action === 'updateStats') {
    // 更新统计数据
    await storageManager.updateBlockStats(message.domain)
  } else if (message.action === 'showNotification') {
    // 显示屏蔽通知
    const settings = storageManager.getSettings()
    if (settings.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon.png',
        title: 'Zearch - 搜索结果已屏蔽',
        message: message.message || `已屏蔽 ${message.count} 个搜索结果`
      })
    }
  }
})

// Plasmo框架会自动注入content script，这里不需要手动注入
// 只需要监听标签页更新来处理其他逻辑
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url)

      // 检查是否是Google搜索页面，发送消息给content script
      if (url.hostname.includes('google.') && url.pathname === '/search') {
        // 延迟一点发送消息，确保content script已加载
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'pageLoaded',
            url: tab.url
          }).catch((error) => {
            // 忽略常见的错误，避免控制台警告
            if (chrome.runtime.lastError) {
              // 清除lastError
              chrome.runtime.lastError
            }
          })
        }, 100)
      }
    } catch (error) {
      console.error('Zearch: Invalid URL', error)
    }
  }
})

// 处理扩展图标点击
chrome.action.onClicked.addListener((tab) => {
  // 打开popup（这通常由manifest自动处理，但可以在这里添加额外逻辑）
  console.log('Zearch: Extension icon clicked')
})

// 监听存储变化，同步到所有标签页
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // 通知所有Google搜索标签页设置已更改
    chrome.tabs.query({ url: '*://www.google.com/search*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'settingsChanged',
              changes
            }).catch((error) => {
              // 忽略常见的错误，避免控制台警告
              if (chrome.runtime.lastError) {
                chrome.runtime.lastError
              }
            })
          }
        })
      }
    })

    // 也查询其他Google域名
    const googleDomains = [
      '*://www.google.co.uk/search*',
      '*://www.google.ca/search*',
      '*://www.google.com.au/search*'
    ]

    googleDomains.forEach(pattern => {
      chrome.tabs.query({ url: pattern }, (tabs) => {
        if (tabs && tabs.length > 0) {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'settingsChanged',
                changes
              }).catch((error) => {
                // 忽略常见的错误，避免控制台警告
                if (chrome.runtime.lastError) {
                  chrome.runtime.lastError
                }
              })
            }
          })
        }
      })
    })
  }
})

console.log('Zearch: Background script loaded')
