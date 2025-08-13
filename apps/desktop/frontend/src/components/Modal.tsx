import { component$, Slot } from '@builder.io/qwik';

export const Modal = component$<{ open: boolean; onClose$: () => void; title?: string }>((props) => {
  if (!props.open) return null as any;
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" onClick$={props.onClose$}></div>
      <div class="relative z-10 card w-[520px] p-4">
        {props.title && <h3 class="text-lg font-semibold mb-2">{props.title}</h3>}
        <div class="mb-3">
          <Slot />
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn" onClick$={props.onClose$}>Fermer</button>
        </div>
      </div>
    </div>
  );
});

