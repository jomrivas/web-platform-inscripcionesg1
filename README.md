# Sistema de Inscripciones - Grupo Scout No. 1 "Los Intrépidos"

Plataforma web para la gestión digital de fichas de inscripción de adultos 
voluntarios y beneficiarios del Grupo Scout No. 1 "Los Intrépidos" (Manada, 
Scouts, Caminantes y Clan Maya/Rovers). Permite a las familias y voluntarios 
registrarse, completar sus fichas con firma digital y darle seguimiento al 
estado de su inscripción, mientras el equipo administrativo gestiona, filtra 
y exporta los registros por año y rama.

## 📋 Sobre el Proyecto

Sistema de inscripciones online desarrollado para el **Grupo Scout No. 1 
"Los Intrépidos"**, con el objetivo de digitalizar el proceso de afiliación 
anual que tradicionalmente se realizaba en papel.

La plataforma cubre a las cuatro ramas del grupo — **Manada** (7-10 años), 
**Scouts** (11-14 años), **Caminantes** (15-17 años) y **Clan Maya/Rovers** 
(18-21 años) — así como a los **adultos voluntarios** (dirigentes, comité y 
responsables).

**Funcionalidades principales:**
- Registro e inicio de sesión para familias y voluntarios
- Fichas digitales de Adulto Voluntario y Beneficiario, con firma manuscrita 
  (dibujada o subida como imagen)
- Confirmación automática por correo al completar una inscripción
- Panel administrativo con listados filtrables por año, rama y estado
- Exportación de registros en CSV, Excel, PDF y respaldo SQL

Construido con **Next.js + Supabase + Vercel**, priorizando bajo costo 
operativo (free tier) dado el uso estacional del sistema (periodo de 
inscripción ordinario: marzo-abril).

## 🛠️ Stack Técnico

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth
- **Email transaccional:** Resend
- **Hosting:** Vercel

```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
