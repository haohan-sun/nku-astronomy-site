# 安卡后端（Cloudflare Worker）

前端 `assets/js/anka-chat.js` 里**不放任何 Key**，只放一个 `proxyUrl`。这个 Worker 就是那个地址：Key 存成 Cloudflare 的 secret，浏览器永远看不到。

## 部署

```bash
cd proxy
npx wrangler login                 # 浏览器里授权一次
npx wrangler secret put ARK_KEY    # 粘贴方舟的 Key，回车
npx wrangler deploy
```

线上已部署：`https://anka-proxy.nku-astronomy.workers.dev`（账号 haohansun07，模型 `deepseek-v4-flash-ga-260731`，key 存在 Worker 的 `ARK_KEY` secret 里）。换环境时部署完会打印 `https://anka-proxy.<你的子域>.workers.dev`，把它填到 `assets/js/anka-chat.js`：

```js
proxyUrl: "https://anka-proxy.<你的子域>.workers.dev",
```

再提交一次前端就生效了。

## 它做了什么

- **来源校验**：只接受 `ALLOW_ORIGIN` 里列出的页面发起 `POST`，别的地方 403。
- **人设与额度由服务端锁定**：前端传上来的 `system`、`model`、`max_tokens`、`temperature` 一律丢弃，统一用 Worker 里的 `SYSTEM`、`deepseek-v4-1-flash-261017`、220 tokens。
- **限流**：每个 IP 每分钟最多 6 次（绑了 KV 才生效；没绑就只靠前端限流）。
- **最小返回**：只回 `choices[0].message.content`，不把上游的 id / usage 抛给前端。

## 本地联调

```bash
cd proxy
npx wrangler dev --var ALLOW_ORIGIN=http://127.0.0.1:8811
```

然后把 `anka-chat.js` 的 `proxyUrl` 临时指到 `http://127.0.0.1:8787`。

## 不部署也能用

`proxyUrl` 为空时，前端只答写死的几条常见问题（加入 / 活动 / 苏宜星 / 今晚看什么 / 器材 / 校区 / 会费 / 历史），不联网、不花钱、也不泄露任何东西。
