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

  // 设置搜索结果数量
  const setSearchResultsPerPage = async (count: 10 | 20 | 50 | 100) => {
    try {
      await storageManager.setSearchResultsPerPage(count)
      console.log('Search results per page set to:', count)
    } catch (error) {
      console.error('Failed to set search results per page:', error)
      alert("设置失败，请重试")
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
        blockMode: 'hide',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-gray-600 font-medium text-lg">加载设置中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-3xl shadow-2xl p-8 mb-8 slide-in">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg float-animation">
              <svg width="32" height="32" viewBox="0 0 128 128" fill="none" className="text-white">
                <g transform="translate(64, 64) scale(0.8, 0.8) translate(-50, -50)" fill="currentColor">
                  <path d="M29.909,69.133c0.018,0,0.036-0.002,0.055-0.006c0.119-0.026,0.204-0.132,0.203-0.253   c-0.094-11.138-7.314-46.228-7.387-46.582c-0.024-0.114-0.122-0.199-0.239-0.205c-0.114-0.013-0.223,0.067-0.259,0.179   c-5.52,17.284,7.262,46.422,7.391,46.715C29.716,69.075,29.809,69.133,29.909,69.133z"/>
                  <path d="M94.923,31.804c0.084-0.082,0.101-0.211,0.043-0.312c-0.059-0.102-0.178-0.15-0.292-0.12   c-0.244,0.067-21.556,5.941-34.019,10.985l2.217-2.265c5.904-1.61,21.052-6.324,28.944-14.157c0.088-0.087,0.101-0.224,0.032-0.326   c-0.07-0.103-0.202-0.143-0.315-0.093c-0.205,0.088-16.577,7.13-25.971,11.827l2.936-3c5.317-1.868,18.494-7.109,23.174-14.588   c0.062-0.099,0.049-0.228-0.03-0.313c-0.08-0.085-0.207-0.106-0.31-0.05c-0.147,0.079-10.917,5.912-18.732,10.762l5.231-5.344   c3.952-2.477,15.735-10.15,16.156-13.833c0.011-0.099-0.035-0.195-0.119-0.248c-0.084-0.051-0.191-0.051-0.275,0.002   c-0.123,0.079-12.381,7.977-17.359,14.48c-0.039,0.051-0.054,0.113-0.05,0.174c-1.35,1.197-2.697,2.398-4.04,3.604   c5.345-6.31,10.61-18.48,10.665-18.609c0.039-0.091,0.022-0.197-0.043-0.272c-0.066-0.074-0.169-0.106-0.264-0.077   c-4.192,1.198-11.268,18.821-11.567,19.57c-0.046,0.115-0.004,0.246,0.101,0.313c0.02,0.013,0.043,0.012,0.064,0.019   c-1.405,1.266-2.811,2.531-4.209,3.805C71.145,26.622,78.857,8.694,78.94,8.5c0.046-0.108,0.014-0.232-0.078-0.304   c-0.092-0.072-0.221-0.073-0.314-0.003c-8.844,6.712-12.952,26.523-12.993,26.722c-0.002,0.009,0.005,0.017,0.004,0.027   c-0.141,0.129-0.285,0.256-0.426,0.385c-1.528,1.403-3.039,2.825-4.559,4.236c3.313-7.537,10.5-31.503,10.576-31.756   c0.035-0.119-0.018-0.245-0.128-0.302c-0.11-0.057-0.244-0.028-0.321,0.069c-8.616,10.947-11.068,32.661-11.091,32.88   c0,0.002,0.001,0.003,0.001,0.005c-1.27,1.183-2.548,2.356-3.811,3.546c4.411-11.824,9.476-37.226,9.529-37.493   c0.023-0.115-0.035-0.231-0.14-0.282c-0.105-0.051-0.232-0.024-0.308,0.064c-7.394,8.645-9.839,34.969-10.155,38.74   c-1.267,1.199-2.52,2.413-3.778,3.622c3.499-11.631,7.209-40.126,7.247-40.424c0.015-0.117-0.051-0.229-0.161-0.273   c-0.109-0.043-0.234-0.007-0.304,0.089c-7.582,10.476-7.7,38.247-7.687,41.475c-1.036,0.998-2.086,1.98-3.115,2.986   c-0.531,0.508-1.052,1.026-1.574,1.542c2.992-11.111,5.987-43.31,6.018-43.641c0.011-0.118-0.06-0.228-0.172-0.267   c-0.111-0.04-0.235,0.003-0.3,0.102c-10.059,15.315-6.286,44.198-6.247,44.488c0,0.001,0.002,0.002,0.002,0.003   c-0.728,0.723-1.454,1.449-2.185,2.169c-0.733,0.723-1.452,1.46-2.18,2.188c2.182-11.979,2.8-45.646,2.806-45.995   c0.002-0.117-0.075-0.221-0.188-0.253c-0.112-0.031-0.232,0.017-0.292,0.118c-8.721,14.869-3.678,43.781-3.098,46.904   c-0.488,0.493-0.986,0.976-1.469,1.474l-2.286,2.339c0.323-12.084-4.323-45.625-4.372-45.972c-0.016-0.116-0.108-0.206-0.225-0.22   c-0.114-0.017-0.227,0.052-0.27,0.161c-6.232,15.86,2.962,43.202,4.194,46.718l-1.421,1.454l-4.312,4.548   c-0.972,1.044-1.933,2.098-2.896,3.151c-1.649-11.24-10.892-40.698-10.988-41.005c-0.035-0.112-0.142-0.191-0.258-0.18   c-0.117,0.005-0.216,0.089-0.24,0.204C11.799,47.591,23.7,70.358,25.811,74.231c-1.12,1.23-2.228,2.473-3.333,3.719   c-2.873-9.995-13.49-33.643-13.603-33.894c-0.048-0.107-0.162-0.169-0.278-0.148c-0.115,0.02-0.203,0.114-0.214,0.231   C7.226,56.955,18.762,74.48,21.746,78.771c-0.461,0.523-0.921,1.048-1.378,1.574C16.739,72.866,5.591,56.16,5.472,55.981   c-0.065-0.098-0.189-0.139-0.298-0.101c-0.111,0.038-0.182,0.146-0.173,0.263c0.758,9.911,11.563,21.729,14.708,24.974   c-2.322,2.691-4.607,5.417-6.818,8.212c-0.006,0.007-0.015,0.019-0.02,0.026c-0.427,0.569-0.311,1.376,0.258,1.803   s1.376,0.311,1.803-0.258l0.007-0.01c2.087-2.784,4.256-5.511,6.465-8.21c1.318,0.957,15.575,11.114,26.507,11.114   c0.482,0,0.958-0.02,1.425-0.061c0.117-0.01,0.212-0.098,0.231-0.213c0.02-0.116-0.041-0.23-0.148-0.278   c-0.207-0.094-20.476-9.245-27.637-11.029c0.227-0.276,0.447-0.556,0.675-0.831l1.048-1.07c3.769,1.8,18.238,8.312,30.23,8.312   c2.196,0,4.312-0.219,6.261-0.725c0.113-0.03,0.192-0.132,0.193-0.249c0-0.117-0.078-0.219-0.192-0.25   c-0.267-0.071-25.416-6.701-35.713-7.884l2.775-2.835c4.574,1.519,17.608,5.468,29.521,5.468c4.42,0,8.689-0.545,12.31-1.958   c0.109-0.043,0.176-0.153,0.162-0.27c-0.014-0.116-0.104-0.209-0.22-0.225c-0.305-0.043-28.312-3.982-40.674-4.138l3.751-3.832   c4.085,0.917,14.643,3.023,25.446,3.023c7.202,0,14.51-0.937,20.074-3.786c0.104-0.053,0.159-0.17,0.134-0.285   c-0.025-0.115-0.124-0.197-0.241-0.202c-0.332-0.013-30.81-1.191-44.172-0.017l3.784-3.866c3.542,0.54,10.86,1.478,19.002,1.478   c9.012,0,19.008-1.154,25.914-5.28c0.101-0.06,0.148-0.181,0.115-0.293c-0.033-0.112-0.155-0.187-0.254-0.186   c-0.326,0.009-29.622,0.787-43.271,2.741l4.001-4.088c1.847,0.129,5.07,0.304,9.053,0.304c10.649,0,26.67-1.249,35.945-7.947   c0.095-0.068,0.132-0.193,0.089-0.302c-0.042-0.11-0.152-0.173-0.269-0.163c-0.328,0.037-30.133,3.432-43.337,6.595l3.205-3.275   c7.293-0.028,29.405-0.933,41.286-10.466c0.092-0.074,0.122-0.201,0.073-0.308c-0.049-0.107-0.167-0.167-0.282-0.145   c-0.294,0.056-26.065,4.952-39.072,8.871l4.327-4.421c7.627-0.848,29.763-3.892,38.24-11.35c0.089-0.078,0.113-0.206,0.059-0.31   c-0.054-0.105-0.171-0.16-0.286-0.134c-0.265,0.06-23.288,5.317-35.978,9.715l3.06-3.126   C65.877,43.226,87.669,38.919,94.923,31.804z"/>
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Zearch 设置</h1>
              <p className="text-blue-100 text-lg">管理你的智能搜索过滤偏好</p>
            </div>
          </div>
        </div>

        {/* 基本设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">基本设置</h2>
          </div>

          {/* 屏蔽模式 */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              屏蔽模式
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 ${
                settings.blockMode === 'hide'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}>
                <input
                  type="radio"
                  name="blockMode"
                  value="hide"
                  checked={settings.blockMode === 'hide'}
                  onChange={() => setBlockMode('hide')}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    settings.blockMode === 'hide' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {settings.blockMode === 'hide' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 mb-2">完全隐藏</div>
                <div className="text-sm text-gray-600">完全移除屏蔽的搜索结果，保持页面整洁</div>
              </label>

              <label className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 ${
                settings.blockMode === 'dim'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}>
                <input
                  type="radio"
                  name="blockMode"
                  value="dim"
                  checked={settings.blockMode === 'dim'}
                  onChange={() => setBlockMode('dim')}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    settings.blockMode === 'dim' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {settings.blockMode === 'dim' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 mb-2">变暗显示</div>
                <div className="text-sm text-gray-600">保留结果但降低透明度，便于识别</div>
              </label>

              <label className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 ${
                settings.blockMode === 'replace'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}>
                <input
                  type="radio"
                  name="blockMode"
                  value="replace"
                  checked={settings.blockMode === 'replace'}
                  onChange={() => setBlockMode('replace')}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    settings.blockMode === 'replace' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {settings.blockMode === 'replace' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 mb-2">替换提示</div>
                <div className="text-sm text-gray-600">用屏蔽提示替换原始内容</div>
              </label>
            </div>
          </div>

          {/* 搜索结果数量设置 */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              每页搜索结果数量
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[10, 20, 50, 100].map((count) => (
                <label key={count} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                  settings.searchResultsPerPage === count
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}>
                  <input
                    type="radio"
                    name="searchResultsPerPage"
                    value={count}
                    checked={settings.searchResultsPerPage === count}
                    onChange={() => setSearchResultsPerPage(count as 10 | 20 | 50 | 100)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${
                      settings.searchResultsPerPage === count ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {count}
                    </div>
                    <div className={`text-sm ${
                      settings.searchResultsPerPage === count ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      条结果
                    </div>
                  </div>
                  {settings.searchResultsPerPage === count && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </label>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <svg className="w-4 h-4 text-blue-500 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              设置将在下次搜索时生效
            </div>
          </div>

          {/* 通知设置 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l6.586 6.586a2 2 0 002.828 0l6.586-6.586A2 2 0 0019.414 5H4.586A2 2 0 003.172 7z" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-800 text-lg">显示屏蔽通知</div>
                  <div className="text-sm text-gray-600">在屏蔽网站时显示桌面通知</div>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-lg ${
                  settings.showNotifications
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 shadow-green-200"
                    : "bg-gray-300 shadow-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                    settings.showNotifications ? "translate-x-6 scale-110" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100/50 p-8 mb-8 card-hover slide-in">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-6 h-6 text-blue-600 float-animation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">统计信息</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50 card-hover">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full pulse-glow"></div>
                <div className="text-sm font-medium text-blue-700">总计屏蔽</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent float-animation">
                {settings.totalBlocked}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200/50 card-hover">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full pulse-glow"></div>
                <div className="text-sm font-medium text-emerald-700">屏蔽规则</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent float-animation">
                {settings.blockedSites.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50 card-hover">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full pulse-glow"></div>
                <div className="text-sm font-medium text-purple-700">累计屏蔽</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent float-animation">
                {settings.blockedSites.reduce((sum, site) => sum + site.blockedCount, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100/50 p-8 mb-8 card-hover slide-in">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-6 h-6 text-blue-600 float-animation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">数据管理</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">导入/导出设置</div>
                    <div className="text-sm text-gray-600">备份或恢复你的配置数据</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportExport(!showImportExport)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {showImportExport ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            {showImportExport && (
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-blue-200/50 rounded-2xl p-6 slide-in">
                <div className="space-y-6">
                  <div>
                    <button
                      onClick={exportSettings}
                      className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>导出设置</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      导入设置
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="粘贴设置JSON数据..."
                      className="w-full h-40 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white custom-scrollbar"
                    />
                    <button
                      onClick={importSettings}
                      className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>导入设置</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">重置所有设置</div>
                    <div className="text-sm text-gray-600">清除所有数据并恢复默认设置</div>
                  </div>
                </div>
                <button
                  onClick={resetSettings}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100/50 p-8 card-hover slide-in">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-6 h-6 text-blue-600 float-animation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">关于</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-semibold text-blue-800">版本</span>
              </div>
              <p className="text-lg font-bold text-blue-700">v0.0.1</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold text-emerald-800">开发者</span>
              </div>
              <p className="text-lg font-bold text-emerald-700">Andy</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-semibold text-purple-800">类型</span>
              </div>
              <p className="text-sm font-medium text-purple-700">Chrome 扩展</p>
            </div>
          </div>
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/50">
            <p className="text-gray-700 leading-relaxed">
              <strong className="text-gray-900">Zearch</strong> 是一个智能的搜索结果过滤器，帮助你屏蔽不想看到的网站，让搜索体验更加纯净和高效。支持多种屏蔽模式，让你完全掌控搜索结果的显示方式。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexOptions
