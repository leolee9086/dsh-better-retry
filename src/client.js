import React from 'react'

export const inject = ['slots', 'locale', 'remote', 'remote.settings']
const NS = 'dsh-better-retry'
const zh = { title: '本轮运行失败', add: '纳入自动重试', added: '已纳入自动重试', saving: '正在保存…', error: '保存失败', unavailable: '重试设置尚未加载' }
const en = { title: 'Run failed', add: 'Enable automatic retry', added: 'Automatic retry enabled', saving: 'Saving…', error: 'Save failed', unavailable: 'Retry settings are not loaded' }

/** The slot supplies a Chat node envelope; error fields belong to node.data. */
function BetterTurnError({ node, t, addRule }) {
  const data = node.data
  const [state, setState] = React.useState('idle')
  const [error, setError] = React.useState('')
  const add = async () => {
    setState('saving')
    setError('')
    try {
      await addRule(data.message)
      setState('added')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
      setState('error')
    }
  }
  return React.createElement('div', { role: 'status', style: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', overflowWrap: 'anywhere' } },
    React.createElement('span', { style: { color: 'var(--dsw-alias-state-error-primary)', fontWeight: 600 } }, t('title')),
    React.createElement('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, data.message),
    data.code ? React.createElement('code', null, data.code) : null,
    React.createElement('button', {
      type: 'button', disabled: state === 'saving' || state === 'added', onClick: add,
      title: error || t('add'),
      style: { flexShrink: 0, cursor: 'pointer' },
    }, t(state === 'saving' ? 'saving' : state === 'added' ? 'added' : state === 'error' ? 'error' : 'add')),
    error ? React.createElement('span', { role: 'alert' }, error) : null,
  )
}

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-better-retry: locale')
  // Pass callbacks, not the Remote service, to presentation components.
  const addRule = async message => {
    const response = await ctx.remote.settings.describe()
    if (!response.ok) throw new Error(response.error.message)
    const view = response.value.namespaces.find(item => item.ns === NS)
    if (!view) throw new Error(ctx.locale.bind(NS)('unavailable'))
    const current = Array.isArray(view.value?.rules) ? view.value.rules : []
    if (current.includes(message)) return
    const update = await ctx.remote.settings.update(NS, { rules: [...current, message] }, view.revision)
    if (!update.ok) throw new Error(update.error.message)
  }
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node', key: 'turn-error', priority: -1, locale: NS,
    inject: () => ({ addRule }),
  }, BetterTurnError))
}
