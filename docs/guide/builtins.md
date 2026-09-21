# Kiritilgan Funksiyalar (Built-in Functions)

Mitti v0.1 versiyasida 24 ta foydali kiritilgan funksiya mavjud. Ular hech qanday importlarsiz to'g'ridan-to'g'ri ishlatiladi.

---

## 1. Asosiy va I/O funksiyalari

### `print(...args)`
Terminalga bir yoki bir nechta qiymatlarni probel bilan ajratib chop etadi.
```mitti
print("Natija:", 42, true)
```

### `len(arg)`
Massiv, satr yoki obyektning o'lchamini (uzunligini) qaytaradi.
```mitti
len("Salom")        # 5
len([1, 2, 3, 4])    # 4
len({a: 1, b: 2})    # 2
```

### `type(arg)`
Qiymatning turini satr ko'rinishida qaytaradi (`"number"`, `"string"`, `"boolean"`, `"null"`, `"array"`, `"object"`, `"function"`).
```mitti
print(type(123))       # number
print(type("salom"))   # string
print(type([1, 2]))    # array
```

### `range(stop)` yoki `range(start, stop[, step])`
Belgilangan oraliqdagi sonlar massivini yaratadi.
```mitti
range(4)          # [0, 1, 2, 3]
range(2, 6)       # [2, 3, 4, 5]
range(1, 10, 2)   # [1, 3, 5, 7, 9]
```

---

## 2. Tip o'girish (Type Conversion)

### `str(val)`
Har qanday qiymatni satr (`string`) ko'rinishiga o'tkazadi.
```mitti
str(100)   # "100"
str(true)  # "true"
```

### `int(val)`
Qiymatni butun songa o'tkazadi.
```mitti
int("42")    # 42
int(3.85)    # 3
```

### `float(val)`
Qiymatni o'nlik songa o'tkazadi.
```mitti
float("3.14") # 3.14
```

---

## 3. Massiv funksiyalari (Array Functions)

### `push(arr, val)`
Massiv oxiriga yangi element qo'shadi va yangilangan massivni qaytaradi.
```mitti
arr = [1, 2]
push(arr, 3) # arr = [1, 2, 3]
```

### `pop(arr)`
Massiv oxiridagi elementni o'chiradi va o'sha elementni qaytaradi.
```mitti
arr = [10, 20, 30]
oxirgi = pop(arr) # 30, arr = [10, 20]
```

---

## 4. Obyekt funksiyalari (Object Functions)

### `keys(obj)`
Obyektning barcha kalitlari ro'yxatini (massivini) qaytaradi.
```mitti
keys({nomi: "Kitob", narxi: 50000}) # ["nomi", "narxi"]
```

### `values(obj)`
Obyektning barcha qiymatlari ro'yxatini qaytaradi.
```mitti
values({a: 1, b: 2}) # [1, 2]
```

### `has(obj, key)`
Obyektda berilgan kalit bor yoki yo'qligini tekshiradi (`true` / `false`).
```mitti
has({ism: "Ali"}, "ism") # true
```

---

## 5. Satr funksiyalari (String Functions)

### `upper(str)`
Satrni bosh harflarga o'tkazadi.
```mitti
upper("mitti") # "MITTI"
```

### `lower(str)`
Satrni kichik harflarga o'tkazadi.
```mitti
lower("MITTI") # "mitti"
```

### `trim(str)`
Satrning boshidagi va oxiridagi bo'shliqlarni olib tashlaydi.
```mitti
trim("  salom  ") # "salom"
```

### `split(str, sep)`
Satrni berilgan ajratuvchi (`sep`) bo'yicha bo'lib, massiv qaytaradi.
```mitti
split("olma,anor,behi", ",") # ["olma", "anor", "behi"]
```

### `join(arr, sep)`
Massiv elementlarini berilgan ajratuvchi orqali bitta satrga ulaydi.
```mitti
join(["a", "b", "c"], "-") # "a-b-c"
```

---

## 6. Matematik funksiyalar (Math Functions)

### `abs(x)`
Sonning modulini (absolyut qiymatini) qaytaradi.
```mitti
abs(-15) # 15
```

### `min(a, b, ...)` yoki `min([arr])`
Eng kichik sonni topadi.
```mitti
min(5, 2, 9)   # 2
min([10, 4, 7]) # 4
```

### `max(a, b, ...)` yoki `max([arr])`
Eng katta sonni topadi.
```mitti
max(5, 2, 9)   # 9
```

### `round(x)`
Sonni eng yaqin butun songa yaxlitlaydi.
```mitti
round(4.6) # 5
round(4.2) # 4
```

### `floor(x)`
Sonni pastga (kichik tomonga) yaxlitlaydi.
```mitti
floor(4.9) # 4
```

### `ceil(x)`
Sonni tepaga (katta tomonga) yaxlitlaydi.
```mitti
ceil(4.1) # 5
```

### `sqrt(x)`
Sonning kvadrat ildizini hisoblaydi.
```mitti
sqrt(16) # 4
```

### `pow(asos, daraja)`
Sonni berilgan darajaga ko'taradi.
```mitti
pow(2, 5) # 32
```
