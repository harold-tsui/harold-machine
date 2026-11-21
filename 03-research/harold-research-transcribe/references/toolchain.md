# 工具与命令手册

主文件只做决策；本文件放可直接执行的命令、参数与故障对照。
所有路径均为占位符：`<输入>` 指媒体文件或链接，`<工作区>` 指本次任务目录。不要写死个人绝对路径。

---

## 1. 环境自检（一次性，30 秒）

```bash
command -v ffmpeg  >/dev/null && echo "ffmpeg ok"  || echo "缺 ffmpeg"
command -v ffprobe >/dev/null && echo "ffprobe ok" || echo "缺 ffprobe"
command -v yt-dlp  >/dev/null && echo "yt-dlp ok"  || echo "缺 yt-dlp"
python3 -c "import faster_whisper; print('faster-whisper ok')" 2>/dev/null || echo "缺 faster-whisper"
python3 -c "import mlx_whisper;    print('mlx-whisper ok')"    2>/dev/null || echo "缺 mlx-whisper（仅 Apple Silicon 需要）"
command -v whisper-cli >/dev/null && echo "whisper.cpp ok" || echo "缺 whisper.cpp（可选）"
uname -m   # arm64 = Apple Silicon，可用 mlx 加速
```

只跑一次。缺什么就按第 2 节装；装不上直接进降级路径，不要循环重试。

---

## 2. 安装

```bash
# macOS
brew install ffmpeg yt-dlp

# Linux
sudo apt install ffmpeg && pip3 install -U yt-dlp

# Python 侧（选其一即可）
pip3 install -U faster-whisper      # CPU 友好，int8 量化，长音频首选
pip3 install -U mlx-whisper         # Apple Silicon 专用，速度最快
pip3 install -U openai-whisper      # 原始实现，依赖 torch，体积大
```

`whisper.cpp`（无 Python 环境时用）：

```bash
brew install whisper-cpp            # 或按上游 README 自行编译
# 模型需自行下载 ggml-*.bin 放到本地目录
```

模型档位与取舍：

| 档位 | 体积 | 相对速度 | 适用 |
|---|---|---|---|
| tiny | ~40MB | 最快 | 只求"有没有提到" |
| base | ~75MB | 快 | 清晰录音、快速预览 |
| small | ~250MB | 中等 | 默认档，普通话清晰场景 |
| medium | ~770MB | 慢 | 口音明显、术语多 |
| large-v3 / turbo | 1–1.5GB | 最慢 | 多人抢话、最终交付 |

原则：先小档跑一遍看错字率，不达标再上调，不要一上来就最大档。

---

## 3. 路径 1：内嵌字幕（最优，先试）

```bash
# 看有没有字幕、时长、标题
yt-dlp --dump-json --no-playlist "<输入>" 2>/dev/null | python3 -c "
import json,sys
i=json.load(sys.stdin)
print('标题:', i.get('title'))
print('时长(秒):', i.get('duration'))
print('官方字幕:', list(i.get('subtitles',{})))
print('自动字幕:', list(i.get('automatic_captions',{})))
"
```

```bash
# 有字幕就只下字幕，不下媒体
yt-dlp --write-subs --write-auto-subs \
       --sub-langs "zh-Hans,zh-Hant,zh,en" \
       --skip-download --sub-format vtt \
       -o "<工作区>/%(title)s.%(ext)s" "<输入>"
```

VTT → 纯文本（去头、去时间行、去内联标签）：

```bash
python3 - "<工作区>/<file>.vtt" > "<工作区>/subtitle.txt" <<'PY'
import re,sys
for line in open(sys.argv[1],encoding='utf-8'):
    if '-->' in line or line.startswith('WEBVTT') or re.fullmatch(r'\d+', line.strip()):
        continue
    t = re.sub(r'<[^>]+>', '', line).strip()
    if t and t != 'WEBVTT':
        print(t)
PY
```

字幕转底稿时补时间戳：VTT 自带 `00:00:01.000 --> 00:00:03.200`，按段首行时间保留即可，不要重算。

字幕可用性判断（1 分钟内做完）：

- 抽 3 段与音频比对，出现整段缺失、明显错位、只覆盖开场 → 判为不可用。
- 自动字幕常见问题：无标点、断句碎、专名错。可在底稿中保留，但必须在"待核清单"标注"来自自动字幕，未逐句校对"。

