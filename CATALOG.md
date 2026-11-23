# harold-machine · 目录 v1.9

> 定位：面向生产使用的可分发 Skill 库。脱敏、可复用、可验收；不做技能合集，只做少数能被讲清楚、能被检查的技能。
> 更新：2026-11-21
> 仓库：开发仓 `harold-tsui/harold-machine-dev`（私有）；发布仓 `harold-tsui/harold-machine`（公开），内容由开发仓 `src/` 生成。入口 `using-harold-machine/` 建议单独链接，业务技能按需逐个链接。
> 过程记录（盘点、迁移台账、试跑与修复）见 `dev/docs/migration-log.md`。
> 下图为发布仓布局；开发仓把技能放在 `src/`，目录、留档与对外文档放在 `dev/`。
> 对外文档：`README.md` 定位｜`INSTALL.md` 安装｜`USAGE.md` 使用手册（位于仓库根目录；开发仓源文件在 `dev/public/`）。

---

## 一、技能分层

按**价值职能**分，不按工具分。工具会换，职能稳定。

| 层 | 职能 | 技能 |
|---|---|---|
| L0 治理 | 谁能进库、怎么验收 | `harold-gov-gate` |
| L1 判断 | 该不该做、怎么取舍 | `harold-decision-review`、`harold-decision-thinking` |
| L2 研究 | 把不确定变成可引用结论 | `harold-research-brief`、`harold-research-transcribe` |
| L3 生产 | 把结论变成可交付物 | `harold-production-topic`、`harold-production-copy`、`harold-production-pack`、`harold-production-polish`、`harold-production-slides`、`harold-production-visual`、`harold-production-web-story`、`harold-production-knowledge-cards` |
| L4 运营 | 让事情闭环、知识留痕 | `harold-ops-weekly`、`harold-ops-wechat`、`harold-ops-video-analysis`、`harold-ops-xiaohongshu`、`harold-ops-finance` |

入口技能 `using-harold-machine` 独立于五层，放在仓库根目录，负责每轮分诊到唯一主技能；它是唯一不以 `harold-` 开头的技能。

### 目录与文件规范

- **CATALOG.md**：技能库的清单文件，给人看，不装进 AI。
- **磁盘目录**：按 L0–L4 分五层，一层一个数字目录；业务技能文件夹放在所属层的目录里，不跨层、不平铺。入口技能 `using-harold-machine` 例外，放在根目录。

```text
harold-machine/
├── README.md
├── CATALOG.md
├── using-harold-machine/     # 入口分诊，先于五层
├── 01-governance/            # L0 治理
│   └── harold-gov-gate/
├── 02-decision/              # L1 判断
│   ├── harold-decision-review/
│   └── harold-decision-thinking/
├── 03-research/              # L2 研究
│   ├── harold-research-brief/
│   └── harold-research-transcribe/
├── 04-production/            # L3 生产
│   ├── harold-production-topic/
│   ├── harold-production-copy/
│   ├── harold-production-pack/
│   ├── harold-production-polish/
│   ├── harold-production-slides/
│   ├── harold-production-visual/
│   ├── harold-production-web-story/
│   └── harold-production-knowledge-cards/
└── 05-operations/            # L4 运营
    ├── harold-ops-weekly/
    ├── harold-ops-wechat/
    ├── harold-ops-video-analysis/
    ├── harold-ops-xiaohongshu/
    └── harold-ops-finance/
```

```text
<层目录>/<slug>/
├── SKILL.md        # 唯一入口，≤300 行
├── references/     # 按需加载，最多一层
├── scripts/        # 只有脆弱操作才写
├── assets/         # 模板
└── evals/          # 验收用例：输入 → 期望特征
```

- slug 统一为 `harold-<层>-<技能>`，全小写 ASCII；层目录统一为 `0N-<层词>`，层词与 slug 中段一致：`01-governance`(gov) / `02-decision` / `03-research` / `04-production` / `05-operations`(ops)。入口技能 `using-harold-machine` 是唯一例外，与 `using-superpowers`、`using-nucleus` 同构。
- 一个技能 = 一个文件夹，文件夹名就是 slug，入口只有一个 `SKILL.md`。
- `using-harold-machine` 是唯一入口技能：每轮先分诊到唯一主技能；它只做路由，不承接业务交付，不计入「业务技能」上限（18 个）。
- 同层第 2 个技能接在后面，如 `harold-gov-vetter`、`harold-gov-registry`，放进 `01-governance/` 与已有技能**并列**，不放进它的文件夹里。
- 新增层才加新数字目录；不做二级分类，避免同一职能被拆散。
- `references/`、`evals/` 是技能的内部件，不是独立技能。
- 中文名只出现在 description 与标题，不进目录名。
- SKILL.md 必含：触发场景 / 工作流 / 输出格式 / **验收标准** / Gotchas（≥3 条，写失败模式而非注意事项）。
- 每个技能必须带 `evals/cases.md`；`SKILL.md` 的验收标准与 `evals` 评分表条数、顺序、语义一一对应。
- 不放 README、CHANGELOG、INSTALL 等辅助文档。

### 准入四问（全部为"是"才建）

1. 模型默认会不会做错？——做得好就不该建。
2. 有没有独家资产？——Harold 的判断、SecondBrain 数据、组织口径、真实模板。
3. 能不能验收？——写得出可检查的通过 / 不通过。
4. 会不会重复发生？——每月 ≥2 次，或单次代价极高。

---

## 二、技能集

| slug | 解决什么 | 可教方法 / 素材 | 验收标准 |
|---|---|---|---|
| `using-harold-machine` | 每轮任务先分诊到唯一主技能，定跨阶段顺序，无命中直接做 | 路由表、五条排序规则、点名优先、红牌清单、交接规则 | 主技能唯一且有序（多阶段给先后，不并列；不命中写"不调用"）；真调用不空谈（无 Skill 机制则读 `SKILL.md`）；不越权改判；依据可核；顺序与调用关系一致；点名直接进入不擅自改派；原生能力不硬套；交接写明下游与理由 |
| `harold-gov-gate` | 新 skill 入库前的准入、风险评估与验收用例 | 准入四问、审查清单、反例库 | 四问逐项有证据；风险覆盖权限或外发且标来源与许可、证据（文件:行号或可复现检查方式）；三条用例可执行（正常/边界/误导各一）；结论与四问一致；不替候选补能力；登记行可直接粘进技能表；复审触发器已设 |
| `harold-decision-review` | 立项、取舍、资源分配的对抗式评审 | 入口分级、三问可逆性、预验尸、条件式建议 | 复述问题与可逆性；选项 ≥3 且含"不做/维持现状"；隐含假设 ≥3 逐条标验证状态；预验尸 ≥3 条；建议为条件式含触发指标；有复盘日期；待确认问题一次 1 个、不替用户拍板 |
| `harold-decision-thinking` | 内容型个人 IP 生意的诊断与取舍判断 | 11 条底层原则、9 个诊断模块、黄灯模式、七组分歧裁决 | 适配性先声明；结论先行且引原则编号；进退取舍给中间层；现实约束至少查两项；主模块唯一；动作带验证口径与时间尺度 |
| `harold-research-brief` | 行业与公司情报的分级简报 | P0–P3 分级、三源交叉、确定性五档、等级→措辞映射 | 口径 6 项齐全；每条结论有等级/来源数/链接/日期，零来源写"不可判定"；核心结论 ≥3 独立来源；非核心单源标"单源未验证"且不进摘要；无无源数字；冲突并列；缺口单列；预测与实绩分开；等级=最低证据等级 |
| `harold-research-transcribe` | 音视频转成可引用文字底稿或字幕 | 字幕优先与 SRT/VTT 交付、四层校验、保密分级、说话人分离、词表、耗时基准 | Step 1 口径 8 项先写；元信息含引擎与耗时；时间戳完整单调；分段符合规则；四层校验记录（A+B+C + 回听清单交用户）；待核清单到时间戳；降级显式记录；不添加转写者观点（无正文时阻塞集只判 B1、B3） |
| `harold-production-topic` | 从热点与素材里选出值得写的题，定到能开写 | 四类信源、七维判断、三硬指标、情绪矩阵、标题四方向、写作简报 12 项 | 口径 5 项齐全；短名单每条有保留/淘汰理由；简报 12 项齐全且确认前无正文；候选带来源与证据状态；三指标逐项判断；定级落四象限；标题 ≥3 版且换角度；待核项不作唯一支撑 |
| `harold-production-copy` | 选题已定后的成稿：原创 / 改写 / 商单 | 角度四来源、张力弧线、五类钩子、7:3 商单结构、改写解构与 15 字查重 | 模式声明且输入齐；受众一句话与角度决策在正文前；质检记录齐全；结构符合模式；每段有论点句；前 100 字指核心矛盾；具体性抽 5 处；商单 7:3 且卖点 ≤2 |
| `harold-production-pack` | 报告 / PPT 从结论到成品的生产线 | 交付规格、结论句标题、三项测试 | 交付定义 5 项齐全（含必答 3 问）；一页纸有主张与 3 条证据；每页一个论点、标题是结论句；每个数字有口径与来源；有删减/朗读/来源测试记录；顺序结论先行 |
| `harold-production-polish` | 中文稿去 AI 腔，只改语言层 | 七类诊断、套话词表、改写对照 | 诊断有分类与处数；改动命中真实病点；无同义替换式假改；具体信息有来源；节奏有长短变化；事实层未被改动；未越界改结构；语气基线一致 |
| `harold-production-slides` | 把页面清单落成 PPT 版式 | 十类页型、节奏规则、版式参数、三页试样闸门 | 接料检查齐备；页型标注正确（≤6 类）；标题为结论句；单页 ≤3 要点；放不下时拆页；字号/间距/配色给具体值；无图方案可执行；结尾有判断或行动 |
| `harold-production-visual` | 文案转成套视觉与配图 prompt | 转换链、八类组件、prompt 模板 | 主判断是一句话；卡片脚本每页一个判断；版式参数具体；prompt 覆盖九层；中文可读性有方案；一组图至少 3 种结构；数字标注真实/待核验/示例；边界清晰不改内容结构 |
| `harold-production-web-story` | 选题或研究结论做成单页叙事网页，双端可验收、可部署 | 四类叙事骨架、设计系统、双端 QA 脚本、部署四级降级 | 接题三件事锁定（缺失项标假设）；大纲确认后才编码（5–9 章、每章一句论点）；验收记录含 320–1440 视口与部署方式；视觉符合设计系统；无占位与空话；无横向溢出；部署按降级且凭证不入项目；hero 一屏说清是什么与为何看 |
| `harold-production-knowledge-cards` | 一个主题批量成卡片：术语释义、行业黑话、人物拆解 | 12 字段 Schema、五段式人物骨架、出词游标、单文件渲染引擎 | 卡片写法合规（字数 / 名词语题 / misuse 非空有具体错法）；不编造（低可信标注、风险提示）；HTML 单文件零依赖且四个交互可用；分类显式声明；同批去重与 termId 规则；人物卡五段式含失败面 |
| `harold-ops-weekly` | 周报、待办、复盘闭环 | 固定结构、三关检查、单条复盘 | 结构完整（需要关注置顶 + 完成/进行中/阻塞/决定/下周 + 复盘）；未完项有三要素（未知写待定）；阻塞写明依赖；决定有依据与影响；复盘可执行；无未解释顺延 |
| `harold-ops-wechat` | 成稿到公众号排版与发布 | 发布 SOP、排版规则、不可逆确认、发布后核验与回滚 | 不擅自发布（自动发布四要素 + 当轮确认）；素材包四项齐（未生成须写原因）；正文无原始 Markdown 标记；分档与主题声明正确；配图规格与图文一致；标题分形态口径且摘要人工拟定；检查单逐项结论（后台项列待人工确认）；公式脚注可用（无则 N/A）；发布后核验与回滚（未发布则 N/A） |
| `harold-ops-video-analysis` | 短视频后台数据诊断：定位第一个失效环节 | 派生指标公式、三级基准表、40/40/20 排序权重、诊断决策树 | 不猜数（缺失标无、模糊标识别失败）；评级有基准且注明经验口径、完播率口径与时长档；结论指到具体环节；派生指标算全；命中首个主因即停；样本与窗口校验 |
| `harold-ops-xiaohongshu` | 小红书图文笔记的校验、发布与核验 | 四项内容校验、话题规则、发布前确认单、失败回退包 | 内容在规则内；不可逆前回显确认；成功给 note_id、失败给回退包；图片与定时校验；审核中不判失败；改版不盲点 |
| `harold-ops-finance` | 知识付费业务的经营核算与指标诊断 | 收入确认六检（含预收款）、CAC/LTV 三法、行业基准表、渠道三档阈值 | 口径先行；不编数；评级有基准与条件；CAC 含佣金；P&L 十一行；缺口单列 |

