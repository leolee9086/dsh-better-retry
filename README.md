# dsh-better-retry

`dsh-better-retry` is a DeepSeek Harness bundle that recognizes explicitly approved transient provider messages and routes them through the existing `@deepseek-ai/dsh-llm-retry` executor. Matching requests use the provider's normal retry policy and therefore receive bounded exponential backoff, jitter, cancellation, durable retry events, and the configured retry limit.

The built-in rules recognize `Too many pending requests, please retry later` and `Our servers are currently overloaded. Please try again later`; request ids and similar volatile fields are ignored. The Web error row adds **纳入自动重试** / **Enable automatic retry**. The button stores the selected message in the `dsh-better-retry` settings namespace; message normalization removes request and trace identifiers, and future matching uses a stable common fragment rather than the full volatile message.

## Install from GitHub

The package is an installable DSH bundle. From a machine with the `dsh` CLI:

```sh
dsh plugin --profile web add github:leolee9086/dsh-better-retry
```

Git installs run the package's source directly, so this repository intentionally ships plain JavaScript and does not require a build step. Pin a commit for reproducible deployments:

```sh
dsh plugin --profile web add github:leolee9086/dsh-better-retry#COMMIT_SHA
```

Restart or reload the `web` profile after installation. Verify the layer with:

```sh
dsh --profile web --dump-config
```

The profile already needs the standard `@deepseek-ai/dsh-llm-retry` row. The bundle adds its own classifier and settings namespace; it does not replace the core retry executor.

## Behavior

Only `PI_AI_ERROR` messages matching an enabled rule are reclassified as `RATE_LIMIT`. Other protocol, authentication, quota, invalid-request, and cancellation failures stay terminal. The retry policy remains provider-owned, so configure its `maxRetries`, `backoff.initialDelayMs`, `backoff.maxDelayMs`, and `backoff.jitterRatio` in the provider profile when needed.

A button click affects subsequent requests. It does not silently revive an already closed turn. The settings section is stored by the Harness settings provider under the active DSH home and can be inspected or edited through the normal settings document.

## Development

```sh
node --test test/*.test.js
node --check src/index.js
node --check src/client.js
```

## License

MIT