---

## 4. 路径 2：取音

```bash
mkdir -p "<工作区>"

# 在线源：只下音频
yt-dlp -x --audio-format wav --no-playlist \
       -o "<工作区>/%(title)s.%(ext)s" "<输入>"

# 本地文件：抽音轨，统一 16kHz 单声道 PCM
ffmpeg -i "<输入>" -vn -ac 1 -ar 16000 -c:a pcm_s16le "<工作区>/audio.wav" -y

# 校验：能读出时长与采样率才算成功
ffprobe -v error -show_entries format=duration:stream=sample_rate,channels \
        -of default=nw=1 "<工作区>/audio.wav"
```

需要登录的内容：用已登录会话导出的 cookie，不要索取账号密码。

```bash
yt-dlp --cookies-from-browser chrome "<输入>"
# 或
yt-dlp --cookies "<cookies.txt>" "<输入>"
```

地区限制、DRM：**不做绕过**。直接告知不可获取，转降级路径。

---

## 5. 路径 3：本地转写

### 5.1 faster-whisper（推荐，CPU 也能跑长音频）

```python
from faster_whisper import WhisperModel

model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(
    "audio.wav",
    language="zh",                 # 显式指定，不要留 None
    beam_size=5,
    vad_filter=True,               # 过滤静音，压制复读
    vad_parameters={"min_silence_duration_ms": 500},
    condition_on_previous_text=False,  # 降低循环幻觉
    initial_prompt="以下是关于<主题>的访谈，涉及<专有名词1>、<专有名词2>。",
)
print("language:", info.language, "duration:", info.duration)
for s in segments:
    print(f"[{int(s.start)//60:02d}:{int(s.start)%60:02d}] {s.text.strip()}")
```

### 5.2 mlx-whisper（Apple Silicon 首选）

```bash
mlx_whisper "<工作区>/audio.wav" \
  --model mlx-community/whisper-large-v3-turbo \
  --language zh \
  --output-format json \
  --output-dir "<工作区>/out"
```

### 5.3 whisper.cpp（无 Python / 内存紧张）

```bash
whisper-cli -m <models>/ggml-small.bin -l zh -f "<工作区>/audio.wav" -oj -of "<工作区>/out/audio"
# 旧版本二进制名为 main，参数一致
```

### 5.4 云端 ASR（可选，非必需）

仅在用户明确同意、网络可用时使用；密钥从环境变量读取，禁止写进脚本或交付物。

```bash
# 由运行环境注入；未设置就明确失败并转本地链路，不要写死密钥
: "${ASR_API_KEY:?未设置 ASR_API_KEY，改走本地链路}"
```

云端不可用不是故障：本技能默认本地链路即可闭环。

### 5.5 中文原生引擎（Whisper 中文错字明显时的上调路径）

公开基准上中文测试集的 CER 量级差异明显：Whisper large-v3 约 20%，Paraformer 约 10%，SenseVoice 约 8%。这些多为**厂商自测、单一测试集**，只作方向参考，不能当承诺。

```bash
pip3 install -U funasr        # 首次运行会下载模型，先报体积与耗时的量级
```

```python
from funasr import AutoModel

model = AutoModel(model="paraformer-zh", vad_model="fsmn-vad", punc_model="ct-punc")
res = model.generate(input="<工作区>/audio.wav", batch_size_s=300)
print(res[0]["text"])
```

三条纪律：

- 先用 60 秒片段与现用 Whisper 结果对比，确认确实更好再整体切换；不要看到一个基准数字就换。
- 该链路默认不给词级时间戳，**字幕仍以 Whisper 系为主**；中文原生引擎更适合当交叉复核的**异族第二引擎**。
- 自带标点模型会改断句，底稿分段仍按主文件 Step 5 重切，不直接沿用。

---

## 6. 参数决策表

