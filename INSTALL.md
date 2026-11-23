# 安装

安装只做一件事：**让你所用客户端的技能目录里，出现 `<技能名>/SKILL.md`**。

命令、路径、系统差异都是这一件事的实现细节，随客户端版本变动。本文定义契约，给出一个参考实现；具体路径以你的客户端文档为准。

## 契约

四条同时满足即安装成功，与用什么手段放进去无关：

| 条件 | 说明 |
|---|---|
| 有技能根目录 | 客户端启动时扫描该目录，位置由客户端决定 |
| 一技能一目录 | 子目录名即技能名，与 `SKILL.md` 的 `name` 一致 |
| `SKILL.md` 在目录根部 | 不是平铺的单个文件，也不是多套一层 |
| frontmatter 完整 | 至少含 `name`、`description`，缺 `name` 无法注册 |

本仓每个技能目录都满足后三条。所以安装动作只剩第一条：把目录放进客户端扫描的位置。

## 四步

**1. 拿到仓库**

```bash
git clone https://github.com/harold-tsui/harold-machine.git
cd harold-machine
```

**2. 找到客户端的技能根目录**

在客户端文档里搜这几类词：`skills directory`、`skills root`、`技能目录`、`SKILL.md location`；配置项可能叫 custom skills folder、additional skills path。

本文示例一律用 `$SKILLS` 占位，不写死任何平台路径——写死即为过期来源。

**3. 放进去**

两种手段择一，契约相同：

- **链接**：仓库更新后自动生效，前提是客户端跟随软链接
- **复制**：客户端不跟随软链接，或你要冻结当前版本；更新需手动重放

```bash
REPO="$PWD"
SKILLS="<你的客户端技能根目录>"

# 入口技能（建议必装）
ln -s "$REPO/using-harold-machine" "$SKILLS/using-harold-machine"

# 业务技能按需逐个链接
ln -s "$REPO/04-production/harold-production-pack" "$SKILLS/harold-production-pack"
```

全量 19 个一起装：

```bash
find "$REPO" -mindepth 2 -maxdepth 3 -name SKILL.md -print0 \
  | xargs -0 -n1 dirname \
  | while read -r d; do ln -sfn "$d" "$SKILLS/$(basename "$d")"; done
```

深度取 3 是为了覆盖仓库根下的入口技能，它比层目录里的技能浅一层。复制安装把 `ln -sfn "$d"` 换成 `cp -R "$d" "$SKILLS/"` 即可。

不必一次装全：先装入口加一个最常用技能，跑通再扩。上下游关系见 [CATALOG.md](CATALOG.md)。

**4. 验证**

三条都要过：

```bash
# 结构：数量与预期一致
ls "$SKILLS"/*/SKILL.md | wc -l

# 可达：能读到文件，链接安装再看指向
ls "$SKILLS/harold-production-pack/SKILL.md"
readlink "$SKILLS/harold-production-pack"
```

第三条只能人工判断：新开一个会话，问"这个任务该用哪个技能"，或直接说某个技能的触发说法。旧会话有缓存，重启后再测。

## 不在本文范围

以下都不改变契约，因此不展开：

- **系统与 shell 差异**：Windows 用 `New-Item -ItemType SymbolicLink` 或直接复制目录，语义等价
- **客户端额外配置**：启用开关、白名单、云同步、权限
- **分发方式**：包管理器、版本锁定、插件市场

契约不满足时，换再多命令都没用；契约满足后，细节随意。

## 更新与卸载

**更新**：让仓库变新即可。

```bash
cd "$REPO" && git pull
```

链接安装立即生效；复制安装要重放第 3 步。

**卸载**：删掉你放进去的那些目录或链接，不动仓库本体。

## 排错：先定位违反哪条契约

| 现象 | 违反的条件 | 处理 |
|---|---|---|
| 客户端完全看不到技能 | `SKILL.md` 不在目录根部 | 确认是 `<技能名>/SKILL.md`，不是平铺文件 |
| 技能列出来但无法调用 | frontmatter 缺 `name` 或与目录名不一致 | 改 `SKILL.md` 的 `name`，不要改目录名 |
| 链接在，技能不生效 | 软链用了相对路径，或客户端不跟随链接 | 改为绝对路径，或改用复制 |
| 两个同名技能互相覆盖 | 同名目录被装了两份 | 保留一份，检查是否来自不同来源 |
| 更新后行为没变 | 复制安装未重放 | 重新复制，或改用链接 |
| 入口装了却从不触发 | 客户端按 `description` 匹配，没有强触发 | 直接点名分诊，见 [USAGE.md](USAGE.md) |

装完进入 [USAGE.md](USAGE.md)，看一轮任务怎么走。
