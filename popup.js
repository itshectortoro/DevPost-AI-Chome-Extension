// State Management
let currentAPI = null;
let currentChatId = null;
let chatsData = {};
let currentMediaFiles = []; // Store uploaded media files

// Cache AI sessions to avoid recreating them every time
let aiSessions = {
  rewriter: null,
  translator: null,
  prompt: null,
  writer: null,
  summarizer: null,
  proofreader: null
};

// API Configuration
const API_CONFIG = {
  rewriter: {
    name: 'Rewriter API',
    color: '#ef4444',
    icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
    prompt: 'What can I rewrite for you today?'
  },
  translator: {
    name: 'Translator API',
    color: '#eab308',
    icon: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
    prompt: 'What can I translate for you today?'
  },
  prompt: {
    name: 'Prompt API',
    color: '#3b82f6',
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
    prompt: 'What can I help you with today?'
  },
  writer: {
    name: 'Writer API',
    color: '#22c55e',
    icon: '<path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path>',
    prompt: 'What can I write for you today?'
  },
  summarizer: {
    name: 'Summarizer API',
    color: '#f97316',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
    prompt: 'What can I summarize for you today?'
  },
  proofreader: {
    name: 'Proofreader API',
    color: '#a855f7',
    icon: '<path d="M4 7V4h16v3"></path><path d="M9 20h6"></path><path d="M12 4v16"></path>',
    prompt: 'What can I proofread for you today?'
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadChatsData();
  setupEventListeners();
});

// Load saved chats from storage
async function loadChatsData() {
  const result = await chrome.storage.local.get('chatsData');
  chatsData = result.chatsData || {};
}

// Save chats to storage (debounced to avoid excessive writes)
let saveTimeout = null;
async function saveChatsData() {
  // Clear any pending save
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Debounce: only save after 500ms of no activity
  saveTimeout = setTimeout(async () => {
    try {
      await chrome.storage.local.set({ chatsData });
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }, 500);
}

// Setup Event Listeners
function setupEventListeners() {
  // Front page - API card clicks
  document.querySelectorAll('.api-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const api = card.dataset.api;
      openAPISection(api);
    });
  });

  // Sidebar buttons
  document.getElementById('newChatBtn').addEventListener('click', createNewChat);
  document.getElementById('backBtn').addEventListener('click', goToFrontPage);
  document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

  // Generate button
  document.getElementById('generateBtn').addEventListener('click', generateResponse);

  // User input - Enter key
  document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateResponse();
    }
  });

  // Multimodal upload buttons
  document.getElementById('imageUploadBtn').addEventListener('click', () => {
    document.getElementById('imageInput').click();
  });

  document.getElementById('audioUploadBtn').addEventListener('click', () => {
    document.getElementById('audioInput').click();
  });

  // File inputs
  document.getElementById('imageInput').addEventListener('change', handleImageUpload);
  document.getElementById('audioInput').addEventListener('change', handleAudioUpload);
}

// Navigation Functions
function openAPISection(api) {
  currentAPI = api;
  currentMediaFiles = []; // Reset media files
  
  // Hide front page, show API page
  document.getElementById('frontPage').classList.remove('active');
  document.getElementById('apiPage').classList.add('active');

  // Update header
  const config = API_CONFIG[api];
  document.getElementById('apiSectionTitle').textContent = config.name;
  
  const iconLarge = document.getElementById('apiIconLarge');
  iconLarge.style.background = config.color;
  iconLarge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${config.icon}</svg>`;

  const emptyIcon = document.getElementById('emptyIcon');
  emptyIcon.style.background = config.color;
  emptyIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${config.icon}</svg>`;

  document.getElementById('emptyPrompt').textContent = config.prompt;

  // Show/hide multimodal section based on API
  const multimodalSection = document.getElementById('multimodalSection');
  if (api === 'prompt') {
    multimodalSection.style.display = 'block';
  } else {
    multimodalSection.style.display = 'none';
  }

  // Load chats for this API
  loadChatsForAPI(api);
}

function goToFrontPage() {
  document.getElementById('apiPage').classList.remove('active');
  document.getElementById('frontPage').classList.add('active');
  
  // Optional: Clear cached session when leaving API (saves memory)
  // Comment out if you want sessions to persist across navigation
  if (currentAPI && aiSessions[currentAPI]) {
    try {
      if (aiSessions[currentAPI].destroy) {
        aiSessions[currentAPI].destroy();
      }
      aiSessions[currentAPI] = null;
    } catch (e) {
      // Some APIs might not have destroy method
      aiSessions[currentAPI] = null;
    }
  }
  
  currentAPI = null;
  currentChatId = null;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('hidden');
}

