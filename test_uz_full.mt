# To'liq o'zbek tilida yozilgan dastur
chop("=== Mitti v1.0.0 ===")

func faktorial(n):
    agar n <= 1:
        qaytarish 1
    qaytarish n * faktorial(n - 1)

uchun i in oraliq(1, 8):
    chop(satr(i) + "! = " + satr(faktorial(i)))

# Shartlar
x = 42
agar x > 100:
    chop("katta son")
aks_holda x > 10:
    chop("o'rta son")
aks:
    chop("kichik son")

chop("uzunlik:", uzunlik("o'zbek"))
chop("tur:", tur(3.14))
