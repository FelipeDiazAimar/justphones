<div align="center">

# 📱 JustPhones — iPhone Cases & Accessories E-commerce

**Complete store with admin panel, finance dashboard and WhatsApp checkout. Next.js 15 + Supabase + R2 + Framer Motion.**

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://justphones-fv.vercel.app)

**[🚀 Live Demo](https://justphones-fv.vercel.app) · [📦 Repo](https://github.com/FelipeDiazAimar/justphones) · [🇪🇸 Español](README.md)**

</div>

## What is it?

Real production store adapted to portfolio demo: Supabase → in-memory hooks, R2 → Unsplash, admin login removed (direct **Admin** button). Catalog (iPhone 11–16 Pro, filters/search/product pages), persistent cart, WhatsApp checkout (`wa.me` formatted message), live discount codes (`DEMO10`, `PROMO20`, `PORTFOLIO`, `BIENVENIDA`), full admin (products/orders/finance/codes/carousel/FAQs/models) and finance dashboard (net profit, capital, stock equity, charts, closures).

## Demo

- Live: https://justphones-fv.vercel.app · Local: http://localhost:9002 (run **inside `justphones/justphones/`** — double folder).
- Zero-config: `npm install && npm run dev`. No login, no env.
- Real integrations (Supabase/R2/EmailJS) stay in code as reference; contact form needs EmailJS envs.

## Stack

Next `15.3.8` · React `18.3.1` · TS `5` · Tailwind `3.4.1` + Radix · Framer Motion `11` · `ogl 1.0.3` (Aurora) · `react-image-crop 11` · Recharts `2.15.1` · RHF + Zod · Embla `8.6` · `next-themes` · Supabase (prod ref) · R2 (prod ref) · EmailJS (prod) · Genkit `1.13`.

## Data

`src/lib/mock-data.ts` (743 lines): 20 products, 20 sales, 15 requests, 15 fixed costs, closures, codes, carousel, FAQs, 12 iPhone models. Resets on reload.

Deploy on Vercel with `justphones/justphones/` as root, no envs for demo.

## Author

**Felipe Diaz Aimar** — https://www.linkedin.com/in/felipe-aimar/ · felipediazaimar@gmail.com · https://github.com/FelipeDiazAimar
