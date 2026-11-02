import sys
p=sys.argv[1]; blk=open(sys.argv[2]).read(); s=open(p).read()
assert 'Enigmatic Intro Transition starts' not in s and '__snSfx = {' in s and s.count('</html>')==1
a="if (r.top < innerHeight * .8 && r.bottom > 0) t0 = now; else return; }"
assert s.count(a)==1
s=s.replace(a,"if (r.top < innerHeight * .8 && r.bottom > 0) { t0 = now; dispatchEvent(new Event('sn-title3d')); } else return; }   /* Nov 1: tells the title sound it has started */")
s=s.replace('</html>', blk.rstrip()+'\n</html>'); open(p,'w').write(s); print('ok')
