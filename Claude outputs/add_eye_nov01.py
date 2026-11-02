import sys
p=sys.argv[1]; blk=open(sys.argv[2]).read(); s=open(p).read()
assert 'blade of air travelling round' not in s and '__snSfx = {' in s and s.count('</html>')==1
a="let t0 = performance.now(), last = t0;"
if 'window.__eyeT0 = t0;' not in s:
    assert s.count(a)==1; s=s.replace(a, a+" window.__eyeT0 = t0;   /* Nov 1: the eye's clock, for its sound */")
s=s.replace('</html>', blk.rstrip()+'\n</html>'); open(p,'w').write(s); print('ok')
