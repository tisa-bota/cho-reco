// sequencer.js — シーケンサー本体（グリッド描画・再生エンジン）

let STEPS = 32;
const CELL_W = 20;
const DRUM_NAMES = ['Kick', 'Snare', 'Hi-hat', 'Crash'];
const DRUM_CLS = ['on-kick', 'on-snare', 'on-hat', 'on-crash'];
const MEL_NOTES = [
  {n:'C5',m:72,black:false},{n:'B4',m:71,black:false},{n:'Bb4',m:70,black:true},
  {n:'A4',m:69,black:false},{n:'Ab4',m:68,black:true},{n:'G4',m:67,black:false},
  {n:'F#4',m:66,black:true},{n:'F4',m:65,black:false},{n:'E4',m:64,black:false},
  {n:'Eb4',m:63,black:true},{n:'D4',m:62,black:false},{n:'C#4',m:61,black:true},
  {n:'C4',m:60,black:false}
];

const CHORD_MIDI = {};
(function buildChordMidi() {
  const roots = {'C':60,'D':62,'E':64,'F':65,'G':67,'A':69,'B':71,
    'Db':61,'Eb':63,'F#':66,'Ab':68,'Bb':70,'C#':61,'D#':63,'G#':68,'A#':70};
  Object.keys(roots).forEach(r => {
    const b = roots[r];
    CHORD_MIDI[r] = [b,b+4,b+7];
    CHORD_MIDI[r+'m'] = [b,b+3,b+7];
    CHORD_MIDI[r+'7'] = [b,b+4,b+7,b+10];
    CHORD_MIDI[r+'maj7'] = [b,b+4,b+7,b+11];
    CHORD_MIDI[r+'m7'] = [b,b+3,b+7,b+10];
    CHORD_MIDI[r+'sus4'] = [b,b+5,b+7];
    CHORD_MIDI[r+'dim'] = [b,b+3,b+6];
    CHORD_MIDI[r+'aug'] = [b,b+4,b+8];
  });
})();

const KEY_CHORDS = {
  'C':['C','Dm','Em','F','G','Am','G7','Cmaj7','Am7','Dm7','Fmaj7','Gsus4','Em7','F/A','C/E','G/B'],
  'D':['D','Em','F#m','G','A','Bm','A7','Dmaj7','Bm7','Em7','Gmaj7','Asus4','F#m7','G/B','D/F#','A/C#'],
  'E':['E','F#m','G#m','A','B','C#m','B7','Emaj7','C#m7','F#m7','Amaj7','Bsus4','G#m7','A/C#','E/G#','B/D#'],
  'F':['F','Gm','Am','Bb','C','Dm','C7','Fmaj7','Dm7','Gm7','Bbmaj7','Csus4','Am7','Bb/D','F/A','C/E'],
  'G':['G','Am','Bm','C','D','Em','D7','Gmaj7','Em7','Am7','Cmaj7','Dsus4','Bm7','C/E','G/B','D/F#'],
  'A':['A','Bm','C#m','D','E','F#m','E7','Amaj7','F#m7','Bm7','Dmaj7','Esus4','C#m7','D/F#','A/C#','E/G#'],
  'B':['B','C#m','D#m','E','F#','G#m','F#7','Bmaj7','G#m7','C#m7','Emaj7','F#sus4','D#m7','E/G#','B/D#','F#/A#'],
  'Cm':['Cm','Dm','Eb','Fm','Gm','Ab','G7','Cm7','Fm7','Gm7','Ebmaj7','Gsus4','Bbmaj7','Ab/C','Cm/Eb','G7/B'],
  'Dm':['Dm','Em','F','Gm','Am','Bb','A7','Dm7','Gm7','Am7','Fmaj7','Asus4','Cmaj7','Bb/D','Dm/F','A7/C#'],
  'Em':['Em','F#m','G','Am','Bm','C','B7','Em7','Am7','Bm7','Gmaj7','Bsus4','Dmaj7','C/E','Em/G','B7/D#'],
  'Fm':['Fm','Gm','Ab','Bbm','Cm','Db','C7','Fm7','Bbm7','Cm7','Abmaj7','Csus4','Ebmaj7','Db/F','Fm/Ab','C7/E'],
  'Gm':['Gm','Am','Bb','Cm','Dm','Eb','D7','Gm7','Cm7','Dm7','Bbmaj7','Dsus4','Fmaj7','Eb/G','Gm/Bb','D7/F#'],
  'Am':['Am','Bm','C','Dm','Em','F','E7','Am7','Dm7','Em7','Cmaj7','Esus4','Gmaj7','F/A','Am/C','E7/G#'],
  'Bm':['Bm','C#m','D','Em','F#m','G','F#7','Bm7','Em7','F#m7','Dmaj7','F#sus4','Amaj7','G/B','Bm/D','F#7/A#'],
};

