// pad.js — 試聴パッド + お気に入り管理 UI

// currentPattern: 現在表示中のパターン {name, resolvedChords, key, numerals}
let currentPattern = null;

function showPad(pattern) {
  currentPattern = pattern;
  const section = document.getElementById('pad-section');
  section.style.display = 'block';

  document.getElementById('pad-pattern-name').textContent = pattern.name;
  document.getElementById('pad-pattern-desc').textContent = pattern.desc || '';

  const grid = document.getElementById('pad-grid');
  grid.innerHTML = '';
  pattern.resolvedChords.forEach((chordName, i) => {
    const btn = document.createElement('button');
    btn.className = 'pad-btn';
    btn.innerHTML = `<span class="pad-numeral">${pattern.numerals[i]}</span><span class="pad-chord">${chordName}</span>`;
    btn.onclick = () => {
      previewChord(chordName);
      btn.classList.add('pad-btn--active');
      setTimeout(() => btn.classList.remove('pad-btn--active'), 300);
    };
    grid.appendChild(btn);
  });

  // お気に入りボタン状態更新
  updateFavButton();
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateFavButton() {
  const btn = document.getElementById('fav-add-btn');
  if (!btn || !currentPattern) return;
  const favs = loadFavorites();
  const exists = favs.some(f =>
    f.name === currentPattern.name &&
    JSON.stringify(f.chords) === JSON.stringify(currentPattern.resolvedChords)
  );
  btn.textContent = exists ? '✓ お気に入り済み' : '♡ お気に入り登録';
  btn.classList.toggle('fav-btn--saved', exists);
}

function handleFavAdd() {
  if (!currentPattern) return;
  const favs = loadFavorites();
  const exists = favs.some(f =>
    f.name === currentPattern.name &&
    JSON.stringify(f.chords) === JSON.stringify(currentPattern.resolvedChords)
  );
  if (exists) return;
  addFavorite(currentPattern.name, currentPattern.resolvedChords, currentPattern.key || '');
  updateFavButton();
  renderFavorites();
}

function renderFavorites() {
  const favs = loadFavorites();
  const list = document.getElementById('fav-list');
  const empty = document.getElementById('fav-empty');
  if (!list) return;
  if (favs.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = favs.map(f => `
    <div class="fav-item" id="fav-${f.id}">
      <div class="fav-item-info">
        <div class="fav-item-name">${f.name}</div>
        <div class="fav-item-chords">${f.chords.join(' → ')}</div>
        ${f.key ? `<div class="fav-item-key">Key: ${f.key}</div>` : ''}
      </div>
      <div class="fav-item-actions">
        <button class="fav-action-btn fav-load-btn" onclick="loadFavToSequencer(${f.id})">
          ▶ シーケンサーへ
        </button>
        <button class="fav-action-btn fav-del-btn" onclick="deleteFav(${f.id})">✕</button>
      </div>
    </div>
  `).join('');
}

function deleteFav(id) {
  removeFavorite(id);
  renderFavorites();
  updateFavButton();
}

function loadFavToSequencer(id) {
  const favs = loadFavorites();
  const fav = favs.find(f => f.id === id);
  if (!fav) return;
  loadChordProgression(fav.chords);
  // シーケンサータブへ切替
  switchTab('sequencer');
}
