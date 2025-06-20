// Test script - Run in browser console to test extension functionality

console.log('🧪 Zearch Extension Test Suite');

// Test storage functionality
async function testStorage() {
  console.log('📦 Testing Storage...');

  try {
    // Test saving settings
    const testSettings = {
      isEnabled: true,
      blockedSites: [
        { domain: 'test.com', blockedCount: 5, addedAt: Date.now() }
      ],
      totalBlocked: 10,
      blockMode: 'dim',
      showNotifications: true,
      version: '0.0.1'
    };

    chrome.storage.sync.set(testSettings, () => {
      console.log('✅ Settings saved successfully');

      // Test reading settings
      chrome.storage.sync.get(Object.keys(testSettings), (result) => {
        console.log('✅ Settings loaded:', result);

        // Verify data integrity
        const isValid = result.isEnabled === testSettings.isEnabled &&
                       result.blockedSites.length === testSettings.blockedSites.length &&
                       result.totalBlocked === testSettings.totalBlocked;

        if (isValid) {
          console.log('✅ Storage test passed');
        } else {
          console.error('❌ Storage test failed - data mismatch');
        }
      });
    });
  } catch (error) {
    console.error('❌ Storage test failed:', error);
  }
}

// Test DOM selectors
function testSelectors() {
  console.log('🎯 Testing DOM Selectors...');

  const selectors = [
    'div.g',
    'div[data-hveid]',
    'div[jscontroller]',
    'div[jsname]',
    'div[data-ved]',
    'div[jsaction]',
    '.srg > div',
    '.rc'
  ];

  let foundResults = 0;

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
      foundResults += elements.length;
    } else {
      console.log(`⚠️  No elements found with selector: ${selector}`);
    }
  });

  if (foundResults > 0) {
    console.log(`✅ Selector test passed - found ${foundResults} total elements`);
  } else {
    console.error('❌ Selector test failed - no search results found');
  }
}

// 测试URL解析
function testUrlParsing() {
  console.log('🔗 Testing URL Parsing...');
  
  const testUrls = [
    'https://www.zhihu.com/question/123456',
    'https://subdomain.quora.com/path',
    'https://reddit.com/r/test',
    'https://www.google.com/search?q=test',
    '/url?q=https://example.com&sa=U'
  ];
  
  testUrls.forEach(url => {
    try {
      const urlObj = new URL(url, window.location.origin);
      const hostname = urlObj.hostname.toLowerCase();
      console.log(`✅ Parsed ${url} -> ${hostname}`);
    } catch (error) {
      console.error(`❌ Failed to parse ${url}:`, error);
    }
  });
}

// 测试域名匹配逻辑
function testDomainMatching() {
  console.log('🎯 Testing Domain Matching...');
  
  const blockedDomains = ['zhihu.com', 'quora.com', 'reddit.com'];
  const testCases = [
    { hostname: 'zhihu.com', shouldMatch: true },
    { hostname: 'www.zhihu.com', shouldMatch: true },
    { hostname: 'subdomain.quora.com', shouldMatch: true },
    { hostname: 'reddit.com', shouldMatch: true },
    { hostname: 'google.com', shouldMatch: false },
    { hostname: 'example.com', shouldMatch: false }
  ];
  
  testCases.forEach(testCase => {
    const { hostname, shouldMatch } = testCase;
    let matched = false;
    
    for (const domain of blockedDomains) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        matched = true;
        break;
      }
    }
    
    if (matched === shouldMatch) {
      console.log(`✅ ${hostname} - ${matched ? 'blocked' : 'allowed'} (correct)`);
    } else {
      console.error(`❌ ${hostname} - expected ${shouldMatch ? 'blocked' : 'allowed'}, got ${matched ? 'blocked' : 'allowed'}`);
    }
  });
}

// 测试性能
function testPerformance() {
  console.log('⚡ Testing Performance...');
  
  const startTime = performance.now();
  
  // 模拟屏蔽操作
  const elements = document.querySelectorAll('div');
  let processedCount = 0;
  
  elements.forEach(element => {
    // 模拟检查和处理
    if (!element.hasAttribute('data-test-processed')) {
      element.setAttribute('data-test-processed', 'true');
      processedCount++;
    }
  });
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Processed ${processedCount} elements in ${duration.toFixed(2)}ms`);
  
  if (duration < 100) {
    console.log('✅ Performance test passed - under 100ms');
  } else {
    console.warn('⚠️  Performance test warning - over 100ms');
  }
  
  // 清理测试属性
  elements.forEach(element => {
    element.removeAttribute('data-test-processed');
  });
}

// 测试防抖功能
function testDebounce() {
  console.log('⏱️  Testing Debounce...');
  
  let callCount = 0;
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  const debouncedFunction = debounce(() => {
    callCount++;
    console.log(`✅ Debounced function called (${callCount})`);
  }, 100);
  
  // 快速调用多次
  for (let i = 0; i < 5; i++) {
    debouncedFunction();
  }
  
  setTimeout(() => {
    if (callCount === 1) {
      console.log('✅ Debounce test passed - function called only once');
    } else {
      console.error(`❌ Debounce test failed - function called ${callCount} times`);
    }
  }, 200);
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Zearch Extension Tests...\n');

  testStorage();
  testSelectors();
  testUrlParsing();
  testDomainMatching();
  testPerformance();
  testDebounce();

  console.log('\n✨ All tests completed! Check results above.');
}

// Export test functions
window.ZearchTests = {
  runAllTests,
  testStorage,
  testSelectors,
  testUrlParsing,
  testDomainMatching,
  testPerformance,
  testDebounce
};

console.log('📋 Test functions available:');
console.log('- ZearchTests.runAllTests() - Run all tests');
console.log('- ZearchTests.testStorage() - Test storage functionality');
console.log('- ZearchTests.testSelectors() - Test DOM selectors');
console.log('- ZearchTests.testUrlParsing() - Test URL parsing');
console.log('- ZearchTests.testDomainMatching() - Test domain matching');
console.log('- ZearchTests.testPerformance() - Test performance');
console.log('- ZearchTests.testDebounce() - Test debounce function');
console.log('\n💡 Run ZearchTests.runAllTests() to start testing!');
