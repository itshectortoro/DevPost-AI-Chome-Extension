Study Buddy 📚
Your personal AI-powered study assistant, built right into your browser

Study Buddy is a Chrome extension that leverages Chrome's Built-in AI APIs to provide six powerful learning tools with real-time streaming responses, all running locally on your device for maximum privacy and performance.

Show Image

🌟 Features
Six AI-Powered Study Tools
🔵 Prompt API - General Q&A and tutoring with multimodal support (images & audio)
🔴 Rewriter API - Rephrase and improve your writing
🟢 Writer API - Generate original content and essays
🟠 Summarizer API - Condense long texts into key points
🟡 Translator API - Multi-language translation support
🟣 Proofreader API - Grammar and spelling correction
Key Capabilities
✅ Real-Time Streaming - Watch AI responses generate live
✅ Privacy-First - All processing happens locally on your device
✅ Persistent Chat History - Save and organize your study sessions
✅ Multimodal Input - Upload images and audio (Prompt API)
✅ Session Management - Intelligent caching for faster responses
✅ Offline Capable - Works without internet once model is downloaded
✅ Completely Free - No subscriptions or API costs
🚀 Installation
Prerequisites
Chrome Browser (Version 128+ recommended)
Chrome Dev or Canary channel preferred
Download: Chrome Dev or Chrome Canary
Enable Required Chrome Flags Navigate to chrome://flags and enable the following: Essential Flags:
   chrome://flags/#optimization-guide-on-device-model
   Set to: "Enabled BypassPerfRequirement"
   
   chrome://flags/#prompt-api-for-gemini-nano
   Set to: "Enabled"
Optional (for additional features):

   chrome://flags/#prompt-api-for-gemini-nano-multimodal-input
   Set to: "Enabled"
   
   chrome://flags/#rewriter-api
   Set to: "Enabled"
   
   chrome://flags/#writer-api
   Set to: "Enabled"
   
   chrome://flags/#summarizer-api
   Set to: "Enabled"
   
   chrome://flags/#translation-api
   Set to: "Enabled"
Restart Chrome after enabling flags
Download Gemini Nano Model
The AI model will download automatically on first use
Check download progress at chrome://on-device-internals
Model size: ~1.5GB (one-time download)
Install the Extension
Method 1: Load Unpacked (Development)
Clone or download this repository:
bash
   git clone https://github.com/itshectortoro/DevPost-AI-Chome-Extension
Open Chrome and navigate to chrome://extensions/
Enable Developer mode (toggle in top-right corner)
Click Load unpacked
Select the study-buddy folder
The extension should now appear in your extensions list
Method 2: Chrome Web Store (Coming Soon)
Currently in development for Chrome Web Store submission.

📖 Usage
Getting Started
Click the Study Buddy icon in your Chrome toolbar
Select an AI tool from the home screen (6 colorful cards)
Type your message in the input box
Click "Generate Response" or press Enter
Watch the AI respond in real-time with streaming text
Using Different APIs
Prompt API (General Q&A)
Ask any question or request tutoring help
Upload images or audio files for multimodal analysis
Great for: homework help, concept explanations, brainstorming
Rewriter API
Paste text you want to improve or rephrase
Get alternative phrasings and better word choices
Great for: essays, emails, creative writing
Writer API
Describe what you want written
Generate original content from scratch
Great for: essays, stories, reports
Summarizer API
Paste long articles or texts
Get concise summaries of key points
Great for: research papers, articles, textbooks
Translator API
Enter text to translate (currently English → Spanish)
Get instant translations
Great for: language learning, reading foreign texts
Proofreader API
Paste text with potential errors
Get corrections and explanations
Great for: final essay checks, grammar practice
Chat Management
New Chat - Start a fresh conversation (sidebar button)
Rename Chat - Click the edit icon on any saved chat
Delete Chat - Click the trash icon to remove a chat
Switch Chats - Click any saved chat to load it
Toggle Sidebar - Click the hamburger menu to show/hide chat list
Multimodal Features (Prompt API Only)
Click "Add Image" or "Add Audio" button
Select a file from your device
Images: JPG, PNG (max 2MB)
Audio: MP3, WAV (max 5MB)
Preview appears below the buttons
Type an optional message
Click "Generate Response"
AI will analyze your media and respond
🏗️ Technical Architecture
Tech Stack
Frontend: HTML5, CSS3, Vanilla JavaScript
Extension: Chrome Extension API (Manifest V3)
AI: Chrome Built-in AI APIs
LanguageModel (Prompt API)
Rewriter
Writer
Summarizer
Translator
Storage: Chrome Storage API (Local)
File Structure
study-buddy/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI structure
├── popup.js              # Application logic & AI integration
├── styles.css            # Styling and animations
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
Key Components
Session Management

