import sys
p=sys.argv[1]; s=open(p).read()
i=s.index("(function elTick() {"); j=s.index("(function elPhone() {")
new = r"""(function elTick() { requestAnimationFrame(elTick); const vs = elVs; if (!vs) return;
  /* Nov 4: the beat really STOPS (pauses) when the four are off screen, when you leave The Mirror, when the page is hidden and when the speaker is muted —
     phones ignore volume, so pausing is the only sure stop. It fades in (1 s) when they come back. A silent video is the clock that keeps all four together */
  const snd = vs[0], clk = vs.length > 1 ? vs[1] : vs[0];
  const lvl = window.__sndLevel == null ? 0.5 : window.__sndLevel, want = elVis && !document.hidden && lvl > 0, target = want ? Math.min(1, lvl) * 0.6 : 0;
  const nowT = performance.now(), dtS = Math.min(0.25, (nowT - (elTick.t || nowT)) / 1000); elTick.t = nowT;
  if (want && snd.paused && !clk.paused && !snd.seeking) { elVol = 0; try { snd.currentTime = clk.currentTime; } catch (e) {} snd.muted = false; const q = snd.play(); if (q) q.catch(() => {}); }
  elVol += (target - elVol) * (1 - Math.exp(-dtS * 3)); if (Math.abs(target - elVol) < 0.003) elVol = target;
  if (!snd.paused) elSetVol(snd, Math.max(0, Math.min(1, elVol)));
  if (!want && !snd.paused && (elVol < 0.02 || lvl === 0 || document.hidden || EL_IOS)) { if (EL_IOS && elVol > 0.02 && lvl > 0 && !document.hidden) { /* iPhone: let the 1 s fade try first */ if (!snd.__offT) snd.__offT = nowT; if (nowT - snd.__offT > 1000) { snd.pause(); snd.__offT = 0; } } else { snd.pause(); snd.__offT = 0; } }
  if (want) snd.__offT = 0;
  if (clk.paused || !clk.duration) return;
  const D = clk.duration || 22.5225, t0 = clk.currentTime;
  for (let k = 0; k < vs.length; k++) { const v = vs[k]; if (v === clk || v.paused || !v.duration || v.seeking) continue; let d = t0 - v.currentTime; if (d > D / 2) d -= D; if (d < -D / 2) d += D;
    if (Math.abs(d) > 0.5) { if (!v.__snapT || nowT - v.__snapT > 1500) { v.__snapT = nowT; try { v.currentTime = t0 + 0.05; } catch (e) {} } continue; }
    v.playbackRate = Math.abs(d) < 0.01 ? 1 : 1 + Math.max(-0.05, Math.min(0.05, d * 0.5)); } })();
"""
s=s[:i]+new+s[j:]
# the speaker mutes the whole site for sure: also mute the music element itself (phones ignore volume)
a="    window.__sndLevel = v;"
assert s.count(a)==1
s=s.replace(a,"    window.__sndLevel = v; try { music.muted = v === 0; } catch (e) {}   /* Nov 4: mute = truly silent, phones too */")
# phone: the speaker stays pinned top-right, always visible while scrolling
a="  @media (hover: hover) { .top-actions .sndwrap:hover .vol { width: 84px; opacity: 1; } }"
assert s.count(a)==1
s=s.replace(a,a+"""
  @media (max-width: 760px) {   /* Nov 4: phone — the speaker is pinned top-right on every page so it can always be tapped */
    .top-actions .sndwrap { position: fixed; top: calc(14px + env(safe-area-inset-top, 0px)); right: 14px; z-index: 60; }
    .top-actions #snd { background: rgba(0,0,0,.55); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  }""")
open(p,'w').write(s); print('patched')
