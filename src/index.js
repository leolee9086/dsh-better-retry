import z from '@deepseek-ai/schemastery'
import { commonStableFragment, createClassifier, DEFAULT_RULES } from './classifier.js'

export const name = 'dsh-better-retry'
export const inject = ['llm', 'settings']

const settingsSchema = z.object({ rules: z.array(z.string()).default([]) })

function classifierForRules(rules) {
  const custom = rules.length > 0 ? [commonStableFragment(rules)] : []
  return createClassifier([...DEFAULT_RULES, ...custom])
}

/**
 * Classify selected provider failures and hand retry execution to dsh-llm-retry.
 * The settings provider owns the durable file; this plugin owns only the
 * classifier and its namespace.
 */
export function apply(ctx) {
  const scope = ctx.settings.register('dsh-better-retry', settingsSchema, { base: { rules: [] } })
  let classifier = classifierForRules(scope.get().rules)
  scope.watch(next => { classifier = classifierForRules(next.rules) })
  ctx.on('llm/stream', (_options, next) => rewriteStream(next(), () => classifier))
}

async function* rewriteStream(source, getClassifier) {
  for await (const chunk of source) {
    if (chunk?.type === 'finish' && chunk.reason?.kind === 'error') {
      const failure = chunk.reason.failure
      if (failure?.code === 'PI_AI_ERROR' && getClassifier().classify(failure.message)) {
        yield { ...chunk, reason: { ...chunk.reason, failure: { ...failure, code: 'RATE_LIMIT' } } }
        continue
      }
    }
    yield chunk
  }
}
