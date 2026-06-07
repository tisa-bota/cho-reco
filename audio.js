// audio.js — Web Audio API 音源（コード・メロディー・ドラム・音色選択）

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function mf(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// ── コード音色 ──────────────────────────────────────────────
let chordTimbre = 'piano'; // piano | epiano | guitar | pad | organ | mute

function playChord(notes, when, dur) {
  if (chordTimbre === 'mute') return;
  const ctx = getCtx();

  if (chordTimbre === 'piano') {
    notes.forEach(n => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = mf(n);
      g.gain.setValueAtTime(0.14, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(when); o.stop(when + dur + 0.05);
    });
  } else if (chordTimbre === 'epiano') {
    notes.forEach(n => {
      // FM: carrier + modulator
      const freq = mf(n);
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.frequency.value = freq * 2;
      modGain.gain.setValueAtTime(freq * 0.8, when);
      modGain.gain.exponentialRampToValueAtTime(freq * 0.01, when + dur * 0.6);
      const car = ctx.createOscillator();
      const g = ctx.createGain();
      car.type = 'sine'; car.frequency.value = freq;
      g.gain.setValueAtTime(0.13, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      mod.connect(modGain); modGain.connect(car.frequency);
      car.connect(g); g.connect(ctx.destination);
      mod.start(when); mod.stop(when + dur + 0.05);
      car.start(when); car.stop(when + dur + 0.05);
    });
  } else if (chordTimbre === 'guitar') {
    notes.forEach(n => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = mf(n);
      g.gain.setValueAtTime(0.1, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + Math.min(dur, 0.35));
      o.connect(g); g.connect(ctx.destination);
      o.start(when); o.stop(when + Math.min(dur, 0.4));
    });
  } else if (chordTimbre === 'pad') {
    notes.forEach(n => {
      const freq = mf(n);
      [1, 1.002, 0.998].forEach(det => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq * det;
        g.gain.setValueAtTime(0.001, when);
        g.gain.linearRampToValueAtTime(0.06, when + dur * 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, when + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(when); o.stop(when + dur + 0.1);
      });
    });
  } else if (chordTimbre === 'organ') {
    notes.forEach(n => {
      const freq = mf(n);
      [1, 2, 3].forEach((harm, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = freq * harm;
        g.gain.setValueAtTime(0.07 / (i + 1), when);
        g.gain.setValueAtTime(0.07 / (i + 1), when + dur - 0.01);
        g.gain.linearRampToValueAtTime(0.001, when + dur + 0.02);
        o.connect(g); g.connect(ctx.destination);
        o.start(when); o.stop(when + dur + 0.05);
      });
    });
  }
}

// ── メロディー音色 ──────────────────────────────────────────
function playMelNote(midi, when, dur) {
  const ctx = getCtx();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = mf(midi);
  g.gain.setValueAtTime(0.3, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + dur * 0.9);
  o.connect(g); g.connect(ctx.destination);
  o.start(when); o.stop(when + dur + 0.02);
}

// ── ドラム ───────────────────────────────────────────────────
function playDrum(t, when) {
  const ctx = getCtx();
  if (t === 0) { // Kick
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(40, when + 0.12);
    g.gain.setValueAtTime(1, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(when); o.stop(when + 0.25);
  } else if (t === 1) { // Snare
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; g.gain.setValueAtTime(0.5, when);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.value = 220; og.gain.setValueAtTime(0.25, when);
    og.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
    o.connect(og); og.connect(ctx.destination);
    s.connect(g); g.connect(ctx.destination);
    s.start(when); o.start(when); o.stop(when + 0.1);
  } else if (t === 2) { // Hi-hat
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.32, when);
    s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(when);
  } else { // Crash
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 5000; f.Q.value = 0.5;
    g.gain.setValueAtTime(0.4, when);
    s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(when);
  }
}

// コード試聴（パッド用）
function previewChord(chordName, durationSec = 0.8) {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const notes = CHORD_MIDI[chordName] || [60, 64, 67];
  playChord(notes, ctx.currentTime, durationSec);
}
