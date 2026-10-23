# Hakuya

个人主页：文字、影像、精神分析阅读与前端探索。

目标地址：https://sakurakoujihakuya.github.io/

## 运行与维护

纯静态 HTML、CSS、JavaScript，无构建步骤、环境变量或服务端依赖。GitHub Pages 可从 main 分支根目录发布。

- index.html：页面正文与作品详情
- style.css：响应式布局
- library.js：片架、筛选与作品内交互
- app.js：页面与文字结构实验
- assets/：本地图片与 Yjs 演示组件

Yjs 演示仅在浏览器内模拟双副本，不提供远程协作或持久化。

## 第三方内容

影视与游戏图片及相关名称属于各自权利人，来源链接与版本说明见页面和 [THIRD_PARTY.md](THIRD_PARTY.md)。本仓库不对第三方图片授予开源许可。Yjs 与 lib0 的许可文件保留在 assets/ 中。

## 回归检查

运行 `python -m unittest discover -s tests -v`（需要 Python 3 和 Node.js）。这只检查语法、资源、作品及主要区块，不代替浏览器对筛选、自动滚动、人物切换和移动布局的实际验收。

## 创意展厅 / 自动目录

`#gallery` 使用 daily-demos 仓库 main 分支的 `demos.json` 作为唯一远程目录源。页面打开时读取，保持可见时每五分钟重新读取，也可点击“刷新目录”。新条目只需在 daily-demos 更新，不需要重新部署主页。GitHub/CDN 或网络传播可能有延迟，不是实时推送。

本地 `assets/demo-catalog.json` 是首次打开的离线降级快照，成功获取远程目录后保存到浏览器 localStorage；网络失败会明确标注并保留可用目录。禁用存储不会阻止在线读取。目录请求不带认证，不读取用户或公司数据。卡片图形是抽象题签，不冒充应用截图；未来可用目录 `preview` 指定公开 HTTPS 截图。

测试：`node --test tests/test_gallery.cjs`；原页面回归：`python -m unittest discover -s tests`。测试覆盖未来目录条目无需改主页即可被读取、筛选、重复/非法条目与不安全链接。修改 JS/CSS 后更新 index 中的资源版本，避免旧缓存。
