import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { apply } from '../src/client.js'

test('registered error renderer displays nested error and retry action in both locales', async () => {
  let registration
  let dictionaries
  let saved
  const ctx = {
    effect: fn => fn(),
    locale: { register: (_ns, dicts) => { dictionaries = dicts; return () => {} } },
    remote: { settings: {
      describe: async () => ({ ok: true, value: { namespaces: [{ ns: 'dsh-better-retry', value: { rules: [] }, revision: 7 }] } }),
      update: async (...args) => { saved = args; return { ok: true } },
    } },
    slots: {
      inject: (_key, fn) => fn(),
      register: (options, component) => { registration = { options, component }; return () => {} },
    },
  }
  apply(ctx)
  assert.equal(registration.options.priority, -1)
  assert.equal(registration.options.locale, 'dsh-better-retry')
  const callbacks = registration.options.inject()
  for (const language of ['zh', 'en']) {
    const html = renderToStaticMarkup(React.createElement(registration.component, {
      node: { data: { message: 'upstream_error: Upstream request failed', code: 'PI_AI_ERROR' } },
      t: key => dictionaries[language][key], ...callbacks,
    }))
    assert.ok(html.includes(dictionaries[language].add))
    assert.ok(html.includes('upstream_error: Upstream request failed'))
    assert.ok(html.includes('PI_AI_ERROR'))
  }
  await callbacks.addRule('upstream_error: Upstream request failed')
  assert.deepEqual(saved, ['dsh-better-retry', { rules: ['upstream_error: Upstream request failed'] }, 7])
  ctx.remote.settings.update = async () => ({ ok: false, error: { message: 'write refused' } })
  await assert.rejects(callbacks.addRule('another error'), /write refused/)
})
