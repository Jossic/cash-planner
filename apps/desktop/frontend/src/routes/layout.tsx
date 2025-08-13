import { component$, Slot, useContextProvider, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { MonthContext } from '../stores/month';
import { monthRecap, monthStatus, closeMonth } from '../lib/tauriClient';

export default component$(() => {
  const now = new Date();
  const monthState = useSignal({ year: now.getFullYear(), month: now.getMonth()+1 });
  useContextProvider(MonthContext, monthState);
  const headerRecap = useSignal<any | null>(null);
  const status = useSignal<any | null>(null);

  useVisibleTask$(async () => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    headerRecap.value = await monthRecap(monthState.value.year, monthState.value.month);
    status.value = await monthStatus(monthState.value.year, monthState.value.month);
  });

  useVisibleTask$(async ({ track }) => {
    track(() => monthState.value.year);
    track(() => monthState.value.month);
    headerRecap.value = await monthRecap(monthState.value.year, monthState.value.month);
    status.value = await monthStatus(monthState.value.year, monthState.value.month);
  });

  return (
    <div class="min-h-screen bg-slate-50">
      <header class="h-12 bg-slate-900 text-white flex items-center justify-between px-4 shadow">
        <div class="font-semibold">JLA Cash Planner</div>
        <div class="flex items-center gap-3 text-xs opacity-80">
          <button class="btn !px-2 !py-1" onClick$={() => {
            const root = document.documentElement;
            root.classList.toggle('dark');
            localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
          }}>🌓</button>
          <span>Local-first • SQLite</span>
        </div>
      </header>
      {headerRecap.value && (
        <div class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-4 py-1 flex items-center gap-4">
          <div>Mois: {monthState.value.year}-{String(monthState.value.month).padStart(2,'0')}</div>
          <div>TVA: {(headerRecap.value.vat_due_cents/100).toFixed(2)}€</div>
          <div>URSSAF: {(headerRecap.value.urssaf_due_cents/100).toFixed(2)}€</div>
          <div>Reste: <span class="font-semibold">{(headerRecap.value.after_provisions_cents/100).toFixed(2)}€</span></div>
          <div class="ml-auto flex items-center gap-2">
            {status.value?.closed_at ? (
              <span class="px-2 py-0.5 rounded bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100">Clôturé</span>
            ) : (
              <>
                <span class="px-2 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-700 dark:text-amber-100">Ouvert</span>
                <button class="btn !px-2 !py-1" onClick$={async ()=>{
                  await closeMonth(monthState.value.year, monthState.value.month);
                  headerRecap.value = await monthRecap(monthState.value.year, monthState.value.month);
                  status.value = await monthStatus(monthState.value.year, monthState.value.month);
                }}>Clore</button>
              </>
            )}
          </div>
        </div>
      )}
      <div class="grid grid-cols-[240px_1fr]">
        <aside class="p-4 border-r bg-white min-h-[calc(100vh-3rem)]">
          <nav class="flex flex-col gap-1 text-sm">
            <Link href="/" class="nav-link">Dashboard</Link>
            <Link href="/invoices" class="nav-link">Encaissements</Link>
            <Link href="/expenses" class="nav-link">Dépenses</Link>
            <Link href="/vat" class="nav-link">TVA</Link>
            <Link href="/urssaf" class="nav-link">URSSAF</Link>
            <Link href="/recap" class="nav-link">Récap</Link>
            <Link href="/forecast" class="nav-link">Prévision</Link>
            <Link href="/close-month" class="nav-link">Clôture</Link>
            <Link href="/settings" class="nav-link">Paramètres</Link>
          </nav>
        </aside>
        <section class="p-6">
          <Slot />
        </section>
      </div>
    </div>
  );
});
