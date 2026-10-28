# AI search model test — 2026-10-28

40 queries (hy/ru/en/translit), 56 approved seed listings. Effort `low`, structured outputs.

| Model | Fully correct queries | Checks passed | en | ru | hy | translit (31–40) | Errors | Parse p95 | Rank p95 | Cost of run | ≈ $/search |
|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5 | 38/40 | 99% | 100% | 90% | 90% | 100% | 0 | 3.3 s | 7.6 s | $0.0160 | $0.00102 |
| claude-sonnet-5-5 | 40/40 | 100% | 100% | 100% | 100% | 100% | 0 | 3.0 s | 3.8 s | $0.2628 | $0.01295 |

## Failed checks

### claude-haiku-5-5

- **#12** (ru) Что-нибудь развивающее для ребёнка 2 лет, недорого → failed: intentClean · got `{"age":24,"cat":"educational-toys","price":null,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Поиск развивающей игрушки для ребёнка 2 лет недорого"
- **#28** (hy) Փազլ 4 տարեկանի համար մինչև 1500 → failed: intentClean · got `{"age":48,"cat":"puzzles","price":1500,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Փազլ փնտրում է 4-ամյա երեխայի համար"

### claude-sonnet-5-5


## Ranking — top 3 per model (for Tigran to judge)

**#1** A balance bike for my 3-year-old, up to 3000 a day, preferably in Kentron, something for outdoor play.

- claude-haiku-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- claude-sonnet-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Outdoor Backyard Slide

**#2** Something educational for a 2 year old

- claude-haiku-5-5: 1. Montessori Wooden Toy Set · 2. VTech Alphabet Train · 3. Melissa & Doug Shape Sorting Cube
- claude-sonnet-5-5: 1. Montessori Wooden Toy Set · 2. VTech Alphabet Train · 3. Melissa & Doug Shape Sorting Cube

**#5** Baby gym for a 4 month old, max 2000 dram

- claude-haiku-5-5: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- claude-sonnet-5-5: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym

**#8** Jigsaw puzzle for a 4-year-old under 1500

- claude-haiku-5-5: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Montessori Wooden Toy Set
- claude-sonnet-5-5: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Montessori Wooden Toy Set

**#11** Беговел для моего трёхлетки, до 3000 в день, лучше в Кентроне, чтобы играть на улице.

- claude-haiku-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- claude-sonnet-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Outdoor Backyard Slide

**#12** Что-нибудь развивающее для ребёнка 2 лет, недорого

- claude-haiku-5-5: 1. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 2. Melissa & Doug Shape Sorting Cube · 3. VTech Alphabet Train
- claude-sonnet-5-5: 1. Melissa & Doug Shape Sorting Cube · 2. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 3. VTech Alphabet Train

**#21** Հավասարակշռության հեծանիվ իմ 3 տարեկան երեխայի համար, օրական մինչև 3000, ցանկալի է Կենտրոնում, բացօթյա խաղերի համար։

- claude-haiku-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center) (invented ids: 1) (missing: 1)
- claude-sonnet-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)

## Intent lines (sample)

- #1 claude-haiku-5-5: Looking for a balance bike for outdoor play
- #1 claude-sonnet-5-5: Looking to rent a balance bike for outdoor play
- #11 claude-haiku-5-5: Поиск беговела для игр на улице
- #11 claude-sonnet-5-5: Беговел для игры на улице
- #21 claude-haiku-5-5: Հավասարակշռության հեծանիվ բացօթյա խաղերի համար Կենտրոնում
- #21 claude-sonnet-5-5: Հավասարակշռության հեծանիվ բացօթյա խաղերի համար
- #33 claude-haiku-5-5: Երեխայի համար հեծանիվ է փնտրվում
- #33 claude-sonnet-5-5: Երեխայի համար հեծանիվ վարձակալելու որոնում
