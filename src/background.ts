// Background script for Zearch extension

import { storageManager } from "./utils/storage"

// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {

  // Initialize storage
  try {
    await storageManager.loadSettings()
  } catch (error) {
    console.error('Zearch: Failed to initialize settings', error)
  }

  // Set up context menus
  chrome.contextMenus.create({
    id: 'zearch-block-current-domain',
    title: 'Block Website Domain',
    contexts: ['page', 'selection', 'image', 'video', 'audio']
  })

  chrome.contextMenus.create({
    id: 'zearch-block-link-domain',
    title: 'Block Link Domain',
    contexts: ['link']
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let targetUrl = null
  let domain = null

  try {
    // Handle blocking current website domain
    if (info.menuItemId === 'zearch-block-current-domain' && tab?.url) {
      targetUrl = tab.url
      const url = new URL(targetUrl)
      domain = url.hostname.toLowerCase()
    }
    // Handle blocking link domain
    else if (info.menuItemId === 'zearch-block-link-domain' && info.linkUrl) {
      targetUrl = info.linkUrl
      const url = new URL(targetUrl)
      domain = url.hostname.toLowerCase()
    }

    if (domain) {
      // Filter out domains that should not be blocked
      const excludedDomains = ['chrome://', 'chrome-extension://', 'moz-extension://', 'edge://', 'about:', 'file://']
      const isExcluded = excludedDomains.some(excluded => targetUrl.startsWith(excluded))

      if (isExcluded) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'Zearch',
          message: 'Cannot block system pages or extension pages'
        })
        return
      }

      const success = await storageManager.addBlockedSite(domain)
      if (success) {
        // Notify user
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'Zearch',
          message: `Added ${domain} to block list`
        })

        // If blocking current page, ask whether to close tab
        if (info.menuItemId === 'zearch-block-current-domain' && tab?.id) {
          // Can choose to close current tab or refresh page
          // Here we choose to refresh page to let user see blocking effect
          chrome.tabs.reload(tab.id)
        }
      } else {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon.png',
          title: 'Zearch',
          message: `${domain} is already in block list`
        })
      }
    }
  } catch (error) {
    console.error('Zearch: Failed to block domain', error)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon.png',
      title: 'Zearch',
      message: 'Failed to block domain, please try again'
    })
  }
})

// Listen for messages from content script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    // Return current settings
    const settings = storageManager.getSettings()
    sendResponse(settings)
  } else if (message.action === 'updateStats') {
    // Update statistics data
    await storageManager.updateBlockStats(message.domain)
  } else if (message.action === 'showNotification') {
    // Show blocking notification
    const settings = storageManager.getSettings()
    if (settings.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon.png',
        title: 'Zearch - Search Results Blocked',
        message: message.message || `Blocked ${message.count} search results`
      })
    }
  }
})

// Plasmo framework automatically injects content scripts, no manual injection needed here
// Just listen for tab updates to handle other logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url)

      // Check if it's a Google search page, send message to content script
      if (url.hostname.includes('google.') && url.pathname === '/search') {
        // Delay sending message to ensure content script is loaded
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'pageLoaded',
            url: tab.url
          }).catch((error) => {
            // Ignore common errors to avoid console warnings
            if (chrome.runtime.lastError) {
              // Clear lastError
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

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (usually handled automatically by manifest, but can add extra logic here)
})

// Listen for storage changes, sync to all tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Notify all Google search tabs that settings have changed
    chrome.tabs.query({ url: '*://www.google.com/search*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'settingsChanged',
              changes
            }).catch((error) => {
              // Ignore common errors to avoid console warnings
              if (chrome.runtime.lastError) {
                chrome.runtime.lastError
              }
            })
          }
        })
      }
    })

    // Also query other Google domains
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
                // Ignore common errors to avoid console warnings
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
