import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { createExpense, listExpenses } from '../../lib/tauriClient';

export default component$(() => {
  const items = useSignal<any[]>([]);
  const form = useSignal({ label: '', category: '', booking_date: '', amount_ht_cents: 0, vat_rate_ppm: 200000, paid_at: '' });
  const errors = useSignal<{ booking_date?: string; label?: string; amount_ht_cents?: string } | null>(null);

  useVisibleTask$(async () => {
    items.value = (await listExpenses()) as any[];
  });

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Dépenses</h2>
      <div class="card p-4">
        <div class="grid grid-cols-6 gap-2 items-end">
          <label class="label">Libellé
            <input class={`input ${errors.value?.label ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.value.label} onInput$={(e:any)=>{form.value.label=e.target.value; errors.value={...errors.value, label: undefined};}}/>
            {errors.value?.label && <div class="text-red-600 text-xs">{errors.value.label}</div>}
          </label>
          <label class="label">Catégorie<input class="input" value={form.value.category} onInput$={(e:any)=>form.value.category=e.target.value}/></label>
          <label class="label">Date
            <input type="date" class={`input ${errors.value?.booking_date ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.value.booking_date} onInput$={(e:any)=>{form.value.booking_date=e.target.value; errors.value={...errors.value, booking_date: undefined};}}/>
            {errors.value?.booking_date && <div class="text-red-600 text-xs">{errors.value.booking_date}</div>}
          </label>
          <label class="label">HT (cents)
            <input type="number" class={`input ${errors.value?.amount_ht_cents ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.value.amount_ht_cents} onInput$={(e:any)=>{form.value.amount_ht_cents=Number(e.target.value); errors.value={...errors.value, amount_ht_cents: undefined};}}/>
            {errors.value?.amount_ht_cents && <div class="text-red-600 text-xs">{errors.value.amount_ht_cents}</div>}
          </label>
          <label class="label">TVA (ppm)<input type="number" class="input" value={form.value.vat_rate_ppm} onInput$={(e:any)=>form.value.vat_rate_ppm=Number(e.target.value)}/></label>
          <label class="label">Payé le<input type="date" class="input" value={form.value.paid_at} onInput$={(e:any)=>form.value.paid_at=e.target.value}/></label>
        </div>
        <div class="mt-3">
          <button class="btn" onClick$={async ()=>{
            errors.value = {};
            if (!form.value.booking_date) { errors.value = { ...errors.value, booking_date: 'Date requise' }; }
            if (!form.value.label) { errors.value = { ...errors.value, label: 'Libellé requis' }; }
            if (form.value.amount_ht_cents <= 0) { errors.value = { ...errors.value, amount_ht_cents: 'Montant > 0' }; }
            if (errors.value && Object.values(errors.value).some(Boolean)) return;
            const dto = { ...form.value, paid_at: form.value.paid_at || undefined };
            await createExpense(dto);
            items.value = (await listExpenses()) as any[];
            form.value = { label: '', category: '', booking_date: '', amount_ht_cents: 0, vat_rate_ppm: 200000, paid_at: '' };
          }}>+ Nouvelle dépense</button>
        </div>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-slate-500">
            <th class="py-2">Date</th><th>Libellé</th><th>Catégorie</th><th>HT</th><th>TVA</th><th>TTC</th><th>Payé le</th>
          </tr>
        </thead>
        <tbody>
          {items.value.map((i:any)=> (
            <tr class="border-t">
              <td class="py-2">{i.booking_date}</td>
              <td>{i.label}</td>
              <td>{i.category}</td>
              <td>{(i.amount_ht/100).toFixed(2)}€</td>
              <td>{(i.amount_tva/100).toFixed(2)}€</td>
              <td>{(i.amount_ttc/100).toFixed(2)}€</td>
              <td>{i.paid_at || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
