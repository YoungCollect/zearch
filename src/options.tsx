import "./app.css"
import { useState, useEffect } from "react"
import { storageManager, type ExtensionSettings } from "./utils/storage"

function IndexOptions() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [importText, setImportText] = useState("")
  const [showImportExport, setShowImportExport] = useState(false)

  // Load settings
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

    // Listen for settings changes
    const handleSettingsChange = (newSettings: ExtensionSettings) => {
      setSettings(newSettings)
    }

    storageManager.addListener(handleSettingsChange)

    return () => {
      storageManager.removeListener(handleSettingsChange)
    }
  }, [])

  // Set blocking mode
  const setBlockMode = async (mode: 'hide' | 'dim' | 'replace') => {
    try {
      await storageManager.setBlockMode(mode)
    } catch (error) {
      console.error('Failed to set block mode:', error)
    }
  }

  // Toggle notifications
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

  // Set search results count
  const setSearchResultsPerPage = async (count: 10 | 20 | 50 | 100) => {
    try {
      await storageManager.setSearchResultsPerPage(count)
      console.log('Search results per page set to:', count)
    } catch (error) {
      console.error('Failed to set search results per page:', error)
      alert("Setting failed, please try again")
    }
  }

  // Export settings
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

  // Import settings
  const importSettings = async () => {
    if (!importText.trim()) {
      alert('Please enter settings data')
      return
    }

    try {
      const success = await storageManager.importSettings(importText)
      if (success) {
        alert('Settings imported successfully!')
        setImportText('')
        setShowImportExport(false)
      } else {
        alert('Failed to import settings, please check data format')
      }
    } catch (error) {
      console.error('Failed to import settings:', error)
      alert('Failed to import settings')
    }
  }

  // Reset settings
  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings? This will clear all data.')) {
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
      alert('Settings have been reset')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      alert('Failed to reset settings')
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-gray-600 font-medium text-lg">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-3xl shadow-2xl p-8 mb-8 slide-in">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg float-animation">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M21.21,10.29,19.48,8.57a4.37,4.37,0,0,0,.65-2.26,4.31,4.31,0,1,0-4.32,4.32A4.35,4.35,0,0,0,18.07,10l1.72,1.73a1,1,0,0,0,1.42,0A1,1,0,0,0,21.21,10.29ZM17.45,8A2.32,2.32,0,0,1,13.5,6.31a2.29,2.29,0,0,1,.68-1.63,2.32,2.32,0,0,1,3.27,0,2.31,2.31,0,0,1,0,3.27ZM19.5,14a1,1,0,0,0-1.22.72A7,7,0,0,1,11.5,20H5.91l.64-.63a1,1,0,0,0,0-1.41,7,7,0,0,1-2-5A7,7,0,0,1,8.87,6.52a1,1,0,1,0-.74-1.86,9,9,0,0,0-3.66,14L2.79,20.29a1,1,0,0,0-.21,1.09A1,1,0,0,0,3.5,22h8a9,9,0,0,0,8.72-6.75A1,1,0,0,0,19.5,14Z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Zearch Settings</h1>
              <p className="text-blue-100 text-lg">Manage your intelligent search filtering preferences</p>
            </div>
          </div>
        </div>

        {/* Basic Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Basic Settings</h2>
          </div>

          {/* Blocking Mode */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Blocking Mode
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
                <div className="font-semibold text-gray-900 mb-2">Complete Hide</div>
                <div className="text-sm text-gray-600">Completely remove blocked search results, keeping the page clean</div>
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
                <div className="font-semibold text-gray-900 mb-2">Dim Display</div>
                <div className="text-sm text-gray-600">Keep results but reduce opacity for easy identification</div>
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
                <div className="font-semibold text-gray-900 mb-2">Replace Notification</div>
                <div className="text-sm text-gray-600">Replace original content with blocking notification</div>
              </label>
            </div>
          </div>

          {/* Search Results Count Settings */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Search Results Per Page
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
                      results
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
              Settings will take effect on next search
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l6.586 6.586a2 2 0 002.828 0l6.586-6.586A2 2 0 0019.414 5H4.586A2 2 0 003.172 7z" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-800 text-lg">Show Block Notifications</div>
                  <div className="text-sm text-gray-600">Display desktop notifications when blocking websites</div>
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

        {/* Statistics */}
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100/50 p-8 mb-8 card-hover slide-in">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-6 h-6 text-blue-600 float-animation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Statistics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50 card-hover">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full pulse-glow"></div>
                <div className="text-sm font-medium text-blue-700">Total Blocked</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent float-animation">
                {settings.totalBlocked}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200/50 card-hover">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full pulse-glow"></div>
                <div className="text-sm font-medium text-emerald-700">Block Rules</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent float-animation">
                {settings.blockedSites.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50 card-hover">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full pulse-glow"></div>
                <div className="text-sm font-medium text-purple-700">Cumulative Blocks</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent float-animation">
                {settings.blockedSites.reduce((sum, site) => sum + site.blockedCount, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100/50 p-8 mb-8 card-hover slide-in">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-6 h-6 text-blue-600 float-animation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">Import/Export Settings</div>
                    <div className="text-sm text-gray-600">Backup or restore your configuration data</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportExport(!showImportExport)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {showImportExport ? 'Hide' : 'Show'}
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
                      <span>Export Settings</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Import Settings
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste settings JSON data..."
                      className="w-full h-40 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white custom-scrollbar"
                    />
                    <button
                      onClick={importSettings}
                      className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>Import Settings</span>
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
                    <div className="font-semibold text-gray-800 text-lg">Reset All Settings</div>
                    <div className="text-sm text-gray-600">Clear all data and restore default settings</div>
                  </div>
                </div>
                <button
                  onClick={resetSettings}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100/50 p-8 card-hover slide-in">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-6 h-6 text-blue-600 float-animation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">About</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-semibold text-blue-800">Version</span>
              </div>
              <p className="text-lg font-bold text-blue-700">v0.0.1</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold text-emerald-800">Developer</span>
              </div>
              <p className="text-lg font-bold text-emerald-700">Andy</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-semibold text-purple-800">Type</span>
              </div>
              <p className="text-sm font-medium text-purple-700">Chrome Extension</p>
            </div>
          </div>
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/50">
            <p className="text-gray-700 leading-relaxed">
              <strong className="text-gray-900">Zearch</strong> is an intelligent search result filter that helps you block unwanted websites, making your search experience cleaner and more efficient. It supports multiple blocking modes, giving you complete control over how search results are displayed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexOptions
