let isBlocking = false;
let blockedUrls = [];

// Helper function to safely access chrome.storage
async function getChromeStorage() {
  if (!chrome?.storage?.local) {
    throw new Error('Chrome extension API not available');
  }
  return chrome.storage.local;
}

// Load saved state and URLs when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('DOM Content Loaded, checking storage...');
    
    // Get the storage instance
    const storage = await getChromeStorage();
    console.log('Storage available:', storage);
    
    // Use proper Promise syntax for storage operations
    storage.get(['isBlocking', 'blockedUrls']).then((result) => {
      console.log('Data retrieved:', result);
      isBlocking = result.isBlocking || false;
      blockedUrls = result.blockedUrls || [];
      
      console.log('Initial state loaded:', { isBlocking, blockedUrls });
      
      const urlListElement = document.getElementById('urlList');
      if (urlListElement) {
        urlListElement.value = blockedUrls.join('\n');
      }
      updateButtonState();
    });
  } catch (error) {
    console.error('Error loading initial state:', error);
  }
});

// Toggle button functionality
const toggleButton = document.querySelector('.toggle-button');
toggleButton.addEventListener('click', async () => {
  try {
    toggleButton.disabled = true;
    isBlocking = !isBlocking;
    
    const storage = await getChromeStorage();
    await storage.set({ isBlocking }).then(() => {
      console.log('Value is set:', isBlocking);
    });
    
    await updateBlocking();
    updateButtonState();
  } catch (error) {
    console.error('Error toggling blocking state:', error);
    isBlocking = !isBlocking;
    updateButtonState();
  } finally {
    toggleButton.disabled = false;
  }
});

// Settings panel toggle
const settingsIcon = document.querySelector('.settings-icon');
const settingsPanel = document.querySelector('.settings-panel');
settingsIcon.addEventListener('click', () => {
  settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', async () => {
  const urls = document.getElementById('urlList').value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url)
    .map(url => {
      try {
        let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
        cleanUrl = cleanUrl.split('/')[0];
        return `*://*.${cleanUrl}/*`;
      } catch {
        return url;
      }
    });
  
  try {
    blockedUrls = urls;
    const storage = await getChromeStorage();
    await storage.set({ blockedUrls });
    await updateBlocking();
    settingsPanel.style.display = 'none';
  } catch (error) {
    console.error('Error saving settings:', error);
  }
});

async function updateBlocking() {
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_RULES',
      isBlocking,
      urls: blockedUrls
    });
    console.log('Rules updated successfully'); // Debug log
  } catch (error) {
    console.error('Error updating blocking rules:', error);
    throw error; // Re-throw to be caught by the toggle button handler
  }
}

function updateButtonState() {
  if (!toggleButton) return; // Safety check
  
  toggleButton.textContent = isBlocking ? 'ON' : 'OFF';
  
  // Update the active class
  if (isBlocking) {
    toggleButton.classList.add('active');
  } else {
    toggleButton.classList.remove('active');
  }
}
