import { component$, PropFunction } from '@builder.io/qwik';

type Option = { label: string; value: string | number };

export const Select = component$<{
  value: string | number;
  options: Option[];
  onChange$: PropFunction<(v: string) => void>;
  label?: string;
}>(props => {
  return (
    <label class="label">
      {props.label}
      <select class="input bg-white dark:bg-slate-800" value={props.value as any} onInput$={(e:any)=>props.onChange$(e.target.value)}>
        {props.options.map(o => (<option value={o.value as any}>{o.label}</option>))}
      </select>
    </label>
  );
});