// Chat Management
function loadChatsForAPI(api) {
  if (!chatsData[api]) {
    chatsData[api] = {};
  }

  const chatsList = document.getElementById('chatsList');
  chatsList.innerHTML = '';

  const chats = Object.keys(chatsData[api]);
  
  if (chats.length === 0) {
    currentChatId = null;
    showEmptyState();
  } else {
    chats.forEach(chatId => {
      addChatToList(chatId, chatsData[api][chatId].title);
    });
    
    // Load the first chat by default
    if (!currentChatId || !chatsData[api][currentChatId]) {
      currentChatId = chats[0];
    }
    loadChat(currentChatId);
  }
}

function addChatToList(chatId, title) {
  const chatsList = document.getElementById('chatsList');
  
  const chatItem = document.createElement('div');
  chatItem.className = 'chat-item';
  if (chatId === currentChatId) {
    chatItem.classList.add('active');
  }
  chatItem.dataset.chatId = chatId;

  chatItem.innerHTML = `
    <div class="chat-item-content">
      <span class="chat-item-text">${title}</span>
    </div>
    <div class="chat-actions">
      <button class="chat-action-btn edit-btn" title="Rename">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="chat-action-btn delete-btn" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Click to load chat
  chatItem.querySelector('.chat-item-content').addEventListener('click', () => {
    loadChat(chatId);
  });

  // Edit button
  chatItem.querySelector('.edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    renameChatInline(chatItem, chatId);
  });

  // Delete button
  chatItem.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteChat(chatId);
  });

  chatsList.appendChild(chatItem);
}

function renameChatInline(chatItem, chatId) {
  const textSpan = chatItem.querySelector('.chat-item-text');
  const currentTitle = textSpan.textContent;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'chat-item-input';
  input.value = currentTitle;
  
  textSpan.replaceWith(input);
  input.focus();
  input.select();

  const saveName = () => {
    const newTitle = input.value.trim() || currentTitle;
    chatsData[currentAPI][chatId].title = newTitle;
    saveChatsData();
    
    const newSpan = document.createElement('span');
    newSpan.className = 'chat-item-text';
    newSpan.textContent = newTitle;
    input.replaceWith(newSpan);
  };

  input.addEventListener('blur', saveName);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveName();
    } else if (e.key === 'Escape') {
      const newSpan = document.createElement('span');
      newSpan.className = 'chat-item-text';
      newSpan.textContent = currentTitle;
      input.replaceWith(newSpan);
    }
  });
}

function createNewChat() {
  if (!currentAPI) return;

  const chatId = `chat_${Date.now()}`;
  const chatNumber = Object.keys(chatsData[currentAPI]).length + 1;
  
  chatsData[currentAPI][chatId] = {
    title: `Chat #${chatNumber}`,
    messages: []
  };

  saveChatsData();
  addChatToList(chatId, `Chat #${chatNumber}`);
  loadChat(chatId);
}

function deleteChat(chatId) {
  if (!confirm('Are you sure you want to delete this chat?')) return;

  delete chatsData[currentAPI][chatId];
  saveChatsData();

  const remainingChats = Object.keys(chatsData[currentAPI]);
  
  if (remainingChats.length === 0) {
    currentChatId = null;
    showEmptyState();
    document.getElementById('chatsList').innerHTML = '';
  } else {
    if (chatId === currentChatId) {
      currentChatId = remainingChats[0];
      loadChat(currentChatId);
    }
    loadChatsForAPI(currentAPI);
  }
}

function loadChat(chatId) {
  currentChatId = chatId;

  // Update active state in sidebar
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.chatId === chatId) {
      item.classList.add('active');
    }
  });

  // Hide empty state, show messages
  document.getElementById('emptyState').style.display = 'none';
  const messagesDiv = document.getElementById('messages');
  messagesDiv.classList.add('active');
  messagesDiv.innerHTML = '';

  // Load messages
  const chat = chatsData[currentAPI][chatId];
  chat.messages.forEach(msg => {
    addMessageToUI(msg.role, msg.content, msg.mediaFiles || []);
  });

  // Scroll to bottom
  document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
}

function showEmptyState() {
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('messages').classList.remove('active');
  document.getElementById('messages').innerHTML = '';
}

