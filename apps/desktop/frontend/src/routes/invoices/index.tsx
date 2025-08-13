import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { createInvoiceSimple, listInvoices } from '../../lib/tauriClient';

export default component$(() => {
  const items = useSignal<any[]>([]);
  const form = useSignal({
    service_date: '', paid_at: '', amount_ht_cents: '', amount_tva_cents: '', amount_ttc_cents: ''
  });
  const errors = useSignal<{ service_date?: string; amount_ht_cents?: string; amount_tva_cents?: string; amount_ttc_cents?: string } | null>(null);

  useVisibleTask$(async () => {
    items.value = (await listInvoices()) as any[];
  });

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Encaissements (Factures)</h2>
      <div class="card p-4">
        <div class="grid grid-cols-5 gap-2 items-end">
          <label class="label">Date facture
            <input type="date" class={`input ${errors.value?.service_date ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.value.service_date} onInput$={(e:any)=>{form.value.service_date=e.target.value; errors.value={...errors.value, service_date: undefined};}}/>
            {errors.value?.service_date && <div class="text-red-600 text-xs">{errors.value.service_date}</div>}
          </label>
          <label class="label">HT (cents)
            <input type="number" class={`input ${errors.value?.amount_ht_cents ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.value.amount_ht_cents} onInput$={(e:any)=>{form.value.amount_ht_cents=e.target.value; errors.value={...errors.value, amount_ht_cents: undefined};}}/>
            {errors.value?.amount_ht_cents && <div class="text-red-600 text-xs">{errors.value.amount_ht_cents}</div>}
          </label>
          <label class="label">TVA (cents)
            <input type="number" class={`input ${errors.value?.amount_tva_cents ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.value.amount_tva_cents} onInput$={(e:any)=>{form.value.amount_tva_cents=e.target.value; errors.value={...errors.value, amount_tva_cents: undefined};}}/>
            {errors.value?.amount_tva_cents && <div class="text-red-600 text-xs">{errors.value.amount_tva_cents}</div>}
          </label>
          <label class="label">TTC (cents)
            <input type="number" class={`input ${errors.value?.amount_ttc_cents ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.value.amount_ttc_cents} onInput$={(e:any)=>{form.value.amount_ttc_cents=e.target.value; errors.value={...errors.value, amount_ttc_cents: undefined};}}/>
            {errors.value?.amount_ttc_cents && <div class="text-red-600 text-xs">{errors.value.amount_ttc_cents}</div>}
          </label>
          <label class="label">Payé le<input type="date" class="input" value={form.value.paid_at} onInput$={(e:any)=>form.value.paid_at=e.target.value}/></label>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="btn" onClick$={async ()=>{
            errors.value = {};
            const ht = form.value.amount_ht_cents ? Number(form.value.amount_ht_cents) : undefined;
            const tva = form.value.amount_tva_cents ? Number(form.value.amount_tva_cents) : undefined;
            const ttc = form.value.amount_ttc_cents ? Number(form.value.amount_ttc_cents) : undefined;
            if (!form.value.service_date) { errors.value = { ...errors.value, service_date: 'Date facture requise' }; }
            if ([ht, tva, ttc].every(v=>v===undefined)) { errors.value = { ...errors.value, amount_ht_cents: 'Indique HT (ou 2 montants)', amount_ttc_cents: errors.value?.amount_ttc_cents, amount_tva_cents: errors.value?.amount_tva_cents }; }
            if ([ht, tva, ttc].some(v=>v!==undefined && (v as number) < 0)) {
              if (ht!==undefined && ht<0) errors.value = { ...errors.value, amount_ht_cents: '>= 0' };
              if (tva!==undefined && tva<0) errors.value = { ...errors.value, amount_tva_cents: '>= 0' };
              if (ttc!==undefined && ttc<0) errors.value = { ...errors.value, amount_ttc_cents: '>= 0' };
            }
            if (ht!==undefined && tva!==undefined && ttc!==undefined && ht + tva !== ttc) {
              errors.value = { ...errors.value, amount_ttc_cents: 'TTC ≠ HT + TVA' };
            }
            if (errors.value && Object.values(errors.value).some(Boolean)) return;
            const dto:any = {
              service_date: form.value.service_date,
              paid_at: form.value.paid_at || undefined,
              amount_ht_cents: ht,
              amount_tva_cents: tva,
              amount_ttc_cents: ttc,
            };
            await createInvoiceSimple(dto);
            items.value = (await listInvoices()) as any[];
            form.value = { service_date: '', paid_at: '', amount_ht_cents: '', amount_tva_cents: '', amount_ttc_cents: '' } as any;
          }}>+ Nouvelle facture</button>
        </div>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-slate-500">
            <th class="py-2">Date</th><th>HT</th><th>TVA</th><th>TTC</th><th>Payé le</th>
          </tr>
        </thead>
        <tbody>
          {items.value.map((i:any)=> (
            <tr class="border-t">
              <td class="py-2">{i.service_date}</td>
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
