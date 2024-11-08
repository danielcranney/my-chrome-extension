// Constants for rule management
const RULE_ID_OFFSET = 1000;

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isBlocking: false, blockedUrls: [] });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_RULES") {
    updateBlockingRules(message.isBlocking, message.urls)
      .then(() => {
        console.log("Rules updated:", {
          isBlocking: message.isBlocking,
          urls: message.urls,
        });
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error updating rules:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates we will send a response asynchronously
  }
});

// Function to create blocking rules
async function updateBlockingRules(isBlocking, urls) {
  // Remove existing rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
  });

  // If blocking is enabled, create new rules
  if (isBlocking && urls.length > 0) {
    const rules = urls.map((url, index) => ({
      id: RULE_ID_OFFSET + index,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: url,
        resourceTypes: ["main_frame"],
      },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
    });
  }
}
