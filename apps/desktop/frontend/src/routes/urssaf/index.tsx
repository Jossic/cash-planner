import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { prepareUrssaf, monthStatus } from '../../lib/tauriClient';
import { Select } from '../../components/Select';
import { useContext } from '@builder.io/qwik';
import { MonthContext } from '../../stores/month';

export default component$(() => {
  const monthState = useContext(MonthContext);
  const report = useSignal<any | null>(null);
  const status = useSignal<any | null>(null);

  useVisibleTask$(async () => {
    report.value = await prepareUrssaf(monthState.value.year, monthState.value.month);
    status.value = await monthStatus(monthState.value.year, monthState.value.month);
  });

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Assistant URSSAF</h2>
      <div class="flex gap-3 items-end">
        <Select label="Année" value={monthState.value.year} options={Array.from({length:6},(_,i)=>({label:String(new Date().getFullYear()-3+i), value:new Date().getFullYear()-3+i}))} onChange$={async (v)=>{monthState.value={...monthState.value, year:Number(v)}; report.value = await prepareUrssaf(monthState.value.year, monthState.value.month); status.value = await monthStatus(monthState.value.year, monthState.value.month);}} />
        <Select label="Mois" value={monthState.value.month} options={Array.from({length:12},(_,i)=>({label:String(i+1).padStart(2,'0'), value:i+1}))} onChange$={async (v)=>{monthState.value={...monthState.value, month:Number(v)}; report.value = await prepareUrssaf(monthState.value.year, monthState.value.month); status.value = await monthStatus(monthState.value.year, monthState.value.month);}} />
        {status.value?.closed_at ? <span class="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Clôturé</span> : <span class="px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">Ouvert</span>}
      </div>
      {report.value && (
        <div class="card p-4 space-y-2">
          <div>CA encaissé: {(report.value.ca_encaisse_cents/100).toFixed(2)}€</div>
          <div>Taux: {(report.value.rate_ppm/10000).toFixed(2)}%</div>
          <div class="font-semibold">URSSAF à payer: {(report.value.due_cents/100).toFixed(2)}€</div>
        </div>
      )}
    </div>
  );
});
