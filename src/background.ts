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
    id: 'zearch-block-domain',
    title: '屏蔽此域名',
    contexts: ['link']
  })
})

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'zearch-block-domain' && info.linkUrl) {
    try {
      const url = new URL(info.linkUrl)
      const domain = url.hostname.toLowerCase()

      const success = await storageManager.addBlockedSite(domain)
      if (success) {
        // 通知用户
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'Zearch',
          message: `已添加 ${domain} 到屏蔽列表`
        })

        // 刷新当前标签页以应用屏蔽
        if (tab?.id) {
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
    } catch (error) {
      console.error('Zearch: Failed to block domain', error)
    }
  }
})

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    // 返回当前设置
    const settings = storageManager.getSettings()
    sendResponse(settings)
  } else if (message.action === 'updateStats') {
    // 更新统计数据
    storageManager.updateBlockStats(message.domain)
  }
})

// 监听标签页更新，在Google搜索页面注入内容脚本
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url)

    // 检查是否是Google搜索页面
    if (url.hostname.includes('google.') && url.pathname === '/search') {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['contents/block-site.js']
      }).catch(error => {
        console.error('Zearch: Failed to inject content script', error)
      })
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
    chrome.tabs.query({ url: '*://www.google.*/search*' }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsChanged',
            changes
          }).catch(() => {
            // 忽略错误，可能是标签页还没有加载内容脚本
          })
        }
      })
    })
  }
})

console.log('Zearch: Background script loaded')
