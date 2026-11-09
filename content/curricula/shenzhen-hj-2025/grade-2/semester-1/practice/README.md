# 练习内容目录

本目录承载课本正文以外、可反复用于家庭练习的内容。所有路径均按教材版本、年级和学期隔离，便于后续添加其他年级或版本而不混淆词汇。

```text
content/curricula/<地区-版本-年份>/grade-<年级>/semester-<学期>/
├── units/                         # 课本点读单元数据
└── practice/                      # 可复用练习素材
    ├── README.md                   # 本说明
    ├── vocabulary/                 # 词汇表：听写、拼写、复习共用
    │   ├── word-list-1.md          # 面向家长/老师校对的原文词表
    │   └── word-list-1.json        # 未来给网页练习读取的结构化镜像
    ├── dictation/                  # 未来：按单元或自定义范围的听写题单
    └── spelling/                   # 未来：拼写、字母排序、填空题单
```

## 新增教材的规则

1. 先在对应 `grade-<年级>/semester-<学期>/practice/vocabulary/` 新建 `word-list-N.md`。
2. 词表保留教材原有英文、中文释义、单元归属及页码，不自行改写释义。
3. 当网页需要生成练习时，为同名 Markdown 创建 `word-list-N.json` 镜像。每条至少包含：`id`、`word`、`meaning`、`unit`、`sourcePage`；多词短语与单词都作为一个条目。
4. 听写和拼写题只引用稳定 ID，不复制词义文本。这样修改中文释义后，所有练习可自动同步。

Markdown 是便于人工核对的原始资料；JSON 是未来互动练习的机器可读资料。两者同名、同目录，避免把不同年级的词汇混在一起。
