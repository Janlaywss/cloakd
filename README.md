# Cloakd

**把 ChatGPT 的网页端伪装成 Claude.ai。** Plasmo 浏览器扩展，纯 CSS 注入 —— 不动 DOM、不注入 React、加载一次不再执行。

- 暖奶油底色 / 铜橙 accent
- Anthropic Sans 做 UI,Anthropic Serif 做助手回复（和 claude.ai 一致）
- 圆角气泡、悬浮 / 选中态匹配 Claude 的交互反馈
- 浅色 / 深色模式自动跟随 ChatGPT 自身设置
- 所有可调参数抽成 CSS 变量,调优只改 3 个文件

> ⚠️ 个人折腾项目。目前只支持 ChatGPT (`chatgpt.com` / `chat.openai.com`)。Gemini 版本计划中,未开工。

---

## 安装

### 先决条件

- Node 20+
- pnpm (推荐) 或 npm

### 步骤

```sh
# 1. 安装依赖（大约 9 秒）
pnpm install

# 2. 构建生产包
pnpm build

# 3. 加载到 Chrome
# chrome://extensions → 打开右上角"开发者模式" → "加载已解压的扩展程序"
# → 选择 build/chrome-mv3-prod/
```

然后访问 https://chatgpt.com,应该立刻看到 Claude 风格的界面。

### 开发模式

改样式的时候别用 `pnpm build`,用 watch:

```sh
pnpm dev
```

然后加载的是 `build/chrome-mv3-dev/`。保存任何 CSS / TS 文件,Plasmo 会自动 rebuild。rebuild 完成之后,需要在 `chrome://extensions` 里点 Cloakd 卡片上的 **刷新** 图标,然后在 chatgpt.com 上硬刷(⌘⇧R)才能看到新样式生效。

> 依赖安装说明:项目里通过 `pnpm.overrides` 把 sharp 强制升到了 0.33.x,避开了旧版 sharp 从 GitHub release 拉 libvips 二进制的坑 —— 那个在国内基本必超时。如果你升级 Plasmo 后想移除这个 override,请参考 [AGENT.md](AGENT.md) 里 "Gotchas #1"。

---

## 如何调主题

所有可调参数都在 `styles/chatgpt/` 目录下的三个 CSS 文件里。

| 文件 | 改它会影响 | 里面有什么 |
|---|---|---|
| [`styles/chatgpt/light.css`](styles/chatgpt/light.css) | 只浅色模式 | 所有浅色 token(颜色、阴影、边框) |
| [`styles/chatgpt/dark.css`](styles/chatgpt/dark.css) | 只深色模式 | 同名 token 的深色版本 |
| [`styles/chatgpt/base.css`](styles/chatgpt/base.css) | 两种模式共享 | 字体栈、圆角、过渡、以及所有选择器(选择器都用 `var(...)` 读 token,不硬编码颜色) |

**原则**:要改颜色 / 阴影 → 去 `light.css` 或 `dark.css`。要改字体 / 圆角 / 过渡 → 去 `base.css`。要改"哪个元素用哪个 token" → 去 `base.css` 的下半部分。

### 常见调优场景

```css
/* styles/chatgpt/light.css — 想把底色换成纯白 */
--cloakd-bg: #FFFFFF;
--cloakd-bg-transparent: rgb(255 255 255 / 0);  /* 记得同步这个 */

/* styles/chatgpt/dark.css — 想让深色模式更深 */
--cloakd-bg: #1a1a19;
--cloakd-bg-transparent: rgb(26 26 25 / 0);

/* styles/chatgpt/base.css — 想让用户气泡也用 serif */
--font-user-message: var(--font-ui-serif);

/* styles/chatgpt/base.css — 觉得气泡圆角太方 */
--cloakd-radius-bubble: 20px;

/* light.css + dark.css 都要改 — 把 accent 换成 Anthropic 的蓝 */
--cloakd-accent: #6C63FF;
--cloakd-accent-hover: #5850E0;
--cloakd-accent-soft: rgba(108, 99, 255, 0.12);
```

改完之后 `pnpm dev` 会自动 rebuild,然后点扩展刷新 + 页面硬刷即可。

