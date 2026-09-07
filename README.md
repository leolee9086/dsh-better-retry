# dsh-better-retry

`dsh-better-retry` 是一个面向 DeepSeek Harness 的智能重试插件。它识别已经确认可以安全重试的临时性错误，并把这些错误交给 DSH 自带的 `@deepseek-ai/dsh-llm-retry` 执行器处理。

匹配成功后，插件不会自行实现另一套重试循环，而是继续使用 DSH 原有的重试机制。因此请求仍然具备指数退避、随机抖动、取消处理、持久化重试事件和重试次数限制。

## 已内置的错误规则

当前默认规则包含以下错误：

```text
Too many pending requests, please retry later
Our servers are currently overloaded. Please try again later
```

错误中的 `request id`、trace id、UUID 等每次请求都会变化的字段会被忽略。例如，下面两条消息会被视为同一类错误：

```text
unknown: Too many pending requests, please retry later (request id: abc123)
unknown: Too many pending requests, please retry later (request id: def456)
```

对于已经保存的多条错误样本，插件会先进行文本规范化，再提取它们之间的公共稳定片段。过短或过于宽泛的片段不会被接受，避免把无关错误误判为可重试错误。

## 安装

### 从 GitHub 安装

目标机器需要已经安装 DSH CLI。执行：

```sh
dsh plugin --profile web add github:leolee9086/dsh-better-retry
```

GitHub 仓库已经提交了 `lib/` 构建产物，目标机器不需要再次执行构建。

为了固定插件版本，建议使用 commit SHA：

```sh
dsh plugin --profile web add github:leolee9086/dsh-better-retry#COMMIT_SHA
```

安装完成后，重启 DSH Web，或者让 `web` profile 重新加载插件。

### 检查是否安装成功

使用下面的命令查看组合后的 profile：

```sh
dsh --profile web --dump-config
```

输出中应当同时出现：

```text
id: llm-retry
name: '@deepseek-ai/dsh-llm-retry'

id: dsh-better-retry
name: dsh-better-retry
```

`dsh-better-retry` 依赖 DSH profile 中已经存在的 `@deepseek-ai/dsh-llm-retry`。本插件负责错误分类，指数退避和重试执行由 DSH 原有插件负责。

## 自动重试行为

当模型请求返回 `PI_AI_ERROR`，且错误消息匹配启用的规则时，插件会把错误重新分类为 `RATE_LIMIT`。随后，`@deepseek-ai/dsh-llm-retry` 会根据对应 provider 的重试策略进行指数退避重试。

默认重试策略由 provider 配置决定。可以根据实际服务情况调整：

- `maxRetries`：最大重试次数。
- `backoff.initialDelayMs`：第一次重试前的初始等待时间。
- `backoff.maxDelayMs`：单次等待时间上限。
- `backoff.jitterRatio`：随机抖动比例。

当错误最终恢复时，当前回合继续执行；达到重试次数上限、请求被取消或插件停止时，错误会正常结束，不会无限重试。

已经结束并显示在历史记录中的回合不会因为安装插件而自动恢复。插件只影响安装并加载之后发生的请求。

## 在界面中纳入新的错误

对于界面中出现的错误，可以使用错误行上的 **“纳入自动重试”** 操作，将当前错误保存到 `dsh-better-retry` 设置中。

保存时不会简单地永久记住某一个带 request id 的完整字符串，而是会进行以下处理：

1. 移除 provider 标签和易变的 request id、trace id、UUID。
2. 统一大小写和空白字符。
3. 从已保存的错误样本中提取公共稳定片段。
4. 拒绝过短或明显过于通用的匹配片段。
5. 后续只对匹配该规则的 `PI_AI_ERROR` 进行重分类。

按钮保存的是后续请求使用的规则，不会自动重新执行已经关闭的回合。

## 安全边界

以下错误不会因为普通消息匹配而被自动重试：

- 身份验证失败。
- 配额或余额不足。
- 无效请求。
- 主动取消。
- 没有匹配启用规则的普通 `PI_AI_ERROR`。

不要把所有 `PI_AI_ERROR` 都加入重试列表，也不要在不了解 provider 行为的情况下启用无限重试。重试请求可能产生额外的服务费用。

## 开发与检查

在仓库目录中执行：

```sh
pnpm install
pnpm run check
pnpm run bundle
```

`pnpm run check` 会运行分类器和流处理的聚焦测试，并检查 Host、Client 入口的 JavaScript 语法。

## GitHub 仓库

项目地址：<https://github.com/leolee9086/dsh-better-retry>

仓库 topics 包含：

- `dsh-plugin`
- `deepseek-harness`
- `cordis`
- `retry`
- `exponential-backoff`

## 许可证

MIT
