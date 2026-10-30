import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
out = []
for c in s:
    o = ord(c)
    if (0x300 <= o <= 0x36f) or o in (0xa0, 0x200b, 0x200c, 0x200d, 0xfeff, 0x2028, 0x2029) or (0x80 <= o < 0xa0):
        out.append('\\u%04x' % o)
    else:
        out.append(c)
open(dst, 'w', encoding='utf-8').write(''.join(out))
print(dst, len(''.join(out)), 'chars; non-ascii left:', sum(1 for c in ''.join(out) if ord(c) > 127))
