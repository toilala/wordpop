chrome.storage.local.get('history', ({ history = [] }) => {
  const list = document.getElementById('list');
  list.innerHTML = history.length 
    ? history.map(w => `<div class="item">${w}</div>`).join('')
    : '<div style="color:#999">No history.</div>';
});