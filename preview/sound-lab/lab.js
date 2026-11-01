/* Seenik SOUND LAB: hear every sound option on the real pages. Lab only; the live site is untouched.
   All sounds are made live in the browser (Web Audio), no files except the site music. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search);
  const SETS = {
    music:   { name: 'Music + speaker', page: 'studio', opts: { A: 'Site music on every page (one track, never restarts)' } },
    laser:   { name: 'Laser titles: the bar comes down, rises, disappears', page: 'studio', both: true, opts: {
      A: 'Laser scribe: thin electric hum that follows the bar, soft zap at the end',
      B: 'Glass shimmer: crystal sparkle while the words are written',
      C: 'Synth sweep: soft pad rising with the bar, settles on one tone',
      D: 'Electric glide down, shimmer up, soft pop as it disappears',
      E: 'Sci-fi scanner sweep down and up, quiet blip at the end',
      F: 'Synth glide down, then up, fading into air' } },
    fortyeight: { name: '"A fulldome cinematic 48-min experience" coming toward us', page: 'mirror', opts: {
      A: 'Deep bass swell, peaks as it reaches full size',
      B: 'Fly-by: air rush getting louder and brighter as it comes closer',
      C: 'Reverse bloom: reverse cymbal into a soft low hit at full size' } },
    rings:   { name: 'Rings around the eye and nebula (locked to their cycles)', page: 'mirror', opts: {
      A: 'Orbit tone: circles left / right with the light round the outer ring; soft swell each new cycle (20 s)',
      B: 'Singing bowls: one per ring speed, each struck softly as its light passes the top',
      C: 'Breathing drone: opens and closes once per outer-ring cycle (20 s)',
      D: 'Three ring notes: each ring speed has its own note that travels round with its light' } },
    wave:    { name: 'Mountain, forest and water wave pulse', page: 'mirror', opts: {
      A: 'Warping whoosh as the wave pulses up, soft settle, ocean while it is flat',
      B: 'Underwater thump on the pulse, then waves lapping while flat',
      C: 'Tape warp: the ocean bends like stretched tape on the pulse, comes back crisp' } },
    logo:    { name: 'Studio logo entrance (new on desktop)', page: 'studio', opts: {
      A: 'Slides in from the left on a swoosh, lands with a soft low "thoom"',
      B: 'Gathers in from a blur on a rising sparkle',
      C: 'Slides in from the right, settles on a light glassy chime' } },
    drop:    { name: 'Raindrop: three hits (big, smaller, tiny)', page: 'studio', opts: {
      A: 'Real drops into a pool', B: 'Cave drops: the same with echo, spacious like a dome', C: 'Musical drops: three pitched water notes' } },
    artist:  { name: 'The Artist: hover and click the titles', page: 'artist', opts: {
      A: 'Hover: digital tick + shimmer. Click: rising two-note confirm',
      B: 'Hover: low sci-fi hum swell. Click: lock-on pulse with sparkle',
      C: 'Hover: each title its own note (together a chord). Click: spacey whoosh' } }
  };
  const setKey = SETS[Q.get('set')] ? Q.get('set') : 'music';
  const SET = SETS[setKey];
  const store = { get(k, d) { try { const v = localStorage.getItem('sndlab-' + k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('sndlab-' + k, v); } catch (e) {} } };
  let opt = store.get('opt-' + setKey, 'A'); if (!SET.opts[opt]) opt = 'A';

  /* ---------------- audio engine ---------------- */
  let ctx = null, out, sfx, verb, cave, noiseBuf, brownBuf;
  let vol = +store.get('vol', '50'), muted = store.get('muted', '0') === '1', musicOn = store.get('music', '1') === '1';
  const level = () => muted ? 0 : vol / 100;
  function makeIR(sec, decay, bright) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; lp += (w - lp) * bright; d[i] = lp * Math.pow(1 - i / n, decay); } }
    return b;
  }
  function audio() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain(); out.gain.value = level(); out.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(out); window.__labSfx = sfx; window.__labMeter = () => { const an = ctx.createAnalyser(); an.fftSize = 2048; out.connect(an); const d = new Float32Array(2048); let pk = 0; const iv = setInterval(() => { an.getFloatTimeDomainData(d); for (const x of d) pk = Math.max(pk, Math.abs(x)); }, 20); return () => { clearInterval(iv); return pk; }; };
    verb = ctx.createConvolver(); verb.buffer = makeIR(3.2, 3, 0.5); verb.connect(sfx);
    cave = ctx.createConvolver(); cave.buffer = makeIR(5.5, 2.2, 0.35); cave.connect(sfx);
    const n = ctx.sampleRate * 4; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const m = ctx.sampleRate * 8; brownBuf = ctx.createBuffer(2, m, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const e = brownBuf.getChannelData(c); let l = 0; for (let i = 0; i < m; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; e[i] = l * 3.5; } }
    return ctx;
  }
  const now = () => ctx.currentTime;
  // little building blocks
  let trim = 1;
  const TRIM = { laser: { A: 2, B: 2.5, C: 3, D: 2, E: 1.8, F: 1 }, forty: { A: .9, B: 2, C: .8 }, logo: { A: .7, B: 3, C: 3 }, hov: { A: 1, B: .9, C: 2.2 }, clk: { A: 2, B: .9, C: 2.5 } };
  const trimmed = (k, fn) => { trim = (TRIM[k] && TRIM[k][opt]) || 1; try { fn(); } finally { trim = 1; } };
  function bus(dry = 1, wet = 0, room = verb, pan = 0) {   // a channel strip: gain -> pan -> dry + reverb send
    const g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p);
    const d = ctx.createGain(); d.gain.value = dry * trim; p.connect(d); d.connect(sfx);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet * trim; p.connect(w); w.connect(room); }
    g.panner = p; return g;
  }
  function osc(type, f, dest, t0, t1) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.connect(dest); o.start(t0); o.stop(t1); return o; }
  function noise(dest, t0, t1, loop = true) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = loop; s.connect(dest); s.start(t0, Math.random() * 3); s.stop(t1); return s; }
  function filt(type, f, q, dest) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; b.connect(dest); return b; }
  function gain(v, dest) { const g = ctx.createGain(); g.gain.value = v; g.connect(dest); return g; }
  function env(g, t, a, peak, hold, rel) { const p = g.gain; p.cancelScheduledValues(t); p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); p.setValueAtTime(peak, t + a + hold); p.exponentialRampToValueAtTime(0.0001, t + a + hold + rel); }
  function bell(f, t, amp, dec, dest, ratios = [1, 2.76, 5.4], amps = [1, .45, .2]) {
    ratios.forEach((r, i) => { const g = gain(0, dest); env(g, t, 0.004, amp * amps[i], 0, dec / (1 + i * .8)); osc('sine', f * r, g, t, t + dec + .2); });
  }
  function bowl(f, t, amp, dec, dest) {   // a felt-struck singing bowl: soft attack, two close partials that beat slowly
    [[1, 1], [1.004, .6], [2.71, .35], [2.716, .2], [5.2, .08]].forEach(([r, a]) => { const g = gain(0, dest); const p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(amp * a, t + 0.06); p.exponentialRampToValueAtTime(0.0001, t + dec * (r > 2 ? .55 : 1)); osc('sine', f * r, g, t, t + dec + .1); });
  }
  function whoosh(t, dur, f0, f1, amp, dest, q = 1.2, shape = 'mid') {
    const g = gain(0, dest), b = filt('bandpass', f0, q, g); noise(b, t, t + dur + .05);
    b.frequency.setValueAtTime(f0, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const p = g.gain; p.setValueAtTime(0.0001, t);
    if (shape === 'rise') { p.exponentialRampToValueAtTime(amp, t + dur * .95); p.linearRampToValueAtTime(0.0001, t + dur); }
    else { p.linearRampToValueAtTime(amp, t + dur * .45); p.exponentialRampToValueAtTime(0.0001, t + dur); }
    return { g, b };
  }
  function thoom(t, amp, dest, f0 = 70, f1 = 42, dec = 1.6) {
    const g = gain(0, dest); env(g, t, .02, amp, .05, dec); const o = osc('sine', f0, g, t, t + dec + .2); o.frequency.exponentialRampToValueAtTime(f1, t + dec * .6);
    const g2 = gain(0, dest), lp = filt('lowpass', 260, .7, g2); env(g2, t, .01, amp * .5, 0, .35); noise(lp, t, t + .5);
  }
  function sparkle(t, dur, dens, f0, f1, amp, dest, rise = true) {   // a cloud of tiny glass grains
    const scale = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5, 3];
    for (let x = 0; x < dur; x += 1 / dens) {
      const u = x / dur, tt = t + x + Math.random() * .02, f = (f0 + (f1 - f0) * (rise ? u : 1 - u)) * scale[Math.floor(Math.random() * scale.length)] / 2;
      const p = ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - .8; p.connect(dest);
      const g = ctx.createGain(); g.connect(p); env(g, tt, .003, amp * (.4 + .6 * Math.random()) * (rise ? .4 + .6 * u : 1), 0, .18 + Math.random() * .2); osc('sine', f, g, tt, tt + .5);
    }
  }

  /* ---------------- 1. site music ---------------- */
  const MUSIC_SRC = 'sound-lab/site-music.mp3', LOOP_AT = 128.0, XF = 3.5;   /* 48 bars at 90 BPM; the last 10 s is the fade-out, so it crossfades back to the top on the bar */
  const decks = [new Audio(MUSIC_SRC), new Audio(MUSIC_SRC)]; decks.forEach(a => { a.preload = 'auto'; a.volume = 0; });
  let deck = 0, mLvl = 0, mWant = 0, mStarted = false, xfading = false;
  const MUSIC_LEVEL = 0.75;
  function musicTick(dt) {
    const onPage = document.body.classList.contains('artist-on'), introSong = document.getElementById('music'), introOn = introSong && !introSong.paused && !onPage;
    mWant = musicOn && onPage && !introOn && ctx ? 1 : 0;
    if (mWant && !mStarted) { mStarted = true; decks[deck].currentTime = 0; decks[deck].play().catch(() => {}); }
    if (mWant && decks[deck].paused && !xfading) decks[deck].play().catch(() => {});
    mLvl += (mWant - mLvl) * Math.min(1, dt / (mWant ? 1.2 : .6));
    const a = decks[deck], b = decks[1 - deck];
    if (!xfading && a.currentTime >= LOOP_AT) { xfading = true; b.currentTime = 0; b.play().catch(() => {}); b._t = performance.now(); }
    let ka = 1, kb = 0;
    if (xfading) { const u = Math.min(1, (performance.now() - b._t) / 1000 / XF); ka = Math.cos(u * Math.PI / 2); kb = Math.sin(u * Math.PI / 2); if (u >= 1) { a.pause(); deck = 1 - deck; xfading = false; ka = 1; kb = 0; } }
    const L = level() * MUSIC_LEVEL * mLvl;
    (xfading ? a : decks[deck]).volume = Math.max(0, Math.min(1, L * ka)); if (xfading) b.volume = Math.max(0, Math.min(1, L * kb));
    if (mLvl < 0.002 && !mWant) decks.forEach(d => { if (!d.paused) d.pause(); });
  }

  /* ---------------- 2. laser titles (both pages; 3.0 s: down .93, on .64, up 1.07, fade .36) ---------------- */
  const LZ = { T1: .93, T2: 1.57, T3: 2.64, E: 3.0 };
  const LASER = {
    A(t) { const g = bus(1, .25), b = filt('bandpass', 1800, 6, g), o = osc('sawtooth', 900, b, t, t + 3.2), o2 = osc('sine', 1800, gain(.25, g), t, t + 3.2);
      const trem = osc('sine', 31, gain(.03, g.gain), t, t + 3.2);
      [o, o2].forEach((x, i) => { const m = i ? 2 : 1, f = x.frequency; f.setValueAtTime(900 * m, t); f.exponentialRampToValueAtTime(600 * m, t + LZ.T1); f.exponentialRampToValueAtTime(480 * m, t + LZ.T2); f.exponentialRampToValueAtTime(1100 * m, t + LZ.T3); });
      b.frequency.setValueAtTime(1800, t); b.frequency.exponentialRampToValueAtTime(1200, t + LZ.T1); b.frequency.exponentialRampToValueAtTime(2200, t + LZ.T3);
      env(g, t, .08, .16, LZ.T3 - .08, .3);
      const z = gain(0, bus(1, .4)); env(z, t + LZ.T3, .003, .22, 0, .18); const zo = osc('sine', 1800, z, t + LZ.T3, t + LZ.T3 + .3); zo.frequency.exponentialRampToValueAtTime(180, t + LZ.T3 + .16);
      whoosh(t + LZ.T3, .14, 5000, 2500, .08, bus(1, .3), 2); },
    B(t) { const d = bus(.8, .7); sparkle(t, LZ.T1, 70, 2200, 3600, .05, d); sparkle(t + LZ.T1, LZ.T2 - LZ.T1, 25, 3000, 3000, .03, d, false); sparkle(t + LZ.T2, LZ.T3 - LZ.T2, 70, 2600, 4400, .05, d);
      [1318.5, 1975.5, 2637].forEach((f, i) => bell(f, t + LZ.T3 + i * .03, .06, 2.2, d, [1, 2.4, 4.1], [1, .3, .12])); },
    C(t) { const g = bus(.8, .6), lp = filt('lowpass', 300, 4, g); [220, 220.9, 329.6, 440, 554.4].forEach((f, i) => osc(i % 2 ? 'sawtooth' : 'triangle', f, gain(.09, lp), t, t + 5.2));
      lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(900, t + LZ.T1); lp.frequency.exponentialRampToValueAtTime(700, t + LZ.T2); lp.frequency.exponentialRampToValueAtTime(3400, t + LZ.T3); lp.frequency.exponentialRampToValueAtTime(1100, t + LZ.E + .4);
      const p = g.gain; p.setValueAtTime(.0001, t); p.linearRampToValueAtTime(.5, t + .5); p.setValueAtTime(.5, t + LZ.E); p.exponentialRampToValueAtTime(.0001, t + 5.1); },
    D(t) { const g = bus(1, .45), o = osc('triangle', 1200, g, t, t + 3.1), o2 = osc('sine', 2400, gain(.3, g), t, t + 3.1), vib = osc('sine', 6, gain(14, o.frequency), t, t + 3.1);
      [o, o2].forEach((x, i) => { const m = i ? 2 : 1, f = x.frequency; f.setValueAtTime(1200 * m, t); f.exponentialRampToValueAtTime(420 * m, t + LZ.T2); f.exponentialRampToValueAtTime(1600 * m, t + LZ.T3); });
      env(g, t, .06, .13, LZ.T3 - .06, .12);
      sparkle(t + LZ.T2, LZ.T3 - LZ.T2, 40, 3000, 5200, .03, bus(.7, .6));
      const pp = gain(0, bus(1, .4)); env(pp, t + LZ.E - .05, .002, .3, 0, .09); const po = osc('sine', 900, pp, t + LZ.E - .05, t + LZ.E + .2); po.frequency.exponentialRampToValueAtTime(260, t + LZ.E + .05); },
    E(t) { const d = bus(.9, .3), hum = gain(0, d); env(hum, t, .1, .05, LZ.T3, .4); osc('sawtooth', 110, filt('lowpass', 500, 1, hum), t, t + 3.4);
      const beep = (tt, f, a) => { const g = gain(0, filt('bandpass', f, 4, d)); env(g, tt, .002, a, .025, .03); osc('square', f, g, tt, tt + .08); };
      for (let x = 0; x < LZ.T2; x += .07) beep(t + x, 1500 - 600 * (x / LZ.T2), .2);
      for (let x = LZ.T2; x < LZ.T3; x += .06) beep(t + x, 900 + 900 * ((x - LZ.T2) / (LZ.T3 - LZ.T2)), .2);
      beep(t + LZ.E - .1, 2200, .25); beep(t + LZ.E + .02, 2900, .2); },
    F(t) { const g = bus(.8, .7), lp = filt('lowpass', 2200, 1, g), o = osc('sine', 660, lp, t, t + 3.2), o2 = osc('triangle', 663, gain(.5, lp), t, t + 3.2);
      [o, o2].forEach(x => { const f = x.frequency; f.setValueAtTime(660, t); f.exponentialRampToValueAtTime(330, t + LZ.T2); f.exponentialRampToValueAtTime(880, t + LZ.T3); });
      env(g, t, .25, .22, LZ.T3 - .25, .5);
      const air = gain(0, bus(.6, .8)), hp = filt('highpass', 3500, .7, air); noise(hp, t + LZ.T3 - .2, t + 5); const p = air.gain; p.setValueAtTime(.0001, t + LZ.T3 - .2); p.linearRampToValueAtTime(.12, t + LZ.E); p.exponentialRampToValueAtTime(.0001, t + 4.8); }
  };

  /* ---------------- 3. "48-min experience" (letters fly in over 2 s) ---------------- */
  const FORTY = {
    A(t) { const g = bus(1, .3), p = g.gain; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(.55, t + 2.0); p.exponentialRampToValueAtTime(.0001, t + 4.6);
      const o = osc('sine', 38, g, t, t + 4.8); o.frequency.exponentialRampToValueAtTime(55, t + 2.0); osc('sine', 110, gain(.12, g), t, t + 4.8).frequency.exponentialRampToValueAtTime(82.4, t + 2);
      const r = gain(.5, g), lp = filt('lowpass', 120, .7, r); noise(lp, t, t + 4.8); lp.frequency.exponentialRampToValueAtTime(380, t + 2); },
    B(t) { const g = bus(1, .35); g.panner.pan.setValueAtTime(-.5, t); g.panner.pan.linearRampToValueAtTime(0, t + 2); const w = whoosh(t, 2.0, 280, 3200, .5, g, 1.4, 'rise');
      const g2 = bus(1, .4), w2 = whoosh(t + 1.95, 1.2, 3000, 700, .35, g2, 1.2); g2.panner.pan.setValueAtTime(0, t + 1.95); g2.panner.pan.linearRampToValueAtTime(.4, t + 3); },
    C(t) { const g = bus(1, .5), hp = filt('highpass', 4200, .7, g); noise(hp, t, t + 2.0); const p = g.gain; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(.35, t + 1.96); p.linearRampToValueAtTime(.0001, t + 2.0);
      thoom(t + 2.0, .7, bus(1, .7), 82, 48, 2.2); bell(220, t + 2.0, .05, 3, bus(.6, .8), [1, 2, 3], [1, .3, .1]); }
  };

  /* ---------------- 4. eye rings (live, locked to the eye's own clock) ---------------- */
  const SPD = [.11, .16, .21], DIRS = [-1, 1, -1];   /* the shader: ring k turns at .11 + .05 * (k % 3) turns per second, alternate rings the other way */
  let rings = null;
  function ringsBuild() {
    const R = { g: bus(1, .6), next: [0, 0, 0], cyc: -1 }; R.g.gain.value = 0; R.vis = 0;
    if (opt === 'A') { R.p = ctx.createStereoPanner(); R.p.connect(R.g); R.sw = gain(1, R.p); [196, 293.7, 98].forEach((f, i) => osc('sine', f, gain([.12, .07, .1][i], R.sw), now(), now() + 1e5)); }
    if (opt === 'C') { R.lp = filt('lowpass', 300, 2.5, R.g); [73.4, 110, 146.8, 220.5].forEach((f, i) => { osc('sawtooth', f, gain(.07, R.lp), now(), now() + 1e5); osc('sawtooth', f * 1.003, gain(.05, R.lp), now(), now() + 1e5); }); }
    if (opt === 'D') { R.v = [392, 523.3, 659.3].map(f => { const p = ctx.createStereoPanner(); p.connect(R.g); const g = gain(.06, p); osc('sine', f, g, now(), now() + 1e5); osc('sine', f * 2.003, gain(.012, p), now(), now() + 1e5); return { p, g }; }); }
    return R;
  }
  function eyeVisible() { const h = document.querySelector('#section-view.on .mir-hero .mir-par'); if (!h) return 0; const r = h.getBoundingClientRect(); const v = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / Math.max(1, Math.min(innerHeight, r.height)); return Math.max(0, Math.min(1, v)); }
  function ringsTick() {
    if (setKey !== 'rings' || !ctx || window.__eyeT0 == null) return;
    if (!rings) rings = ringsBuild();
    const T = (performance.now() - window.__eyeT0) / 1000, ct = now(), vis = eyeVisible();
    rings.g.gain.setTargetAtTime(vis * (opt === 'B' ? 1 : .9), ct, .4);
    const th = 2 * Math.PI * (T * .05 % 1);   /* the light that sweeps the outer ring's degree marks: once round every 20 s */
    if (opt === 'A') { rings.p.pan.setTargetAtTime(Math.cos(th) * .85, ct, .05); const c = Math.floor(T * .05); if (c !== rings.cyc) { if (rings.cyc >= 0) { const s = rings.sw.gain; s.cancelScheduledValues(ct); s.setTargetAtTime(1.7, ct, .5); s.setTargetAtTime(1, ct + 1.5, 1.2); bowl(587.3, ct, .05 * vis, 6, rings.g); } rings.cyc = c; } }
    if (opt === 'C') rings.lp.frequency.setTargetAtTime(240 + 1700 * (.5 - .5 * Math.cos(th)), ct, .1);
    if (opt === 'D') rings.v.forEach((v, k) => { const a = 2 * Math.PI * DIRS[k] * (T * SPD[k] - k * .37); v.p.pan.setTargetAtTime(Math.cos(a) * .8, ct, .05); v.g.gain.setTargetAtTime(.04 + .03 * (.5 - .5 * Math.sin(a)), ct, .08); });
    if (opt === 'B') SPD.forEach((s, k) => {   /* strike when this ring's light passes the top of the eye */
      const per = 1 / s, off = (((-.25 * DIRS[k] + k * .37) % 1) + 1) % 1, n = Math.floor((T - off * per) / per) + 1, tHit = off * per + n * per;
      if (rings.next[k] !== n && tHit - T < .35) { rings.next[k] = n; bowl([146.8, 220, 293.7][k], ct + Math.max(0, tHit - T), .11 * Math.max(.15, vis), 7, rings.g); }
    });
  }

  /* ---------------- 5. the wave (video loop: big at the loop point, flat 2-8 s, rising 8-10 s) ---------------- */
  let wv = null;
  function waveBuild() {
    const W = { g: bus(1, .35), last: -1 }; W.g.gain.value = 0;
    W.sea = gain(0, W.g); const src = ctx.createBufferSource(); src.buffer = brownBuf; src.loop = true; W.src = src;
    const lp = filt('lowpass', opt === 'B' ? 700 : 1100, .6, W.sea); src.connect(lp); src.start();
    const foam = gain(.25, W.sea), hp = filt('highpass', 2500, .5, foam); noise(hp, now(), now() + 1e5);
    W.swell = osc('sine', .16, gain(.35, W.sea.gain), now(), now() + 1e5);   /* the sea breathes in slow swells */
    if (opt === 'C') { W.pad = gain(0, W.g); [130.8, 196, 261.6].forEach(f => { const o = osc('triangle', f, gain(.09, filt('lowpass', 900, .7, W.pad)), now(), now() + 1e5); W.pad['o' + f] = o; }); }
    return W;
  }
  function waveVid() { return document.querySelector('#section-view.on video.wave-live'); }
  function waveTick() {
    if (setKey !== 'wave' || !ctx) return;
    const v = waveVid(); if (!v) { if (wv) wv.g.gain.setTargetAtTime(0, now(), .3); return; }
    if (!wv) wv = waveBuild();
    const r = v.getBoundingClientRect(), vis = Math.max(0, Math.min(1, (Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / Math.max(1, r.height)));
    const ct = now(), D = v.duration || 9.97, tau = v.currentTime || 0;
    wv.g.gain.setTargetAtTime(vis * (v.paused ? 0 : 1), ct, .3);
    const flat = tau > 2.1 && tau < 7.9;
    wv.sea.gain.setTargetAtTime(flat ? .5 : (opt === 'C' ? .35 : .12), ct, flat ? .8 : .35);
    // events, scheduled a moment ahead from the video clock
    const ev = (at, fn) => { const dtv = at - tau, k = 'done' + at; if (dtv > -0.5 && dtv < 0.35 && !(performance.now() - (wv[k] || 0) < 3000)) { wv[k] = performance.now(); fn(ct + Math.max(0, dtv)); (window.__labLog = window.__labLog || []).push('wave' + at); } };
    if (opt === 'A') {
      ev(7.9, t => { const R = D - 7.9; const w = whoosh(t, R, 180, 2600, .45, wv.g, 1.6, 'rise'); const g = gain(0, wv.g); const p = g.gain; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(.32, t + R); p.exponentialRampToValueAtTime(.0001, t + R + 2.2);
        const o = osc('sawtooth', 70, filt('lowpass', 700, 3, g), t, t + R + 2.4), depth = gain(2, o.frequency); osc('sine', 3, depth, t, t + R + 2.4); depth.gain.setValueAtTime(2, t); depth.gain.linearRampToValueAtTime(40, t + R);
        o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(230, t + R); o.frequency.exponentialRampToValueAtTime(55, t + R + 2.2); });
      ev(.15, t => whoosh(t, 1.9, 1800, 300, .18, wv.g, .8));
    }
    if (opt === 'B') {
      ev(8.4, t => { const g = gain(0, wv.g); const p = g.gain; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(.35, t + D - 8.4); const lp = filt('lowpass', 160, .8, g); noise(lp, t, t + D - 8.4 + .1); });
      ev(D - .03, t => { thoom(t, .9, wv.g, 62, 36, 2.4); const g = gain(0, wv.g), lp = filt('lowpass', 420, 1, g); env(g, t, .05, .45, .2, 2); noise(lp, t, t + 3); lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(140, t + 2.5); });
      [2.6, 3.9, 5.1, 6.4, 7.4].forEach(x => ev(x, t => { const g = gain(0, wv.g), bp = filt('bandpass', 900 + Math.random() * 500, .8, g); env(g, t, .25, .12, .1, .8); noise(bp, t, t + 1.4); }));
    }
    if (opt === 'C') {
      const u = tau >= 7.9 ? (tau - 7.9) / (D - 7.9) : (tau < 2 ? 1 - tau / 2 : 0);   /* how far into the pulse: 0 flat, 1 at the top */
      wv.src.playbackRate.setTargetAtTime(1 - .55 * u, ct, .05);
      wv.pad.gain.setTargetAtTime(.28 * u, ct, .1);
      [130.8, 196, 261.6].forEach((f, i) => wv.pad['o' + f].frequency.setTargetAtTime(f * (1 - .35 * u) * (1 + .03 * u * Math.sin(performance.now() / 1000 * (5 + i))), ct, .03));
    }
  }

  /* ---------------- 6. Studio logo entrance ---------------- */
  const LOGO = {
    A(t) { const g = bus(1, .3); g.panner.pan.setValueAtTime(-.8, t); g.panner.pan.linearRampToValueAtTime(0, t + 1.25); whoosh(t, 1.3, 350, 1600, .4, g, 1.1); thoom(t + 1.2, .75, bus(1, .5)); },
    B(t) { const d = bus(.8, .8); sparkle(t, 1.5, 55, 1200, 4200, .055, d); [783.99, 1174.66, 1567.98].forEach((f, i) => bell(f, t + 1.5 + i * .04, .045, 2.6, d, [1, 2.4, 4.1], [1, .3, .1])); const s = gain(0, d), hp = filt('highpass', 5000, .7, s); env(s, t, 1.4, .05, 0, .8); noise(hp, t, t + 2.4); },
    C(t) { const g = bus(1, .3); g.panner.pan.setValueAtTime(.8, t); g.panner.pan.linearRampToValueAtTime(0, t + 1.25); whoosh(t, 1.25, 600, 2400, .25, g, 1.3); const d = bus(.9, .8); bell(1046.5, t + 1.25, .1, 3, d, [1, 2.4, 4.1, 5.9], [1, .4, .15, .06]); bell(1568, t + 1.29, .06, 2.6, d, [1, 2.4, 4.1], [1, .3, .1]); }
  };
  const LOGO_CSS = { A: 'labLogoL', B: 'labLogoG', C: 'labLogoR' };

  /* ---------------- 7. raindrop (video clock: the drop lands at 0.72 s, the rebound at 3.10 s, the last droplet at 4.88 s) ---------------- */
  const HITS = [[.72, 1], [3.10, .5], [4.88, .2]];
  function plop(t, size, dest) {
    const f0 = [1500, 950, 520][size === 1 ? 2 : size === .5 ? 1 : 0], dur = .06 + .12 * size;
    const g = gain(0, dest); env(g, t, .002, .5 * (.15 + .85 * size), 0, dur + .05); const o = osc('sine', f0, g, t, t + dur + .2); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * (2.1 + size), t + dur);
    const s = gain(0, dest), bp = filt('bandpass', 3800, .9, s); env(s, t, .002, .18 * size + .03, 0, .12 + .25 * size); noise(bp, t, t + .6);
    if (size > .4) { const k = gain(0, dest); env(k, t, .001, .35 * size, 0, .09); osc('sine', 140, k, t, t + .2).frequency.exponentialRampToValueAtTime(70, t + .08); }
  }
  let dropBus = null;
  function dropTick() {
    if (setKey !== 'drop' || !ctx) return;
    const v = document.querySelector('#section-view.on .st-drop-vid'); if (!v || v.paused) return;
    const r = v.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    if (!dropBus || dropBus.opt !== opt) {
      if (opt === 'B') { dropBus = bus(.7, 1.1, cave); const dl = ctx.createDelay(1), fb = gain(.38, dl), lp = filt('lowpass', 2400, .7, fb); dl.delayTime.value = .31; dropBus.connect(dl); dl.connect(lp); dl.connect(gain(.5, sfx)); }
      else dropBus = bus(1, opt === 'C' ? .7 : .22);
      dropBus.opt = opt;
    }
    const tau = v.currentTime, ct = now();
    HITS.forEach(([h, size], i) => { const d = h - tau; if (d > -0.05 && d < 0.35 && !(performance.now() - (dropBus['h' + i] || 0) < 2000)) { dropBus['h' + i] = performance.now(); const t = ct + Math.max(0, d) - .015;
      if (opt === 'C') { const f = [440, 659.3, 880][i]; bell(f, t, .2 * (.5 + size * .5), 1.2 + 1.6 * size, dropBus, [1, 2.0, 3.01], [1, .25, .08]); const g = gain(0, dropBus); env(g, t, .002, .08, 0, .08); osc('sine', f * 1.6, g, t, t + .15).frequency.exponentialRampToValueAtTime(f * 3, t + .07); }
      else plop(t, size, dropBus); (window.__labLog = window.__labLog || []).push('drop' + i); } });
  }

  /* ---------------- 8. The Artist titles ---------------- */
  const ART_NOTES = [523.25, 659.25, 783.99, 987.77, 1174.66];
  function artHover(i) { audio(); const t = now() + .005;
    if (opt === 'A') { const d = bus(1, .3); const g = gain(0, filt('bandpass', 3200, 3, d)); env(g, t, .001, .25, .006, .02); osc('square', 3200, g, t, t + .05); bell(4186, t + .01, .03, .35, d, [1, 1.5], [1, .5]); }
    if (opt === 'B') { const d = bus(1, .3), g = gain(0, d), lp = filt('lowpass', 300, 5, g); env(g, t, .25, .16, .1, .5); osc('sawtooth', 110, lp, t, t + 1.1); osc('sawtooth', 110.6, lp, t, t + 1.1); lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(1100, t + .35); lp.frequency.exponentialRampToValueAtTime(300, t + .9); }
    if (opt === 'C') bell(ART_NOTES[i % ART_NOTES.length], t, .09, 2.4, bus(.9, .6), [1, 2.0, 3.0], [1, .2, .06]); }
  function artClick(i) { audio(); const t = now() + .005;
    if (opt === 'A') { const d = bus(1, .4); [880, 1318.5].forEach((f, k) => { const g = gain(0, d); env(g, t + k * .075, .003, .2, .03, .12); const o = osc('sine', f, g, t + k * .075, t + k * .075 + .3); osc('sine', f * 2, gain(f * .6, o.frequency), t + k * .075, t + k * .075 + .3); }); }
    if (opt === 'B') { const d = bus(1, .5); [0, .12].forEach(x => { const g = gain(0, d); env(g, t + x, .005, .3, .04, .18); osc('sine', 220, g, t + x, t + x + .35); osc('square', 12, gain(.15, g.gain), t + x, t + x + .3); }); sparkle(t + .2, .45, 50, 2800, 5200, .04, bus(.7, .7)); }
    if (opt === 'C') { const d = bus(1, .6); whoosh(t, .9, 300, 5200, .3, d, 2.5, 'rise'); const g = gain(0, d); env(g, t + .1, .02, .12, .2, .7); const o = osc('sine', 1200, g, t + .1, t + 1.2); o.frequency.exponentialRampToValueAtTime(200, t + 1.1); } }
  document.addEventListener('pointerover', e => { if (setKey !== 'artist') return; const f = e.target.closest && e.target.closest('#artist-view .frame'); if (!f || f.contains(e.relatedTarget)) return; trimmed('hov', () => artHover([...document.querySelectorAll('#artist-view .frame')].indexOf(f))); }, true);
  document.addEventListener('click', e => { if (setKey !== 'artist') return; const f = e.target.closest && e.target.closest('#artist-view .frame'); if (f) trimmed('clk', () => artClick([...document.querySelectorAll('#artist-view .frame')].indexOf(f))); }, true);

  /* ---------------- hooks from the page ---------------- */
  window.__sfx = (kind, el) => {
    if (!ctx || kind !== 'laser' || setKey !== 'laser') return;
    if (el.classList.contains('mir-top') && el.querySelector('.mir-small')) trimmed('laser', () => LASER[opt](now() + .01)), (window.__labLog = window.__labLog || []).push('laser' + opt);
  };
  document.addEventListener('animationstart', e => {
    if (!ctx) return;
    if (setKey === 'fortyeight' && e.animationName === 'subIn') trimmed('forty', () => FORTY[opt](now() + .01)), (window.__labLog = window.__labLog || []).push('48' + opt);
    if (setKey === 'logo' && e.animationName === 'stLogoDrift') trimmed('logo', () => LOGO[opt](now() + .01));   /* phone: its own entrance, with the sound */
    if (setKey === 'logo' && /^labLogo/.test(e.animationName)) trimmed('logo', () => LOGO[opt](now() + .01)), (window.__labLog = window.__labLog || []).push('logo' + opt);
  }, true);
  // desktop logo entrance (lab only): play it when the logo comes into view
  let logoSeen = new WeakSet();
  function logoTick() {
    if (setKey !== 'logo' || innerWidth <= 760) return;
    const lo = document.querySelector('#section-view.on .st-lead .st-logo, #section-view.on .st-logo'); if (!lo || logoSeen.has(lo)) return;
    const r = lo.getBoundingClientRect(); if (r.top > innerHeight * .85 || r.bottom < 0 || !ctx) return;
    logoSeen.add(lo); lo.style.animation = 'none'; void lo.offsetWidth; lo.style.animation = LOGO_CSS[opt] + ' 1.35s cubic-bezier(.2,.75,.25,1) both';
  }

  /* ---------------- speaker + volume, top right ---------------- */
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  const box = document.createElement('div'); box.id = 'lab-snd';
  box.innerHTML = `<span class="vol"><input type="range" min="0" max="100" value="${vol}" aria-label="Volume"></span><button type="button" aria-label="Sound"></button>`;
  document.body.appendChild(box);
  const sBtn = box.querySelector('button'), sVol = box.querySelector('input');
  const applyLvl = () => { sBtn.innerHTML = level() ? ICON_ON : ICON_OFF; if (out) out.gain.setTargetAtTime(level(), now(), .05); const iv = document.getElementById('vol'); if (iv) { iv.value = vol; iv.dispatchEvent(new Event('input', { bubbles: true })); } };
  let closeT = 0;
  sBtn.addEventListener('click', e => { e.stopPropagation(); audio(); if (!box.classList.contains('open')) { box.classList.add('open'); } else { muted = !muted; if (!muted && vol === 0) vol = 50, sVol.value = 50; store.set('muted', muted ? '1' : '0'); applyLvl(); } clearTimeout(closeT); closeT = setTimeout(() => box.classList.remove('open'), 2500); });
  sVol.addEventListener('input', e => { vol = +sVol.value; muted = vol === 0; store.set('vol', vol); store.set('muted', muted ? '1' : '0'); applyLvl(); clearTimeout(closeT); closeT = setTimeout(() => box.classList.remove('open'), 2500); });
  ['pointerdown', 'click'].forEach(k => sVol.addEventListener(k, e => e.stopPropagation()));
  applyLvl();

  /* ---------------- the lab panel ---------------- */
  const panel = document.createElement('div'); panel.id = 'lab-panel';
  const others = Object.keys(SETS).map((k, i) => `<a href="SOUND-LAB.html?set=${k}"${k === setKey ? ' class="on"' : ''}>${i + 1}</a>`).join('');
  panel.innerHTML = `<div class="lab-k">SOUND LAB · ${Object.keys(SETS).indexOf(setKey) + 1} of ${Object.keys(SETS).length}</div><div class="lab-n">${SET.name}</div>
    <div class="lab-o">${Object.entries(SET.opts).map(([k, d]) => `<button type="button" data-o="${k}"><b>${k}</b><span>${d}</span></button>`).join('')}</div>
    <div class="lab-r"><button type="button" class="lab-go">▶ Start</button>${SET.both ? '<button type="button" class="lab-pg" data-p="studio">The Studio</button><button type="button" class="lab-pg" data-p="mirror">The Mirror</button>' : ''}<label class="lab-m"><input type="checkbox" ${musicOn ? 'checked' : ''}> music</label></div>
    <div class="lab-s">${others}</div>`;
  document.body.appendChild(panel);
  ['pointerdown', 'click', 'wheel'].forEach(k => panel.addEventListener(k, e => e.stopPropagation()));
  const mark = () => panel.querySelectorAll('[data-o]').forEach(b => b.classList.toggle('on', b.dataset.o === opt));
  mark();
  let curPage = store.get('page-' + setKey, SET.page);
  function go(page) {
    audio(); curPage = page || curPage; store.set('page-' + setKey, curPage);
    rings = null; wv = null; dropBus = null;   /* rebuilt with the chosen option */
    if (window.__jumpTo) {
      window.__jumpTo(curPage === 'artist' ? 'contact' : 'artist');   /* step away and back, so the page is built fresh and its animations play again */
      setTimeout(() => { window.__jumpTo(curPage); setTimeout(scrollToTarget, 450); }, 120);
    }
    panel.querySelector('.lab-go').textContent = '▶ Play again';
  }
  function scrollToTarget() {
    const SV = document.getElementById('section-view'); if (!SV) return;
    const sel = { fortyeight: '.mir-title3d', rings: '.mir-hero', wave: 'video.wave-live', drop: '.st-drop-vid', logo: '.st-logo' }[setKey];
    const el = sel && SV.querySelector(sel); if (!el) return;
    if (setKey === 'logo' && innerWidth > 760) { const lo = SV.querySelector('.st-logo'); if (lo) lo.style.opacity = '0'; }
    const tryScroll = (n) => { const e2 = SV.querySelector(sel); if (!e2) return; const r = e2.getBoundingClientRect(); SV.scrollBy({ top: r.top + r.height / 2 - innerHeight / 2, behavior: 'smooth' }); if (n) setTimeout(() => tryScroll(n - 1), 700); };
    setTimeout(() => tryScroll(1), setKey === 'logo' ? 0 : 900);
    if (setKey === 'logo') setTimeout(() => { const lo = SV.querySelector('.st-logo'); if (lo) lo.style.opacity = ''; }, 900);
  }
  panel.querySelector('.lab-go').addEventListener('click', () => go());
  panel.querySelectorAll('.lab-pg').forEach(b => b.addEventListener('click', () => go(b.dataset.p)));
  panel.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { opt = b.dataset.o; store.set('opt-' + setKey, opt); mark(); go(); }));
  panel.querySelector('.lab-m input').addEventListener('change', e => { musicOn = e.target.checked; store.set('music', musicOn ? '1' : '0'); audio(); });

  window.__labTest = { LASER, FORTY, LOGO, artHover, artClick, audio, plop, bell, setOpt: o => { opt = o; }, now: () => now() };
  /* ---------------- one clock for everything ---------------- */
  let lastT = performance.now();
  (function tick() {
    requestAnimationFrame(tick); const t = performance.now(), dt = Math.min(.1, (t - lastT) / 1000); lastT = t;
    musicTick(dt); if (!ctx) return;
    ringsTick(); waveTick(); dropTick(); logoTick();
  })();
})();
