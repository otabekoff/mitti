# Mitti tiliga xush kelibsiz!

x = 10
y = 20

if x < y:
    print("Hello, Mitti!")
else:
    print("Salom emas")

for i in range(5):
    print(i)

total = 0
i = 0
while i < 5:
    total += i
    i += 1
print("Yig'indi:", total)

func kvadrat(n):
    return n * n

print("5 ning kvadrati:", kvadrat(5))

arr = [1, 2, 3, 4, 5]
push(arr, 6)
print(arr)
print("Uzunlik:", len(arr))

person = {name: "Ali", age: 25}
print(person)
print(person.name, "ning yoshi:", person.age)
person.age = 26
print("Yangi yosh:", person["age"])

func fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

nums = []
for i in range(10):
    push(nums, fibonacci(i))
print("Fibonacci:", nums)
