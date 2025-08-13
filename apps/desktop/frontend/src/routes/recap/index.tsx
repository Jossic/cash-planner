import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Select } from '../../components/Select';
import { invoke } from '@tauri-apps/api/core';
import { useContext } from '@builder.io/qwik';
import { MonthContext } from '../../stores/month';
import { monthStatus } from '../../lib/tauriClient';

export default component$(() => {
  const monthState = useContext(MonthContext);
  const recap = useSignal<any | null>(null);
  const status = useSignal<any | null>(null);

  useVisibleTask$(async () => {
    recap.value = await invoke('cmd_month_recap', { y: monthState.value.year, m: monthState.value.month });
    status.value = await monthStatus(monthState.value.year, monthState.value.month);
  });

  const months = Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1).padStart(2, '0'), value: i + 1 }));
  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - 3 + i)).map(y => ({ label: String(y), value: y }));

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Récap mensuel</h2>
      <div class="flex gap-3 items-end">
        <Select label="Année" value={monthState.value.year} options={years} onChange$={async (v)=>{monthState.value={...monthState.value, year:Number(v)}; recap.value = await invoke('cmd_month_recap', { y: monthState.value.year, m: monthState.value.month }); status.value = await monthStatus(monthState.value.year, monthState.value.month);}} />
        <Select label="Mois" value={monthState.value.month} options={months} onChange$={async (v)=>{monthState.value={...monthState.value, month:Number(v)}; recap.value = await invoke('cmd_month_recap', { y: monthState.value.year, m: monthState.value.month }); status.value = await monthStatus(monthState.value.year, monthState.value.month);}} />
        {status.value?.closed_at ? <span class="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Clôturé</span> : <span class="px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">Ouvert</span>}
      </div>
      {recap.value && (
        <div class="grid md:grid-cols-2 gap-4">
          <div class="card p-4 space-y-2">
            <div class="font-semibold">Encaissements (M)</div>
            <div>HT: {(recap.value.receipts_ht_cents/100).toFixed(2)}€</div>
            <div>TVA: {(recap.value.receipts_tva_cents/100).toFixed(2)}€</div>
            <div class="font-medium">TTC: {(recap.value.receipts_ttc_cents/100).toFixed(2)}€</div>
          </div>
          <div class="card p-4 space-y-2">
            <div class="font-semibold">Dépenses (M)</div>
            <div>TTC: {(recap.value.expenses_ttc_cents/100).toFixed(2)}€</div>
          </div>
          <div class="card p-4 space-y-2">
            <div class="font-semibold">TVA / URSSAF</div>
            <div>TVA due: {(recap.value.vat_due_cents/100).toFixed(2)}€</div>
            <div>URSSAF due: {(recap.value.urssaf_due_cents/100).toFixed(2)}€</div>
          </div>
          <div class="card p-4 space-y-2">
            <div class="font-semibold">Net et après provisions</div>
            <div>Net du mois: {(recap.value.net_from_month_cents/100).toFixed(2)}€</div>
            <div class="font-medium">Reste après provisions: {(recap.value.after_provisions_cents/100).toFixed(2)}€</div>
          </div>
        </div>
      )}
      <div class="text-sm text-slate-500">
        Utilise ces montants pour remplir ta TVA et URSSAF et vire sur tes comptes dédiés: TVA = TVA due, URSSAF = URSSAF due. Le reste (après provisions) représente ce qui reste en trésorerie pour salaire/autres.
      </div>
    </div>
  );
});
