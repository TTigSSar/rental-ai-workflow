# AI search model test — 2026-10-29

40 queries (hy/ru/en/translit), 56 approved seed listings. Effort `low`, structured outputs.

| Model | Fully correct queries | Checks passed | en | ru | hy | translit (31–40) | Errors | Parse p95 | Rank p95 | Cost of run | ≈ $/search |
|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5 | 38/40 | 99% | 100% | 90% | 90% | 100% | 0 | 3.3 s | 7.6 s | $0.0160 | $0.00102 |
| claude-sonnet-5-5 | 40/40 | 100% | 100% | 100% | 100% | 100% | 0 | 3.0 s | 3.8 s | $0.2628 | $0.01295 |
| openai/gpt-6-luna | 40/40 | 100% | 100% | 100% | 100% | 100% | 0 | 1.1 s | 0.9 s | $0.0087 | $0.00044 |
| google/gemini-3.5-flash-lite | 40/40 | 100% | 100% | 100% | 100% | 100% | 0 | 1.4 s | 1.0 s | $0.0323 | $0.00148 |
| google/gemini-3.8-flash | 40/40 | 100% | 100% | 100% | 100% | 100% | 0 | 8.4 s | 5.1 s | $0.0639 | $0.00300 |
| deepseek/deepseek-v4.1-flash | 37/40 | 99% | 100% | 90% | 80% | 100% | 0 | 2.7 s | 0.7 s | $0.0331 | $0.00341 |
| qwen/qwen3.8-flash | 37/40 | 99% | 100% | 100% | 80% | 90% | 7 | 10.7 s | 5.3 s | $0.0217 | $0.00139 |
| openai/gpt-6.1-terra | 37/40 | 99% | 90% | 100% | 80% | 100% | 0 | 1.1 s | 1.1 s | $0.0741 | $0.00378 |
| moonshotai/kimi-k3.1-pro | 40/40 | 100% | 100% | 100% | 100% | 100% | 0 | 6.9 s | 5.0 s | $0.1664 | $0.00982 |

## Failed checks

### claude-haiku-5-5

- **#12** (ru) Что-нибудь развивающее для ребёнка 2 лет, недорого → failed: intentClean · got `{"age":24,"cat":"educational-toys","price":null,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Поиск развивающей игрушки для ребёнка 2 лет недорого"
- **#28** (hy) Փազլ 4 տարեկանի համար մինչև 1500 → failed: intentClean · got `{"age":48,"cat":"puzzles","price":1500,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Փազլ փնտրում է 4-ամյա երեխայի համար"

### claude-sonnet-5-5


### openai/gpt-6-luna


### google/gemini-3.5-flash-lite


### google/gemini-3.8-flash


### deepseek/deepseek-v4.1-flash

- **#15** (ru) Развивающий коврик для малыша 4 месяцев, максимум 2000 драм → failed: category · got `{"age":4,"cat":"educational-toys","price":2000,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Ищет развивающий коврик для малыша"
- **#25** (hy) Զարգացնող գորգ 4 ամսական երեխայի համար, առավելագույնը 2000 դրամ → failed: category · got `{"age":4,"cat":"educational-toys","price":2000,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Փնտրում է զարգացնող գորգ երեխայի համար"
- **#26** (hy) Խաղալիքներ որդուս ծննդյան համար, նա 6 տարեկան է → failed: category · got `{"age":72,"cat":null,"price":null,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Ծննդյան համար խաղալիք"

### qwen/qwen3.8-flash

- **#23** error: Unexpected end of JSON input
- **#26** error: Unexpected end of JSON input
- **#33** error: Expected double-quoted property name in JSON at position 145 (line 9 column 2)

### openai/gpt-6.1-terra

- **#5** (en) Baby gym for a 4 month old, max 2000 dram → failed: price · got `{"age":4,"cat":"baby-toys","price":null,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Rent a baby gym."
- **#25** (hy) Զարգացնող գորգ 4 ամսական երեխայի համար, առավելագույնը 2000 դրամ → failed: price · got `{"age":4,"cat":"baby-toys","price":null,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Զարգացնող գորգի որոնում"
- **#28** (hy) Փազլ 4 տարեկանի համար մինչև 1500 → failed: price · got `{"age":48,"cat":"puzzles","price":null,"dist":[],"hard":false,"near":false,"dates":false}` · intent: "Փազլի որոնում"

### moonshotai/kimi-k3.1-pro


## Ranking — top 3 per model (for Tigran to judge)

**#1** A balance bike for my 3-year-old, up to 3000 a day, preferably in Kentron, something for outdoor play.

- claude-haiku-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- claude-sonnet-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Outdoor Backyard Slide
- openai/gpt-6-luna: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center) (invented ids: 1) (missing: 1)
- google/gemini-3.5-flash-lite: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- google/gemini-3.8-flash: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- deepseek/deepseek-v4.1-flash: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- qwen/qwen3.8-flash: error Unexpected end of JSON input
- openai/gpt-6.1-terra: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- moonshotai/kimi-k3.1-pro: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)

