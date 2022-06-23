let color = '#800080';

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({color});
    console.log('Default background color set to %cpurple', `color: ${color}`);
});