| 现象 | 参数 | 说明 |
|---|---|---|
| 中英混说被判成英文 | `language="zh"` | 显式指定主语言，比自动检测稳 |
| 静音处复读同一句 | `vad_filter=True`、`condition_on_previous_text=False` | 仍复读则截断该段 |
| 专名反复错 | `initial_prompt` 放专名词表 | 只放词，不放整句指令 |
| CPU 太慢 | `compute_type="int8"` + 降档 | 质量略降，速度提升明显 |
| 显存不足 | `device="cpu"` | 不要反复试 cuda |
| 多人抢话、切分混乱 | 升档 + `beam_size=5` | 分段规则仍按主文件 Step 5 |
| 输出繁体 / 术语翻译 | 指明语言 + 词表 | 不改写内容，只纠正转写 |

---

## 7. 长音频分片与偏移合并

目标：单片 10–15 分钟，切点落在静音处，避免切断词。

```bash
# 1) 找静音点（噪声阈值按素材调整）
ffmpeg -i "<工作区>/audio.wav" -af silencedetect=noise=-35dB:d=0.6 -f null - 2>&1 \
  | grep silence_start
```

```python
# 2) 把上面 grep 到的 silence_start 填进 silences（秒），生成片文件
import subprocess as sp

# 下列数值为示例，非真实数据；total 用 ffprobe 实测值替换
src, total, target = "audio.wav", 1830.0, 900
silences = [60.2, 912.5, 1801.3]          # 从 silencedetect 输出抄入
cuts, pos = [0.0], 0.0
while pos + target < total:
    goal = pos + target
    near = [s for s in silences if goal - 120 < s < goal + 120 and s > pos + 60]
    pos = min(near, key=lambda s: abs(s - goal)) if near else goal
    cuts.append(pos)
cuts.append(total)

for i, (a, b) in enumerate(zip(cuts, cuts[1:])):
    # 每片尾部多留 0.5 秒作重叠区，合并时去重
    sp.run(["ffmpeg", "-ss", str(a), "-t", str(b - a + 0.5), "-i", src,
            f"part_{i}.wav", "-y"], check=True)
```

```python
# 3) 合并时加回偏移
offset = 0.0
for i, part in enumerate(parts):
    segs = transcribe(part)
    for s in segs:
        s["start"] += offset; s["end"] += offset
    offset += duration_of(part)
```

三条硬要求：

- 每片偏移量单独记录，写到日志里，便于排错。
- 接缝留 0.5 秒重叠（切片命令用 `-t (b-a+0.5)`），合并时按时间戳去掉重叠区内重复的句子，避免丢字与复读。
- 合并后必须检查时间戳单调性与总覆盖（见第 9 节）。

---

## 8. 后处理：分段与时间戳

段界来源：引擎给了句级切分就直接用；没给时取 >1.5 秒静音点作为候选段界。

```bash
ffmpeg -i "<工作区>/audio.wav" -af silencedetect=noise=-35dB:d=1.5 -f null - 2>&1 \
  | grep silence_start
```

只在单段超过 60 秒（中文另超 200 字）时，才用最近的候选段界断开；不要为了对齐静音把每句都切碎。

```python
import re

def fmt(t, with_hour=False):
    t = int(t)
    h, m, s = t // 3600, (t % 3600) // 60, t % 60
    return f"[{h}:{m:02d}:{s:02d}]" if with_hour or h else f"[{m:02d}:{s:02d}]"

def fix_zh(text):
    text = re.sub(r'\s+', '', text)
    text = re.sub(r'([，。！？；：])\1+', r'\1', text)
    return text

# 碎片合并：<3 秒且 <10 字并入前一段
merged, buf = [], None
for s in segments:
    short = (s["end"] - s["start"] < 3) and len(s["text"].strip()) < 10
    if buf and short:
        buf["text"] += s["text"]; buf["end"] = s["end"]
    else:
        if buf: merged.append(buf)
        buf = dict(s)
if buf: merged.append(buf)

# 单段上限：≤60 秒；中文另限 ≤200 字，两者先到为准，超出按标点再切
```

### 8.1 字幕行宽与阅读速度校验

行宽按语言分档，不把西文数字套到中文：

| 语言 | 每行硬上限 | 建议值 | 阅读速度上限 |
|---|---|---|---|
| 中文 | 16 字（SDH 18） | ≤14 字 | ≤9 字/秒（SDH ≤11） |
| 西文 | 42 字符 | ≤37 字符 | ≤20 字符/秒 |
| 中英混排 | 32 显示宽 | ≤28 显示宽 | 按主导语言取严 |