let chordGrid = Array(STEPS).fill(null);
let drumGrid = Array(4).fill(null).map(() => Array(STEPS).fill(false));
let melGrid = Array(MEL_NOTES.length).fill(null).map(() => Array(STEPS).fill(0));
let selChord = 'C';
let selMelNote = 0;
let selNoteDur = 4;
let isPlaying = false;
let bpm = 100;
let stepIdx = 0;
let nextStepTime = 0;
let schedTimer = null;

// コード進行をシーケンサーにロード
function loadChordProgression(chords) {
  chordGrid = Array(STEPS).fill(null);
  chords.forEach((chord, i) => {
    const step = i * 4;
    if (step < STEPS) chordGrid[step] = chord;
  });
  renderChord();
}

function selDur(d) {
  selNoteDur = d;
  document.querySelectorAll('.ndbtn').forEach(b => b.classList.toggle('sel', +b.dataset.dur === d));
}

function changeSteps(n) {
  STEPS = n;
  chordGrid = Array(STEPS).fill(null);
  drumGrid = Array(4).fill(null).map(() => Array(STEPS).fill(false));
  melGrid = Array(MEL_NOTES.length).fill(null).map(() => Array(STEPS).fill(0));
  render();
}

function clearAll() {
  chordGrid = Array(STEPS).fill(null);
  drumGrid = Array(4).fill(null).map(() => Array(STEPS).fill(false));
  melGrid = Array(MEL_NOTES.length).fill(null).map(() => Array(STEPS).fill(0));
  render();
}

function makeBarHeader(id) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  for (let s = 0; s < STEPS; s++) {
    const d = document.createElement('div');
    d.className = 'bar-tick' + (s % 4 === 0 ? ' bs' : '');
    d.style.width = CELL_W + 'px';
    d.textContent = s % 4 === 0 ? 'B' + (Math.floor(s / 4) + 1) : '·';
    el.appendChild(d);
  }
}

function renderChord() {
  makeBarHeader('chord-bar-header');
  const container = document.getElementById('chord-cells');
  container.innerHTML = '';
  for (let s = 0; s < STEPS; s++) {
    const c = document.createElement('div');
    c.className = 'cell' + (s % 4 === 0 ? ' b1' : '');
    c.dataset.step = s;
    c.style.width = CELL_W + 'px';
    if (chordGrid[s]) { c.classList.add('on-chord'); c.textContent = chordGrid[s]; c.style.fontSize = '8px'; }
    c.onclick = () => { chordGrid[s] = chordGrid[s] === selChord ? null : selChord; renderChord(); };
    container.appendChild(c);
  }
}

function renderDrum() {
  makeBarHeader('drum-bar-header');
  const tnCol = document.getElementById('drum-tn-col');
  tnCol.innerHTML = '';
  const rowsContainer = document.getElementById('drum-rows');
  rowsContainer.innerHTML = '';
  drumGrid.forEach((tr, t) => {
    const tn = document.createElement('div');
    tn.className = 'tn'; tn.style.height = '26px';
    tn.style.borderBottom = '1px solid #e0e0e0';
    tn.textContent = DRUM_NAMES[t];
    tnCol.appendChild(tn);
    const row = document.createElement('div');
    row.className = 'track-row';
    const cells = document.createElement('div');
    cells.className = 'cells';
    for (let s = 0; s < STEPS; s++) {
      const c = document.createElement('div');
      c.className = 'cell' + (s % 4 === 0 ? ' b1' : '');
      c.dataset.step = s;
      c.style.width = CELL_W + 'px';
      if (tr[s]) { c.classList.add(DRUM_CLS[t]); c.textContent = '●'; }
      c.onclick = ((() => { const ss = s, tt = t; return () => { drumGrid[tt][ss] = !drumGrid[tt][ss]; renderDrum(); }; })());
      cells.appendChild(c);
    }
    row.appendChild(cells);
    rowsContainer.appendChild(row);
  });
}

