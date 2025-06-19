import "./app.css"
import { useState, useEffect } from "react"
import { storageManager, type ExtensionSettings } from "./utils/storage"

function IndexOptions() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [importText, setImportText] = useState("")
  const [showImportExport, setShowImportExport] = useState(false)

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

  // 设置屏蔽模式
  const setBlockMode = async (mode: 'hide' | 'dim' | 'replace') => {
    try {
      await storageManager.setBlockMode(mode)
    } catch (error) {
      console.error('Failed to set block mode:', error)
    }
  }

  // 切换通知
  const toggleNotifications = async () => {
    if (!settings) return
    try {
      await storageManager.saveSettings({
        showNotifications: !settings.showNotifications
      })
    } catch (error) {
      console.error('Failed to toggle notifications:', error)
    }
  }

  // 导出设置
  const exportSettings = () => {
    const settingsJson = storageManager.exportSettings()
    const blob = new Blob([settingsJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zearch-settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入设置
  const importSettings = async () => {
    if (!importText.trim()) {
      alert('请输入设置数据')
      return
    }

    try {
      const success = await storageManager.importSettings(importText)
      if (success) {
        alert('设置导入成功！')
        setImportText('')
        setShowImportExport(false)
      } else {
        alert('设置导入失败，请检查数据格式')
      }
    } catch (error) {
      console.error('Failed to import settings:', error)
      alert('设置导入失败')
    }
  }

  // 重置设置
  const resetSettings = async () => {
    if (!confirm('确定要重置所有设置吗？这将清除所有数据。')) {
      return
    }

    try {
      await storageManager.saveSettings({
        isEnabled: true,
        blockedSites: [],
        totalBlocked: 0,
        blockMode: 'dim',
        showNotifications: true
      })
      alert('设置已重置')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      alert('重置失败')
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Zearch 设置</h1>
              <p className="text-gray-600">管理你的搜索结果屏蔽偏好</p>
            </div>
          </div>
        </div>

        {/* 基本设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本设置</h2>

          {/* 屏蔽模式 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              屏蔽模式
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="blockMode"
                  value="hide"
                  checked={settings.blockMode === 'hide'}
                  onChange={() => setBlockMode('hide')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">完全隐藏</div>
                  <div className="text-sm text-gray-500">完全移除屏蔽的搜索结果</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="blockMode"
                  value="dim"
                  checked={settings.blockMode === 'dim'}
                  onChange={() => setBlockMode('dim')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">变暗显示</div>
                  <div className="text-sm text-gray-500">保留结果但降低透明度和饱和度</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="blockMode"
                  value="replace"
                  checked={settings.blockMode === 'replace'}
                  onChange={() => setBlockMode('replace')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">替换提示</div>
                  <div className="text-sm text-gray-500">用屏蔽提示替换原始内容</div>
                </div>
              </label>
            </div>
          </div>

          {/* 通知设置 */}
          <div className="mb-6">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">显示屏蔽通知</div>
                <div className="text-sm text-gray-500">在屏蔽网站时显示通知</div>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showNotifications ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showNotifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">统计信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{settings.totalBlocked}</div>
              <div className="text-sm text-gray-600">总计屏蔽</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{settings.blockedSites.length}</div>
              <div className="text-sm text-gray-600">屏蔽网站</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {settings.blockedSites.reduce((sum, site) => sum + site.blockedCount, 0)}
              </div>
              <div className="text-sm text-gray-600">活跃屏蔽</div>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据管理</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">导入/导出设置</div>
                <div className="text-sm text-gray-500">备份或恢复你的设置</div>
              </div>
              <button
                onClick={() => setShowImportExport(!showImportExport)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {showImportExport ? '隐藏' : '显示'}
              </button>
            </div>

            {showImportExport && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <button
                      onClick={exportSettings}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      导出设置
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      导入设置
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="粘贴设置JSON数据..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={importSettings}
                      className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      导入设置
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <div className="font-medium text-gray-700">重置所有设置</div>
                <div className="text-sm text-gray-500">清除所有数据并恢复默认设置</div>
              </div>
              <button
                onClick={resetSettings}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">关于</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>版本:</strong> {settings.version}</p>
            <p><strong>开发者:</strong> Andy</p>
            <p><strong>描述:</strong> 一个用于屏蔽Google搜索结果中特定网站的Chrome扩展</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexOptions
