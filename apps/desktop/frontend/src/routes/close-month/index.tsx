import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Modal } from '../../components/Modal';
import { Link } from '@builder.io/qwik-city';
import { Select } from '../../components/Select';
import { closeMonth, monthRecap, monthStatus } from '../../lib/tauriClient';

export default component$(() => {
  const open = useSignal(false);
  const now = new Date();
  const year = useSignal(now.getFullYear());
  const month = useSignal(now.getMonth()+1);
  const status = useSignal<any | null>(null);
  const recap = useSignal<any | null>(null);

  useVisibleTask$(async () => {
    status.value = await monthStatus(year.value, month.value);
    recap.value = await monthRecap(year.value, month.value);
  });
  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Clôture mensuelle</h2>
      <div class="flex gap-3">
        <Select label="Année" value={year.value} options={Array.from({length:6},(_,i)=>({label:String(new Date().getFullYear()-3+i), value:new Date().getFullYear()-3+i}))} onChange$={async (v)=>{year.value=Number(v); status.value = await monthStatus(year.value, month.value); recap.value = await monthRecap(year.value, month.value);}} />
        <Select label="Mois" value={month.value} options={Array.from({length:12},(_,i)=>({label:String(i+1).padStart(2,'0'), value:i+1}))} onChange$={async (v)=>{month.value=Number(v); status.value = await monthStatus(year.value, month.value); recap.value = await monthRecap(year.value, month.value);}} />
      </div>
      <div class="card p-4 space-y-3">
        {status.value?.closed_at ? (
          <div class="text-green-700">Mois clôturé le {status.value.closed_at}</div>
        ) : (
          <div class="text-amber-700">Mois non clôturé</div>
        )}
        <ul class="space-y-2">
          <li><label><input type="checkbox"/> Encaissements importés</label></li>
          <li><label><input type="checkbox"/> Dépenses importées</label></li>
          <li><label><input type="checkbox"/> Rapprochement ok</label></li>
          <li><label><input type="checkbox"/> Provision TVA créée</label></li>
          <li><label><input type="checkbox"/> Provision URSSAF créée</label></li>
          <li><label><input type="checkbox"/> Rapport PDF exporté</label></li>
        </ul>
        <div class="flex gap-2 mt-4">
          <button class="btn" onClick$={()=>open.value=true}>Voir le récap</button>
          {!status.value?.closed_at && <button class="btn" onClick$={async ()=>{ await closeMonth(year.value, month.value); status.value = await monthStatus(year.value, month.value); recap.value = await monthRecap(year.value, month.value); }}>Clore le mois</button>}
          <Link href="/recap" class="btn">Ouvrir la page récap</Link>
        </div>
      </div>
      <Modal open={open.value} onClose$={()=>open.value=false} title="Récap mensuel">
        {recap.value ? (
          <div class="space-y-1 text-sm">
            <div>Encaissements TTC: {(recap.value.receipts_ttc_cents/100).toFixed(2)}€</div>
            <div>Dépenses TTC: {(recap.value.expenses_ttc_cents/100).toFixed(2)}€</div>
            <div>TVA due: {(recap.value.vat_due_cents/100).toFixed(2)}€</div>
            <div>URSSAF due: {(recap.value.urssaf_due_cents/100).toFixed(2)}€</div>
            <div>Net du mois: {(recap.value.net_from_month_cents/100).toFixed(2)}€</div>
            <div class="font-semibold">Reste après provisions: {(recap.value.after_provisions_cents/100).toFixed(2)}€</div>
          </div>
        ) : (
          <div class="text-sm">Chargement…</div>
        )}
      </Modal>
    </div>
  );
});
