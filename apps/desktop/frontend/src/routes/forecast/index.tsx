import { component$, useSignal, useVisibleTask$, useContext } from '@builder.io/qwik';
import { Select } from '../../components/Select';
import { forecast, getSettings, saveSettings, monthStatus } from '../../lib/tauriClient';
import { MonthContext } from '../../stores/month';

export default component$(() => {
  const monthState = useContext(MonthContext);
  const horizon = useSignal(6);
  const data = useSignal<any | null>(null);
  const s = useSignal<any>({ forecast_ht_cents: 0, forecast_expenses_ttc_cents: 0, forecast_expense_vat_rate_ppm: 200000 });
  const status = useSignal<any | null>(null);

  useVisibleTask$(async () => {
    s.value = (await getSettings()) as any;
    data.value = await forecast(monthState.value.year, monthState.value.month, horizon.value);
    status.value = await monthStatus(monthState.value.year, monthState.value.month);
  });

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Prévision de trésorerie</h2>
      <div class="flex gap-3 items-end">
        <Select label="Année" value={monthState.value.year} options={Array.from({length:6},(_,i)=>({label:String(new Date().getFullYear()-3+i), value:new Date().getFullYear()-3+i}))} onChange$={async (v)=>{monthState.value={...monthState.value, year:Number(v)}; data.value = await forecast(monthState.value.year, monthState.value.month, horizon.value); status.value = await monthStatus(monthState.value.year, monthState.value.month);}} />
        <Select label="Mois" value={monthState.value.month} options={Array.from({length:12},(_,i)=>({label:String(i+1).padStart(2,'0'), value:i+1}))} onChange$={async (v)=>{monthState.value={...monthState.value, month:Number(v)}; data.value = await forecast(monthState.value.year, monthState.value.month, horizon.value); status.value = await monthStatus(monthState.value.year, monthState.value.month);}} />
        <Select label="Horizon" value={horizon.value} options={[3,6,12].map(n=>({label:String(n)+' mois', value:n}))} onChange$={async (v)=>{horizon.value=Number(v); data.value = await forecast(monthState.value.year, monthState.value.month, horizon.value);}} />
        {status.value?.closed_at ? <span class="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Clôturé</span> : <span class="px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">Ouvert</span>}
      </div>
      <div class="card p-4 grid md:grid-cols-4 gap-3">
        <label class="label">CA estimé HT (cents)
          <input class="input" type="number" value={s.value.forecast_ht_cents} onInput$={(e:any)=>s.value.forecast_ht_cents=Number(e.target.value)} />
        </label>
        <label class="label">Dépenses estimées TTC (cents)
          <input class="input" type="number" value={s.value.forecast_expenses_ttc_cents} onInput$={(e:any)=>s.value.forecast_expenses_ttc_cents=Number(e.target.value)} />
        </label>
        <label class="label">TVA dépense (ppm)
          <input class="input" type="number" value={s.value.forecast_expense_vat_rate_ppm} onInput$={(e:any)=>s.value.forecast_expense_vat_rate_ppm=Number(e.target.value)} />
        </label>
        <div class="flex items-end"><button class="btn" onClick$={async ()=>{ await saveSettings(s.value); data.value = await forecast(monthState.value.year, monthState.value.month, horizon.value); }}>Enregistrer</button></div>
      </div>
      {data.value && (
        <div class="overflow-auto">
          <table class="min-w-[720px] w-full text-sm">
            <thead>
              <tr class="text-left text-slate-500 border-b">
                <th class="py-2">Mois</th><th>HT</th><th>TVA due</th><th>URSSAF</th><th>Dép. TTC</th><th>Net</th><th>Après provisions</th>
              </tr>
            </thead>
            <tbody>
              {data.value.months.map((ln:any)=> (
                <tr class="border-t">
                  <td class="py-2">{ln.year}-{String(ln.month).padStart(2,'0')}</td>
                  <td>{(ln.ht_cents/100).toFixed(2)}€</td>
                  <td>{(ln.tva_due_cents/100).toFixed(2)}€</td>
                  <td>{(ln.urssaf_due_cents/100).toFixed(2)}€</td>
                  <td>{(ln.expenses_ttc_cents/100).toFixed(2)}€</td>
                  <td>{(ln.net_cents/100).toFixed(2)}€</td>
                  <td class="font-semibold">{(ln.after_provisions_cents/100).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
