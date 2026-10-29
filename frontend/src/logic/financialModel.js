const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0))

export const DEFAULT_PREFERENCES = {
  primary_goal: 'understand_spending',
  goal_title: '',
  goal_amount: '',
  goal_date: '',
  monthly_income: '',
  priorities: {
    saving: 5,
    spending_control: 5,
    budget_consistency: 5,
    goal_progress: 5,
    family_visibility: 2,
  },
}

export function normalizePreferences(value = {}) {
  const priorities = value?.priorities || {}
  return {
    ...DEFAULT_PREFERENCES,
    ...value,
    priorities: Object.fromEntries(Object.entries(DEFAULT_PREFERENCES.priorities).map(([key, fallback]) => [
      key,
      Math.round(Math.min(10, Math.max(0, Number(priorities[key] ?? fallback)))),
    ])),
  }
}

const metricScore = (value) => Math.round(clamp(value) * 100)

export function buildFinancialModel(transactions = [], budgets = {}, rawPreferences = {}) {
  const preferences = normalizePreferences(rawPreferences)
  const expenses = transactions.filter((row) => row.type === 'Expense')
  const income = transactions.filter((row) => row.type === 'Income')
  const expenseTotal = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const incomeTotal = income.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const statedIncome = Number(preferences.monthly_income || 0)
  const incomeBase = incomeTotal || statedIncome
  const savingsRate = incomeBase > 0 ? clamp((incomeBase - expenseTotal) / incomeBase) : 0

  const budgetEntries = Object.entries(budgets).map(([category, limit]) => {
    const spent = expenses
      .filter((row) => String(row.category).toLowerCase() === category.toLowerCase())
      .reduce((sum, row) => sum + Number(row.amount || 0), 0)
    return { category, limit: Number(limit || 0), spent, ratio: Number(limit) > 0 ? spent / Number(limit) : 0 }
  })
  const budgetScore = budgetEntries.length
    ? budgetEntries.reduce((sum, row) => sum + clamp(1 - Math.max(0, row.ratio - 1)), 0) / budgetEntries.length
    : 0.5

  const discretionaryCategories = new Set(['dining', 'shopping', 'entertainment', 'other', 'subscriptions'])
  const discretionarySpend = expenses
    .filter((row) => discretionaryCategories.has(String(row.category).toLowerCase()))
    .reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const discretionaryShare = expenseTotal > 0 ? discretionarySpend / expenseTotal : 0
  const spendingControlScore = 1 - clamp(discretionaryShare / 0.45)
  const goalAmount = Number(preferences.goal_amount || 0)
  const goalProgressScore = goalAmount > 0 && incomeBase > 0
    ? clamp((incomeBase - expenseTotal) / goalAmount)
    : savingsRate

  const priorities = preferences.priorities
  const weighted = [
    [savingsRate, priorities.saving],
    [spendingControlScore, priorities.spending_control],
    [budgetScore, priorities.budget_consistency],
    [goalProgressScore, priorities.goal_progress],
  ]
  const weightTotal = weighted.reduce((sum, [, weight]) => sum + weight, 0) || 1
  const score = Math.round(weighted.reduce((sum, [metric, weight]) => sum + metric * weight, 0) / weightTotal * 100)

  const focusMap = {
    saving: ['saving money', priorities.saving],
    spending_control: ['cutting unnecessary spending', priorities.spending_control],
    budget_consistency: ['staying within budgets', priorities.budget_consistency],
    goal_progress: ['moving toward your goal', priorities.goal_progress],
    family_visibility: ['family visibility', priorities.family_visibility],
  }
  const focus = Object.entries(focusMap).sort(([, a], [, b]) => b[1] - a[1])[0]?.[1]?.[0] || 'understanding your spending'
  const primaryGoal = {
    understand_spending: 'understanding your spending patterns',
    build_savings: 'building savings consistently',
    reach_goal: preferences.goal_title ? `reaching ${preferences.goal_title}` : 'reaching a personal goal',
    pay_down_debt: 'reducing financial pressure',
    family_budget: 'making family spending visible',
  }[preferences.primary_goal] || 'understanding your spending patterns'

  const recommendations = []
  if (incomeBase === 0) recommendations.push('Add one income entry or your approximate monthly income to make savings scores more useful.')
  if (budgetEntries.some((row) => row.ratio > 1)) recommendations.push('One or more budgets are over pace. Review the largest overspend before adding new limits.')
  if (priorities.saving >= 7 && savingsRate < 0.2) recommendations.push('Your saving priority is high, but recorded surplus is below 20%. Start with one recurring discretionary expense.')
  if (priorities.spending_control >= 7 && discretionaryShare > 0.35) recommendations.push('Discretionary spending is a large share of recorded expenses. Track the merchants behind it for a clearer next step.')
  if (!recommendations.length) recommendations.push('Keep recording transactions for a few more weeks; the model becomes more reliable as your history grows.')

  return {
    score,
    focus,
    primaryGoal,
    headline: `Your plan is centered on ${primaryGoal}.`,
    summary: `The model is currently focusing on ${focus}. It uses ${transactions.length} recorded transaction${transactions.length === 1 ? '' : 's'} and your priority weights.`,
    metrics: {
      savings: metricScore(savingsRate),
      budget_control: metricScore(budgetScore),
      spending_control: metricScore(spendingControlScore),
      goal_progress: metricScore(goalProgressScore),
      discretionary_share: Math.round(discretionaryShare * 100),
    },
    recommendations,
  }
}
