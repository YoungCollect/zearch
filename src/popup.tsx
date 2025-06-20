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
    
    // Listen for settings changes
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
      alert("Failed to add domain, please try again")
    }
  }

  const removeDomain = async (domain: string) => {
    try {
      await storageManager.removeBlockedSite(domain)
    } catch (error) {
      console.error('Failed to remove domain:', error)
      alert("Failed to remove domain, please try again")
    }
  }

  const clearStats = async () => {
    try {
      await storageManager.clearStats()
    } catch (error) {
      console.error('Failed to clear stats:', error)
      alert("Failed to clear statistics, please try again")
    }
  }

  const setSearchResultsPerPage = async (count: 10 | 20 | 50 | 100) => {
    try {
      await storageManager.setSearchResultsPerPage(count)
      console.log('Search results per page set to:', count)
    } catch (error) {
      console.error('Failed to set search results per page:', error)
      alert("Failed to update settings, please try again")
    }
  }

  if (loading || !settings) {
    return (
      <div className="w-80 bg-white flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white shadow-lg border border-gray-200">
      {/* Header */}
      <div className="bg-primary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M21.21,10.29,19.48,8.57a4.37,4.37,0,0,0,.65-2.26,4.31,4.31,0,1,0-4.32,4.32A4.35,4.35,0,0,0,18.07,10l1.72,1.73a1,1,0,0,0,1.42,0A1,1,0,0,0,21.21,10.29ZM17.45,8A2.32,2.32,0,0,1,13.5,6.31a2.29,2.29,0,0,1,.68-1.63,2.32,2.32,0,0,1,3.27,0,2.31,2.31,0,0,1,0,3.27ZM19.5,14a1,1,0,0,0-1.22.72A7,7,0,0,1,11.5,20H5.91l.64-.63a1,1,0,0,0,0-1.41,7,7,0,0,1-2-5A7,7,0,0,1,8.87,6.52a1,1,0,1,0-.74-1.86,9,9,0,0,0-3.66,14L2.79,20.29a1,1,0,0,0-.21,1.09A1,1,0,0,0,3.5,22h8a9,9,0,0,0,8.72-6.75A1,1,0,0,0,19.5,14Z" fill="currentColor"/>
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
        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="text-xl font-bold text-primary">{settings.totalBlocked}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Rules</p>
              <p className="text-xl font-bold text-gray-700">{settings.blockedSites.length}</p>
            </div>
          </div>
        </div>

        {/* Search Results Per Page Setting */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Results Per Page</p>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100].map((count) => (
              <button
                key={count}
                onClick={() => setSearchResultsPerPage(count as 10 | 20 | 50 | 100)}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  settings.searchResultsPerPage === count
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Settings will take effect on next search
          </p>
        </div>

        {/* Add New Domain */}
        <div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="Enter domain or keyword"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 ring-primary focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
            />
            <button
              onClick={addDomain}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm bg-primary-hover focus:outline-none focus:ring-2 ring-primary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Blocked List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Blocked List</h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-primary text-primary-hover"
            >
              {showSettings ? 'Hide' : 'Settings'}
            </button>
          </div>

          {showSettings && (
            <div className="mb-3 p-3 bg-gray-50 rounded text-xs space-y-3 border border-gray-200">
              <button
                onClick={clearStats}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Clear Statistics
              </button>
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="text-primary hover:text-primary-hover font-medium block"
              >
                Advanced Settings
              </button>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-1">
            {settings.blockedSites.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No blocked sites yet
              </div>
            ) : (
              settings.blockedSites.map((site) => (
                <div
                  key={site.domain}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {site.description || site.domain}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded font-mono truncate" title={site.domain}>
                        {site.domain}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Blocked {site.blockedCount} times
                    </p>
                  </div>
                  <button
                    onClick={() => removeDomain(site.domain)}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors ml-2 flex-shrink-0"
                  >
                    Remove
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
