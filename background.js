'use strict';

const CACHE_PREFIX = 'wp_';
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const WIKI_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const TRANS_API = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=';

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === 'lookup') {
    performSmartLookup(req.word).then(sendResponse);
    return true; // Keep channel open
  }
});

async function performSmartLookup(text) {
  const query = text.trim();
  const isPhrase = query.includes(' ');

  // 1. Try Cache First
  const cached = await cacheGet(query);
  if (cached) return { ok: true, ...cached, fromCache: true };

  try {
    // 2. Branching Logic
    if (!isPhrase) {
      // Try Dictionary for single words
      const dRes = await fetch(DICT_API + encodeURIComponent(query.toLowerCase()));
      if (dRes.ok) {
        const json = await dRes.json();
        const data = { type: 'dict', entry: json[0] };
        await cacheSet(query, data);
        return { ok: true, ...data };
      }
    }

    // 3. Try Wikipedia (Entities/Places/Phrases)
    const wRes = await fetch(WIKI_API + encodeURIComponent(query));
    if (wRes.ok) {
      const wJson = await wRes.json();
      if (wJson.type === 'standard') {
        const data = { type: 'wiki', entry: wJson };
        await cacheSet(query, data);
        return { ok: true, ...data };
      }
    }

    // 4. Final Fallback: Translation
    const tRes = await fetch(TRANS_API + encodeURIComponent(query));
    const tJson = await tRes.json();
    const data = { type: 'trans', entry: tJson[0][0][0] };
    await cacheSet(query, data);
    return { ok: true, ...data };

  } catch (err) {
    return { ok: false, error: "Search failed." };
  }
}

// Helper: Cache Get/Set
async function cacheGet(k) {
  const r = await chrome.storage.local.get(CACHE_PREFIX + k);
  return r[CACHE_PREFIX + k];
}
async function cacheSet(k, v) {
  await chrome.storage.local.set({ [CACHE_PREFIX + k]: v });
}