```python
import unicodedata

def width(s):
    # W/F 为全角与宽字符；A（歧义宽度）按 1 计，偏保守
    return sum(2 if unicodedata.east_asian_width(ch) in "WF" else 1 for ch in s)

def cps(text, start, end, zh=True):
    dur = max(end - start, 0.001)
    return (len(text) if zh else width(text)) / dur

def cue_ok(text, start, end, zh=True):
    dur = end - start
    if not (1.0 <= dur <= 7.0):
        return False
    if zh:
        return len(text) <= 16 and cps(text, start, end, True) <= 9
    return width(text) <= 42 and cps(text, start, end, False) <= 20
```

超 CPS 的三种处理，按优先级：**拆条 → 压缩停顿**（把上一条尾部的空白让给本条）→ 仍不行才降到建议值以下，但不得超硬上限。不要靠延长单条时长硬塞。

时间戳规则与主文件 Step 5 一致，此处只给实现。不要按"第几句"编号，只保留时间。

---

## 9. 质量校验脚本（A 结构 / B 置信度 / C 交叉 / D 回听清单）

分四层：A、B 必做且全自动；C 有第二个引擎或档位时必做；D 只能由人做，agent 只负责出清单。

### 9.1 A 结构检查

```python
segs = [{"start":0.0,"end":3.2,"text":"..."}]  # 转写结果（示例，非真实数据）
total = 1830.0                                  # ffprobe 读到的时长（示例）

bad   = [i for i in range(1,len(segs)) if segs[i]["start"] < segs[i-1]["start"]]          # 回退
gap   = abs(total - segs[-1]["end"])                                                      # 覆盖
dup   = [i for i in range(1,len(segs)) if segs[i]["text"].strip() == segs[i-1]["text"].strip()]  # 复读
noise = [i for i,s in enumerate(segs) if len(s["text"].strip()) <= 2]                     # 空转

print("时间戳回退:", bad, "| 覆盖差:", round(gap,1), "秒", "| 重复段:", dup, "| 疑似幻觉:", noise)
```

判定：回退非空或覆盖差 >30 秒 → 必须修；重复与空转逐条核，能删则删，不能判就标 `[听不清]`。

### 9.2 B 置信度标记

faster-whisper / mlx-whisper 的 segment 带 `avg_logprob` 与 `no_speech_prob`：

```python
for s in segments:
    if s.avg_logprob < -1.0:                      # 模型自己也不确定
        s.text = s.text.rstrip() + " [?]"
    if s.no_speech_prob > 0.6 and s.avg_logprob < -1.0:
        s.text = "[听不清]"                        # 静音幻觉：两条件同时成立才替换
```

- 静音幻觉的判据是**两个条件同时成立**（无语音概率高 且 平均对数概率低）。只凭 `no_speech_prob` 高、或只凭文本短（≤2 字）就替换，会把"好""对"这类正常短应答误删，也会漏掉模型自信编造的长段落。
- 阈值是经验值，可按素材上下浮动（如 -1.2 / 0.5），但必须在校验记录里写明本次用的阈值。
- whisper.cpp 默认不输出置信度：跳过本层，记录写"该引擎无置信度输出"。
- 标了 `[?]` 的段必须同时进待核清单，不能只在正文加个问号。

### 9.3 C 交叉复核

用第二档模型或第二引擎重跑同一音频，按 1 秒窗口对齐后逐段比对：

```python
import difflib

def ratio(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()

suspect = []
for p, q in zip(primary, secondary):              # 两路结果按起点对齐后配对
    if ratio(p["text"], q["text"]) < 0.8:
        suspect.append((p["start"], p["text"], q["text"]))
```

- 差异段全部进待核清单，来源列写"交叉"。
- 第二引擎优先选**异族**（Whisper ↔ 中文原生引擎，见 §5.5）；同引擎不同档位也算交叉，但属弱交叉，记录里注明。
- 有内嵌字幕时，用字幕做第三方比对面，效果更好。
- 两路都跑不了：跳过本层，交付物写"单引擎，未交叉复核"。

分片交付时另做**接缝复核**：每个接缝取前后各 5 秒重转，与主稿逐句比对。