Sessions are cached and reused for better performance
Automatic cleanup on errors
Each API maintains its own session
Streaming Implementation

Real-time chunk processing
Auto-scrolling to follow content
Non-blocking UI updates
Data Persistence

Chat history stored locally via Chrome Storage API
Debounced saves (500ms) to optimize performance
Organized by API type
⚙️ Configuration
Customizing the Extension
Change Translator Languages
Edit popup.js around line 650:

javascript
aiSessions.translator = await window.Translator.create({
  sourceLanguage: 'en',  // Change source language
  targetLanguage: 'es'   // Change target language
});
Modify Proofreader Prompt
Edit popup.js around line 860:

javascript
const prompt = `Your custom proofreading instructions here: ${text}`;
Adjust File Size Limits
Edit popup.js:

javascript
// Image upload (line 580)
if (file.size > 2 * 1024 * 1024) { // Change 2MB limit

// Audio upload (line 600)
if (file.size > 5 * 1024 * 1024) { // Change 5MB limit
🐛 Troubleshooting
Common Issues
"Prompt API is not available"
Solution: Enable chrome://flags/#prompt-api-for-gemini-nano and restart Chrome
Ensure you're using Chrome 128+ (Dev or Canary)
"Gemini Nano model is downloading"
Solution: Wait for download to complete (check chrome://on-device-internals)
Model is ~1.5GB and downloads automatically
May take 5-15 minutes depending on connection
"Failed to create AI session"
Solution:
Verify all required flags are enabled
Restart Chrome completely
Test in DevTools: await window.LanguageModel.create()
Check model download status
Streaming not working
Solution: Refresh the extension (chrome://extensions → reload)
Check console for errors (F12 → Console tab)
Responses not saving
Solution: Check Chrome Storage permissions in manifest.json
Clear extension data: chrome://extensions → Details → Remove site data
Debug Mode
Open extension popup
Press F12 to open DevTools
Check Console tab for error messages
Look for API availability logs
🤝 Contributing
Contributions are welcome! Here's how you can help:

Fork the repository
Create a feature branch: git checkout -b feature/AmazingFeature
Commit your changes: git commit -m 'Add some AmazingFeature'
Push to the branch: git push origin feature/AmazingFeature
Open a Pull Request
Development Guidelines
Follow existing code style and conventions
Test all 6 APIs before submitting
Update README if adding new features
Ensure streaming works for new APIs
Add error handling for edge cases
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Built for the Chrome Built-in AI Challenge hackathon
Powered by Google Chrome's Built-in AI APIs
Uses Gemini Nano on-device language model
Inspired by the need for privacy-focused, accessible AI tools for students
📧 Contact
Project Link: https://github.com/itshectortoro/DevPost-AI-Chome-Extension

Issues & Feedback: GitHub Issues

🚦 Project Status
Current Version: 1.0.0

Status: ✅ Stable - All core features implemented

Roadmap:

 Chrome Web Store publication
 Additional language pairs for translator
 Dark mode theme
 Export chat history feature
 Custom AI prompt templates
 Voice input support
 Made for students everywhere

Privacy-first. Offline-capable. Completely free.