### Token 命名

两套 token,两种职责:

- **`--cloakd-*`** — 这个项目自己的语义 token (`--cloakd-bg`, `--cloakd-accent`, `--cloakd-radius-bubble` 等)。选择器都读这些。
- **`--font-*`** — 字体相关的 token,完全镜像 Claude.ai 自己用的变量名 (`--font-ui`, `--font-ui-serif`, `--font-user-message`, `--font-claude-response`, `--font-anthropic-sans/serif/mono` 等)。这样将来从 Claude.ai 直接复制 CSS 片段过来就能用。

---

## 目录结构

```
cloakd/
├── AGENT.md                  AI 助手使用的项目上下文文档
├── README.md                 这个文件
├── package.json
├── tsconfig.json
├── assets/
│   ├── icon.png              512×512 占位图标（随时替换）
│   └── fonts/
│       ├── anthropic-sans.woff2   Anthropic Sans Web Regular
│       └── anthropic-serif.woff2  Anthropic Serif Web Regular
├── contents/
│   └── chatgpt.ts            content script:注入 @font-face + 三个 CSS 文件
└── styles/
    └── chatgpt/
        ├── base.css          字体 / 几何 / 选择器
        ├── light.css         浅色 tokens
        └── dark.css          深色 tokens
```

---

## 字体

两个 woff2 通过 Plasmo 的 `data-base64:` 导入方式直接内联进 content script bundle:

```ts
// contents/chatgpt.ts
import anthropicSans  from "data-base64:~assets/fonts/anthropic-sans.woff2"
import anthropicSerif from "data-base64:~assets/fonts/anthropic-serif.woff2"
```

**为什么要内联**:content script 注入的 `<style>` 里的 `@font-face { src: url(...) }` 没法直接读扩展自身的文件 (需要走 `web_accessible_resources` + `chrome.runtime.getURL()` 动态重写 CSS),麻烦且有首屏闪烁。base64 内联代价是 bundle 从 12KB 涨到 403KB,但 Chrome 会缓存解析后的样式表,每次 SPA 导航都是零闪烁。

**已知限制**:
- 只装了 **Regular 400**。粗体 / italic 会落回系统字体栈的下一档 (`system-ui`),不伪粗 —— 是 `font-synthesis: none` 防止浏览器合成丑陋的 faux-bold。如果想彻底匹配,从 claude.ai 的 devtools → Network 面板抓几份粗体 woff2 扔进 `assets/fonts/`,在 [`contents/chatgpt.ts`](contents/chatgpt.ts) 里加对应的 `@font-face` 块。
- **Anthropic Mono 没装**。代码块走系统 mono (SF Mono / Menlo)。

---

## 已知限制

1. **ChatGPT 的 Tailwind class 名会变**。一些兜底选择器 (`[class*="rounded-3xl"]` 之类) 可能哪天就命中不到了。用 DevTools 检查实际 DOM,在 [`styles/chatgpt/base.css`](styles/chatgpt/base.css) 追加更精确的选择器。
2. **没有开关按钮**。想临时关掉的话在 `chrome://extensions` 里停用 Cloakd。未来会考虑加 popup toggle。
3. **Plasmo 版本**。当前锁在 0.88,有新版 0.90.5 可用,升级之后可能可以去掉 sharp override —— 详见 [AGENT.md](AGENT.md)。
4. **没做过 Firefox**。只在 Chromium 系 (Chrome / Edge / Arc / Brave) 上验证过。Plasmo 理论上支持 Firefox 构建,没测过。

---

## Roadmap

- [ ] Gemini (`gemini.google.com`) 支持 — `contents/gemini.ts` + `styles/gemini/{base,light,dark}.css`
- [ ] 多字重字体 (Medium / Semibold / Bold)
- [ ] Popup toggle,临时禁用注入
- [ ] Options 页,让用户直接在扩展里调 token 而不用改文件 + 重载

---

## 贡献 / 二次开发

看 [AGENT.md](AGENT.md) 了解项目约定、设计原则和已知的坑。

如果你要让 AI 助手帮忙改这个项目,`AGENT.md` 会被 Claude Code / Cursor 等工具自动加载进上下文。
