import sys
p=sys.argv[1]; s=open(p).read()
def rep(a,b):
    global s
    c=s.count(a); assert c==1,(c,a[:70]); s=s.replace(a,b)
# 1. the logo's own fit adds the slide offset, so the slide ends exactly where the logo belongs (no jump)
rep("lo.style.translate = Math.round(t) + 'px ' + Math.round(em.bottom - .5 - oy) + 'px'; };",
    "lo.style.translate = Math.round(t + (window.__stSlide || 0)) + 'px ' + Math.round(em.bottom - .5 - oy) + 'px'; };   /* Nov 1: + the entrance slide */")
# 2. no CSS animation any more
rep("""  @keyframes snLogoIn { from { translate: 55vw 0; opacity: 0; } 70% { opacity: 1; } to { translate: 0 0; opacity: 1; } }
  #section-view.on .st-lead .st-logo.sn-in { animation: snLogoIn 1.35s cubic-bezier(.2,.75,.25,1) both; }
""","")
rep("/* Nov 1 SOUND: desktop only — The Studio's logo slides in from the right as the page opens */","/* Nov 1 SOUND: the Studio logo's slide is driven in the script below */")
# 3. a spring: slides in, goes a little past, eases back into place
i=s.index("    if (!seen.has(lo)) { seen.add(lo); lastX = null;"); j=s.index("\n", i)
s=s[:i]+"""    if (!seen.has(lo)) { seen.add(lo); lastX = null; if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { slideT0 = now; lo.style.opacity = '0'; } }
    if (slideT0 != null) {   /* a soft spring: comes in from the right, runs a little past its place, then eases back */
      const t = (now - slideT0) / 1000, A = innerWidth * .55, z = .72, w = 4.9, wd = w * Math.sqrt(1 - z * z);
      window.__stSlide = A * Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); lo.style.opacity = Math.min(1, t / .5).toFixed(3);
      if (t > 2.4) { window.__stSlide = 0; lo.style.opacity = ''; slideT0 = null; } }"""+s[j:]
rep("let seen = new WeakSet(), air = null, lastX = null,","let seen = new WeakSet(), slideT0 = null, air = null, lastX = null,")
rep("    const tr = getComputedStyle(lo).translate, x = tr && tr !== 'none' ? parseFloat(tr) || 0 : 0;","    const x = window.__stSlide || 0;")
rep("    const lo = document.querySelector('#section-view.on .st-lead .st-logo'); if (!lo) { lastX = null; return; }",
    "    const lo = document.querySelector('#section-view.on .st-lead .st-logo'); if (!lo) { lastX = null; window.__stSlide = 0; slideT0 = null; return; }")
open(p,'w').write(s); print('ok')