```python
for seam in seam_offsets:                    # 每片起点，示例，非真实数据
    clip = extract(seam - 5, seam + 5)
    again = transcribe(clip)
    for s in again:
        near = nearest_seg(s["start"] + seam - 5)
        if near and ratio(s["text"], near["text"]) < 0.8:
            suspect.append((seam, near["text"], s["text"]))
```

接缝处的缺字与复读都记"交叉"，并在校验记录里列出接缝时间点。

### 9.4 D 回听清单（交给用户，不由 agent 执行）

```python
for r in (0.1, 0.3, 0.5, 0.7, 0.9):               # 固定 5 个相对位置
    t = total * r
    near = min(segs, key=lambda s: abs(s["start"] - t))
    print(f"- [{near['start']//60:02d}:{int(near['start'])%60:02d}] {near['text']}  ← 请回听 30 秒")
```

把这份清单交给用户，由用户回填"有无错字、错在哪"，再据此算粗错字率（>15% 判不合格，上调档位或转人工）。

用户没回填：交付物写"未人工复核"，不给错字率，也不得写"抽样校验通过"。

---

## 10. 故障对照

| 现象 | 处理 |
|---|---|
| `Video unavailable` / `HTTP 403` | 先升级 yt-dlp；仍失败则用已登录 cookie；再失败转降级 |
| 地区限制 | 不绕过，告知不可获取 |
| 下载到一半中断 | 重试一次；仍失败检查网络，或让用户提供本地文件 |
| `PytorchStreamReader failed` | 音频损坏，删除重取，不要拿坏文件反复转 |
| CUDA / 显存 OOM | 改 `device="cpu"` + `compute_type="int8"` + 降档，不重复重试 cuda |
| 转写结果整段复读 | 开 VAD、关 `condition_on_previous_text`，截断复读段 |
| 大量无意义标点 / 歌词 | 该段判为音乐，替换为 `[音乐]` |
| 语言判错 | 显式 `language=`，混语按段标 |
| 时间戳整体偏移 | 分片未加偏移，回到合并逻辑修 |
| 字幕文件乱码 | 换 `--sub-format vtt` 重下；仍乱码则放弃字幕走 ASR |
| 字幕与音频对不上 | 判为不可用，走 ASR |

---

## 11. 不可获取的源

- DRM 保护的流媒体：不做解密。
- 付费订阅音频：不做账号共享或破解。
- 加密会议回放：请用户导出本地录音文件。

交付时写清"不可获取 + 原因 + 替代方案（导出录音 / 提供文字稿 / 换用公开版本）"。

---

## 12. 说话人分离（默认关闭）

默认不做。理由：分离错误会污染引用，且耗时显著高于转写本身。

仅在三条同时成立时开启：**用户明确要求 + 素材是 ≥2 人对话 + 结论需要引用到具体人**。

### 12.1 本地 diarization（pyannote）

```bash
pip3 install -U pyannote.audio
# 模型页需先接受用户协议，token 从环境变量读取，不写进脚本
: "${HF_TOKEN:?未设置 HF_TOKEN，改走问答结构人工粗标}"
```

```python
from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token=True)
diarization = pipeline("<工作区>/audio.wav")
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f} {turn.end:.1f} {speaker}")
```

接口随版本变化，失败时查上游 README，不要反复重试。首次运行会下载模型，先报体积与耗时的量级。

### 12.2 与转写结果对齐

取每个转写段与 diarization 区间的时间交集，算各说话人占比：

- 单人在该段占比 >60% → 标该说话人。
- 无说话人占比过半 → 标 `[多人重叠]`，不强行指派。
- 标签统一为「说话人 1 / 2 / 3」，不做性别、身份推断。
- 字幕交付且已区分说话人时，同一句话由两人接续说完，可用 `- ` 前缀分两行，不做逐字对齐。

### 12.3 不可靠时的处理

- 机器分离结果必须在头部标"机器分离，可能有错"，并抽 2 段人工核对。
- 命中以下任一信号，直接判"分离不可靠"，退回未区分并写明依据：
  - 同一人连续发言的 20 秒内，标签跳变 ≥2 次；
  - 与明显的问答结构矛盾（提问后紧跟同标签，且连续出现 ≥3 轮）；
  - 重叠说话段占比 >20%（`[多人重叠]` 总时长 ÷ 总时长）。
