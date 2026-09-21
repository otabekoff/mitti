# Bayt-kod Kompilyatori va Virtual Mashina (VM)

Mitti dasturlash tili `v0.6.0` versiyasidan boshlab klassik AST daraxtini to'g'ridan-to'g'ri aylanib chiqish (Tree-walk Interpreter) bilan bir qatorda zamonaviy **Stack-based Bytecode Virtual Machine (VM)** tizimiga ham ega.

## Arxitektura

Kompilyatsiya va bajarilish quyidagi bosqichlardan o'tadi:

```
Manba kodi (.mt)
       │
       ▼
   [ Lexer ]  ───►  Tokenlar
       │
       ▼
  [ Parser ]  ───►  AST (Abstrakt Sintaktik Daraxt)
       │
       ▼
 [ Compiler ] ───►  Chunk (Bayt-kod + Konstantalar jadvali)
       │
       ▼
    [ VM ]    ───►  Stack-asosidagi Ijro (Stack & Call Frames)
```

## Buyruqlar

### 1. Bayt-kodni ko'rish (Disassembler)

Har qanday Mitti dasturining kompilyatsiya qilingan bayt-kod ko'rinishini `dis` subkomandasi orqali ko'rishingiz mumkin:

```bash
mitti dis dastur.mt
```

Chiqish misoli:

```text
== dastur.mt ==
Offset  Qator   OpCode                  Parametrlar
----------------------------------------------------------------
0000    1       OP_CONSTANT             [0] = "Salom, VM!"
0002    1       OP_PRINT
0003    2       OP_CONSTANT             [1] = 10
0005    2       OP_DEFINE_GLOBAL        'x'
0007    3       OP_GET_GLOBAL           'x'
0009    3       OP_CONSTANT             [2] = 20
0011    3       OP_ADD
0012    3       OP_PRINT
0013    3       OP_HALT
```

### 2. VM orqali ishga tushirish

Kodni virtual mashinada tezkor bajarish uchun `--vm` bayrog'idan foydalaning:

```bash
mitti --vm dastur.mt
```

Standart holda `mitti dastur.mt` buyrug'i barqaror Tree-walk interpreter orqali ishlaydi. Ikkala rejim bir-biriga xalaqit bermasdan parallel ishlaydi.

## Qo'llab-quvvatlanadigan OpCode'lar

VM quyidagi asosiy operatsiyalarni o'z ichiga oladi:

- **Konstantalar va Stek**: `OP_CONSTANT`, `OP_NULL`, `OP_TRUE`, `OP_FALSE`, `OP_POP`
- **Arifmetika va Mantiq**: `OP_ADD`, `OP_SUB`, `OP_MUL`, `OP_DIV`, `OP_MOD`, `OP_POW`, `OP_NEGATE`, `OP_NOT`
- **Taqqoslash**: `OP_EQUAL`, `OP_NOT_EQUAL`, `OP_GREATER`, `OP_GREATER_EQUAL`, `OP_LESS`, `OP_LESS_EQUAL`
- **O'zgaruvchilar**: `OP_DEFINE_GLOBAL`, `OP_GET_GLOBAL`, `OP_SET_GLOBAL`, `OP_GET_LOCAL`, `OP_SET_LOCAL`
- **Boshqaruv oqimi (Jumps)**: `OP_JUMP`, `OP_JUMP_IF_FALSE`, `OP_JUMP_IF_TRUE`, `OP_LOOP`
- **Funksiyalar**: `OP_CALL`, `OP_RETURN`
- **Ma'lumot tuzilmalari**: `OP_BUILD_ARRAY`, `OP_BUILD_OBJECT`, `OP_GET_INDEX`, `OP_SET_INDEX`