function renderMel() {
  makeBarHeader('mel-bar-header');
  const tnCol = document.getElementById('mel-tn-col');
  tnCol.innerHTML = '';
  const rowsContainer = document.getElementById('mel-rows');
  rowsContainer.innerHTML = '';
  MEL_NOTES.forEach((note, ni) => {
    const tn = document.createElement('div');
    tn.className = 'tn clickable' + (note.black ? ' black-key' : '');
    tn.style.height = '26px';
    tn.style.borderBottom = '1px solid #e0e0e0';
    tn.textContent = note.n;
    if (ni === selMelNote) { tn.style.background = '#166834'; tn.style.color = '#dcfce7'; }
    tn.onclick = () => { selMelNote = ni; renderMel(); };
    tnCol.appendChild(tn);
    const row = document.createElement('div');
    row.className = 'track-row';
    const cells = document.createElement('div');
    cells.className = 'cells';
    let s = 0;
    while (s < STEPS) {
      const dur = melGrid[ni][s];
      if (dur > 0) {
        const c = document.createElement('div');
        c.className = 'cell on-mel' + (s % 4 === 0 ? ' b1' : '');
        c.dataset.step = s;
        c.style.width = (CELL_W * dur) + 'px';
        c.style.borderRight = '1px solid #e0e0e0';
        const durLabel = {16:'全',8:'2分',4:'4分',2:'8分',1:'16分'};
        c.textContent = durLabel[dur] || '♩';
        c.style.fontSize = '8px';
        c.onclick = ((() => { const ss = s, nni = ni, dd = dur; return () => {
          for (let i = 0; i < dd && ss + i < STEPS; i++) melGrid[nni][ss + i] = 0;
          renderMel();
        }; })());
        cells.appendChild(c);
        s += dur;
      } else {
        const c = document.createElement('div');
        c.className = 'cell' + (s % 4 === 0 ? ' b1' : '');
        c.dataset.step = s;
        c.style.width = CELL_W + 'px';
        c.onclick = ((() => { const ss = s, nni = ni; return () => {
          if (nni !== selMelNote) { selMelNote = nni; renderMel(); return; }
          const dur = selNoteDur;
          let canPlace = true;
          for (let i = 0; i < dur && ss + i < STEPS; i++) if (melGrid[nni][ss + i] > 0) { canPlace = false; break; }
          if (canPlace) { melGrid[nni][ss] = dur; for (let i = 1; i < dur && ss + i < STEPS; i++) melGrid[nni][ss + i] = -1; }
          renderMel();
        }; })());
        cells.appendChild(c);
        s++;
      }
    }
    row.appendChild(cells);
    rowsContainer.appendChild(row);
  });
}

function buildChordPicker() {
  const key = document.getElementById('key-sel').value;
  const chords = KEY_CHORDS[key] || KEY_CHORDS['C'];
  const picker = document.getElementById('chord-picker');
  picker.innerHTML = chords.map(c =>
    `<button class="cp${c === selChord ? ' sel' : ''}" onclick="selChord='${c}';buildChordPicker()">${c}</button>`
  ).join('');
}

function render() { renderChord(); renderDrum(); renderMel(); }

// 再生エンジン
function schedStep(s, when) {
  const sps = 60 / bpm / 4;
  const chord = chordGrid[s];
  if (chord) { const notes = CHORD_MIDI[chord] || [60,64,67]; playChord(notes, when, sps * 3.8); }
  drumGrid.forEach((tr, t) => { if (tr[s]) playDrum(t, when); });
  melGrid.forEach((tr, ni) => {
    const dur = tr[s];
    if (dur > 0) playMelNote(MEL_NOTES[ni].m, when, sps * dur * 0.92);
  });
}

function scheduler() {
  const ctx = getCtx();
  const sps = 60 / bpm / 4;
  while (nextStepTime < ctx.currentTime + 0.12) {
    const s = stepIdx, t = nextStepTime;
    schedStep(s, t);
    setTimeout(() => highlight(s), Math.max(0, (t - ctx.currentTime) * 1000));
    stepIdx = (stepIdx + 1) % STEPS;
    nextStepTime += sps;
  }
  schedTimer = setTimeout(scheduler, 25);
}

function highlight(s) {
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.toggle('playing', +c.dataset.step === s);
  });
}

function togglePlay() {
  if (isPlaying) { stopSeq(); return; }
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  isPlaying = true; stepIdx = 0; nextStepTime = ctx.currentTime; scheduler();
  const btn = document.getElementById('play-btn');
  btn.classList.add('act'); btn.textContent = '⏸ 一時停止';
}

function stopSeq() {
  isPlaying = false; clearTimeout(schedTimer);
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('playing'));
  const btn = document.getElementById('play-btn');
  btn.classList.remove('act'); btn.textContent = '▶ 再生';
}
