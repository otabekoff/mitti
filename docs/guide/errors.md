# Xatolarni Boshqarish (Error Handling)

Mitti v0.3.0 versiyasida dasturdagi kutilmagan xatoliklarni xavfsiz tutish, tahlil qilish va maxsus istisnolarni (exceptions) otish uchun to'liq mexanizm yaratildi.

---

## 1. `try / except` Bloki

Dastur bajarilishida xatolik sodir bo'lishi mumkin bo'lgan kod qismi `try` bloki ichiga olinadi. Agar xatolik yuz bersa, boshqaruv `except` blokiga o'tadi:

```mitti
try:
    a = 10
    b = 0
    c = a / b
    print("Bu qator bajarilmaydi")
except xato:
    print("Ushlangan xatolik:", xato)
```

> **Eslatma**: `except` dan so'ng xato o'zgaruvchisini yozish ixtiyoriy. Agar u ko'rsatilsa (masalan, `except e:`), xato matni yoki qiymati ushbu o'zgaruvchiga yuklanadi.

---

## 2. `finally` Bloki

`finally` bloki xatolik yuz berishidan yoki bermasligidan qat'i nazar, **har doim** bajariladi. Bu odatda ochiq fayllarni yopish, tarmoq ulanishlarini tozalash yoki resurslarni ozod qilish uchun ishlatiladi:

```mitti
ochiq = true
try:
    print("Resurs bilan ish boshlandi...")
    natija = nomalum_funksiya()
except e:
    print("Xato yuz berdi:", e)
finally:
    ochiq = false
    print("Finally: resurs muvaffaqiyatli yopildi.")
```

---

## 3. Maxsus Xatolik Otish (`raise` / `throw`)

Dasturchi o'z shartlari bajarilmaganda xatolik tashlashi mumkin. Buning uchun `raise` (yoki `throw`) kalit so'zi ishlatiladi:

```mitti
func yoshni_tekshir(yosh):
    if yosh < 0:
        raise "Yosh manfiy bo'lishi mumkin emas!"
    if yosh > 150:
        raise "Yosh juda katta!"
    return "To'g'ri yosh: " + str(yosh)

try:
    print(yoshni_tekshir(-10))
except xatolik:
    print("Tekshiruv xatosi:", xatolik)
```

---

## 4. Vizual Call Stack Trace

Agar xatolik `try / except` orqali ushlanmasa, interpreter dasturni to'xtatadi va foydalanuvchiga muammoni topish oson bo'lishi uchun batafsil **Traceback** ko'rsatadi:

```text
Xatolik: nolga bo'lish mumkin emas
  fayl: main.mt, 2-qatorda
    2 |     return 10 / 0
Traceback (chaqiruvlar steki):
  -> ichki (4-qator)
  -> tashqi (5-qator)
```
Undan:
1. Xato turi va sababi;
2. Xato sodir bo'lgan aniq qator raqami va kod satri;
3. Qaysi funksiyalar qaysi qatordan chaqirilib kelingani ketma-ketligi ko'rinadi.

