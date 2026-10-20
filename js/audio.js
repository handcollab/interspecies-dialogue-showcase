// One audio element, one AnalyserNode: every visual on the page listens to it.
import { clamp, lerp } from './util.js';

export const TRACKS = [
  { id: 'one-pass-read-excerpt-90s', zh: '單向讀取 · 節錄 90 秒', en: 'ONE-PASS READ — 2:45–4:15', meta: '第二樂章尾聲 → 栓塞風暴', dur: 90 },
  { id: 'one-pass-read-full-600s', zh: '單向讀取 · 全曲', en: 'ONE-PASS READ — 600 s', meta: '五個樂章 · 切點 73 · 167 · 283 · 433', dur: 600, opr: true },
  { id: 'music-01-transpiration', zh: '蒸散', en: 'TRANSPIRATION', meta: '3/4 · 72 BPM · D 多利亞', dur: 180 },
  { id: 'music-02-phloem-flow', zh: '韌皮流', en: 'PHLOEM FLOW', meta: '4/4 · 96 BPM 搖擺 · A 多利亞', dur: 180 },
  { id: 'music-03-photoperiod', zh: '光週期', en: 'PHOTOPERIOD', meta: '4/4 · 128 BPM · F 利地亞', dur: 180 },
  { id: 'music-04-rings-in-seven', zh: '年輪七拍', en: 'RINGS IN SEVEN', meta: '7/8 · 弗里吉亞 → 利地亞', dur: 180 },
  { id: 'performance-12min-excerpt-60s', zh: '展演聲音 · 節錄 60 秒', en: 'PERFORMANCE (12 MIN) — 7:36–8:36', meta: '嘟嚕嚕顫音與 2.5–9 kHz 高頻純音', dur: 60 },
];

class Engine extends EventTarget {
  constructor() {
    super();
    this.el = new Audio();
    this.el.preload = 'none';
    this.el.crossOrigin = 'anonymous';
    this.track = null;
    this.ctx = null;
    this.bands = { bass: 0, mid: 0, high: 0, level: 0, onset: 0 };
    this._avg = { bass: 0, mid: 0, high: 0 };
    this._prevHigh = 0; this._prevBass = 0;
    this.peaks = {};
    for (const ev of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata']) {
      this.el.addEventListener(ev, () => this.dispatchEvent(new Event(ev)));
    }
    this.el.addEventListener('ended', () => this.next());
    this.el.addEventListener('error', () => this.dispatchEvent(new Event('mediaerror')));
  }
  get playing() { return !this.el.paused && !this.el.ended; }
  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.src = this.ctx.createMediaElementSource(this.el);
      this.an = this.ctx.createAnalyser();
      this.an.fftSize = 2048;
      this.an.smoothingTimeConstant = 0.72;
      this.src.connect(this.an);
      this.an.connect(this.ctx.destination);
      this.freq = new Uint8Array(this.an.frequencyBinCount);
      this.wave = new Uint8Array(this.an.fftSize);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  async loadPeaks(id) {
    if (this.peaks[id]) return this.peaks[id];
    try {
      const r = await fetch(`assets/audio/${id}.peaks.json`);
      this.peaks[id] = await r.json();
    } catch (e) { this.peaks[id] = null; }
    return this.peaks[id];
  }
  select(id, autoplay = true, at = null) {
    const t = TRACKS.find((x) => x.id === id) || TRACKS[0];
    this.ensureCtx();
    if (!this.track || this.track.id !== t.id) {
      this.track = t;
      this.el.src = `assets/audio/${t.id}.mp3`;
      this.el.currentTime = 0;
      this.dispatchEvent(new Event('track'));
      this.loadPeaks(t.id).then(() => this.dispatchEvent(new Event('peaks')));
    }
    // 0 is a real seek target (movement I / segment I); only null/undefined means "don't seek"
    if (typeof at === 'number' && at >= 0) {
      const seek = () => { try { this.el.currentTime = at; } catch (e) { /* not yet seekable */ } };
      if (this.el.readyState >= 1) seek(); else this.el.addEventListener('loadedmetadata', seek, { once: true });
    }
    if (autoplay) this.play();
  }
  play() {
    this.ensureCtx();
    if (!this.track) { this.select(TRACKS[0].id, true); return; }
    document.dispatchEvent(new CustomEvent('sound:exclusive', { detail: 'engine' }));
    const p = this.el.play();
    if (p && p.catch) p.catch(() => this.dispatchEvent(new Event('blocked')));
  }
  pause() { this.el.pause(); }
  toggle() { this.playing ? this.pause() : this.play(); }
  seek(frac) { if (this.el.duration) this.el.currentTime = clamp(frac) * this.el.duration; }
  next() {
    const i = TRACKS.findIndex((x) => x.id === (this.track && this.track.id));
    this.select(TRACKS[(i + 1) % TRACKS.length].id, true);
  }
  update(dt) {
    const b = this.bands;
    if (!this.an || !this.playing) {
      b.bass = lerp(b.bass, 0, 0.08); b.mid = lerp(b.mid, 0, 0.08); b.high = lerp(b.high, 0, 0.08);
      b.level = lerp(b.level, 0, 0.08); b.onset = lerp(b.onset, 0, 0.2);
      return b;
    }
    this.an.getByteFrequencyData(this.freq);
    this.an.getByteTimeDomainData(this.wave);
    const sr = this.ctx.sampleRate, n = this.freq.length, hz = sr / 2 / n;
    const band = (lo, hi) => {
      const a = Math.max(1, Math.floor(lo / hz)), z = Math.min(n - 1, Math.ceil(hi / hz));
      let s = 0; for (let i = a; i <= z; i++) s += this.freq[i];
      return s / ((z - a + 1) * 255);
    };
    const raw = { bass: band(30, 170), mid: band(250, 2000), high: band(2500, 9000) };
    let rms = 0; for (let i = 0; i < this.wave.length; i += 4) { const v = (this.wave[i] - 128) / 128; rms += v * v; }
    rms = Math.sqrt(rms / (this.wave.length / 4));
    const G = { bass: 1.15, mid: 1.7, high: 3.4 };
    for (const k of ['bass', 'mid', 'high']) {
      // absolute level plus transients above a slow running average
      this._avg[k] = lerp(this._avg[k], raw[k], 1 - Math.exp(-dt / 1.6));
      const dev = Math.max(0, raw[k] - this._avg[k]);
      const v = clamp(raw[k] * G[k] * 0.6 + dev * G[k] * 2.4);
      b[k] = lerp(b[k], v, v > b[k] ? 0.55 : 0.14);
    }
    b.level = lerp(b.level, clamp(rms * 3.2), 0.3);
    const flux = Math.max(0, raw.high - this._prevHigh) + Math.max(0, raw.bass - this._prevBass) * 0.5;
    this._prevHigh = raw.high; this._prevBass = raw.bass;
    b.onset = Math.max(b.onset * Math.exp(-dt * 6), clamp(flux * 9 - 0.12));
    return b;
  }
}
export const engine = new Engine();
