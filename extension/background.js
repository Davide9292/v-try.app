// MirrorMe Background Service Worker

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('MirrorMe: Extension installed');
    
    // Open popup to guide user through setup
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html')
    });
  } else if (details.reason === 'update') {
    console.log('MirrorMe: Extension updated');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateImage') {
    handleImageGeneration(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getStoredData') {
    chrome.storage.local.get(['geminiApiKey', 'userImage'])
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true;
  }
});

async function handleImageGeneration(data) {
  try {
    const { apiKey, userImage, targetImage, prompt } = data;
    
    if (!apiKey || !userImage || !targetImage) {
      throw new Error('Missing required data for image generation');
    }
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/png",
                data: userImage.split(',')[1] // Remove data URL prefix
              }
            },
            {
              inline_data: {
                mime_type: "image/png", 
                data: targetImage.includes(',') ? targetImage.split(',')[1] : targetImage
              }
            }
          ]
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }
    
    const result = await response.json();
    
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const parts = result.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inline_data && part.inline_data.data) {
          return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
        }
      }
    }
    
    throw new Error('No image data in response');
  } catch (error) {
    console.error('Background script error:', error);
    throw error;
  }
}

// Context menu integration (optional enhancement)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'mirrorme-image') {
    // Send message to content script to process the clicked image
    chrome.tabs.sendMessage(tab.id, {
      action: 'processImage',
      imageUrl: info.srcUrl
    });
  }
});

// Create context menu when extension starts
chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'mirrorme-image',
      title: 'MirrorMe con questa immagine',
      contexts: ['image'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
  });
}

// Handle storage changes for real-time updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('MirrorMe: Storage updated', changes);
    
    // Notify all content scripts about storage changes
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'storageUpdated',
          changes: changes
        }).catch(() => {
          // Ignore errors for tabs without content scripts
        });
      });
    });
  }
});

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(() => {
  console.log('MirrorMe: Extension suspending');
});

// Error handling
chrome.runtime.onError.addListener((error) => {
  console.error('MirrorMe Runtime Error:', error);
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will be handled by the popup, but we can add additional logic here if needed
  console.log('MirrorMe: Extension icon clicked on tab', tab.id);
});
