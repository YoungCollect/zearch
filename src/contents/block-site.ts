import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "*://www.google.com/search*",
    "*://www.google.co.uk/search*",
    "*://www.google.ca/search*",
    "*://www.google.com.au/search*",
    "*://www.google.de/search*",
    "*://www.google.fr/search*",
    "*://www.google.it/search*",
    "*://www.google.es/search*",
    "*://www.google.co.jp/search*",
    "*://www.google.co.kr/search*",
    "*://www.google.com.br/search*",
    "*://www.google.ru/search*",
    "*://www.google.com.mx/search*",
    "*://www.google.co.in/search*"
  ],
  run_at: "document_end"
}

import { storageManager, type ExtensionSettings } from "../utils/storage"

// Current settings
let settings: ExtensionSettings | null = null

// Notification debouncing
let notificationTimeout: NodeJS.Timeout | null = null
let pendingNotifications: { [key: string]: number } = {}

// Initialize
async function initialize() {
  try {
    settings = await storageManager.loadSettings()
    console.log('Zearch: Settings loaded', settings)

    // If enabled, start blocking
    if (settings.isEnabled) {
      initializeBlocking()
    }
  } catch (error) {
    console.error('Zearch: Failed to load settings', error)
  }
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleBlocking') {
    if (settings) {
      settings.isEnabled = message.enabled
      if (settings.isEnabled) {
        initializeBlocking()
        blockSites()
      } else {
        cleanup()
      }
    }
  } else if (message.action === 'pageLoaded') {
    // Page loaded, reinitialize
    if (settings && settings.isEnabled) {
      setTimeout(() => {
        blockSites()
      }, 500)
    }
  } else if (message.action === 'settingsChanged') {
    // Settings changed, reload settings
    initialize()
  }
})

// Check if element is UI element (avoid processing Chrome bottom navigation etc.)
function isUIElement(element: Element): boolean {
  // Check if outside search results area
  const searchContainer = document.querySelector('#search, #rso, .srg')
  if (searchContainer && !searchContainer.contains(element)) {
    return true
  }

  // Check if navigation, pagination or other UI elements
  const uiSelectors = [
    '[role="navigation"]',
    '.paging',
    '#botstuff',
    '#bottomads',
    '.commercial-unit-desktop-top',
    '.commercial-unit-desktop-rhs',
    '[data-ved][aria-label*="page"]',
    '[data-ved][aria-label*="next"]',
    '[data-ved][aria-label*="previous"]'
  ]

  for (const selector of uiSelectors) {
    if (element.matches(selector) || element.closest(selector)) {
      return true
    }
  }

  // Check if contains pagination related text
  const text = element.textContent?.toLowerCase() || ''
  const paginationKeywords = ['next', 'previous', 'page']
  if (paginationKeywords.some(keyword => text.includes(keyword)) && text.length < 50) {
    return true
  }

  return false
}

// Start initialization
initialize()

