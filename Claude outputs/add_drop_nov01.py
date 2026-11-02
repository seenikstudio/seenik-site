import sys
p=sys.argv[1]; blk=open(sys.argv[2]).read(); s=open(p).read()
assert 'musical water notes' not in s and '__snSfx = {' in s and s.count('</html>')==1
s=s.replace('</html>', blk.rstrip()+'\n</html>'); open(p,'w').write(s); print('ok')
