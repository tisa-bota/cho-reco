// pad.js — 試聴パッドUI（Lite版：お気に入り・シーケンサー送信なし）

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

  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
