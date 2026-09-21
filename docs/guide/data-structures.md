# Ma'lumot Tuzilmalari: Massivlar va Lug'atlar

Mitti dasturlash tilida ma'lumotlarni guruhlash uchun ikkita asosiy struktura mavjud: **Massivlar (Arrays)** va **Lug'atlar/Obyektlar (Maps/Objects)**.

---

## 1. Massivlar (Arrays)

Massivlar to'rtburchak qavs `[...]` orqali yaratiladi:

```mitti
sonlar = [10, 20, 30, 40, 50]
aralash = [1, "salom", true, [2, 3]]
```

### Indekslash
Indekslash 0 dan boshlanadi:

```mitti
print(sonlar[0]) # 10
print(sonlar[2]) # 30
```

### Manfiy (Negative) Indekslash
Python kabi, massivning oxiridan hisoblash uchun manfiy indekslardan foydalanish mumkin:

```mitti
print(sonlar[-1]) # 50 (oxirgi element)
print(sonlar[-2]) # 40 (oxiridan ikkinchi element)
```

### Elementni o'zgartirish
```mitti
sonlar[1] = 99
print(sonlar) # [10, 99, 30, 40, 50]
```

### Massiv funksiyalari
- `len(arr)` — elementlar soni
- `push(arr, qiymat)` — oxiriga element qo'shish
- `pop(arr)` — oxirgi elementni sug'urib olish (o'chirish va qaytarish)

```mitti
royxat = [1, 2]
push(royxat, 3)
print(royxat) # [1, 2, 3]

oxirgi = pop(royxat)
print(oxirgi) # 3
print(royxat) # [1, 2]
```

---

## 2. Obyektlar va Lug'atlar (Maps / Dictionaries)

Obyektlar jingalak qavs `{...}` orqali kalit-qiymat ko'rinishida hosil qilinadi:

```mitti
foydalanuvchi = {
    ism: "Ali",
    yosh: 25,
    shahar: "Toshkent"
}
```

### Xususiyatlarga murojaat qilish
Ikki xil usulda murojaat qilish mumkin:
1. **Nuqta orqali (`obj.prop`)**:
   ```mitti
   print(foydalanuvchi.ism) # Ali
   ```
2. **Kvadrat qavs orqali (`obj["prop"]`)**:
   ```mitti
   print(foydalanuvchi["yosh"]) # 25
   ```

### Xususiyat qo'shish yoki o'zgartirish
```mitti
foydalanuvchi.kasb = "Muhandis"
foydalanuvchi["yosh"] = 26
print(foydalanuvchi)
```

### Obyektlar bilan ishlovchi yordamchi funksiyalar
- `keys(obj)` — barcha kalitlar ro'yxati (massiv sifatida)
- `values(obj)` — barcha qiymatlar ro'yxati
- `has(obj, "kalit")` — berilgan kalit mavjudligini tekshirish (`true`/`false`)

```mitti
kitob = {
    nomi: "Dunyoning ishlari",
    muallif: "O'tkir Hoshimov"
}

print(keys(kitob))    # ["nomi", "muallif"]
print(values(kitob))  # ["Dunyoning ishlari", "O'tkir Hoshimov"]
print(has(kitob, "nomi")) # true
print(has(kitob, "narx")) # false
```
