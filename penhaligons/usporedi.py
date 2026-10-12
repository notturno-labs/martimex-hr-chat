# upotreba: python3 usporedi.py <id>
# Obris glave sprijeda (pravokutno, 1 px = 1 px fotografije) uspoređuje se
# s obrisom zlatne glave na fotografiji (iznad ovratnika). Ispiše IoU i
# napravi out/<id>-usporedba.png (lijevo foto s crvenim obrisom modela,
# desno model).
import sys, subprocess, os
from PIL import Image, ImageFilter, ImageChops, ImageDraw
import numpy as np
D = os.path.dirname(os.path.abspath(__file__))
SREDINE = {'lady-blanche': 166.5, 'mr-sam': 457.5, 'lord-george': 748.5, 'duchess-rose': 1041.5, 'changing-constance': 1332.5}
DNO = 1809; VRH_OVR = 341; W, H = 320, 720
idd = sys.argv[1]
cx = SREDINE[sys.argv[2] if len(sys.argv) > 2 else idd]   # 2. argument: s kojom bočicom s fotografije usporediti
foto = Image.open(os.path.join(D, 'ref/foto.jpg')).convert('RGB')
x0 = int(round(cx - W / 2)); y0 = DNO - H + 1
crop = foto.crop((x0, y0, x0 + W, y0 + H))
a = np.asarray(crop).astype(int)
fm = (np.abs(a - 247).sum(axis=2) > 14).astype(np.uint8) * 255
fm = Image.fromarray(fm).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
fm = np.asarray(fm) > 127
out = os.path.join(D, 'out', idd + '-silueta.png')
env = dict(os.environ); env['NODE_PATH'] = subprocess.check_output('npm root -g', shell=True, text=True).strip()
subprocess.run(['node', os.path.join(D, 'render.js'), f'ids={idd}&mod=silueta&w={W}&h={H}&n=26000', out], check=True, env=env)
rm = Image.open(out).convert('L').filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
rm = np.asarray(rm) > 100
gl = H - VRH_OVR      # redovi iznad ovratnika
A, B = fm[:gl], rm[:gl]
iou = (A & B).sum() / max(1, (A | B).sum())
print(f'{idd}: IoU glave sprijeda = {iou:.3f}  (foto {A.sum()} px, model {B.sum()} px, samo foto {(A & ~B).sum()} px, samo model {(B & ~A).sum()} px)')
# slika usporedbe
ov = crop.copy()
d = ImageDraw.Draw(ov)
rb = B & ~np.roll(B, 1, 0) | B & ~np.roll(B, -1, 0) | B & ~np.roll(B, 1, 1) | B & ~np.roll(B, -1, 1)
ys, xs = np.nonzero(rb)
for y, x in zip(ys, xs): d.point((x, y), fill=(255, 0, 0))
dif = np.zeros((gl, W, 3), np.uint8); dif[A & B] = (200, 200, 200); dif[A & ~B] = (0, 120, 255); dif[B & ~A] = (255, 60, 60)
sl = Image.new('RGB', (W * 3 + 20, gl), (40, 40, 40))
sl.paste(ov.crop((0, 0, W, gl)), (0, 0)); sl.paste(Image.fromarray(dif), (W + 10, 0)); sl.paste(Image.open(out).convert('RGB').crop((0, 0, W, gl)), (2 * W + 20, 0))
sl.save(os.path.join(D, 'out', idd + '-usporedba.png'))
