# Zearch - Intelligent Search Result Blocker

A powerful Chrome extension for blocking specific websites from Google search results, enhancing your search experience.

## ✨ Features

- 🚫 **Smart Blocking**: Automatically block search results from specified domains
- 🎯 **Intelligent Matching**: Auto-generate regex patterns to match main domains and all subdomains
- 🎨 **Multiple Blocking Modes**: Support for complete hide, dim display, and replace notification modes
- 📊 **Statistical Analysis**: Real-time blocking statistics to understand blocking effectiveness
- ⚙️ **Flexible Configuration**: Customize blocking lists with personalized settings
- 💾 **Data Synchronization**: Use Chrome sync storage for consistent data across devices
- 🔄 **Real-time Updates**: Dynamic page monitoring with infinite scroll support
- 🎯 **Right-click Shortcuts**: Quick add to blocking list via right-click on links
- 📱 **Responsive UI**: Modern interface design supporting various screen sizes
- 🌍 **Multi-domain Support**: Support for Google search domains worldwide

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

### Development Mode

```bash
pnpm dev
```

### Build Extension

```bash
pnpm build
```

### Package for Release

```bash
pnpm package
```

## 📦 Install Extension

1. Run `pnpm build` to build the extension
2. Open Chrome browser and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked extension"
5. Select the `build/chrome-mv3-prod` folder

## 🎯 Usage

### Basic Usage

1. **Enable Extension**: Click the extension icon and ensure the toggle is on
2. **Add Blocked Websites**: Enter the domain to block in the popup (e.g., csdn.net), click "Add"
3. **Smart Matching**: The system automatically generates regex patterns to match the domain and all subdomains
4. **Search Testing**: Search on Google, blocked websites will display according to the set mode

### Advanced Features

- **Right-click Blocking**: Right-click links on search result pages and select "Block this domain"
- **Bulk Management**: Manage all blocked websites in the settings page
- **Data Import/Export**: Backup and restore your settings
- **Statistics View**: View blocking effectiveness statistics

## ⚙️ Configuration Options

### Blocking Modes

- **Complete Hide**: Completely remove blocked search results
- **Dim Display**: Keep results but reduce opacity and saturation
- **Replace Notification**: Replace original content with blocking notification

### Other Settings

- **Show Notifications**: Display notifications when blocking websites
- **Statistics Data**: View and clear blocking statistics
- **Data Management**: Import/export settings, reset configuration

## 🧪 Testing

### Automated Testing

Run test scripts in browser console:

```javascript
// Load test script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('test-extension.js');
document.head.appendChild(script);

// Run all tests
ZearchTests.runAllTests();
```

### Manual Testing

1. **Functionality Testing**:
   - Add/remove blocked websites
   - Switch blocking modes
   - Verify statistics data

2. **Compatibility Testing**:
   - Different Google domains (google.com, google.co.uk, etc.)
   - Various search result types
   - Dynamic loading content

3. **Performance Testing**:
   - Large search result pages
   - Frequent scroll loading
   - Multiple tabs simultaneous use

## 🛠️ Technical Architecture

### Core Components

- **Content Script** (`src/contents/block-site.ts`): Main blocking logic
- **Popup** (`src/popup.tsx`): Extension popup interface
- **Options** (`src/options.tsx`): Settings page
- **Background** (`src/background.ts`): Background service
- **Storage** (`src/utils/storage.ts`): Data storage management

### Technology Stack

- **Framework**: React + TypeScript
- **Build Tool**: Plasmo
- **Styling**: Tailwind CSS
- **Storage**: Chrome Storage API
- **Permissions**: tabs, storage, contextMenus, notifications, scripting

## 📊 Performance Optimization

- **Debounce Processing**: Avoid frequent execution of blocking logic
- **Selector Optimization**: Use efficient DOM selectors
- **Memory Management**: Timely cleanup of event listeners
- **Asynchronous Processing**: Non-blocking data storage operations

## 🔧 Development Guide

### Project Structure

```
src/
├── contents/          # Content scripts
│   └── block-site.ts
├── utils/            # Utility functions
│   └── storage.ts
├── popup.tsx         # Popup component
├── options.tsx       # Settings page
└── background.ts        # Background script
```

### Adding New Features

1. Add UI in corresponding components
2. Add data structures in storage.ts
3. Implement logic in content script
4. Update permission configuration

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Working**:
   - Check if extension is enabled
   - Confirm you're on Google search page
   - Check console for error messages

2. **Blocking Not Effective**:
   - Verify domain format is correct
   - Check blocking mode settings
   - Refresh page and retry

3. **Data Loss**:
   - Check Chrome sync settings
   - Try importing backup data
   - Reinstall extension

### Debugging Tips

- Use Chrome Developer Tools
- Check extension management page for errors
- Run test scripts in console

## 📝 Changelog

### v0.0.1 (Current Version)
- ✨ Initial release
- 🚫 Basic blocking functionality
- 🎨 Multiple blocking modes
- 📊 Statistics feature
- ⚙️ Settings page

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 👨‍💻 Author

Andy - Developer focused on improving search experience
