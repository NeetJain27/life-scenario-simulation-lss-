const monthKey = (date) => String(date || '').slice(0, 7)

export function buildSpendingAnalysis(transactions = [], budgets = {}, currentMonth = new Date().toISOString().slice(0, 7)) {
  const [year, month] = currentMonth.split('-').map(Number)
  const previousDate = new Date(Date.UTC(year, month - 2, 1))
  const previousMonth = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, '0')}`
  const forMonth = (key) => transactions.filter((row) => monthKey(row.date) === key)
  const summarize = (rows) => rows.reduce((result, row) => {
    const kind = row.type === 'Income' ? 'income' : 'expense'
    result[kind] += Number(row.amount || 0)
    if (kind === 'expense') result.categories[row.category] = (result.categories[row.category] || 0) + Number(row.amount || 0)
    return result
  }, { income: 0, expense: 0, categories: {} })
  const current = summarize(forMonth(currentMonth))
  const previous = summarize(forMonth(previousMonth))
  const changes = Object.keys({ ...previous.categories, ...current.categories }).map((category) => {
    const before = previous.categories[category] || 0
    const now = current.categories[category] || 0
    return { category, current: now, previous: before, change: now - before, changePercent: before ? Math.round((now - before) / before * 100) : null }
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  const alerts = []
  for (const [category, limitValue] of Object.entries(budgets)) {
    const limit = Number(limitValue || 0)
    const spent = current.categories[category] || 0
    if (!limit) continue
    const ratio = spent / limit
    if (ratio >= 1) alerts.push({ level: 'over', category, spent, limit, text: `${category} is over budget by ₹${Math.round(spent - limit).toLocaleString('en-IN')}.` })
    else if (ratio >= 0.8) alerts.push({ level: 'near', category, spent, limit, text: `${category} has used ${Math.round(ratio * 100)}% of its budget.` })
    else if (spent > 0) alerts.push({ level: 'good', category, spent, limit, text: `${category} is within budget so far.` })
  }
  alerts.sort((a, b) => ({ over: 0, near: 1, good: 2 }[a.level] - { over: 0, near: 1, good: 2 }[b.level]))

  return { currentMonth, previousMonth, current, previous, changes: changes.slice(0, 4), alerts: alerts.slice(0, 4) }
}
