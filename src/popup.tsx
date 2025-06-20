import "./app.css"
import { useState, useEffect } from "react"
import { storageManager, type ExtensionSettings, type BlockedSite } from "./utils/storage"

function IndexPopup() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadSettings()
    
    // 监听设置变化
    const unsubscribe = storageManager.addListener((newSettings) => {
      setSettings(newSettings)
    })

    return unsubscribe
  }, [])

  const loadSettings = async () => {
    try {
      const loadedSettings = await storageManager.loadSettings()
      setSettings(loadedSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExtension = async () => {
    if (!settings) return
    try {
      await storageManager.saveSettings({
        isEnabled: !settings.isEnabled
      })
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim() || !settings) return
    
    try {
      await storageManager.addBlockedSite(newDomain.trim())
      setNewDomain("")
    } catch (error) {
      console.error('Failed to add domain:', error)
      alert("添加失败，请重试")
    }
  }

  const removeDomain = async (domain: string) => {
    try {
      await storageManager.removeBlockedSite(domain)
    } catch (error) {
      console.error('Failed to remove domain:', error)
      alert("删除失败，请重试")
    }
  }

  const clearStats = async () => {
    try {
      await storageManager.clearStats()
    } catch (error) {
      console.error('Failed to clear stats:', error)
      alert("清除统计失败，请重试")
    }
  }

  const setSearchResultsPerPage = async (count: 10 | 20 | 50 | 100) => {
    try {
      await storageManager.setSearchResultsPerPage(count)
      console.log('Search results per page set to:', count)
    } catch (error) {
      console.error('Failed to set search results per page:', error)
      alert("设置失败，请重试")
    }
  }

  if (loading || !settings) {
    return (
      <div className="w-80 bg-white flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-gray-500 text-sm">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white shadow-lg border border-gray-200">
      {/* 头部 */}
      <div className="bg-blue-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">Zearch</h1>
          </div>
          <button
            onClick={toggleExtension}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              settings.isEnabled ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 rounded-full bg-white transition-transform duration-200 ${
                settings.isEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 统计信息 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">已屏蔽</p>
              <p className="text-xl font-bold text-blue-600">{settings.totalBlocked}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">规则数</p>
              <p className="text-xl font-bold text-gray-700">{settings.blockedSites.length}</p>
            </div>
          </div>
        </div>

        {/* 搜索结果数量设置 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">每页搜索结果</p>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100].map((count) => (
              <button
                key={count}
                onClick={() => setSearchResultsPerPage(count as 10 | 20 | 50 | 100)}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  settings.searchResultsPerPage === count
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 设置将在下次搜索时生效
          </p>
        </div>

        {/* 添加新域名 */}
        <div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="输入域名或关键词"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
            />
            <button
              onClick={addDomain}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              添加
            </button>
          </div>
        </div>

        {/* 屏蔽列表 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">屏蔽列表</h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showSettings ? '隐藏' : '设置'}
            </button>
          </div>
          
          {showSettings && (
            <div className="mb-3 p-2 bg-blue-50 rounded text-xs space-y-2">
              <button
                onClick={clearStats}
                className="text-red-600 hover:text-red-800"
              >
                清除统计
              </button>
              <br />
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="text-blue-600 hover:text-blue-800"
              >
                高级设置
              </button>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-1">
            {settings.blockedSites.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                暂无屏蔽网站
              </div>
            ) : (
              settings.blockedSites.map((site) => (
                <div
                  key={site.domain}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {site.description || site.domain}
                    </p>
                    <p className="text-xs text-gray-500">
                      已屏蔽 {site.blockedCount} 次
                    </p>
                  </div>
                  <button
                    onClick={() => removeDomain(site.domain)}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
