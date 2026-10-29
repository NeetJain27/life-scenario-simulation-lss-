import { supabase } from './supabase'

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Please sign in to save and view your financial data.')
  return data.user.id
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,title,category,amount,transaction_type,payment_method,transaction_date,import_source')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveTransaction(transaction) {
  const user_id = await requireUserId()
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id,
      title: transaction.title.trim(),
      category: transaction.category.trim(),
      amount: Number(transaction.amount),
      transaction_type: transaction.type,
      payment_method: transaction.method,
      transaction_date: transaction.date,
      import_source: 'manual',
    })
    .select('id,title,category,amount,transaction_type,payment_method,transaction_date')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getBudgets(month) {
  const { data, error } = await supabase
    .from('budgets')
    .select('category,amount')
    .eq('month', `${month}-01`)
    .order('category')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveBudget({ category, month, amount }) {
  const user_id = await requireUserId()
  const { error } = await supabase
    .from('budgets')
    .upsert({
      user_id,
      category: category.trim(),
      month: `${month}-01`,
      amount: Number(amount),
    }, { onConflict: 'user_id,category,month' })
  if (error) throw new Error(error.message)
}
