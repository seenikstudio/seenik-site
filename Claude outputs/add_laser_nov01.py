import sys
p=sys.argv[1]; blk=open(sys.argv[2]).read(); s=open(p).read()
a="  addEventListener('pointerdown', () => audio(), { capture: true, passive: true });"
assert s.count(a)==1 and 'SN_LASER' not in s
s=s.replace(a, a+"\n  window.__snSfx = { ctx: () => ctx, out: () => out };")
assert s.count('</html>')==1
s=s.replace('</html>', blk.rstrip()+'\n</html>')
open(p,'w').write(s); print('ok')