**#2** Something educational for a 2 year old

- claude-haiku-5-5: 1. Montessori Wooden Toy Set · 2. VTech Alphabet Train · 3. Melissa & Doug Shape Sorting Cube
- claude-sonnet-5-5: 1. Montessori Wooden Toy Set · 2. VTech Alphabet Train · 3. Melissa & Doug Shape Sorting Cube
- openai/gpt-6-luna: 1. LeapFrog LeapStart Interactive Learning System · 2. Montessori Wooden Toy Set · 3. Melissa & Doug Shape Sorting Cube
- google/gemini-3.5-flash-lite: 1. LeapFrog LeapStart Interactive Learning System · 2. VTech Alphabet Train · 3. Montessori Wooden Toy Set
- google/gemini-3.8-flash: 1. VTech Alphabet Train · 2. Montessori Wooden Toy Set · 3. Melissa & Doug Shape Sorting Cube
- deepseek/deepseek-v4.1-flash: 1. Montessori Wooden Toy Set · 2. VTech Alphabet Train · 3. Melissa & Doug Shape Sorting Cube
- qwen/qwen3.8-flash: 1. VTech Alphabet Train · 2. LeapFrog LeapStart Interactive Learning System · 3. Montessori Wooden Toy Set
- openai/gpt-6.1-terra: 1. Montessori Wooden Toy Set · 2. LeapFrog LeapStart Interactive Learning System · 3. VTech Alphabet Train
- moonshotai/kimi-k3.1-pro: 1. LeapFrog LeapStart Interactive Learning System · 2. VTech Alphabet Train · 3. Montessori Wooden Toy Set

**#5** Baby gym for a 4 month old, max 2000 dram

- claude-haiku-5-5: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- claude-sonnet-5-5: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- openai/gpt-6-luna: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- google/gemini-3.5-flash-lite: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Fisher-Price 4-in-1 Ocean Wonders Bouncer
- google/gemini-3.8-flash: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- deepseek/deepseek-v4.1-flash: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- qwen/qwen3.8-flash: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- openai/gpt-6.1-terra: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym
- moonshotai/kimi-k3.1-pro: 1. Baby Activity Gym · 2. Tiny Love Meadow Days Gymini Play Mat · 3. Chicco Baby Senses Activity Gym

**#8** Jigsaw puzzle for a 4-year-old under 1500

- claude-haiku-5-5: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Montessori Wooden Toy Set
- claude-sonnet-5-5: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Montessori Wooden Toy Set
- openai/gpt-6-luna: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. LEGO Duplo Starter Set
- google/gemini-3.5-flash-lite: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. LEGO Duplo Starter Set
- google/gemini-3.8-flash: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. LEGO Duplo Starter Set
- deepseek/deepseek-v4.1-flash: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Montessori Wooden Toy Set
- qwen/qwen3.8-flash: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Montessori Wooden Toy Set
- openai/gpt-6.1-terra: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Montessori Wooden Toy Set
- moonshotai/kimi-k3.1-pro: 1. Children's Puzzle Bundle · 2. Classic Board Game Trio · 3. Mega Bloks First Builders Big Building Bag (80 pcs)

**#11** Беговел для моего трёхлетки, до 3000 в день, лучше в Кентроне, чтобы играть на улице.

- claude-haiku-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- claude-sonnet-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Outdoor Backyard Slide
- openai/gpt-6-luna: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center) (invented ids: 1) (missing: 1)
- google/gemini-3.5-flash-lite: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. LeapFrog LeapStart Interactive Learning System
- google/gemini-3.8-flash: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Outdoor Backyard Slide
- deepseek/deepseek-v4.1-flash: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- qwen/qwen3.8-flash: error Unexpected end of JSON input
- openai/gpt-6.1-terra: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- moonshotai/kimi-k3.1-pro: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)

**#12** Что-нибудь развивающее для ребёнка 2 лет, недорого

- claude-haiku-5-5: 1. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 2. Melissa & Doug Shape Sorting Cube · 3. VTech Alphabet Train
- claude-sonnet-5-5: 1. Melissa & Doug Shape Sorting Cube · 2. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 3. VTech Alphabet Train
- openai/gpt-6-luna: 1. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 2. Melissa & Doug Shape Sorting Cube · 3. VTech Alphabet Train
- google/gemini-3.5-flash-lite: 1. Hape Pound & Tap Bench · 2. Melissa & Doug Shape Sorting Cube · 3. VTech Alphabet Train
- google/gemini-3.8-flash: 1. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 2. Melissa & Doug Shape Sorting Cube · 3. VTech Alphabet Train
- deepseek/deepseek-v4.1-flash: 1. Melissa & Doug Shape Sorting Cube · 2. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 3. VTech Alphabet Train
- qwen/qwen3.8-flash: error Unexpected end of JSON input
- openai/gpt-6.1-terra: 1. Melissa & Doug Shape Sorting Cube · 2. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 3. Mega Bloks First Builders Big Building Bag (80 pcs)
- moonshotai/kimi-k3.1-pro: 1. Melissa & Doug Shape Sorting Cube · 2. Melissa & Doug Wooden Peg Puzzle - Farm Animals · 3. VTech Alphabet Train

