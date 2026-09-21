# elif zanjiri
score = 75
if score >= 90:
    print("A")
elif score >= 75:
    print("B")
elif score >= 60:
    print("C")
else:
    print("F")

# closures
func counter():
    count = 0
    func increment():
        count += 1
        return count
    return increment

inc = counter()
print(inc())
print(inc())
print(inc())

# break / continue
i = 0
while true:
    i += 1
    if i == 3:
        continue
    if i > 5:
        break
    print("i =", i)

# nested arrays/objects
data = {
    users: [
        {name: "Ali", active: true},
        {name: "Vali", active: false}
    ]
}
for u in data.users:
    if u.active:
        print(u.name, "faol")
    else:
        print(u.name, "faol emas")

# string operatsiyalari
s = "Salom, Dunyo!"
print(upper(s))
print(lower(s))
print(len(s))
print(join(["a", "b", "c"], "-"))

# and / or / not
print(true and false)
print(true or false)
print(not true)

# compound assignment
n = 10
n *= 3
n -= 5
print(n)
