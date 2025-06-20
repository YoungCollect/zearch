import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.google.com/search*", "https://google.com/search*"],
  run_at: "document_start"
}

// Get stored settings
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || { searchResultsPerPage: 10 }
      resolve(settings)
    })
  })
}

// Handle search results count
async function handleSearchResultsCount() {
  try {
    const settings: any = await getSettings()
    const targetNum = settings.searchResultsPerPage || 10

    const url = new URL(window.location.href)
    const currentNum = url.searchParams.get('num')

    // If current count doesn't match settings, modify URL
    if (currentNum !== targetNum.toString()) {
      url.searchParams.set('num', targetNum.toString())

      // Use history.replaceState to avoid redirect loops
      if (url.href !== window.location.href) {
        window.history.replaceState({}, '', url.href)

        // Reload page to apply new search results count
        window.location.reload()
      }
    }
  } catch (error) {
    console.error('Failed to handle search results count:', error)
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    setTimeout(handleSearchResultsCount, 100)
  }
})

// Initialize
handleSearchResultsCount()

// Listen for Google AJAX navigation
let lastUrl = location.href
const observer = new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl && url.includes('/search')) {
    lastUrl = url
    setTimeout(handleSearchResultsCount, 200)
  }
})

// Wait for page load completion before starting observation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document, { subtree: true, childList: true })
  })
} else {
  observer.observe(document, { subtree: true, childList: true })
}
