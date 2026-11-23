# 安装

三种安装方式，按客户端能力选一种。装完必须过一遍文末的验证。

## 前置：先拿到仓库

```bash
git clone https://github.com/harold-tsui/harold-machine.git
cd harold-machine
```

后续命令都在这个目录里执行。下文用 `$REPO` 指代仓库绝对路径。

## 方式一：软链接（推荐）

技能目录留在仓库里，客户端只放链接。改一次仓库，客户端跟着生效；更新只需 `git pull`。

以 Claude Code 为例：

```bash
REPO="$(pwd)"
mkdir -p ~/.claude/skills

# 入口技能
ln -s "$REPO/using-harold-machine" ~/.claude/skills/using-harold-machine

# 业务技能：装哪些链哪些
ln -s "$REPO/02-decision/harold-decision-review" ~/.claude/skills/harold-decision-review
ln -s "$REPO/04-production/harold-production-pack" ~/.claude/skills/harold-production-pack
```

要装全量：

```bash
find "$REPO" -mindepth 2 -maxdepth 3 -name SKILL.md -print0 \
  | xargs -0 -n1 dirname \
  | while read -r d; do ln -sfn "$d" ~/.claude/skills/"$(basename "$d")"; done
```

这条命令会把 18 个业务技能和入口一起链进去。只想要其中几个，就手动 `ln -s`，不要跑全量。

## 方式二：复制

客户端不支持软链接、或需要固定版本快照时用复制。

```bash
cp -R "$REPO/using-harold-machine" ~/.claude/skills/
cp -R "$REPO/04-production/harold-production-pack" ~/.claude/skills/
```

代价是要手动同步：仓库更新后，复制的目录不会变，需要重新 `cp -R`。

## 方式三：整仓指向

客户端支持指定一个 skills 根目录时，直接把仓库根目录指过去。此时层目录（`01-governance` 等）也会被扫描，是否可用取决于客户端是否递归查找。

不确定客户端行为时，用方式一，逐个链接最可控。

## 装什么，先装什么

不必一次装全。建议顺序：

| 阶段 | 装什么 | 为什么 |
|---|---|---|
| 第一轮 | `using-harold-machine` + 一个最常用的业务技能 | 在真实任务里验证分诊是否准 |
| 第二轮 | 再接该技能的上下游 | 例如 `production-topic` → `production-copy` → `ops-wechat` |
| 稳定后 | 按层补齐 | 参照 [CATALOG.md](CATALOG.md) 的调用关系图 |

入口技能建议必装：它负责判断"这轮该用哪个技能"，没有它，其余技能只能靠你手动点名。

## 验证

三条都要过：

1. **目录结构**：技能名对应目录，目录内有 `SKILL.md`。

```bash
ls -l ~/.claude/skills/harold-production-pack/SKILL.md
```

2. **软链接未断**：链接指向仓库内真实目录。

```bash
readlink ~/.claude/skills/harold-production-pack
ls ~/.claude/skills/harold-production-pack/SKILL.md
```

第一条输出应是 `$REPO/04-production/harold-production-pack`；第二条报 "No such file" 说明链接已断。

3. **能被路由命中**：在客户端里问一句"这个任务该用哪个技能"，或直接触发某个技能的触发说法（见其 `SKILL.md` 的「触发场景」）。能被正确调用，说明客户端已读到技能。

## 更新

```bash
cd "$REPO" && git pull
```

软链接方式装的不需要额外操作。复制方式装的要重新执行 `cp -R`，或删掉旧目录再复制。

## 卸载

删除链接或目录，不要删仓库本体：

```bash
rm ~/.claude/skills/harold-production-pack   # 软链用 rm，不加 -r
rm -rf ~/.claude/skills/harold-production-pack  # 复制安装的用 rm -rf
```

确认没有别的技能指向同一目录后再删。

## 排错

| 现象 | 原因 | 处理 |
|---|---|---|
| 客户端完全看不到技能 | 放了 `SKILL.md` 文件，没放目录 | 客户端读的是 `<skill-name>/SKILL.md`，目录必须存在 |
| 链接存在但技能不生效 | 用相对路径建的软链，换工作目录后失效 | 删掉重建，源路径写绝对路径 |
| 两个同名技能互相覆盖 | 不同来源装了同一个 slug | `ls -l` 看链接指向，保留一个 |
| 更新后行为没变 | 复制方式安装，未同步 | 重新 `cp -R`，或改用软链接 |
| 入口技能装了但从不触发 | 客户端会自动匹配 description；触发说法没命中 | 直接点名"用 using-harold-machine 分诊"，或读 [USAGE.md](USAGE.md) 的触发示例 |

装完进入 [USAGE.md](USAGE.md)，看第一轮任务怎么走。
