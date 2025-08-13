import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { getSettings, saveSettings } from '../../lib/tauriClient';

export default component$(() => {
  const s = useSignal<any>({ default_vat_rate_ppm: 200000, urssaf_rate_ppm: 220000, buffer_cents: 30000, vat_declare_day: 12, vat_pay_day: 20, urssaf_pay_day: 5 });
  useVisibleTask$(async () => {
    s.value = (await getSettings()) as any;
  });
  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Paramètres</h2>
      <div class="card p-4 space-y-3">
        <div class="grid grid-cols-3 gap-2">
          <label class="label">Taux TVA par défaut<input class="input" type="number" value={s.value.default_vat_rate_ppm} onInput$={(e:any)=>s.value.default_vat_rate_ppm=Number(e.target.value)} /></label>
          <label class="label">Taux URSSAF (ppm)<input class="input" type="number" value={s.value.urssaf_rate_ppm} onInput$={(e:any)=>s.value.urssaf_rate_ppm=Number(e.target.value)} /></label>
          <label class="label">Buffer (cents)<input class="input" type="number" value={s.value.buffer_cents} onInput$={(e:any)=>s.value.buffer_cents=Number(e.target.value)} /></label>
          <label class="label">Jour déclaration TVA<input class="input" type="number" value={s.value.vat_declare_day} onInput$={(e:any)=>s.value.vat_declare_day=Number(e.target.value)} /></label>
          <label class="label">Jour paiement TVA<input class="input" type="number" value={s.value.vat_pay_day} onInput$={(e:any)=>s.value.vat_pay_day=Number(e.target.value)} /></label>
          <label class="label">Jour URSSAF<input class="input" type="number" value={s.value.urssaf_pay_day} onInput$={(e:any)=>s.value.urssaf_pay_day=Number(e.target.value)} /></label>
        </div>
        <div class="flex gap-2">
          <button class="btn" onClick$={async ()=>{ await saveSettings(s.value); }}>Sauvegarder</button>
        </div>
      </div>
    </div>
  );
});
