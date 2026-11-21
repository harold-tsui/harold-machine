# Prompt 结构与模板

## 结论

高级 prompt 不是写得更长，而是把"画面决策链"写完整。控制这 9 层：

1. **媒介 / 画面类型**：film photography、poster、infographic、UI screenshot、watercolor editorial
2. **主体定义**：谁、什么物、什么场景、什么时代、什么身份
3. **镜头与构图**：medium shot、symmetrical composition、3:4、留白、极端透视
4. **光线系统**：荧光、霓虹、轮廓光、窗光、屏幕光、闪光
5. **材质与细节**：皮肤纹理、织物褶皱、纸纹、刷痕、玻璃反射
6. **色彩策略**：主色 + 一个强调色，不堆颜色
7. **情绪与叙事**：克制、史诗、神秘、纪念感、博物馆级
8. **版式 / 文字约束**：标题位置、中文标注、字体风格、信息层级
9. **负面约束**：不要塑料感、不要廉价海报感、不要乱码、不要模板感

## 六条规律

1. **先定媒介，再定主体。** 第一步锁死成像语言（`35 mm film photography`、`museum-style infographic`），它决定底层审美，不是装饰项。
2. **高级感来自少数强决策。** 一个强轮廓、一条强动线、一个强光源、一个强版式结构，四者选一个做到极致。
3. **抽象词后面必须有证据。** "高级 / 电影感"要补细噪声、反光、褶皱、纸纹、行距。
4. **主动控制噪音。** 强 prompt 的一半作用是替模型删错：不要过锐、不要过饰、不要拥挤、不要廉价霓虹。
5. **写关系，不只写对象。** 从"有什么"升级为"它们怎么互相作用"：人与门框、冷白光与外部霓虹、玻璃反射与背景货架。
6. **版式类 prompt 是在写视觉系统。** 信息层级、标题位置、主次、留白、比例、结构稳定性，都要直接写进 prompt。

## 通用骨架

```text
[媒介/风格类型],
[主体 + 场景 + 时代/身份],
[镜头 + 构图 + 比例],
[光线系统],
[色彩策略],
[材质/纹理/真实细节],
[动作/空间关系/叙事线索],
[背景与辅助元素],
[文字/版式规则],
[整体气质],
[负面约束]
```

## 四类长期复用模式

| 模式 | 公式 |
|---|---|
| A 摄影人像 | 媒介 + 混合光线 + 皮肤细节 + 服装材质 + 姿态关系 + 背景证据 + 负面词 |
| B 海报 | 强概念 + 单一视觉支点 + 留白 + 主标题规则 + 高级配色 + 不拥挤 |
| C 信息图 | 中心主视觉 + 固定分区 + 中文标注 + 材质结构说明 + 统一纸面气质 |
| D UI / 截图 | 指定设备或平台 + 明确页面层级 + 文本类型 + 真实交互元素 + 截图感证据 |

## 模板库

### 1. 叙事海报

```text
A premium poster for [主题], built around one strong visual concept: [核心视觉支点].
[背景与留白策略]. [主体与世界观]. [配色]. [主标题位置与字号规则].
[纸张纹理 / 印刷质感]. Rich detail but not overcrowded, clear hierarchy,
memorable silhouette, [负面约束].
```

### 2. 博物馆式信息图

```text
请根据【主题】生成一张高审美、中文可读、博物馆展板级的信息图。整体克制、专业、可收藏。
版式：顶部标题区、中心主视觉、左侧结构拆解区、右侧材质与说明区、底部总结区。
背景为纸张质感，所有文字为简体中文，信息层级清晰。
避免海报感、电商感、乱码、过度装饰。
```

### 3. 轮廓叙事海报

```text
请根据【主题】自动选择一个最有象征意义、最有记忆点的主轮廓载体，
让完整叙事世界自然生长在这个轮廓结构之中（不是嵌进瓶子里）。
强调强轮廓、深纵深、克制配色、纸张质感、诗意叙事；细节丰富但不拥挤。
避免常见容器套路、模板化奇幻拼贴、廉价游戏感。
```

### 4. 平台截图 / UI

```text
Generate a realistic [platform/device] screenshot for [主题].
Clear information hierarchy, authentic UI spacing, believable text blocks,
native icon rhythm, realistic status/navigation elements,
screen glare or capture evidence if needed, premium but natural interface design,
not overly polished, not generic template UI.
```

### 5. 极端透视排版

```text
[场景/表面], giant bold sans-serif typography of "[文字内容]" integrated onto the surface,
extreme perspective distortion aligned to vanishing point,
letterforms conforming to surface curvature, partial occlusion for depth layering,
cinematic lighting, poster-grade integrated typography, modern advertising aesthetics.
```

### 6. 摄影人像

```text
[film / editorial / documentary] photography, [scene and location], [lighting system],
[shot type and composition], [subject], [facial structure and skin texture],
[hair and styling], [wardrobe and fabric details], [pose and body-to-environment relation],
[background evidence], [color grading], [mood], extremely realistic detail, [negative constraints]
```

## 负面约束词库（按需挑 5–8 条）

- 质感：no plastic skin, no digital over-sharpening, no airbrushing, no fake material
- 版式：no clutter, no overcrowded layout, no random icons, no template feel, no stock-photo look
- 色彩：no cheap neon, no oversaturated rainbow, no muddy gradients
- 文字：no gibberish text, no garbled Chinese, no watermark, no tiny unreadable labels
- 内容：no people, no 3D mascot, no fake logos, no brand marks
- 摄影：no extra limbs, no deformed hands, no motion blur unless asked

## 补全五个问题，就能直接出稿

1. 要画什么（一句话）
2. 用在哪：封面 / 正文卡 / 单张海报 / 信息图
3. 要什么气质：克制 / 史诗 / 科技 / 文博 / 商业
4. 有没有参考对象或禁区
5. 比例尺寸

用户答不全时，按"高级、克制、可传播"默认补全，并在输出里写明补的假设。
