import { component$, Slot } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import './global.css';

export default component$(() => {
  return (
    <QwikCityProvider>
      <main class="min-h-screen">
        <RouterOutlet />
      </main>
      <ServiceWorkerRegister />
    </QwikCityProvider>
  );
});