// Debounce function to avoid frequent execution
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Create blocked indicator element
function createBlockedIndicator(domain: string): HTMLElement {
  const indicator = document.createElement('div')
  indicator.className = 'zearch-blocked-indicator'

  const hideButton = document.createElement('button')
  hideButton.textContent = 'Hide'
  hideButton.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    margin-left: auto;
  `

  // Add click event handler
  hideButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Hide the entire search result item
    const resultElement = indicator.closest('[data-zearch-blocked]')
    if (resultElement) {
      resultElement.style.display = 'none'
    }
  })

  const container = document.createElement('div')
  container.style.cssText = `
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 4px 0;
  `

  const icon = document.createElement('span')
  icon.textContent = '🚫'
  icon.style.fontSize = '14px'

  const text = document.createElement('span')
  text.textContent = `Blocked ${domain}`

  container.appendChild(icon)
  container.appendChild(text)
  container.appendChild(hideButton)
  indicator.appendChild(container)

  return indicator
}

// Apply different blocking modes
function applyBlockMode(element: Element, domain: string, mode: 'hide' | 'dim' | 'replace') {
  switch (mode) {
    case 'hide':
      element.style.display = 'none'
      break

    case 'dim':
      element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'
      element.style.opacity = '0.3'
      element.style.transform = 'scale(0.95)'
      element.style.filter = 'grayscale(100%)'

      // Add blocking indicator
      const dimIndicator = createBlockedIndicator(domain)
      element.insertBefore(dimIndicator, element.firstChild)
      break

    case 'replace':
      // Save original content
      const originalContent = element.innerHTML
      element.setAttribute('data-zearch-original', originalContent)

      // Create replacement content
      const replaceContainer = document.createElement('div')
      replaceContainer.style.cssText = `
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `

      const icon = document.createElement('div')
      icon.textContent = '🚫'
      icon.style.cssText = 'font-size: 24px; margin-bottom: 8px;'

      const title = document.createElement('div')
      title.textContent = 'Blocked Website'
      title.style.cssText = 'font-weight: 600; margin-bottom: 4px;'

      const domainText = document.createElement('div')
      domainText.textContent = domain
      domainText.style.cssText = 'font-size: 14px; margin-bottom: 12px;'

      const showButton = document.createElement('button')
      showButton.textContent = 'Show Content'
      showButton.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      `

      // Add click event handler
      showButton.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const original = element.getAttribute('data-zearch-original')
        if (original) {
          element.innerHTML = original
          element.removeAttribute('data-zearch-original')
          element.removeAttribute('data-zearch-blocked')
        }
      })

      replaceContainer.appendChild(icon)
      replaceContainer.appendChild(title)
      replaceContainer.appendChild(domainText)
      replaceContainer.appendChild(showButton)

      // Replace content
      element.innerHTML = ''
      element.appendChild(replaceContainer)
      break
  }
}

// Update statistics
async function updateStats(domain: string) {
  try {
    await storageManager.updateBlockStats(domain)
  } catch (error) {
    console.error('Zearch: Failed to update stats', error)
  }
}

// Blocking function
function blockSites() {
  if (!settings || !settings.isEnabled) return

  // Use more precise selectors to match Google search results, avoiding Chrome UI
  const selectors = [
    '#search .g', // Main search results
    '#search div[data-hveid]', // New search result containers
    '#rso .g', // Results in search result groups
    '#rso > div > div', // Direct children of search results
    '.srg > .g', // Results in search result groups
    '.rc', // Result containers
    '[data-ved][jsaction*="click"]' // Elements with specific attributes
  ];

  let results: NodeListOf<Element> | null = null;

  // Try different selectors
  for (const selector of selectors) {
    results = document.querySelectorAll(selector);
    if (results.length > 0) break;
  }

  if (!results || results.length === 0) return;

  let blockedCount = 0

  results.forEach(result => {
    // Check if already processed
    if (result.hasAttribute('data-zearch-processed')) return;

    // Filter out Chrome UI elements and non-search result elements
    if (isUIElement(result)) return;

    result.setAttribute('data-zearch-processed', 'true')

    const link = result.querySelector('a[href]');
    if (!link) return;

    const url = link.getAttribute('href');
    if (!url) return;

    try {
      // More precise domain matching
      const urlObj = new URL(url, window.location.origin);
      const hostname = urlObj.hostname.toLowerCase();

      for (const site of settings.blockedSites) {
        let shouldBlock = false

        // All rules are regex by default
        try {
          const regex = new RegExp(site.domain, 'i')
          shouldBlock = regex.test(hostname)
        } catch (error) {
          console.warn('Zearch: Invalid regex pattern:', site.domain)
          continue
        }

        if (shouldBlock) {
          // Apply different handling based on blocking mode
          const displayName = site.description || site.domain
          applyBlockMode(result, displayName, settings.blockMode)

          // Mark as blocked
          result.setAttribute('data-zearch-blocked', site.domain)

          // Update statistics
          updateStats(site.domain)
          blockedCount++

          console.log(`Zearch: Blocked ${hostname} using regex: ${site.domain}`)
          break;
        }
      }
    } catch (error) {
      console.warn('Zearch: Error processing URL:', url, error)
    }
  });

  if (blockedCount > 0) {
    console.log(`Zearch: Blocked ${blockedCount} results`)

    // Send notification message to background script (using debounce)
    if (settings.showNotifications) {
      // Accumulate notification data
      const blockedElements = document.querySelectorAll('[data-zearch-blocked]')
      blockedElements.forEach(element => {
        const domain = element.getAttribute('data-zearch-blocked')
        if (domain) {
          const site = settings.blockedSites.find(s => s.domain === domain)
          const displayName = site?.description || domain
          pendingNotifications[displayName] = (pendingNotifications[displayName] || 0) + 1
        }
      })

      // Clear previous timer
      if (notificationTimeout) {
        clearTimeout(notificationTimeout)
      }

      // Set new timer, delay sending notification
      notificationTimeout = setTimeout(() => {
        const totalBlocked = Object.values(pendingNotifications).reduce((sum, count) => sum + count, 0)
        const domains = Object.keys(pendingNotifications)

        if (totalBlocked > 0) {
          const message = domains.length === 1
            ? `Blocked ${totalBlocked} search results from ${domains[0]}`
            : `Blocked ${totalBlocked} search results from ${domains.length} websites`

          chrome.runtime.sendMessage({
            action: 'showNotification',
            domain: domains.join(', '),
            count: totalBlocked,
            message: message
          }).catch((error) => {
            // Ignore common errors to avoid console warnings
            if (chrome.runtime.lastError) {
              chrome.runtime.lastError
            }
          })
        }

        // Clear pending notifications
        pendingNotifications = {}
      }, 1000) // Send notification after 1 second
    }
  }
}

