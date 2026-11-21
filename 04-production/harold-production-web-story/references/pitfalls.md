# 避坑清单（概况版）

做这类单页网页最常见的坑和修法方向。验收不过时先来这里对号。

## 布局

| 症状 | 修法方向 |
|---|---|
| 全页截图出现一大块假留白 | 首屏高度别裸写 `100svh`，加 `min()` 上限 |
| 窄屏图片被撑变形 | CSS 加 `img { max-width:100%; height:auto }` |
| 手机端横向滚动 | 320px 也要验；表格外包 `overflow-x:auto`，长文本加 `overflow-wrap:anywhere` |
| 图片容器高度塌陷/撑飞 | 容器用 `aspect-ratio` 锁比例 |
| 点导航锚点后标题被粘性导航压住 | `html { scroll-padding-top: 导航高度 }`，或章节 `scroll-margin-top` |
| 正文里的来源链接被 QA 判为触控过小 | 句内链接属 WCAG 2.5.8 Inline 例外；脚本只查导航、按钮、卡片链接。注意 44px 是内部标准（WCAG 2.5.8 的 AA 要求是 24×24） |
| 为了"高级感"劫持滚动，读屏用户拿不到内容 | 不拦截 wheel / touch，不做滚动锁定；叙事写在真实 DOM 文本里，只做进入视口淡入 |
| 首屏图几 MB，手机上白屏很久 | 导出 WebP / AVIF，宽按容器 2 倍、单张 ≤300KB，写 `width` / `height` |
| 开了"减少动效"还在滚入淡入 | `prefers-reduced-motion: reduce` 里关掉 transition 与 `scroll-behavior` |
| 发到微信 / 飞书没有预览卡 | 补 `og:title` / `og:description` / `og:image`（绝对 URL、1200×630） |
| 图片读屏软件读不出来 | 信息图写 `alt`，装饰图 `alt=""`，不要省略属性 |
| 键盘 Tab 看不到焦点 | 删掉全局 `outline: none`，改用 `:focus-visible` 自绘焦点框 |

## 验收脚本

| 症状 | 修法方向 |
|---|---|
| 截图卡在图片加载 | 首屏图用 `loading="eager"`；脚本里给 decode 加超时 |
| 中文路径读不到文件 | 路径做 encodeURI / decodeURIComponent 成对处理 |
| 截图截到半成品 | 页面渲染完设 `data-ready` 标记，脚本等它再截 |

## 部署

| 症状 | 修法方向 |
|---|---|
| 部署后还是旧页面 | 对象存储+CDN 的方案，上传后要刷新 CDN 缓存 |
| 不确定发布成功没有 | 公网 curl 读回：状态码 200 + 字节数与本地一致 |
| Vercel 构建报 runtime 版本冲突 | 静态页删掉固定旧版本的 vercel.json，用空配置 |

## 内容

| 症状 | 修法方向 |
|---|---|
| 预测类内容被当官方结论 | 显眼处标注"这是预测，非官方结论" |
| 数据引发误导 | 每个数据标来源、口径与时点 |
