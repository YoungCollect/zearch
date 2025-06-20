export interface BlockedSite {
  domain: string
  blockedCount: number
  addedAt: number
  lastBlocked?: number
  isRegex?: boolean
  description?: string
}

export interface ExtensionSettings {
  isEnabled: boolean
  blockedSites: BlockedSite[]
  totalBlocked: number
  blockMode: 'hide' | 'dim' | 'replace'
  showNotifications: boolean
  searchResultsPerPage: 10 | 20 | 50 | 100
  version: string
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  isEnabled: true,
  blockedSites: [
    // { domain: ".*\\.baidu\\..*", blockedCount: 0, addedAt: Date.now(), isRegex: true, description: "Baidu网站" },
    // { domain: ".*\\.csdn\\..*", blockedCount: 0, addedAt: Date.now(), isRegex: true, description: "CSDN网站" }
  ],
  totalBlocked: 0,
  blockMode: 'hide',
  showNotifications: true,
  searchResultsPerPage: 10,
  version: '0.0.1'
}

export class StorageManager {
  private static instance: StorageManager
  private settings: ExtensionSettings = { ...DEFAULT_SETTINGS }
  private listeners: Array<(settings: ExtensionSettings) => void> = []

  private constructor() {
    this.loadSettings()
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  // Load settings
  async loadSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        // If settings object exists in storage, use it; otherwise use default settings
        const storedSettings = result.settings || {}

        // Merge default settings with stored settings
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...storedSettings,
          // Ensure blockedSites is an array
          blockedSites: storedSettings.blockedSites || DEFAULT_SETTINGS.blockedSites
        }

        // Data migration: add new fields to old data
        this.settings.blockedSites = this.settings.blockedSites.map(site => ({
          ...site,
          addedAt: site.addedAt || Date.now()
        }))

        console.log('Zearch: Settings loaded', this.settings)
        this.notifyListeners()
        resolve(this.settings)
      })
    })
  }

  // 保存设置
  async saveSettings(newSettings: Partial<ExtensionSettings>): Promise<void> {
    return new Promise((resolve) => {
      this.settings = { ...this.settings, ...newSettings }
      chrome.storage.sync.set({ settings: this.settings }, () => {
        console.log('Zearch: Settings saved', this.settings)
        this.notifyListeners()
        resolve()
      })
    })
  }

  // 获取当前设置
  getSettings(): ExtensionSettings {
    return { ...this.settings }
  }

  // Generate regex for website
  generateSiteRegex(input: string): { regex: string, description: string } {
    const trimmed = input.toLowerCase().trim()

    // If input is already in regex format, return directly
    if (trimmed.includes('.*') || trimmed.includes('\\')) {
      return { regex: trimmed, description: `Custom regex: ${trimmed}` }
    }

    // Remove protocol and path
    let domain = trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

    // Remove www prefix
    domain = domain.replace(/^www\./, '')

    // Escape special characters
    const escapedDomain = domain.replace(/\./g, '\\.')

    // Generate regex: match any subdomain and the domain itself
    const regex = `.*\\.${escapedDomain}.*|^${escapedDomain}$`

    return {
      regex,
      description: `${domain} and its subdomains`
    }
  }

  // Add blocked site (use regex by default)
  async addBlockedSite(input: string, description?: string): Promise<boolean> {
    const { regex, description: autoDesc } = this.generateSiteRegex(input)
    const finalDescription = description || autoDesc

    // Check if already exists
    if (this.settings.blockedSites.some(site => site.domain === regex)) {
      return false
    }

    // Validate regex pattern
    try {
      new RegExp(regex)
    } catch (error) {
      console.error('Invalid regex pattern:', regex)
      return false
    }

    const newSite: BlockedSite = {
      domain: regex,
      blockedCount: 0,
      addedAt: Date.now(),
      isRegex: true,
      description: finalDescription
    }

    const newBlockedSites = [...this.settings.blockedSites, newSite]
    await this.saveSettings({ blockedSites: newBlockedSites })
    return true
  }

  // 删除屏蔽网站
  async removeBlockedSite(domain: string): Promise<void> {
    const newBlockedSites = this.settings.blockedSites.filter(
      site => site.domain !== domain
    )
    await this.saveSettings({ blockedSites: newBlockedSites })
  }

  // 更新屏蔽统计
  async updateBlockStats(domain: string): Promise<void> {
    const siteIndex = this.settings.blockedSites.findIndex(
      site => site.domain === domain
    )
    
    if (siteIndex !== -1) {
      const updatedSites = [...this.settings.blockedSites]
      updatedSites[siteIndex] = {
        ...updatedSites[siteIndex],
        blockedCount: updatedSites[siteIndex].blockedCount + 1,
        lastBlocked: Date.now()
      }
      
      await this.saveSettings({
        blockedSites: updatedSites,
        totalBlocked: this.settings.totalBlocked + 1
      })
    }
  }

  // 清除统计数据
  async clearStats(): Promise<void> {
    const resetSites = this.settings.blockedSites.map(site => ({
      ...site,
      blockedCount: 0,
      lastBlocked: undefined
    }))
    
    await this.saveSettings({
      blockedSites: resetSites,
      totalBlocked: 0
    })
  }

  // 切换扩展状态
  async toggleExtension(): Promise<boolean> {
    const newState = !this.settings.isEnabled
    await this.saveSettings({ isEnabled: newState })
    return newState
  }

  // 设置屏蔽模式
  async setBlockMode(mode: 'hide' | 'dim' | 'replace'): Promise<void> {
    await this.saveSettings({ blockMode: mode })
  }

  // 设置搜索结果数量
  async setSearchResultsPerPage(count: 10 | 20 | 50 | 100): Promise<void> {
    await this.saveSettings({ searchResultsPerPage: count })
  }

  // 导出设置
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2)
  }

  // 导入设置
  async importSettings(settingsJson: string): Promise<boolean> {
    try {
      const importedSettings = JSON.parse(settingsJson) as ExtensionSettings
      
      // 验证导入的数据
      if (!importedSettings.blockedSites || !Array.isArray(importedSettings.blockedSites)) {
        throw new Error('Invalid settings format')
      }
      
      await this.saveSettings(importedSettings)
      return true
    } catch (error) {
      console.error('Zearch: Failed to import settings', error)
      return false
    }
  }

  // 添加设置变化监听器
  addListener(listener: (settings: ExtensionSettings) => void): void {
    this.listeners.push(listener)
  }

  // 移除监听器
  removeListener(listener: (settings: ExtensionSettings) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.settings)
      } catch (error) {
        console.error('Zearch: Error in settings listener', error)
      }
    })
  }

  // 获取今日统计
  getTodayStats(): { blocked: number, sites: number } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()
    
    const todayBlocked = this.settings.blockedSites.reduce((total, site) => {
      if (site.lastBlocked && site.lastBlocked >= todayTimestamp) {
        return total + site.blockedCount
      }
      return total
    }, 0)
    
    const activeSites = this.settings.blockedSites.filter(
      site => site.lastBlocked && site.lastBlocked >= todayTimestamp
    ).length
    
    return { blocked: todayBlocked, sites: activeSites }
  }
}

// 导出单例实例
export const storageManager = StorageManager.getInstance()