### 验收判定口径（全库唯一）

- 公式：**阻塞全过 + 计分 ≥ ⌈0.8 × N⌉ = 可交付；计分 ≤ 阈值-1 = 重写；阻塞任一为 0 = 重做**（N = 计分项数；标注 N/A 的项不计入分母）。
- 换算：5 项 → 4；6 项 → 5；7 项 → 6；9 项 → 8；12 项 → 10。
- 有 N/A 场景的技能，必须在判定行里写明各场景换算后的 N 与阈值，不得临场改阈值。
- 判定式只由 `harold-gov-gate` 维护；其他技能引用本条，不得自造阈值、中间档或改写措辞。
- 每个技能的 `SKILL.md` 判定行与 `evals/cases.md` 评分表末尾判定行必须逐字一致，且能用本条公式复算。

### 调用关系

```text
using-harold-machine                      ← 先分诊：本轮用哪个技能、按什么顺序
      │
      ├─ harold-gov-gate              ← 决定哪些技能存在
      ├─ harold-research-brief        → 产出带等级的证据
      │    └─ harold-research-transcribe → 音视频转文字底稿
      ├─ harold-decision-review       → 基于证据做取舍
      ├─ harold-decision-thinking     → 内容生意的诊断与判断
      ├─ harold-ops-finance           → 经营核算，为取舍提供数字
      ├─ harold-production-topic      → 选对题，出写作简报
      │    └─ harold-production-copy  → 成稿：原创 / 改写 / 商单
      ├─ harold-production-pack       → 定内容结构与叙事
      │    ├─ harold-production-polish  → 只改语言层
      │    ├─ harold-production-slides  → PPT 版式落地
      │    ├─ harold-production-visual  → 成套视觉与配图
      │    ├─ harold-production-web-story → 单页叙事网页，双端验收与部署
      │    └─ harold-production-knowledge-cards → 主题批量成卡片流
      └─ harold-ops-weekly            → 让动作闭环、留痕
           ├─ harold-ops-wechat       → 成稿到排版发布
           ├─ harold-ops-xiaohongshu  → 小红书图文发布与核验
           └─ harold-ops-video-analysis → 数据复盘，定位第一个失效环节
```

研究负责"是什么"，决策负责"做不做"，生产负责"怎么交付"，运营负责"有没有落地"。四者不互相替代；缺证据时决策只能给暂缓。路由只定先后，不代替任何技能执行。

---

## 三、明确不做

- 不做技能超市：业务技能常驻控制在 18 个以内（当前 18），另设 1 个入口分诊技能 `using-harold-machine`，宁缺毋滥。
- 不封装模型原生能力：搜索、写代码、读文件、常规写作。
- 不复制开源文件：只借鉴交互设计与流程结构；官方能力直接用官方版。
- 不建无验收的技能：写不出"怎样算通过"就不建。

---

## 四、分发约束

- 文件名只用 ASCII；正文路径一律用相对路径，不出现个人绝对路径。
- 不出现内部组织名、真实客户、真实持仓与未公开经营数据。
- 每个技能自带：触发说法（3–5 条，写在正文「触发场景」）、一条完整示例。
- 示例中的数字必须显式标注"示例，非真实数据"，避免读者误引。
- 不打包第三方开源代码；引用时注明来源与许可证。
