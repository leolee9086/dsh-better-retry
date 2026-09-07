import assert from 'node:assert/strict'
import test from 'node:test'
import { createClassifier } from '../src/classifier.js'

async function collect(source) {
  const result = []
  for await (const item of source) result.push(item)
  return result
}

async function* classifyStream(chunks, classifier) {
  for (const chunk of chunks) {
    if (chunk.type === 'finish' && chunk.reason?.kind === 'error'
      && chunk.reason.failure.code === 'PI_AI_ERROR'
      && classifier.classify(chunk.reason.failure.message)) {
      yield { ...chunk, reason: { ...chunk.reason, failure: { ...chunk.reason.failure, code: 'RATE_LIMIT' } } }
    } else yield chunk
  }
}

test('classifies approved provider failures for the existing retry executor', async () => {
  const classifier = createClassifier()
  const chunks = await collect(classifyStream([
    { type: 'finish', reason: { kind: 'error', failure: { code: 'PI_AI_ERROR', message: 'server_error: Our servers are currently overloaded. Please try again later.' } } },
    { type: 'finish', reason: { kind: 'error', failure: { code: 'PI_AI_ERROR', message: 'authentication failed' } } },
  ], classifier))
  assert.equal(chunks[0].reason.failure.code, 'RATE_LIMIT')
  assert.equal(chunks[1].reason.failure.code, 'PI_AI_ERROR')
})
