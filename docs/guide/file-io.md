# Fayllar bilan Ishlash (File I/O)

Mitti v0.2.0 versiyasida fayl tizimi bilan to'g'ridan-to'g'ri ishlash uchun qulay va sinxron funksiyalar qo'shildi.

---

## 1. Asosiy Funksiyalar

| Funksiya | Ta'rifi | Qaytargan qiymati |
|---|---|---|
| `file_exists(path)` | Fayl mavjudligini tekshiradi | `true` yoki `false` |
| `read_file(path)` | Fayl matnini to'liq o'qiydi (UTF-8) | Satr (`string`) |
| `write_file(path, content)` | Faylga yangidan yozadi (ustidan yozadi) | `true` |
| `append_file(path, content)` | Fayl oxiriga qo'shadi | `true` |
| `remove_file(path)` | Faylni o'chiradi | `true` (o'chirilsa) yoki `false` |

---

## 2. Ishlatish Namunasi

```python
fayl = "kundalik.txt"

# 1. Yangi fayl yaratish va yozish
write_file(fayl, "Bugun Mitti tili bilan ishladim.\n")

# 2. Mavjud faylga qo'shimcha yozish
append_file(fayl, "Modullar va Fayl I/O juda qulay ekan!\n")

# 3. Fayl mavjudligini tekshirish
if file_exists(fayl):
    print("Fayl topildi, o'qilmoqda...")
    matn = read_file(fayl)
    print("--- Fayl mazmuni ---")
    print(matn)

# 4. Faylni o'chirish
remove_file(fayl)
print("Fayl o'chirildi. Mavjudmi:", file_exists(fayl)) # false
```

---

## 3. Nisbiy va Mutlaq Yo'llar

- **Nisbiy yo'llar (`./`, `../`)**: Agar kod fayl ichida bajarilayotgan bo'lsa (`node dist/main.js papka/app.mt`), nisbiy yo'llar o'sha fayl turgan katalogga nisbatan hisoblanadi.
- **Mutlaq yo'llar**: Masalan, `C:/data/file.txt` yoki `/var/log/app.log` to'g'ridan-to'g'ri ko'rsatilishi mumkin.

