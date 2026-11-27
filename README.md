# Calculadora de Margen Real y Precio Óptimo

Aplicación web de una sola página (SPA) construida con **Next.js (App Router)**, **React** y **Tailwind CSS**, 100% client-side, sin inicio de sesión ni base de datos.

## Funcionalidades

- **6 controles sincronizados (slider + input numérico)** con valores iniciales en MXN:
  - Precio de venta al público (`$350 MXN`)
  - Costo del producto / COGS (`$120 MXN`)
  - Comisión de plataforma o pasarela (`15%`) con 3 presets rápidos: `Mercado Libre (15%)`, `Shopify/Stripe (4%)` y `Venta Directa (0%)`
  - Costo de envío y empaque por orden (`$92 MXN`)
  - Gasto en ads por venta / CPA (`$35 MXN`)
  - Gastos fijos mensuales (`$8,000 MXN`)
- **Resultados en tiempo real**:
  - KPI principal de utilidad neta real por unidad (MXN) y margen neto (%) con tipografía `tabular-nums`
  - Semáforo de salud financiera (`<10%` Rojo, `10%–19.9%` Amarillo, `≥20%` Verde) con diagnóstico textual directo
  - Barra horizontal apilada con desglose porcentual de cada peso vendido
  - Tarjeta de **Precio Mínimo Sugerido** (meta `20%` de margen neto libre) y **Punto de Equilibrio** mensual
  - Comparador rápido de impacto al subir el precio `+10%`
- **Sección de conversión (CTA)**:
  - Auditoría rápida de catálogo por WhatsApp (`wa.me` configurable con resumen prellenado)
  - Plantilla Avanzada en Excel para múltiples SKUs

## Configuración opcional (Variables de entorno)

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=5215512345678
NEXT_PUBLIC_EXCEL_TEMPLATE_URL=https://tu-enlace-de-checkout.com
```

El enlace `wa.me` también puede sobrescribirse desde el botón **Configurar wa.me** en la app o pasando `?wa=5215512345678` en la URL.

## Desarrollo local

```bash
npm install
npm run dev
```

## Pruebas y compilación

```bash
npm test
npm run typecheck
npm run build
```
