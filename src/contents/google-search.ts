import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.google.com/search*", "https://google.com/search*"],
  run_at: "document_start"
}

// 获取存储的设置
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || { searchResultsPerPage: 10 }
      resolve(settings)
    })
  })
}

// 处理搜索结果数量
async function handleSearchResultsCount() {
  try {
    const settings: any = await getSettings()
    const targetNum = settings.searchResultsPerPage || 10
    
    const url = new URL(window.location.href)
    const currentNum = url.searchParams.get('num')
    
    console.log('Google Search - Current num:', currentNum, 'Target num:', targetNum)
    
    // 如果当前数量与设置不符，则修改 URL
    if (currentNum !== targetNum.toString()) {
      url.searchParams.set('num', targetNum.toString())
      
      // 使用 history.replaceState 避免重定向循环
      if (url.href !== window.location.href) {
        console.log('Updating URL to:', url.href)
        window.history.replaceState({}, '', url.href)
        
        // 重新加载页面以应用新的搜索结果数量
        window.location.reload()
      }
    }
  } catch (error) {
    console.error('Failed to handle search results count:', error)
  }
}

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    console.log('Settings changed, reprocessing search results')
    setTimeout(handleSearchResultsCount, 100)
  }
})

// 初始化
handleSearchResultsCount()

// 监听 Google 的 AJAX 导航
let lastUrl = location.href
const observer = new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl && url.includes('/search')) {
    lastUrl = url
    console.log('Google navigation detected:', url)
    setTimeout(handleSearchResultsCount, 200)
  }
})

// 等待页面加载完成后开始观察
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document, { subtree: true, childList: true })
  })
} else {
  observer.observe(document, { subtree: true, childList: true })
}
