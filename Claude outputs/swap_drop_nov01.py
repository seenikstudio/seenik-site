import sys,re
p=sys.argv[1]; new=open(sys.argv[2]).read().strip(); s=open(p).read()
k=s.index("three musical water notes"); i=s.rfind("<script>",0,k); j=s.index("</script>",k)+len("</script>")
s=s[:i]+new+s[j:]; assert 'musical water notes' not in s and s.count('real water-drop sounds')==1
open(p,'w').write(s); print('ok')
