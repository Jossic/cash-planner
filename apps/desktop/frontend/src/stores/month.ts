import { Signal, createContextId } from '@builder.io/qwik';

export type MonthState = { year: number; month: number };
export const MonthContext = createContextId<Signal<MonthState>>('month-context');

