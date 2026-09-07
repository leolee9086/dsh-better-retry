const DEFAULT_RULES = [
  'too many pending requests, please retry later',
  'our servers are currently overloaded. please try again later',
]

const VARIABLE_PATTERNS = [
  /\brequest id\s*:\s*[^)\s]+/gi,
  /\b(?:trace|correlation|request)[-_ ]?id\s*[:=]\s*[^\s,)]+/gi,
  /\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi,
]

/** Remove provider labels and per-request identifiers while keeping diagnostics. */
export function normalizeMessage(message) {
  let value = String(message ?? '').replace(/^(?:unknown|server_error):\s*/i, '').trim()
  for (const pattern of VARIABLE_PATTERNS) value = value.replace(pattern, '')
  return value.replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').replace(/[.。]+$/, '').trim().toLowerCase()
}

/** Find the stable words shared by all selected samples. */
export function commonStableFragment(messages) {
  const normalized = messages.map(normalizeMessage).filter(Boolean)
  if (normalized.length === 0) return ''
  const seed = normalized[0]
  const candidates = seed.split(/\s+/).filter(word => word.length >= 3)
  const shared = candidates.filter(word => normalized.every(value => value.includes(word)))
  if (shared.length === 0) return seed
  return shared.join(' ')
}

/** Require a useful phrase before enabling a user-created message rule. */
export function matchesRule(message, rule) {
  const value = normalizeMessage(message)
  const needle = normalizeMessage(rule)
  return needle.length >= 24 && value.includes(needle)
}

export function createClassifier(initialRules = DEFAULT_RULES) {
  const rules = [...new Set(initialRules.map(normalizeMessage).filter(rule => rule.length >= 24))]
  return {
    rules: () => [...rules],
    classify(message) { return rules.some(rule => matchesRule(message, rule)) },
    add(messages) {
      const rule = commonStableFragment(messages)
      if (rule.length >= 24 && !rules.includes(rule)) rules.push(rule)
      return rule
    },
  }
}

export { DEFAULT_RULES }