// Debounced blockSites function
const debouncedBlockSites = debounce(blockSites, 150);

// Cleanup function
function cleanup() {
  // Remove all blocking marks and styles
  const blockedElements = document.querySelectorAll('[data-zearch-blocked]')
  blockedElements.forEach(element => {
    element.removeAttribute('data-zearch-blocked')
    element.removeAttribute('data-zearch-processed')

    // Restore styles
    element.style.display = ''
    element.style.opacity = ''
    element.style.transform = ''
    element.style.filter = ''
    element.style.transition = ''

    // Restore original content for replace mode
    const originalContent = element.getAttribute('data-zearch-original')
    if (originalContent) {
      element.innerHTML = originalContent
      element.removeAttribute('data-zearch-original')
    }

    // Remove blocking indicators
    const indicator = element.querySelector('.zearch-blocked-indicator')
    if (indicator) {
      indicator.remove()
    }
  })

  console.log('Zearch: Cleanup completed')
}

// Initialize blocking functionality
function initializeBlocking() {
  console.log('Zearch: Initializing blocking...')

  // Initial execution
  setTimeout(blockSites, 100)

  // Prevent missing Google dynamic loading, listen for DOM changes
  if (window.zearchObserver) {
    window.zearchObserver.disconnect()
  }

  window.zearchObserver = new MutationObserver((mutations) => {
    // Check if new search results are added
    const hasNewResults = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          return element.matches && (
            element.matches('div.g') ||
            element.matches('div[data-hveid]') ||
            element.matches('div[jscontroller]') ||
            element.matches('div[jsname]') ||
            element.matches('div[data-ved]') ||
            element.matches('div[jsaction]') ||
            element.matches('.srg > div') ||
            element.matches('.rc')
          );
        }
        return false;
      });
    });

    if (hasNewResults && settings && settings.isEnabled) {
      debouncedBlockSites();
    }
  });

  window.zearchObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen for page scrolling to handle lazy-loaded content
  if (window.zearchScrollHandler) {
    document.removeEventListener('scroll', window.zearchScrollHandler)
  }

  window.zearchScrollHandler = debounce(() => {
    if (settings && settings.isEnabled) {
      blockSites()
    }
  }, 300)

  document.addEventListener('scroll', window.zearchScrollHandler)

  // Listen for page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && settings && settings.isEnabled) {
      setTimeout(blockSites, 100)
    }
  })
}

// Extend global object to avoid type errors
declare global {
  interface Window {
    zearchObserver?: MutationObserver
    zearchScrollHandler?: () => void
  }
}

console.log('Zearch: Content script loaded')

