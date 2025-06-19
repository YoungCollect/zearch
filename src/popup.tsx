import "./app.css"
import { useState, useEffect } from "react"
import { storageManager, type ExtensionSettings, type BlockedSite } from "./utils/storage"

function IndexPopup() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [isRegex, setIsRegex] = useState(false)
  const [loading, setLoading] = useState(true)

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await storageManager.loadSettings()
        setSettings(currentSettings)
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()

    // 监听设置变化
    const handleSettingsChange = (newSettings: ExtensionSettings) => {
      setSettings(newSettings)
    }

    storageManager.addListener(handleSettingsChange)

    return () => {
      storageManager.removeListener(handleSettingsChange)
    }
  }, [])

  // 切换扩展开关
  const toggleExtension = async () => {
    try {
      const newState = await storageManager.toggleExtension()

      // 通知内容脚本状态变化
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleBlocking',
            enabled: newState
          })
        }
      })
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    }
  }

  // 添加新的屏蔽域名
  const addDomain = async () => {
    if (!newDomain.trim()) return

    try {
      const success = await storageManager.addBlockedSite(newDomain.trim(), isRegex)
      if (success) {
        setNewDomain("")
        setIsRegex(false)
      } else {
        alert(isRegex ? "该正则表达式已存在或无效" : "该域名已存在于屏蔽列表中")
      }
    } catch (error) {
      console.error('Failed to add domain:', error)
      alert("添加失败，请重试")
    }
  }

  // 删除屏蔽域名
  const removeDomain = async (domain: string) => {
    try {
      await storageManager.removeBlockedSite(domain)
    } catch (error) {
      console.error('Failed to remove domain:', error)
      alert("删除域名失败，请重试")
    }
  }

  // 清除统计数据
  const clearStats = async () => {
    try {
      await storageManager.clearStats()
    } catch (error) {
      console.error('Failed to clear stats:', error)
      alert("清除统计失败，请重试")
    }
  }

  if (loading || !settings) {
    return (
      <div className="w-80 p-4 bg-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="w-80 p-4 bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-800">Zearch</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {settings.isEnabled ? "已启用" : "已禁用"}
          </span>
          <button
            onClick={toggleExtension}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.isEnabled ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">总计已屏蔽</p>
            <p className="text-2xl font-bold text-blue-600">{settings.totalBlocked}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">活跃网站</p>
            <p className="text-lg font-semibold text-gray-700">{settings.blockedSites.length}</p>
          </div>
        </div>
        <button
          onClick={clearStats}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          清除统计
        </button>
      </div>

      {/* 添加新域名 */}
      <div className="mb-4">
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder={isRegex ? "输入正则表达式 (如: .*\\.example\\.com)" : "输入要屏蔽的域名"}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
            />
            <button
              onClick={addDomain}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              添加
            </button>
          </div>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={(e) => setIsRegex(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-600">使用正则表达式</span>
            {isRegex && (
              <span className="text-xs text-gray-500">
                (支持复杂匹配模式)
              </span>
            )}
          </label>
        </div>
      </div>

      {/* 屏蔽列表 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          屏蔽列表 ({settings.blockedSites.length})
        </h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {settings.blockedSites.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              暂无屏蔽网站
            </div>
          ) : (
            settings.blockedSites.map((site) => (
              <div
                key={site.domain}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-800">{site.domain}</p>
                    {site.isRegex && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                        正则
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>已屏蔽 {site.blockedCount} 次</span>
                    {site.lastBlocked && (
                      <span>• 最近: {new Date(site.lastBlocked).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeDomain(site.domain)}
                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 底部链接 */}
      <div className="border-t pt-3 flex justify-between text-xs text-gray-500">
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="hover:text-gray-700"
        >
          设置
        </button>
        <span>v0.0.1</span>
      </div>
    </div>
  )
}

export default IndexPopup
