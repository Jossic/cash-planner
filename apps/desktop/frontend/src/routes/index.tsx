import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { getDashboard, monthRecap, monthStatus, closeMonth } from '../lib/tauriClient';
import { Select } from '../components/Select';
import { useContext } from '@builder.io/qwik';
import { MonthContext } from '../stores/month';

export default component$(() => {
  const monthState = useContext(MonthContext);
  const summary = useSignal<any | null>(null);
  const recap = useSignal<any | null>(null);
  const status = useSignal<any | null>(null);

  useVisibleTask$(async () => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    summary.value = await getDashboard(monthState.value.year, monthState.value.month);
    recap.value = await monthRecap(monthState.value.year, monthState.value.month);
    status.value = await monthStatus(monthState.value.year, monthState.value.month);
  });

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Dashboard – {monthState.value.year}-{String(monthState.value.month).padStart(2, '0')}</h2>
        <div class="flex items-center gap-2 text-sm">
          {status.value?.closed_at ? (
            <span class="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Clôturé</span>
          ) : (
            <>
              <span class="px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">Ouvert</span>
              <button class="btn !px-2 !py-1" onClick$={async ()=>{ await closeMonth(monthState.value.year, monthState.value.month); summary.value = await getDashboard(monthState.value.year, monthState.value.month); recap.value = await monthRecap(monthState.value.year, monthState.value.month); status.value = await monthStatus(monthState.value.year, monthState.value.month); }}>Clore</button>
            </>
          )}
        </div>
      </div>
      <div class="flex gap-3 items-end">
        <Select label="Année" value={monthState.value.year} options={Array.from({length:6},(_,i)=>({label:String(new Date().getFullYear()-3+i), value:new Date().getFullYear()-3+i}))} onChange$={(v)=>{monthState.value={...monthState.value, year:Number(v)}; load();}} />
        <Select label="Mois" value={monthState.value.month} options={Array.from({length:12},(_,i)=>({label:String(i+1).padStart(2,'0'), value:i+1}))} onChange$={(v)=>{monthState.value={...monthState.value, month:Number(v)}; load();}} />
      </div>
      {summary.value && (
        <div class="grid grid-cols-2 gap-4">
          <div class="card p-4">
            <div class="text-slate-500">Encaissements HT</div>
            <div class="text-2xl font-semibold">{(summary.value.encaissements_ht_cents/100).toFixed(2)}€</div>
          </div>
          <div class="card p-4">
            <div class="text-slate-500">TVA due</div>
            <div class="text-2xl font-semibold">{(summary.value.tva_due_cents/100).toFixed(2)}€</div>
          </div>
          <div class="card p-4">
            <div class="text-slate-500">URSSAF due</div>
            <div class="text-2xl font-semibold">{(summary.value.urssaf_due_cents/100).toFixed(2)}€</div>
          </div>
          <div class="card p-4">
            <div class="text-slate-500">Disponible</div>
            <div class="text-2xl font-semibold">{(summary.value.disponible_cents/100).toFixed(2)}€</div>
          </div>
        </div>
      )}
      {recap.value && (
        <div class="card p-3 border-dashed">
          <div class="text-sm">À virer: TVA {(recap.value.vat_due_cents/100).toFixed(2)}€ + URSSAF {(recap.value.urssaf_due_cents/100).toFixed(2)}€ = <span class="font-semibold">{((recap.value.vat_due_cents+recap.value.urssaf_due_cents)/100).toFixed(2)}€</span>. Reste après provisions: <span class="font-semibold">{(recap.value.after_provisions_cents/100).toFixed(2)}€</span>.</div>
        </div>
      )}
      <div class="flex gap-2">
        <button class="btn">Clore le mois</button>
        <button class="btn">Préparer TVA</button>
        <button class="btn">Préparer URSSAF</button>
      </div>
    </div>
  );
});