- 参照量级：公开基准上主流 diarization 系统的 DER 在 11%–13%，重叠与远场是最难的两块；经验上 DER 超过 12%–15% 用户就不再信任标签。所以"看起来基本对"不等于可用。
- 装不上、无 token、素材太吵导致轮次混乱 → 放弃分离，声明"未区分说话人"。
- 双人访谈可用问答结构粗标（提问方 / 回答方），但必须注明"按结构推断，非声纹"。宁可粗标，不可乱猜。

---

## 13. 词表持久化

### 13.1 位置与格式

默认放任务目录 `<工作区>/glossary.txt`；需要跨任务复用时由用户指定固定路径，不默认写进技能目录（避免不同主题的词互相污染）。

```text
# 一行一词；# 开头为注释
# 可选：用 <- 标注常见误写，供后处理替换
李彦宏
火山引擎
Seedance <- Seed Dance, seeddance
上下文工程
```

### 13.2 读取：拼进 initial_prompt

```python
import os

def load_glossary(path, limit=30):   # 显式传 "<工作区>/glossary.txt"，不依赖当前目录
    if not os.path.exists(path):
        return ""
    terms = [l.strip() for l in open(path, encoding="utf-8")
             if l.strip() and not l.startswith("#")]
    terms = [t.split("<-")[0].strip() for t in terms]
    return "、".join(terms[:limit])      # 词表过长会挤压上下文，30 个封顶
```

只放词，不写成句子；提示词越长，模型顺着编内容的风险越大。

### 13.3 增量回写

转写结束后，从待核清单与 `[?]` 段里挑出**反复出现且已确认正确**的专名，建议追加。必须经用户确认后再写文件——不能把听错的名字自动固化进词表。

### 13.4 后处理替换（保守）

只替换显式标注的误写，且要求误写长度 ≥3 字，避免短词误伤：

```python
import os

def apply_fixes(text, path="glossary.txt"):
    if not os.path.exists(path):
        return text
    for line in open(path, encoding="utf-8"):
        if "<-" not in line or line.startswith("#"):
            continue
        right, wrongs = line.split("<-", 1)
        for w in wrongs.split(","):
            w = w.strip()
            if len(w) >= 3:
                text = text.replace(w, right.strip())
    return text
```

替换了几处、用了哪几对，写进校验记录，便于回溯。

---

## 14. 耗时估算基准

### 14.1 量级参考（非承诺）

RTF = 转写耗时 ÷ 素材时长。下表是常见配置的量级；机器、音频质量、语言都会让结果浮动。

| 引擎 / 档位 | 硬件 | RTF 量级 | 1 小时音频约需 |
|---|---|---|---|
| faster-whisper small | CPU int8 | 0.3–0.8 | 20–50 分钟 |
| faster-whisper medium | CPU int8 | 1.0–1.5 | 60–90 分钟 |
| faster-whisper large-v3 | CPU int8 | 2–4 | 2–4 小时 |
| mlx-whisper large-v3-turbo | Apple Silicon | 0.05–0.15 | 3–9 分钟 |
| whisper.cpp small | Apple Silicon | 0.2–0.4 | 12–25 分钟 |

首次运行另有模型下载时间（小档几十秒，large 级 1–5 分钟，视网络）。

### 14.2 报耗时公式

```text
基础耗时 = 素材时长 × RTF × 1.05（分片合并开销）+ 模型下载（仅首次）
做 C 层交叉复核再 ×1.8（同一素材跑第二遍）；单引擎不加
```

只报区间，不报单位数；末尾注明"实际以首片速度为准"。

### 14.3 实测校准（更准，优先用）

开工前先转前 60 秒并计时：

```bash
ffmpeg -ss 0 -t 60 -i "<工作区>/audio.wav" "<工作区>/probe.wav" -y
/usr/bin/time -p <转写命令> "<工作区>/probe.wav"
```

用 `real` 秒数 ÷ 60 得实测 RTF，再乘总时长。校准值写进元信息"耗时"字段，同类素材下次直接复用。

### 14.4 容易低估的情况

- 多人抢话、背景音乐重：VAD 反复触发，可能到基准的 1.5 倍。
- 分片过碎：每片有固定启动开销，片段数 >20 时再加 10%。
- 交叉复核用大档：第二遍可能比第一遍更慢，不是简单加一倍。
