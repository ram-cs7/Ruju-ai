const API_URL = 'http://localhost:3000/api/v1/verify';

// Create a context menu item for highlighting text and verifying it
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verify-ruju",
    title: "Verify with Ruju.ai",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verify-ruju") {
    // Send message to content script to show loading UI
    chrome.tabs.sendMessage(tab.id, { action: "startVerification", text: info.selectionText });
    
    // Perform verification API call
    performVerification(info.selectionText, tab.id);
  }
});

async function performVerification(text, tabId) {
  // Get API key and active document ID from storage
  chrome.storage.sync.get(['apiKey', 'documentId'], async (result) => {
    if (!result.apiKey) {
      chrome.tabs.sendMessage(tabId, { action: "verificationError", error: "No API Key configured. Click the Ruju extension icon to set it up." });
      return;
    }
    if (!result.documentId) {
      chrome.tabs.sendMessage(tabId, { action: "verificationError", error: "No Document ID configured. Click the Ruju extension icon to enter one." });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.apiKey}`
        },
        body: JSON.stringify({
          question: text,
          documentIds: [result.documentId]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      chrome.tabs.sendMessage(tabId, { action: "verificationComplete", result: data });
    } catch (error) {
      chrome.tabs.sendMessage(tabId, { action: "verificationError", error: error.message });
    }
  });
}
