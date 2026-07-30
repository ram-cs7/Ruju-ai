// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startVerification") {
    showRujuPopup('Verifying claim...', true);
  } else if (request.action === "verificationComplete") {
    displayResult(request.result);
  } else if (request.action === "verificationError") {
    showRujuPopup(`Error: ${request.error}`, false);
  }
});

let popupContainer = null;

function showRujuPopup(message, isLoading) {
  if (!popupContainer) {
    popupContainer = document.createElement('div');
    popupContainer.className = 'ruju-ext-popup';
    document.body.appendChild(popupContainer);
  }

  popupContainer.innerHTML = `
    <div class="ruju-ext-header">
      <div class="ruju-ext-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        Ruju.ai
      </div>
      <button class="ruju-ext-close" onclick="this.parentElement.parentElement.remove();">&times;</button>
    </div>
    <div class="ruju-ext-body">
      ${isLoading ? '<div class="ruju-ext-spinner"></div>' : ''}
      <div class="ruju-ext-message">${message}</div>
    </div>
  `;
  
  // Make the close button work (since onclick attribute doesn't always play well in content scripts due to CSP)
  const closeBtn = popupContainer.querySelector('.ruju-ext-close');
  closeBtn.addEventListener('click', () => {
    popupContainer.remove();
    popupContainer = null;
  });
}

function displayResult(result) {
  if (!popupContainer) return;
  
  let claimsHtml = '';
  
  if (result.claims && result.claims.length > 0) {
    result.claims.forEach(claim => {
      const colorClass = claim.status === 'VERIFIED' ? 'ruju-status-green' : 
                         claim.status === 'REFUTED' ? 'ruju-status-red' : 'ruju-status-yellow';
      
      claimsHtml += `
        <div class="ruju-claim-box">
          <div class="ruju-claim-status ${colorClass}">
            <strong>${claim.status}</strong>
          </div>
          <div class="ruju-claim-text">${claim.claim}</div>
          <div class="ruju-claim-reason">${claim.reasoning}</div>
          ${claim.evidence_quote ? `<div class="ruju-claim-quote">"${claim.evidence_quote}"</div>` : ''}
        </div>
      `;
    });
  } else {
    claimsHtml = '<div class="ruju-claim-box">No specific claims found.</div>';
  }
  
  popupContainer.querySelector('.ruju-ext-body').innerHTML = `
    <div class="ruju-ext-question"><strong>Query:</strong> ${result.question}</div>
    <div class="ruju-ext-claims">
      ${claimsHtml}
    </div>
  `;
}