**#21** Հավասարակշռության հեծանիվ իմ 3 տարեկան երեխայի համար, օրական մինչև 3000, ցանկալի է Կենտրոնում, բացօթյա խաղերի համար։

- claude-haiku-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center) (invented ids: 1) (missing: 1)
- claude-sonnet-5-5: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- openai/gpt-6-luna: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- google/gemini-3.5-flash-lite: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- google/gemini-3.8-flash: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Outdoor Backyard Slide
- deepseek/deepseek-v4.1-flash: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- qwen/qwen3.8-flash: error Unexpected end of JSON input
- openai/gpt-6.1-terra: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)
- moonshotai/kimi-k3.1-pro: 1. Kids Balance Bike · 2. Little Tikes Cozy Coupe · 3. Intex Inflatable Kiddie Pool (Ocean Play Center)

## Intent lines (sample)

- #1 claude-haiku-5-5: Looking for a balance bike for outdoor play
- #1 claude-sonnet-5-5: Looking to rent a balance bike for outdoor play
- #1 openai/gpt-6-luna: Looking for a balance bike for outdoor play.
- #1 google/gemini-3.5-flash-lite: balance bike
- #1 google/gemini-3.8-flash: rent a balance bike for outdoor play
- #1 deepseek/deepseek-v4.1-flash: Looking for a balance bike for outdoor play
- #1 qwen/qwen3.8-flash: Looking for a balance bike for outdoor play.
- #1 openai/gpt-6.1-terra: Find a balance bike for outdoor play.
- #1 moonshotai/kimi-k3.1-pro: Find a balance bike for outdoor play.
- #11 claude-haiku-5-5: Поиск беговела для игр на улице
- #11 claude-sonnet-5-5: Беговел для игры на улице
- #11 openai/gpt-6-luna: Ищет беговел для игр на улице.
- #11 google/gemini-3.5-flash-lite: поиск беговела для улицы
- #11 google/gemini-3.8-flash: Аренда беговела для катания на улице
- #11 deepseek/deepseek-v4.1-flash: Ищет беговел для игры на улице
- #11 qwen/qwen3.8-flash: Ищем беговел для уличных игр
- #11 openai/gpt-6.1-terra: Беговел для игры на улице
- #11 moonshotai/kimi-k3.1-pro: Поиск беговела для игр на улице
- #21 claude-haiku-5-5: Հավասարակշռության հեծանիվ բացօթյա խաղերի համար Կենտրոնում
- #21 claude-sonnet-5-5: Հավասարակշռության հեծանիվ բացօթյա խաղերի համար
- #21 openai/gpt-6-luna: Փնտրում է հավասարակշռության հեծանիվ՝ բացօթյա խաղերի համար։
- #21 google/gemini-3.5-flash-lite: Որոնվում է հավասարակշռության հեծանիվ բացօթյա խաղերի համար
- #21 google/gemini-3.8-flash: Հավասարակշռության հեծանիվ բացօթյա խաղերի համար
- #21 deepseek/deepseek-v4.1-flash: Փնտրում եմ հավասարակշռության հեծանիվ բացօթյա խաղերի համար
- #21 qwen/qwen3.8-flash: Հավասարակշռության հեծանիվ է փնտրում բացօթյա խաղերի համար
- #21 openai/gpt-6.1-terra: Փնտրում է հավասարակշռության հեծանիվ բացօթյա խաղերի համար։
- #21 moonshotai/kimi-k3.1-pro: Հավասարակշռության հեծանիվ բացօթյա խաղերի համար
- #33 claude-haiku-5-5: Երեխայի համար հեծանիվ է փնտրվում
- #33 claude-sonnet-5-5: Երեխայի համար հեծանիվ վարձակալելու որոնում
- #33 openai/gpt-6-luna: Հեծանիվ է փնտրում։
- #33 google/gemini-3.5-flash-lite: Հեծանիվ երեխայի համար
- #33 google/gemini-3.8-flash: հեծանիվ վարձակալելու համար
- #33 deepseek/deepseek-v4.1-flash: Փնտրում է մանկական հեծանիվ վարձակալության համար
- #33 qwen/qwen3.8-flash: error
- #33 openai/gpt-6.1-terra: Փնտրում է հեծանիվ վարձակալելու համար։
- #33 moonshotai/kimi-k3.1-pro: Հեծանիվ վարձակալել
