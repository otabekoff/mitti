# VM va Interpreter solishtirish uchun benchmark
# Oddiy arifmetika va sikllar tezligini tekshiramiz

func fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

print("Fibonacci hisoblash (n = 15):")
natija = fib(15)
print("Natija:", natija)

print("\nKatta sikl hisoblash (100000 marta yig'indi):")
yigindi = 0
for i in range(100000):
    yigindi += i
print("Yig'indi:", yigindi)

