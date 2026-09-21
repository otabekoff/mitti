# WebAssembly (WASM) uchun matematik hisob-kitoblar va algoritmlar

func factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

func fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Faktoriyal hisoblash
f5 = factorial(5)
print(f5)

# Fibonacci hisoblash
fib10 = fibonacci(10)
print(fib10)

# While sikli orqali 1 dan 10 gacha yig'indi
total = 0
i = 1
while i <= 10:
    total += i
    i += 1
print(total)