// Message Functions
function addMessageToUI(role, content, mediaFiles = []) {
  const messagesDiv = document.getElementById('messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  let mediaHTML = '';
  if (mediaFiles && mediaFiles.length > 0) {
    mediaHTML = '<div class="message-media">';
    mediaFiles.forEach(file => {
      if (file.type === 'image') {
        // Only show thumbnail, not full base64 in DOM for performance
        mediaHTML += `<div class="message-media-indicator">📷 Image: ${file.name}</div>`;
      } else if (file.type === 'audio') {
        mediaHTML += `<div class="message-media-indicator">🎤 Audio: ${file.name}</div>`;
      }
    });
    mediaHTML += '</div>';
  }

  messageDiv.innerHTML = `
    <div class="message-label">${role === 'user' ? 'You' : API_CONFIG[currentAPI].name}</div>
    ${mediaHTML}
    <div class="message-content">${content}</div>
  `;

  messagesDiv.appendChild(messageDiv);
  document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;

  return messageDiv;
}

function addMessageToData(role, content, mediaFiles = []) {
  if (!chatsData[currentAPI][currentChatId]) {
    return;
  }

  // Don't store full media data in chat history to save space and improve performance
  const lightMediaInfo = mediaFiles.map(file => ({
    type: file.type,
    name: file.name,
    mimeType: file.mimeType
    // Removed: data field (saves tons of space)
  }));

  chatsData[currentAPI][currentChatId].messages.push({
    role,
    content,
    mediaFiles: lightMediaInfo,
    timestamp: Date.now()
  });

  saveChatsData();
}

// Multimodal Media Handling Functions
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Check file size (limit to 2MB for performance)
  if (file.size > 2 * 1024 * 1024) {
    alert('Image too large. Please use an image under 2MB for best performance.');
    event.target.value = '';
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaFile = {
        type: 'image',
        name: file.name,
        data: e.target.result,
        mimeType: file.type
      };
      
      currentMediaFiles.push(mediaFile);
      displayMediaPreview();
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Error uploading image. Please try again.');
  }

  // Reset input
  event.target.value = '';
}

async function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Check file size (limit to 5MB for performance)
  if (file.size > 5 * 1024 * 1024) {
    alert('Audio file too large. Please use an audio file under 5MB for best performance.');
    event.target.value = '';
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaFile = {
        type: 'audio',
        name: file.name,
        data: e.target.result,
        mimeType: file.type
      };
      
      currentMediaFiles.push(mediaFile);
      displayMediaPreview();
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error uploading audio:', error);
    alert('Error uploading audio. Please try again.');
  }

  // Reset input
  event.target.value = '';
}

function displayMediaPreview() {
  const previewDiv = document.getElementById('mediaPreview');
  previewDiv.innerHTML = '';

  currentMediaFiles.forEach((file, index) => {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-item';

    if (file.type === 'image') {
      mediaItem.innerHTML = `
        <img src="${file.data}" alt="${file.name}">
        <button class="remove-media-btn" data-index="${index}">×</button>
      `;
    } else if (file.type === 'audio') {
      mediaItem.innerHTML = `
        <div class="media-item-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
          <span class="media-item-name">${file.name}</span>
        </div>
        <button class="remove-media-btn" data-index="${index}">×</button>
      `;
    }

    previewDiv.appendChild(mediaItem);
  });

  // Add event listeners to remove buttons
  previewDiv.querySelectorAll('.remove-media-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeMediaFile(index);
    });
  });
}

function removeMediaFile(index) {
  currentMediaFiles.splice(index, 1);
  displayMediaPreview();
}

