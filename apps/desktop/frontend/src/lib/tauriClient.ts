import { invoke } from '@tauri-apps/api/core';

export type MonthId = { year: number; month: number };

export async function getDashboard(year: number, month: number) {
  return invoke('cmd_dashboard', { month: year, m: month });
}

export async function listInvoices(year?: number, month?: number) {
  return invoke('cmd_list_invoices', { month: year, m: month });
}

export async function createInvoice(input: any) {
  return invoke('cmd_create_invoice', { dto: input });
}

export async function createInvoiceSimple(input: any) {
  return invoke('cmd_create_invoice_simple', { dto: input });
}

export async function listExpenses(year?: number, month?: number) {
  return invoke('cmd_list_expenses', { month: year, m: month });
}

export async function createExpense(input: any) {
  return invoke('cmd_create_expense', { dto: input });
}

export async function prepareVat(year: number, month: number) {
  return invoke('cmd_prepare_vat', { y: year, m: month });
}

export async function prepareUrssaf(year: number, month: number) {
  return invoke('cmd_prepare_urssaf', { y: year, m: month });
}

export async function getSettings() {
  return invoke('cmd_get_settings');
}

export async function saveSettings(s: any) {
  return invoke('cmd_save_settings', { s });
}

export async function monthRecap(year: number, month: number) {
  return invoke('cmd_month_recap', { y: year, m: month });
}

export async function closeMonth(year: number, month: number) {
  return invoke('cmd_close_month', { y: year, m: month });
}

export async function monthStatus(year: number, month: number) {
  return invoke('cmd_month_status', { y: year, m: month });
}

export async function forecast(year: number, month: number, horizon: number) {
  return invoke('cmd_forecast', { y: year, m: month, horizon });
}
