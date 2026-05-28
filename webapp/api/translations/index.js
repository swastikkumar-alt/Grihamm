const crypto = require('crypto');

const GOOGLE_TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const MAX_REQUEST_CHARACTERS = 200000;
const TRANSLATION_CACHE_VERSION = 'google-v1';

const json = (status, body) => ({
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=31536000, immutable',
  },
  body,
});

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

const isLanguageCode = value => /^[a-z]{2,3}(-[a-z0-9]+)*$/i.test(String(value || ''));

const flattenStrings = (value, path = [], out = []) => {
  if (typeof value === 'string') {
    out.push({ path, value });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenStrings(item, [...path, index], out));
    return out;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => flattenStrings(item, [...path, key], out));
  }
  return out;
};

const setAtPath = (target, path, value) => {
  let cursor = target;
  path.slice(0, -1).forEach(segment => {
    cursor = cursor[segment];
  });
  cursor[path[path.length - 1]] = value;
};

const maskPlaceholders = text => {
  const placeholders = [];
  const masked = text.replace(/{{\s*[\w.]+\s*}}/g, match => {
    const token = `__GRIHAMM_VAR_${placeholders.length}__`;
    placeholders.push({ token, match });
    return token;
  });
  return { masked, placeholders };
};

const unmaskPlaceholders = (text, placeholders) => {
  let next = text;
  placeholders.forEach(({ token, match }) => {
    next = next.replaceAll(token, match);
  });
  return next;
};

const decodeEntities = value => value
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const getSupabaseHeaders = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.SUPABASE_URL || !serviceKey) return null;
  return {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    'content-type': 'application/json',
  };
};

const getCachedTranslation = async cacheKey => {
  const headers = getSupabaseHeaders();
  if (!headers) return null;

  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/translation_cache?cache_key=eq.${cacheKey}&select=resources&limit=1`, {
    headers,
  });
  if (!response.ok) return null;

  const rows = await response.json();
  return rows?.[0]?.resources || null;
};

const saveCachedTranslation = async row => {
  const headers = getSupabaseHeaders();
  if (!headers) return;

  await fetch(`${process.env.SUPABASE_URL}/rest/v1/translation_cache`, {
    method: 'POST',
    headers: {
      ...headers,
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
};

const translateChunk = async ({ apiKey, language, entries }) => {
  const maskedEntries = entries.map(entry => maskPlaceholders(entry.value));
  const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      q: maskedEntries.map(entry => entry.masked),
      source: 'en',
      target: language,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Translation failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  return (payload?.data?.translations || []).map((item, index) => (
    unmaskPlaceholders(decodeEntities(item.translatedText || entries[index].value), maskedEntries[index].placeholders)
  ));
};

module.exports = async function translations(context, req) {
  const language = String(req.params.language || '').toLowerCase();
  const resources = req.body?.resources;
  const sourceLanguage = req.body?.sourceLanguage || 'en';

  if (!isLanguageCode(language)) {
    context.res = json(400, { error: 'Invalid target language.' });
    return;
  }

  if (sourceLanguage !== 'en' || !resources || typeof resources !== 'object') {
    context.res = json(400, { error: 'English resources are required.' });
    return;
  }

  if (language === 'en') {
    context.res = json(200, { language, resources, cached: true, provider: 'source' });
    return;
  }

  const sourceHash = sha256(JSON.stringify(resources));
  const cacheKey = sha256(`${TRANSLATION_CACHE_VERSION}:${sourceHash}:${language}`);
  const cached = await getCachedTranslation(cacheKey);
  if (cached) {
    context.res = json(200, { language, resources: cached, cached: true, provider: 'supabase' });
    return;
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    context.res = json(503, { error: 'GOOGLE_TRANSLATE_API_KEY is not configured.' });
    return;
  }

  const entries = flattenStrings(resources);
  const totalCharacters = entries.reduce((sum, entry) => sum + entry.value.length, 0);
  if (totalCharacters > MAX_REQUEST_CHARACTERS) {
    context.res = json(413, { error: `Translation payload exceeds ${MAX_REQUEST_CHARACTERS} characters.` });
    return;
  }

  const translatedResources = JSON.parse(JSON.stringify(resources));
  for (let index = 0; index < entries.length; index += 100) {
    const chunk = entries.slice(index, index + 100);
    const translated = await translateChunk({ apiKey, language, entries: chunk });
    translated.forEach((value, offset) => setAtPath(translatedResources, chunk[offset].path, value));
  }

  await saveCachedTranslation({
    cache_key: cacheKey,
    source_language: 'en',
    target_language: language,
    source_hash: sourceHash,
    resources: translatedResources,
    provider: 'google-translate-v2',
  });

  context.res = json(200, { language, resources: translatedResources, cached: false, provider: 'google-translate-v2' });
};