// Generate Response
async function generateResponse() {
  const input = document.getElementById('userInput');
  const userMessage = input.value.trim();

  // For Prompt API, allow submission with just media files (no text required)
  if (!userMessage && currentMediaFiles.length === 0) return;
  if (!userMessage && currentAPI !== 'prompt') return;

  const generateBtn = document.getElementById('generateBtn');
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="loading"></span>';

  // If no current chat, create first one automatically
  if (!currentChatId) {
    const chatId = `chat_${Date.now()}`;
    chatsData[currentAPI][chatId] = {
      title: 'Chat #1',
      messages: []
    };
    currentChatId = chatId;
    saveChatsData();
    addChatToList(chatId, 'Chat #1');
    loadChat(chatId);
  }

  // Store media files for this message
  const messageMedia = [...currentMediaFiles];

  // Add user message
  const displayMessage = userMessage || '(Media uploaded)';
  addMessageToUI('user', displayMessage, messageMedia);
  addMessageToData('user', displayMessage, messageMedia);
  input.value = '';

  try {
    // Call appropriate API based on current section
    let response;
    switch(currentAPI) {
      case 'rewriter':
        response = await callRewriterAPI(userMessage);
        break;
      case 'translator':
        response = await callTranslatorAPI(userMessage);
        break;
      case 'prompt':
        response = await callPromptAPI(userMessage, messageMedia);
        break;
      case 'writer':
        response = await callWriterAPI(userMessage);
        break;
      case 'summarizer':
        response = await callSummarizerAPI(userMessage);
        break;
      case 'proofreader':
        response = await callProofreaderAPI(userMessage);
        break;
      default:
        response = 'API not implemented yet.';
    }

    // Add assistant response
    // Only add response if it wasn't already handled by streaming
  if (response !== '__STREAMING_COMPLETE__') {
    addMessageToUI('assistant', response);
    addMessageToData('assistant', response);
  }

  } catch (error) {
    console.error('Error generating response:', error);
    const errorMsg = 'Sorry, I encountered an error. Please make sure the Chrome AI APIs are enabled and try again.';
    addMessageToUI('assistant', errorMsg);
    addMessageToData('assistant', errorMsg);
  }

  // Clear media files after sending
  currentMediaFiles = [];
  displayMediaPreview();

  generateBtn.disabled = false;
  generateBtn.textContent = 'Generate Response';
}

// API Call Functions with Session Caching
// REWRITER API WITH STREAMING
async function callRewriterAPI(text) {
  try {
    if (!window.Rewriter) {
      return 'Rewriter API is not available. Please ensure you have enrolled in the Chrome Built-in AI Early Preview Program.';
    }

    // Create session if it doesn't exist
    if (!aiSessions.rewriter) {
      aiSessions.rewriter = await window.Rewriter.create();
    }

    // Create the assistant message element (empty initially for streaming)
    const assistantMessageDiv = addMessageToUI('assistant', '');
    const messageContent = assistantMessageDiv.querySelector('.message-content');

    try {
      // Use streaming
      const stream = aiSessions.rewriter.rewriteStreaming(text);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        messageContent.textContent = fullResponse;

        // Auto-scroll
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      // Save to chat history
      addMessageToData('assistant', fullResponse);
      return '__STREAMING_COMPLETE__';

    } catch (error) {
      console.error('Rewriter streaming error:', error);
      aiSessions.rewriter = null;
      const errorMsg = 'Error using Rewriter API: ' + error.message;
      messageContent.textContent = errorMsg;
      addMessageToData('assistant', errorMsg);
      return '__STREAMING_COMPLETE__';
    }

  } catch (error) {
    console.error('Rewriter API error:', error);
    aiSessions.rewriter = null;
    return 'Error using Rewriter API: ' + error.message;
  }
}

async function callTranslatorAPI(text) {
  try {
    if (!window.Translator) {
      return 'Translator API is not available. Please ensure you have enrolled in the Chrome Built-in AI Early Preview Program.';
    }

    // Reuse existing session or create new one
    if (!aiSessions.translator) {
      const canTranslate = await window.Translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'es'
      });

      if (canTranslate === 'no') {
        return 'Translation is not available for this language pair.';
      }

      aiSessions.translator = await window.Translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'es'
      });
    }

    const result = await aiSessions.translator.translate(text);
    return result;
  } catch (error) {
    console.error('Translator API error:', error);
    // Reset session on error
    aiSessions.translator = null;
    return 'Error using Translator API: ' + error.message;
  }
}

