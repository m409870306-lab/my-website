# 婚纱礼服 AI 试穿小程序

顾客端 MVP：上传本人照片，填写可选体型信息，选择婚纱礼服，生成试穿效果图。

## 本地启动

安装后端依赖：

```bash
npm run server:install
```

复制环境变量：

```bash
copy .env.example server\.env
```

默认使用 mock 生成，不消耗 OpenAI API：

```bash
npm run server:dev
```

健康检查：

```bash
curl http://localhost:8787/health
```

## 接入 OpenAI

后续由你自己把密钥写入 `server/.env`：

```bash
OPENAI_API_KEY=你的密钥
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_MOCK=false
PORT=8787
PUBLIC_BASE_URL=http://localhost:8787
```

不要把 API Key 写入前端，也不要提交 `.env`。

## 小程序预览

用微信开发者工具打开：

```text
D:\婚纱试穿小程序\miniprogram
```

开发阶段需要关闭 URL 校验，或把后端配置到合法域名后再真机测试。

## MVP 验收

- 上传页支持 1-3 张本人照。
- 体型信息可跳过。
- 礼服选择有 4 个种子款式。
- 生成页显示处理状态。
- 结果页整版展示图片，文字不遮挡人物主体。
