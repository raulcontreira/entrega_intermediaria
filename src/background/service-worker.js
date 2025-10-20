
chrome.runtime.onInstalled.addListener(() => {
  console.log('Bootcamp Helper instalado.');
  chrome.storage.local.set({ installs: (Date.now()) });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PING') {
    sendResponse({ ok: true, time: new Date().toISOString() });
  }
});

