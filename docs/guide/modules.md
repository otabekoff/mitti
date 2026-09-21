# Modullar Tizimi (Modules)

Mitti v0.2.0 versiyasida to'liq modullar tizimi joriy etildi. Siz o'z kodingizni bir nechta fayllarga ajratishingiz, lokal fayllarni import qilishingiz yoki standart kiritilgan modullardan foydalanishingiz mumkin.

---

## 1. Lokal Fayllarni Import Qilish

Mitti fayllari `.mt` kengaytmasiga ega. Boshqa fayldan funksiya yoki o'zgaruvchilarni chaqirishning ikkita usuli mavjud:

### A) To'liq modulni obyekt sifatida import qilish (`import ... as ...`)

```python
# matematika.mt fayli:
PI = 3.14159
func kvadrat(x):
    return x * x
```

Asosiy faylda:
```python
import "./matematika.mt" as mat

print(mat.PI)          # 3.14159
print(mat.kvadrat(6))  # 36
```

> **Eslatma**: Agar `as` ko'rsatilmasa, fayl nomi (kengaytmasiz) avtomatik o'zgaruvchi nomi sifatida olinadi:
> ```python
> import "./matematika.mt"
> print(matematika.PI)
> ```

### B) Tanlangan qismlarni import qilish (`from ... import ...`)

```python
from "./matematika.mt" import kvadrat, PI

print(PI)
print(kvadrat(5)) # 25
```

Nomlar to'qnashuvining oldini olish uchun `as` bilan qayta nomlash (alias) mumkin:
```python
from "./matematika.mt" import kvadrat as sq

print(sq(9)) # 81
```

---

## 2. Standart Kiritilgan Modullar (Standard Built-in Modules)

Mitti tilida tayyor yordamchi standart modullar mavjud:

### 1) `math` Moduli
Matematik o'zgarmaslar va funksiyalar to'plami.

```python
import math

print(math.pi)        # 3.141592653589793
print(math.e)         # 2.718281828459045
print(math.sqrt(49))  # 7
print(math.pow(2, 5)) # 32
print(math.sin(0))    # 0
print(math.floor(4.8))# 4
print(math.ceil(4.2)) # 5
print(math.random())  # 0 va 1 oralig'idagi tasodifiy son
```

### 2) `json` Moduli
JSON ma'lumotlarini tahlil qilish (parse) va matnga aylantirish (stringify).

```python
import json

talaba = {
    ism: "Vali",
    yosh: 20,
    fanlar: ["Fizika", "Kimyo"]
}

# Mitti obyektini JSON satrga aylantirish
matn = json.stringify(talaba)
print(matn) # {"ism":"Vali","yosh":20,"fanlar":["Fizika","Kimyo"]}

# JSON satrdan Mitti obyektini tiklash
qayta = json.parse(matn)
print(qayta.ism)       # Vali
print(qayta.fanlar[0]) # Fizika
```

### 3) `os` Moduli
Operatsion tizim va muhit haqida ma'lumot olish.

```python
import os

print(os.platform)  # win32 / linux / darwin
print(os.arch)      # x64 / arm64
print(os.cwd())     # Joriy ishchi papka

# Tizim muhit o'zgaruvchilari (Environment variables):
path_val = os.env("PATH")
print(path_val)
```

---

## 3. Modullarni Keshlash va Sikllar Xavfsizligi

- **Module Caching**: Bir fayl bir necha marta yoki turli joylarda `import` qilinsa ham, u faqat bir marta ijro etiladi va xotirada keshlanadi.
- **Circular Imports**: Agar A moduli B ni, B moduli esa A ni import qilishga harakat qilsa, interpreter darhol tushunarli `Aylanma (circular) import xatosi` beradi.
