import { supabase } from './supabaseClient'

/* ---------------- Categories ---------------- */

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createCategory(name) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameCategory(id, name) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

/* ---------------- Components ---------------- */

export async function fetchComponents() {
  const { data, error } = await supabase
    .from('components')
    .select('*, category:categories(id, name)')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createComponent(payload) {
  const { data, error } = await supabase
    .from('components')
    .insert(payload)
    .select('*, category:categories(id, name)')
    .single()
  if (error) throw error
  return data
}

export async function updateComponentQuantity(id, quantity) {
  const { data, error } = await supabase
    .from('components')
    .update({ quantity })
    .eq('id', id)
    .select('*, category:categories(id, name)')
    .single()
  if (error) throw error
  return data
}

export async function updateComponent(id, payload) {
  const { data, error } = await supabase
    .from('components')
    .update(payload)
    .eq('id', id)
    .select('*, category:categories(id, name)')
    .single()
  if (error) throw error
  return data
}

export async function deleteComponent(id) {
  const { error } = await supabase.from('components').delete().eq('id', id)
  if (error) throw error
}

/* ---------------- Stock transactions ---------------- */

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('stock_transactions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createTransaction(payload) {
  const { data, error } = await supabase
    .from('stock_transactions')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

/* ---------------- Machines ---------------- */

export async function fetchMachines() {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createMachine(payload) {
  const { data, error } = await supabase
    .from('machines')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMachine(id, payload) {
  const { data, error } = await supabase
    .from('machines')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMachine(id) {
  const { error } = await supabase.from('machines').delete().eq('id', id)
  if (error) throw error
}

/* ---------------- Machine components (bill of materials) ---------------- */

export async function fetchAllMachineComponents() {
  const { data, error } = await supabase
    .from('machine_components')
    .select('*, component:components(id, name, quantity, unit, part_no)')
  if (error) throw error
  return data
}

export async function addMachineComponent(payload) {
  const { data, error } = await supabase
    .from('machine_components')
    .insert(payload)
    .select('*, component:components(id, name, quantity, unit, part_no)')
    .single()
  if (error) throw error
  return data
}

export async function updateMachineComponentQty(id, quantity_required) {
  const { data, error } = await supabase
    .from('machine_components')
    .update({ quantity_required })
    .eq('id', id)
    .select('*, component:components(id, name, quantity, unit, part_no)')
    .single()
  if (error) throw error
  return data
}

export async function removeMachineComponent(id) {
  const { error } = await supabase.from('machine_components').delete().eq('id', id)
  if (error) throw error
}
