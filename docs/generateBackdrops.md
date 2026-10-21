# Fundalurile pe arhetip (`assets/recipes/backdrops/`)

Fiecare fundal e o fotografie reală a unui preparat **din același arhetip**, pre-procesată la
build: blur 18px, saturație 60%, luminozitate 55%. Pre-procesarea evită o dependență de blur la
runtime și ține fișierele mici (~13 KB fiecare — imaginile neclare se comprimă foarte bine).

## Regenerare

Necesită Pillow: `pip3 install Pillow`

```python
from PIL import Image, ImageFilter, ImageEnhance

MAP = {
    'soup':      'ciorba_radauteana_rapida',
    'stew':      'mancare_cartofi_carnaciori',
    'pasta':     'paste_carbonara_rapide',
    'grill':     'muschiulet_porc_cuptor',
    'roast':     'cartofi_gratinati_cuptor',
    'breakfast': 'terci_ovaz_fructe_miere',
    'dessert':   'lava_cake_ciocolata_airfryer',
    'seafood':   'somon_la_tigaie_orez',
    'rice':      'mamaliga_branza_smantana',
    'snack':     'popcorn_aromat_parmezan_boia',
}
W, H = 900, 640

for arch, src in MAP.items():
    im = Image.open(f'assets/recipes/{src}.jpg').convert('RGB')
    r = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((l, t, l + W, t + H))
    im = im.filter(ImageFilter.GaussianBlur(18))
    im = ImageEnhance.Color(im).enhance(0.6)
    im = ImageEnhance.Brightness(im).enhance(0.55)
    im.save(f'assets/recipes/backdrops/{arch}.jpg', quality=72, optimize=True)
```

## Reguli

- **Fundalul vine mereu din același arhetip.** O ciorbă primește o fotografie de ciorbă. A
  împrumuta dintr-un alt arhetip este exact greșeala pe care ADR-07 o previne.
- **`salad` și `wrap` nu au fundal** fiindcă nu există fotografie din acele arhetipuri. Cardurile
  lor folosesc doar degradeul. Dacă apare o fotografie potrivită, adaug-o aici și în `index.ts`.
- Când o rețetă își primește propria fotografie în `assets/recipes/`, aceasta înlocuiește automat
  fundalul — `RecipeVisual` preferă întotdeauna fotografia proprie.
