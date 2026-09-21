# Sintaksis va Asosiy Tushunchalar

Mitti tili Python kabi **indentatsiya** (bo'sh joylar / tablar) yordamida bloklarni ajratadi. Qavslar (`{}`) shart emas.

---

## 1. Izohlar (Comments)

Izohlar `#` belgisi bilan boshlanadi:

```mitti
# Bu bir qatorli izoh
x = 10 # Qator oxiridagi izoh
```

---

## 2. Ma'lumot turlari (Data Types)

Mitti quyidagi asosiy turlarni qo'llab-quvvatlaydi:

- **Sonlar (`number`)**: Butun va o'nlik sonlar (`10`, `-5`, `3.14`)
- **Satrlar (`string`)**: Qo'shtirnoq yoki bittalik tirnoq ichida (`"salom"`, `'dunyo'`)
- **Mantiqiy (`boolean`)**: `true` yoki `false`
- **Null**: `null` (qiymat yo'qligini bildiradi)

```mitti
a = 100
pi = 3.1415
matn = "Mitti tili"
faol = true
hech_nima = null
```

---

## 3. Operatorlar

### Arifmetik operatorlar:
- `+` (qo'shish / satrlarni ulash)
- `-` (ayirish / unar manfiy)
- `*` (ko'paytirish)
- `/` (bo'lish)
- `%` (qoldiqli bo'lish)

### Murakkab tenglash (Compound Assignment):
`+=`, `-=`, `*=`, `/=`

```mitti
x = 10
x += 5   # 15
x *= 2   # 30
```

### Taqqoslash operatorlari:
- `==` (teng)
- `!=` (teng emas)
- `<` (kichik)
- `>` (katta)
- `<=` (kichik yoki teng)
- `>=` (katta yoki teng)

### Mantiqiy operatorlar:
- `and` (mantiqiy VA)
- `or` (mantiqiy YOKI)
- `not` (mantiqiy INKOR)

```mitti
if x > 0 and not faol:
    print("Shart bajarildi")
```

---

## 4. Shart operatorlari (`if / elif / else`)

Shartli tekshiruvlar `:` va blok indentatsiyasi bilan yoziladi:

```mitti
baho = 85

if baho >= 90:
    print("A'lo")
elif baho >= 80:
    print("Yaxshi")
elif baho >= 60:
    print("Qoniqarli")
else:
    print("Qoniqarsiz")
```

---

## 5. Sikllar (Loops)

### `while` sikli
Shart to'g'ri bo'lib turguncha takrorlanadi:

```mitti
count = 0
while count < 5:
    print(count)
    count += 1
```

### `for ... in ...` sikli
Massivlar yoki `range()` orqali iteratsiya qilish:

```mitti
for i in range(5):
    print(i) # 0, 1, 2, 3, 4

mevalar = ["olma", "anor", "behi"]
for meva in mevalar:
    print("Meva: " + meva)
```

### `break` va `continue`
- `break` — siklni zudlik bilan to'xtatadi.
- `continue` — joriy iteratsiyani o'tkazib yuboradi va keyingi qadamga o'tadi.

```mitti
for i in range(10):
    if i == 3:
        continue # 3 ni tashlab o'tadi
    if i == 7:
        break    # 7 ga yetganda sikl to'xtaydi
    print(i)
```

---

## 6. Funksiyalar (`func`)

Funksiyalar `func nom(parametrlar):` ko'rinishida e'lon qilinadi va `return` orqali natija qaytaradi:

```mitti
func qosh(a, b):
    return a + b

natija = qosh(10, 20)
print(natija) # 30
```

### Rekursiya
Funksiyalar o'z-o'zini chaqira oladi:

```mitti
func faktorial(n):
    if n <= 1:
        return 1
    return n * faktorial(n - 1)

print(faktorial(5)) # 120
```

### Lexical Scope & Closures (Yopiq funksiyalar)
Mitti funksiyalari yuqori tartibli (first-class) hisoblanadi va tashqi qamrovdagi (scope) o'zgaruvchilarni saqlab qoladi:

```mitti
func yaratuvi(boshlangich):
    func oshir(qadam):
        return boshlangich + qadam
    return oshir

generator = yaratuvi(100)
print(generator(5))  # 105
print(generator(20)) # 120
```
