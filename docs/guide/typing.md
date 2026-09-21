# Gradual Typing — Ixtiyoriy Tiplash

Mitti **gradual typing** (bosqichma-bosqich tiplash) modelini qo'llab-quvvatlaydi.
Tip annotatsiyalari ixtiyoriy — eski kod o'zgarishsiz ishlaydi.
Annotatsiya yozilgan joylarda qiymat runtime'da tekshiriladi.

## O'zgaruvchi annotatsiyasi

```mitti
x: int = 42
name: str = "Ali"
active: bool = true
ratio: float = 3.14
items: list = [1, 2, 3]
config: obj = {port: 8080}
data: any = "istalgan tip"
```

Sintaksis:
```
o'zgaruvchi_nomi: tip_nomi = qiymat
```

Annotatsiyasiz o'zgaruvchilar `any` tipida hisoblanadi:
```mitti
y = 100     # any — xato yo'q
z = "salom" # any — xato yo'q
```

## Funksiya parametr va return tipi

```mitti
func add(a: int, b: int) -> int:
    return a + b

func greet(name: str) -> str:
    return "Salom, " + name

func power(base: float, exp: int) -> float:
    result: float = 1.0
    for i in range(exp):
        result = result * base
    return result
```

Sintaksis:
```
func nom(param1: tip1, param2: tip2) -> return_tip:
    ...
```

Annotatsiyasiz parametrlar `any` tipida bo'ladi.

## Tip nomlari

| Annotatsiya | Mitti tipi            | Misol              |
|-------------|----------------------|--------------------|
| `int`       | Butun son            | `42`, `-7`, `0`    |
| `float`     | Haqiqiy son          | `3.14`, `2.0`      |
| `str`       | Satr (matn)          | `"salom"`, `""`    |
| `bool`      | Mantiqiy             | `true`, `false`    |
| `list`      | Massiv               | `[1, 2, 3]`        |
| `obj`       | Obyekt               | `{a: 1, b: 2}`     |
| `any`       | Istalgan tip (skip)  | —                  |

> **Eslatma:** `int` va `float` farqi bor.
> `x: int = 3.14` — **xato** (butun son emas).
> `x: float = 3.14` — **to'g'ri**.
> `x: float = 42` — **to'g'ri** (`int` → `float` muvofiq).

## Runtime tip tekshiruvi

Tip xatosi yuzaga kelganda aniq xabar chiqadi:

```bash
$ mitti -e "x: int = 3.14"
Tip xatosi: 'x' uchun 'int' tipi kutilgan, 'float' keldi (butun son emas)
  1-qatorda
    1 | x: int = 3.14
```

Funksiya chaqiruvi:
```mitti
func double(n: int) -> int:
    return n * 2

double("salom")  # Xato: 'n' uchun 'int' tipi kutilgan, 'str' keldi
```

## Linter — `mitti lint`

`mitti lint` buyrug'i faylni **bajarmasdan** statik tahlil qiladi.

```bash
mitti lint fayl.mt
```

### Aniqlanadigan muammolar

**1. Tip nomuvofiq:**
```mitti
x: int = "salom"   # xato: 'int' kutilgan, 'str' berildi
```

**2. Aniqlanmagan o'zgaruvchi:**
```mitti
print(nomalum)      # xato: aniqlanmagan o'zgaruvchi: 'nomalum'
```

**3. Ishlatilmagan import:**
```mitti
import math         # ogohlantirish: 'math' import qilingan, lekin ishlatilmagan
x = 10
```

**4. Return tipi e'lon qilingan, lekin return yo'q:**
```mitti
func compute(n: int) -> str:
    y = n * 2       # ogohlantirish: return topilmadi
```

### Linter natijasi

```bash
$ mitti lint examples/typing_bad.mt
xato [5-qator]: tip nomuvofiq: 'int' kutilgan, 'str' berildi ('x')
xato [8-qator]: aniqlanmagan o'zgaruvchi: 'noaniq'
ogohlantirish [11-qator]: 'compute' funksiyasi '-> str' return tipini e'lon qilgan, lekin 'return' topilmadi
ogohlantirish [2-qator]: 'math' import qilingan, lekin ishlatilmagan
```

Xatosiz fayl uchun:
```bash
$ mitti lint examples/typing.mt
✓ examples/typing.mt: xato topilmadi
```

`xato` bo'lsa chiqish kodi `1`, bo'lmasa `0`.

## To'liq misol

```mitti
# Tip annotatsiyali funksiyalar
func hisob(narx: float, miqdor: int) -> float:
    jami: float = narx * miqdor
    return jami

func chegirma(summa: float, foiz: int) -> float:
    return summa * (100 - foiz) / 100

narx: float = 15000.0
miqdor: int = 3
jami = hisob(narx, miqdor)
yakuniy = chegirma(jami, 10)

print("Jami:", jami)
print("10% chegirmadan keyin:", yakuniy)
```

Faylni `mitti lint` bilan tekshirib, keyin `mitti` bilan ishga tushiring:
```bash
mitti lint hisob.mt   # tekshiruv
mitti hisob.mt        # bajarish
```