async function callPromptAPI(text, mediaFiles = []) {
  try {
    // Check if API exists
    if (!window.LanguageModel) {
      return 'Prompt API is not available. Please ensure you have enabled the prompt-api-for-gemini-nano flag in chrome://flags and restarted Chrome.';
    }

    const LM = window.LanguageModel;

    // Check availability
    try {
      const availability = await LM.availability();
      if (availability === 'no' || availability === 'unavailable') {
        return 'Prompt API is not available on this device. Make sure you have enabled the optimization-guide-on-device-model flag with BypassPerfRequirement.';
      }
      if (availability === 'after-download' || availability === 'downloading') {
        return 'Gemini Nano model is downloading. Please wait a few minutes and try again. Check progress at chrome://on-device-internals';
      }
    } catch (availError) {
      console.warn('Could not check availability:', availError);
    }

    // Create session if it doesn't exist (REUSE existing session)
    if (!aiSessions.prompt) {
      try {
        aiSessions.prompt = await LM.create(['en']);
      } catch (createError) {
        console.error('Failed to create session:', createError);
        aiSessions.prompt = null;
        return 'Failed to create AI session. Make sure:\n1. Gemini Nano is fully downloaded\n2. You have enabled chrome://flags/#prompt-api-for-gemini-nano-multimodal-input\n3. Try running in DevTools: await LanguageModel.create()';
      }
    }

    // Create the assistant message element (empty initially for streaming)
    const assistantMessageDiv = addMessageToUI('assistant', '');
    const messageContent = assistantMessageDiv.querySelector('.message-content');

    try {
      // Check if we have media files (multimodal input)
      if (mediaFiles && mediaFiles.length > 0) {
        // Build multimodal content array
        let content = [];
        
        // Add text if provided
        if (text) {
          content.push({ type: 'text', content: text });
        }
        
        // Add media files
        for (const file of mediaFiles) {
          if (file.type === 'image') {
            content.push({
              type: 'image',
              value: file.data, // base64 data URL
            });
          } else if (file.type === 'audio') {
            content.push({
              type: 'audio',
              value: file.data, // base64 data URL
            });
          }
        }
        
        // If only media without text, add a default prompt
        if (!text) {
          content.unshift({ type: 'text', value: 'Please analyze this media and describe what you see/hear.' });
        }
        
        // Try multimodal input (may not be fully supported yet)
        try {
          const result = await aiSessions.prompt.prompt([
            {
              role: 'user',
              content: content
            },
          ]);
          
          // Display the result
          messageContent.textContent = result;
          addMessageToData('assistant', result);
          return '__STREAMING_COMPLETE__';
          
        } catch (multimodalError) {
          // Fallback if multimodal not supported - use text with note
          console.warn('Multimodal input may not be fully supported yet:', multimodalError);
          const fallbackText = text || 'User uploaded media files';
          
          // Use streaming for fallback
          const stream = aiSessions.prompt.promptStreaming(fallbackText + '\n\nNote: Full media analysis features are still being developed in Chrome AI APIs.');
          let fullResponse = '';

          for await (const chunk of stream) {
            fullResponse += chunk;
            messageContent.textContent = fullResponse;
            
            const chatContainer = document.getElementById('chatContainer');
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }

          addMessageToData('assistant', fullResponse);
          return '__STREAMING_COMPLETE__';
        }
        
      } else {
        // Standard text-only streaming (no media files)
        const stream = aiSessions.prompt.promptStreaming(text);
        let fullResponse = '';

        // Process each chunk as it arrives
        for await (const chunk of stream) {
          fullResponse += chunk;
          messageContent.textContent = fullResponse;

          // Auto-scroll to bottom
          const chatContainer = document.getElementById('chatContainer');
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Save the complete response to chat history
        addMessageToData('assistant', fullResponse);
        return '__STREAMING_COMPLETE__';
      }

    } catch (streamError) {
      console.error('Streaming error:', streamError);
      
      // Reset session on error so it gets recreated next time
      if (aiSessions.prompt && aiSessions.prompt.destroy) {
        aiSessions.prompt.destroy();
      }
      aiSessions.prompt = null;

      const errorMsg = 'Error during streaming: ' + streamError.message;
      messageContent.textContent = errorMsg;
      addMessageToData('assistant', errorMsg);
      return '__STREAMING_COMPLETE__';
    }

  } catch (error) {
    console.error('Prompt API error:', error);
    
    // Reset session on error
    if (aiSessions.prompt && aiSessions.prompt.destroy) {
      aiSessions.prompt.destroy();
    }
    aiSessions.prompt = null;

    const errorMsg = error.message || error.toString();
    if (errorMsg.includes('Model') || errorMsg.includes('model')) {
      return 'Error: Gemini Nano model not ready. Please:\n1. Enable chrome://flags/#optimization-guide-on-device-model (BypassPerfRequirement)\n2. Enable chrome://flags/#prompt-api-for-gemini-nano-multimodal-input\n3. Restart Chrome\n4. Run in DevTools: await LanguageModel.create()';
    }

    return 'Error using Prompt API: ' + errorMsg;
  }
}

// WRITER API WITH STREAMING
async function callWriterAPI(text) {
  try {
    if (!window.Writer) {
      return 'Writer API is not available. Please ensure you have enrolled in the Chrome Built-in AI Early Preview Program.';
    }

    // Create session if it doesn't exist
    if (!aiSessions.writer) {
      aiSessions.writer = await window.Writer.create();
    }

    // Create the assistant message element (empty initially for streaming)
    const assistantMessageDiv = addMessageToUI('assistant', '');
    const messageContent = assistantMessageDiv.querySelector('.message-content');

    try {
      // Use streaming
      const stream = aiSessions.writer.writeStreaming(text);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        messageContent.textContent = fullResponse;

        // Auto-scroll
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      // Save to chat history
      addMessageToData('assistant', fullResponse);
      return '__STREAMING_COMPLETE__';

    } catch (error) {
      console.error('Writer streaming error:', error);
      aiSessions.writer = null;
      const errorMsg = 'Error using Writer API: ' + error.message;
      messageContent.textContent = errorMsg;
      addMessageToData('assistant', errorMsg);
      return '__STREAMING_COMPLETE__';
    }

  } catch (error) {
    console.error('Writer API error:', error);
    aiSessions.writer = null;
    return 'Error using Writer API: ' + error.message;
  }
}

// SUMMARIZER API WITH STREAMING
async function callSummarizerAPI(text) {
  try {
    if (!window.Summarizer) {
      return 'Summarizer API is not available. Please ensure you have enrolled in the Chrome Built-in AI Early Preview Program and enabled the summarizer flag.';
    }

    // Check availability
    try {
      const availability = await window.Summarizer.availability();
      if (availability.available === 'no') {
        return 'Summarizer API is not available on this device.';
      }
      if (availability.available === 'after-download') {
        return 'AI model is downloading. Please wait and try again.';
      }
    } catch (capError) {
      console.warn('Could not check summarizer capabilities:', capError);
    }

    // Create session if it doesn't exist
    if (!aiSessions.summarizer) {
      try {
        aiSessions.summarizer = await window.Summarizer.create();
      } catch (createError) {
        console.error('Failed to create summarizer:', createError);
        return 'Failed to create summarizer session. Please ensure the API is properly enabled.';
      }
    }

    // Create the assistant message element (empty initially for streaming)
    const assistantMessageDiv = addMessageToUI('assistant', '');
    const messageContent = assistantMessageDiv.querySelector('.message-content');

    try {
      // Use streaming
      const stream = aiSessions.summarizer.summarizeStreaming(text);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        messageContent.textContent = fullResponse;

        // Auto-scroll
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      // Save to chat history
      addMessageToData('assistant', fullResponse);
      return '__STREAMING_COMPLETE__';

    } catch (error) {
      console.error('Summarizer streaming error:', error);
      aiSessions.summarizer = null;
      const errorMsg = 'Error using Summarizer API: ' + error.message;
      messageContent.textContent = errorMsg;
      addMessageToData('assistant', errorMsg);
      return '__STREAMING_COMPLETE__';
    }

  } catch (error) {
    console.error('Summarizer API error:', error);
    aiSessions.summarizer = null;
    return 'Error using Summarizer API: ' + error.message;
  }
}

// PROOFREADER API WITH STREAMING (using LanguageModel approach)
async function callProofreaderAPI(text) {
  try {
    if (!window.LanguageModel) {
      return 'Proofreader functionality is not available. Please ensure you have enrolled in the Chrome Built-in AI Early Preview Program.';
    }

    // Create session if it doesn't exist
    if (!aiSessions.proofreader) {
      aiSessions.proofreader = await window.LanguageModel.create(['en']);
    }

    // Create the assistant message element (empty initially for streaming)
    const assistantMessageDiv = addMessageToUI('assistant', '');
    const messageContent = assistantMessageDiv.querySelector('.message-content');

    try {
      // Use streaming with a proofreading prompt
      const prompt = `Please proofread and correct this text for grammar, spelling, punctuation errors, return the corrected response, and explain the errors in the least amount of sentences possible: ${text}`;
      const stream = aiSessions.proofreader.promptStreaming(prompt);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        messageContent.textContent = fullResponse;

        // Auto-scroll
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      // Save to chat history
      addMessageToData('assistant', fullResponse);
      return '__STREAMING_COMPLETE__';

    } catch (error) {
      console.error('Proofreader streaming error:', error);
      aiSessions.proofreader = null;
      const errorMsg = 'Error using Proofreader: ' + error.message;
      messageContent.textContent = errorMsg;
      addMessageToData('assistant', errorMsg);
      return '__STREAMING_COMPLETE__';
    }

  } catch (error) {
    console.error('Proofreader error:', error);
    aiSessions.proofreader = null;
    return 'Error using Proofreader: ' + error.message;
  }
}