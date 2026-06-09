// storage.js — お気に入り管理

const STORAGE_KEY = 'choreco_favorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

function addFavorite(name, chords, key) {
  const favs = loadFavorites();
  const entry = { id: Date.now(), name, chords, key, savedAt: new Date().toISOString() };
  favs.unshift(entry);
  saveFavorites(favs);
  return entry;
}

function removeFavorite(id) {
  const favs = loadFavorites().filter(f => f.id !== id);
  saveFavorites(favs);
}
