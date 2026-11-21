# harold-machine

> Harold Finch 造了一台会自己判断的机器。这台是我的——它只负责判断，什么值得交付。

18 个技能，分五层，每个技能都自带**阻塞项、计分项和一条可复算的判定行**。不达标就重做，不靠"感觉还行"。

## 这是什么

一套面向生产使用的个人技能库，不是提示词合集。技能覆盖一个人的内容公司从判断到交付的完整链路：

| 层 | 职能 | 技能数 |
|---|---|---|
| L0 治理 | 谁能进库、怎么验收 | 1 |
| L1 判断 | 该不该做、怎么取舍 | 2 |
| L2 研究 | 把不确定变成可引用结论 | 2 |
| L3 生产 | 把结论变成可交付物 | 8 |
| L4 运营 | 让事情闭环、知识留痕 | 5 |

外加入口技能 `using-harold`：每轮先分诊出唯一主技能，再动手；没有合适的就直接做，不硬套。

完整清单、触发说法与调用关系见 [CATALOG.md](CATALOG.md)。

## 为什么叫 harold-machine

- `harold` 是作者的名字，也是《疑犯追踪》里造机器的人的名字。
- 那台机器的流程是「输入 → 判定 relevant / irrelevant → 派人执行 → 自我纠偏」，和这里的 L0 → L4 是同一条链。

## 目录

```text
harold-machine/
├── README.md
├── CATALOG.md
├── using-harold/             # 入口分诊，先于五层
├── 01-governance/            # L0 治理
├── 02-decision/              # L1 判断
├── 03-research/              # L2 研究
├── 04-production/            # L3 生产
└── 05-operations/            # L4 运营
```

一个技能就是一个文件夹，文件夹名即 slug：

```text
<层目录>/<slug>/
├── SKILL.md        # 唯一入口，≤300 行
├── references/     # 按需加载，最多一层
├── scripts/        # 只有脆弱操作才写
├── assets/         # 模板
└── evals/          # 验收用例：输入 → 期望特征
```

每个 `SKILL.md` 末尾都有「验收标准」，与 `evals/cases.md` 的评分表逐字一致。

## 怎么安装

1. 先读 [CATALOG.md](CATALOG.md)，按任务落到某一层。
2. 把需要的一个或多个技能目录链接到 AI 客户端的 skills 目录（逐个链接，与目录层级无关）。
3. 入口 `using-harold/` 建议单独链接：它负责分诊，不替代任何业务技能执行。

以 Claude Code 的 `~/.claude/skills/` 为例，逐个软链：

```bash
mkdir -p ~/.claude/skills
ln -s "$PWD/using-harold" ~/.claude/skills/using-harold
ln -s "$PWD/02-decision/harold-decision-review" ~/.claude/skills/harold-decision-review
```

也可只装当前要用的几个技能，其余不链接。

## 验收怎么算

全库只有一条口径，由 `harold-gov-gate` 维护：

> **阻塞全过 + 计分 ≥ ⌈0.8 × N⌉ = 可交付；计分 ≤ 阈值-1 = 重写；阻塞任一为 0 = 重做**
> （N = 计分项数；标注 N/A 的项不计入分母）

换算固定：5 项 → 4；6 项 → 5；7 项 → 6；9 项 → 8；12 项 → 10。其他技能只能引用，不能自造阈值。

## 状态

- 技能数：18 + 1 入口
- 每个技能均有 `evals/cases.md`，条目与判定行已全库校验一致
- 本仓为发布版本，由开发仓 `harold-tsui/harold-machine-dev` 的 `src/` 生成
