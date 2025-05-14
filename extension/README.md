<p align="center">
  <img src="" />
</p>

<br/>

<p align=""> 
  Introducing Stream Timestamp Saver an extension that remembers you position on livestreams for Youtube and Rumble. A way to make it easier watching livestreams.
</p>

<br/>

<p align="">Stream Timestamp Saver   is developed independently, and is not officially endorsed by or affiliated with Youtube or Rumble.</p>

### Features 

- 🔄 Automatic timestamp saving and loading
- 🎯 Support for both YouTube and Rumble video platforms
- ⚙️ Configurable settings for debug mode and notifications
- 🔒 Local storage for privacy-focused timestamp saving
- ⚡ Performance-optimized with minimal overhead
- 🛠️ Debug logging system for troubleshooting

## Technical Details

### Content Script (`content.js`)

The content script is the core of Stream Timestamp Saver, responsible for:

- **Video Detection**: Automatically detects video elements on supported platforms
- **Timestamp Management**: 
  - Saves current video position
  - Restores previous timestamps when returning to videos
  - Handles both regular videos and livestreams
- **Settings System**:
  - Configurable options for debug mode
  - Notification controls
  - Auto-save/load functionality
- **Message Handling**: 
  - Communicates with background scripts
  - Handles settings updates
  - Manages timestamp operations

### Storage

The extension uses Chrome's local storage with the following keys:
- `stream-timestamp-saver--settings`: Extension settings
- `stream-timestamp-saver--savedtimestamps`: Saved video timestamps
- `stream-timestamp-saver--localstorage-settings`: Local storage configuration

## Installation

### Chrome Web Store 

Stream Timestamp Saver   is available in the Chrome Web Store. Check out the [Stream Timestamp Saver]() extension page.

## Usage


## Support
- Stream Timestamp Saver   is currently in beta testing and any suggestions or reported bugs are greatly appreciated. 
- For support, troubleshooting, comments and suggestions feel free to email swrightdev@gmail.com. 

## Contributing


---

### Privacy Policy

*At Stream Timestamp Saver   we are committed to protecting your privacy. We do not collect, store or share website data or personal contact information, including your name, email address, postal address, phone number, and other contact details. This Privacy Policy does not apply to Rumble or any third-party websites or advertisers.*
