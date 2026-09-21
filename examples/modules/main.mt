# Modullar tizimi namunasi (v0.2.0)

# 1. Lokal fayl modulidan import qilish
import "./math_utils.mt" as mu
from "./math_utils.mt" import kvadrat, yigindi, PI

print("mu.PI qiymati:", mu.PI)
print("kvadrat(7):", kvadrat(7))
print("mu.kub(4):", mu.kub(4))
print("yigindi([10, 20, 30]):", yigindi([10, 20, 30]))

# 2. Standart kiritilgan 'math' moduli
import math
print("math.pi:", math.pi)
print("math.sqrt(64):", math.sqrt(64))
print("math.pow(2, 8):", math.pow(2, 8))

# 3. Standart kiritilgan 'json' moduli
import json
malumot = {
    ism: "Aziz",
    yosh: 22,
    ballar: [90, 85, 95]
}
json_matn = json.stringify(malumot)
print("JSON matn:", json_matn)

qayta_oqilgan = json.parse(json_matn)
print("Qayta o'qilgan ism:", qayta_oqilgan.ism)
print("Qayta o'qilgan ballar:", qayta_oqilgan.ballar)

# 4. Standart kiritilgan 'os' moduli
import os
print("OS platform:", os.platform)
print("OS arxitektura:", os.arch)
print("Joriy papka:", os.cwd())

