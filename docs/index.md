---
layout: home

hero:
  name: "Mitti"
  text: "Oddiy, tez va tushunarli dasturlash tili"
  tagline: "Python-uslub sintaksis, TypeScript-da yozilgan toza tree-walk interpreter."
  actions:
    - theme: brand
      text: Tez boshlash
      link: /guide/getting-started
    - theme: alt
      text: Sintaksis
      link: /guide/syntax
    - theme: alt
      text: Built-in funksiyalar
      link: /guide/builtins

features:
  - icon: ⚡
    title: Oson va tanish sintaksis
    details: "Indentatsiyaga asoslangan toza tuzilma (Python-like). O'rganish va o'qish juda yengil."
  - icon: 🎯
    title: Boy Built-in funksiyalar
    details: "24 dan ortiq kiritilgan funksiyalar: massivlar, matnlar, matematik amallar va ma'lumot turlari bilan ishlash."
  - icon: 🧩
    title: Zamonaviy imkoniyatlar
    details: "First-class funksiyalar, closure'lar, lug'at (map) va massivlar, salbiy indekslash va chuqur scope boshqaruvi."
  - icon: 🛠️
    title: Toza arxitektura
    details: "Hech qanday tashqi kompilyator qaramliklarisiz: Lexer ➔ Parser ➔ AST ➔ Interpreter."
---

## Tezkor namuna

```python
func salom_ber(ism):
    return "Salom, " + ism + "!"

ismlar = ["Ali", "Vali", "Gani"]

for ism in ismlar:
    print(salom_ber(ism))

xodim = {
    ism: "Ali",
    yosh: 25,
    lavozim: "Dasturchi"
}

print(xodim.ism + " — " + str(xodim.yosh) + " yoshda")
```
