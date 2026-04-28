(function() {
  let host, shadow, popup, bubble;

  function init() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'wp-host';
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      #wp-box, #wp-bub { position: fixed; z-index: 2147483647; font-family: sans-serif; }
      #wp-bub { width: 28px; height: 28px; background: #4f46e5; border-radius: 50%; color: #fff; 
                display: none; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; }
      #wp-box { width: 300px; background: #fff; border: 1px solid #ddd; border-radius: 8px; 
                padding: 12px; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #111; }
      .title { font-weight: bold; font-size: 16px; color: #4f46e5; margin-bottom: 4px; }
      .meaning { margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
      @media (prefers-color-scheme: dark) {
        #wp-box { background: #1c1917; color: #e7e5e4; border-color: #444; }
      }
    `;
    shadow.appendChild(style);

    popup = document.createElement('div'); popup.id = 'wp-box';
    bubble = document.createElement('div'); bubble.id = 'wp-bub';
    bubble.innerText = 'W';

    shadow.appendChild(popup);
    shadow.appendChild(bubble);

    bubble.onclick = () => render(bubble.dataset.word, bubble.dataset.rect);
  }

  async function render(word, rectStr) {
    const rect = JSON.parse(rectStr);
    popup.style.display = 'block';
    popup.innerHTML = 'Thinking...';
    position(popup, rect);
    bubble.style.display = 'none';

    const res = await chrome.runtime.sendMessage({ type: 'lookup', word });
    if (!res.ok) { popup.innerHTML = "No results."; return; }

    let html = '';
    if (res.type === 'dict') {
      html = `<div class="title">${res.entry.word}</div>`;

      /*multiple definition*/
      res.entry.meanings.slice(0, 3).forEach(m => {
        html += `<div class="meaning"><b>${m.partOfSpeech}</b>: ${m.definitions[0].definition}</div>`;
      });
    } else if (res.type === 'wiki') {
      html = `<div class="title">${res.entry.title}</div><div>${res.entry.extract}</div>`;
    } else {
      html = `<div class="title">Translation</div><div>${res.entry}</div>`;
    }
    popup.innerHTML = html;
  }

  function position(el, rect) {
    el.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    el.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';
  }

  document.addEventListener('mouseup', () => {
    const sel = window.getSelection();
    const text = sel.toString().trim();
    if (!text || text.length > 300) return;

    init();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    
    if (text.includes(' ')) {
      bubble.style.display = 'flex';
      bubble.dataset.word = text;
      bubble.dataset.rect = JSON.stringify(rect);
      position(bubble, rect);
      popup.style.display = 'none';
    } else {
      render(text, JSON.stringify(rect));
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (host && !e.composedPath().includes(host)) {
      popup.style.display = 'none';
      bubble.style.display = 'none';
    }
  });
})();