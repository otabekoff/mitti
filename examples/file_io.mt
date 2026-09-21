# Fayllar bilan ishlash namunasi (File I/O)

fayl_nomi = "test_output.txt"

# 1. Fayl borligini tekshirish
print("Boshida fayl bormi:", file_exists(fayl_nomi))

# 2. Faylga yozish
write_file(fayl_nomi, "Salom, Mitti tilidan yozildi!\n")
print("Yozilgandan keyin fayl bormi:", file_exists(fayl_nomi))

# 3. Faylga qo'shimcha yozish
append_file(fayl_nomi, "Ikkinchi qator qo'shildi.\n")

# 4. Fayldan o'qish
matn = read_file(fayl_nomi)
print("Fayl mazmuni:")
print(matn)

# 5. Faylni o'chirish (tozalash)
remove_file(fayl_nomi)
print("O'chirilgandan keyin fayl bormi:", file_exists(fayl_nomi))

