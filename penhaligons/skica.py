import sys
from PIL import Image, ImageDraw, ImageFont
F=lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
foto=Image.open('ref/foto.jpg').convert('RGB')
cent={'lady-blanche':166.5,'mr-sam':457.5,'lord-george':748.5,'duchess-rose':1041.5,'changing-constance':1332.5}
naziv={'lady-blanche':'The Revenge of Lady Blanche','mr-sam':'The Blazing Mr Sam','lord-george':'The Tragedy of Lord George','duchess-rose':'The Coveted Duchess Rose','changing-constance':'Changing Constance'}
id=sys.argv[1]; vrh=int(sys.argv[2]) if len(sys.argv)>2 else 180
cx=cent[id]; ph=foto.crop((int(cx-160),1809-720+1,int(cx+160),1810))
fr=Image.open(f'skice/{id}-front.png').convert('RGB'); gl=Image.open(f'skice/{id}-glava.png').convert('RGB'); an=Image.open(f'skice/{id}-animacija.png').convert('RGB')
h=720-vrh
out=Image.new('RGB',(1500,40+h+30+24+420+10),(18,18,18)); d=ImageDraw.Draw(out)
d.text((16,8),f"Penhaligon's Portraits — {naziv[id]}  (skica, točkice u stilu animacije)",fill=(240,225,205),font=F(22))
out.paste(ph.crop((0,vrh,320,720)),(16,40)); out.paste(fr.crop((0,vrh,320,720)),(346,40))
d.text((16,40+h+4),'fotografija',fill=(200,190,180),font=F(16)); d.text((346,40+h+4),'model sprijeda',fill=(200,190,180),font=F(16))
g2=gl.resize((int(gl.width*0.53),int(gl.height*0.53))); out.paste(g2,(690,64))
d.text((690,40),'glava izbliza: sprijeda · okret 35° · okret −35° · bok · straga',fill=(200,190,180),font=F(16))
y=40+h+30
d.text((16,y),'u stvarnoj veličini animacije (26 000 točkica): sprijeda · 35° · bok · straga',fill=(200,190,180),font=F(16))
out.paste(an,(16,y+24)); out.save(f'skice/{id}-skica.png'); print(out.size)
