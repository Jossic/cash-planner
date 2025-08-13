import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import render from './entry.ssr';
import qwikCityPlan from '@qwik-city-plan';

const { router, notFound } = createQwikCity({ render, qwikCityPlan });

export default { router, notFound };

