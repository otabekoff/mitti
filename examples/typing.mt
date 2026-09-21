# Mitti v0.4.0 — Gradual Typing (ixtiyoriy tip annotatsiyalari) namunasi

# O'zgaruvchi annotatsiyalari
x: int = 42
name: str = "Mitti"
active: bool = true
ratio: float = 3.14

print("x =", x)
print("name =", name)
print("active =", active)
print("ratio =", ratio)

# Annotatsiyasiz o'zgaruvchilar ham ishlaydi (avvalgi kod o'zgarishsiz)
y = 100
message = "Salom, dunyo!"
print(y, message)

# Funksiya parametr va return tipi
func add(a: int, b: int) -> int:
    return a + b

func greet(person: str) -> str:
    return "Salom, " + person + "!"

func power(base: float, exp: int) -> float:
    result: float = 1.0
    for i in range(exp):
        result = result * base
    return result

print("3 + 5 =", add(3, 5))
print(greet("Ali"))
print("2.0 ^ 10 =", power(2.0, 10))

# Annotatsiyasiz funksiyalar ham ishlaydi
func double(n):
    return n * 2

print("double(7) =", double(7))

# List va obj annotatsiyalari
items: list = [1, 2, 3, 4, 5]
config: obj = {name: "Mitti", version: "0.4.0"}

print("items =", items)
print("config =", config)

# any — istalgan tip
data: any = 42
data = "endi satr"
data = [1, 2, 3]
print("data =", data)

# try/except bilan birga
func safe_divide(a: int, b: int) -> float:
    if b == 0:
        raise "Nolga bo'lish mumkin emas"
    return a / b

try:
    result = safe_divide(10, 2)
    print("10 / 2 =", result)
    result2 = safe_divide(5, 0)
except err:
    print("Xato ushlandi:", err)

