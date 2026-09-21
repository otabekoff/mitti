# Xatolarni boshqarish (v0.3.0)

# 1. Oddiy try / except
print("--- 1. Nolga bo'lishni tutish ---")
try:
    a = 10
    b = 0
    c = a / b
    print("Bu qator bajarilmaydi")
except xato:
    print("Xato ushlandi:", xato)

# 2. try / except / finally
print("\n--- 2. finally blokining ishlashi ---")
fayl_ochildi = true
try:
    print("Resurs bilan ishlayapmiz...")
    # mavjud bo'lmagan o'zgaruvchi
    y = noma_lum_ozgaruvchi + 5
except e:
    print("Muammo yuz berdi:", e)
finally:
    fayl_ochildi = false
    print("Finally: resurs yopildi. fayl_ochildi =", fayl_ochildi)

# 3. Maxsus xato tashlash (raise)
print("\n--- 3. Maxsus xatolik (raise) ---")
func tekshir_yosh(yosh):
    if yosh < 0:
        raise "Yosh manfiy bo'lishi mumkin emas!"
    if yosh > 150:
        raise "Yosh juda katta!"
    return "Yosh qabul qilindi: " + str(yosh)

try:
    print(tekshir_yosh(25))
    print(tekshir_yosh(-5))
except err:
    print("Foydalanuvchi xatosi:", err)

# 4. Funksiyalar ichida xatoni tutish
print("\n--- 4. Funksiyalar ichidan xato uzatilishi ---")
func bolish(x, y):
    return x / y

func hisobla():
    return bolish(100, 0)

try:
    hisobla()
except e:
    print("hisobla() xatoni tutdi:", e)

print("\nDastur xavfsiz yakunlandi!")

