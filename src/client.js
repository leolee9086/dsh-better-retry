import React from 'react'

export const inject = ['slots', 'locale', 'remote']
const NS = 'dsh-better-retry'
const zh = { title: '本轮运行失败', add: '纳入自动重试', added: '已纳入自动重试', saving: '正在保存…', error: '保存失败' }
const en = { title: 'Run failed', add: 'Enable automatic retry', added: 'Automatic retry enabled', saving: 'Saving…', error: 'Save failed' }

/** Browser renderer replacing the built-in terminal error row at a lower priority. */
function BetterTurnError({ node, remote, locale }) {
  const [state, setState] = React.useState('idle')
  const copy = locale().startsWith('zh') ? zh : en
  const add = async () => {
    setState('saving')
    try {
      const response = await remote.settings.describe()
      if (!response.ok) throw new Error(response.error.message)
      const view = response.value.namespaces.find(item => item.ns === NS)
      const current = Array.isArray(view?.value?.rules) ? view.value.rules : []
      if (!current.includes(node.message)) {
        const update = await remote.settings.update(NS, { rules: [...current, node.message] }, view?.revision)
        if (!update.ok) throw new Error(update.error.message)
      }
      setState('added')
    } catch (_error) {
      setState('error')
    }
  }
  return React.createElement('div', { className: 'dsh-better-retry-row', role: 'status' },
    React.createElement('span', { className: 'dsh-better-retry-title' }, copy.title),
    React.createElement('span', { className: 'dsh-better-retry-message' }, node.message),
    node.code ? React.createElement('code', null, node.code) : null,
    React.createElement('button', {
      type: 'button', disabled: state === 'saving' || state === 'added', onClick: add,
      title: copy.add, className: 'dsh-better-retry-button',
    }, state === 'saving' ? copy.saving : state === 'added' ? copy.added : state === 'error' ? copy.error : copy.add),
  )
}

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-better-retry: locale')
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node', key: 'turn-error', priority: -1, locale: 'chat',
    inject: () => ({ remote: ctx.remote, locale: () => ctx.locale.getLocale().id }),
  }, props => React.createElement(BetterTurnError, props)))
}
