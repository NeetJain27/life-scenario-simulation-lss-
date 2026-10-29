import { supabase } from './supabase'
import { normalizePreferences } from '../logic/financialModel'

export async function getProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Please sign in to load your profile.')
  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,onboarding_completed,onboarding_answers')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data || { id: userData.user.id, onboarding_completed: false, onboarding_answers: {} }
}

export async function saveProfilePreferences(preferences) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Please sign in to save your preferences.')
  const answers = normalizePreferences(preferences)
  const { data, error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true, onboarding_answers: answers })
    .eq('id', userData.user.id)
    .select('id,display_name,onboarding_completed,onboarding_answers')
    .single()
  if (error) throw new Error(error.message)
  return data
}
