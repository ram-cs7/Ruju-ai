document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const documentIdInput = document.getElementById('documentId');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'documentId'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.documentId) documentIdInput.value = result.documentId;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const documentId = documentIdInput.value.trim();
    
    chrome.storage.sync.set({ apiKey, documentId }, () => {
      statusEl.style.display = 'block';
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 2000);
    });
  });
});
