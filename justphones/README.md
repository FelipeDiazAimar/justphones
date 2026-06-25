# JustPhones — E-commerce de Fundas y Accesorios para iPhone

> Portfolio demo — tienda online completa con panel de administración, finanzas y carrito funcional.

![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## Descripción

**JustPhones** es una tienda online especializada en fundas y accesorios para iPhone. El proyecto es una aplicación full-stack construida con Next.js 15 App Router que incluye:

- Catálogo de productos con filtros por modelo y categoría
- Carrito de compras persistente con localStorage
- Flujo de checkout con envío de pedido por WhatsApp
- Códigos de descuento validados en tiempo real
- **Panel de administración completo** (sin login en modo demo)
- **Dashboard financiero** con gráficos de ventas, rentabilidad y capital

Todo el proyecto funciona con **datos mock en memoria** — sin base de datos ni autenticación requerida, ideal para demostración en portfolio.

---

## Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 3 + shadcn/ui |
| Animaciones | Framer Motion 11 |
| Gráficos | Recharts 2 |
| Formularios | React Hook Form + Zod |
| Carrusel | Embla Carousel |
| Íconos | Lucide React |
| Deploy | Vercel |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── admin/                  # Panel de administración
│   │   ├── page.tsx            # Dashboard con acceso a todas las secciones
│   │   ├── products/           # CRUD completo de productos
│   │   ├── pedidos/            # Gestión de solicitudes de clientes
│   │   ├── finanzas/           # Dashboard financiero con gráficos
│   │   ├── codigos/            # Códigos de descuento
│   │   ├── carousel/           # Gestión de imágenes del carrusel
│   │   ├── faqs/               # Preguntas frecuentes
│   │   ├── models/             # Modelos de iPhone compatibles
│   │   └── names/              # Nombres de productos
│   ├── catalog/                # Catálogo público con filtros
│   ├── product/[id]/           # Página de detalle de producto
│   ├── contact/                # Formulario de contacto
│   ├── faq/                    # Página pública de FAQs
│   └── search/                 # Búsqueda de productos
├── components/
│   ├── layout/                 # Header, Footer, navegación
│   ├── ui/                     # Componentes shadcn/ui
│   ├── cart-sheet.tsx          # Carrito lateral con descuentos
│   └── product-card.tsx        # Tarjeta de producto
├── hooks/                      # Custom hooks con estado en memoria
│   ├── use-products.ts
│   ├── use-sales.ts
│   ├── use-customer-requests.ts
│   ├── use-fixed-costs.ts
│   ├── use-monetary-income.ts
│   └── ...
└── lib/
    ├── mock-data.ts            # Todos los datos demo (productos, ventas, finanzas)
    └── utils.ts
```

---

## Funcionalidades

### Tienda Pública

- **Carrusel** de imágenes promocionales en la página principal
- **Catálogo** con navegación por modelo (iPhone 11 a 16 Pro) y categoría (fundas, accesorios, auriculares)
- **Filtros** por subcategoría, modelo y disponibilidad de stock
- **Búsqueda** de productos por nombre o modelo
- **Página de producto** con selector de color, stock en tiempo real y galería de imágenes
- **Carrito lateral** con:
  - Agregar / quitar productos
  - Aplicar códigos de descuento
  - Persistencia en `localStorage`
- **Checkout por WhatsApp** — genera un mensaje formateado con el pedido completo y abre WhatsApp directamente
- **FAQs** con acordeón
- **Formulario de contacto**

### Panel de Administración (`/admin`)

Accesible directamente desde el botón **Admin** en la barra de navegación. Sin login requerido en modo demo.

| Sección | Funcionalidad |
|---|---|
| **Productos** | Crear, editar y eliminar productos con imágenes, colores, stock y precios |
| **Pedidos** | Ver solicitudes de clientes, registrar ventas, aplicar descuentos |
| **Finanzas** | Dashboard completo (ver sección debajo) |
| **Códigos** | CRUD de códigos de descuento con porcentaje y estado activo/inactivo |
| **Carrusel** | Subir y ordenar imágenes del carrusel principal |
| **FAQs** | Crear y editar preguntas frecuentes |
| **Modelos** | Gestión de modelos de iPhone compatibles |
| **Nombres** | Gestión de nombres de productos (subcategorías) |

### Dashboard Financiero (`/admin/finanzas`)

Panel completo de análisis financiero con:

**Métricas por período (selector de mes):**
- Ingreso por Productos
- Movimientos Monetarios (ingresos y egresos)
- Costos Fijos del período
- Extracciones de Sueldos
- Costos de Pedidos (restock)
- Costos Totales e Ingresos Totales
- **Ganancia Neta**
- **Capital Disponible** acumulado histórico
- Patrimonio Total en stock
- Items Vendidos y Tasa de Conversión

**Gráficos interactivos:**
- Ventas por día / mes / año (LineChart)
- Ventas por categoría (PieChart)
- Resumen de Ganancias y Costos (BarChart) — diario, semanal, mensual, por pedido

**Tablas:**
- Popularidad de productos (por ventas, pedidos o vistas)
- Rentabilidad por método de pago (lista, efectivo, débito)
- Historial de pedidos de restock con costos y márgenes

**Gestión en vivo:**
- Agregar / editar / eliminar costos fijos por período
- Registrar extracciones de sueldo
- Registrar ingresos y egresos monetarios
- Cierres de caja mensuales con historial

---

## Datos Mock

Todos los datos están definidos en [`src/lib/mock-data.ts`](src/lib/mock-data.ts) y se reinician con cada recarga de página.

| Dataset | Cantidad |
|---|---|
| Productos | 20 (fundas, accesorios, auriculares) |
| Ventas | 20 registros (abr–jun 2026) |
| Solicitudes de clientes | 15 registros |
| Costos fijos | 15 registros (3 meses) |
| Extracciones de sueldo | 4 registros |
| Movimientos monetarios | 5 registros |
| Historial de stock | 30 entradas en 3 pedidos |
| Cierres de caja | 3 períodos (abr / may / jun 2026) |
| Códigos de descuento | 4 códigos activos |
| Imágenes de carrusel | 5 imágenes |
| FAQs | 6 preguntas |
| Modelos de iPhone | 12 modelos (iPhone 11 a 16 Pro) |

**Códigos de descuento para probar:**
| Código | Descuento |
|---|---|
| `DEMO10` | 10% |
| `PROMO20` | 20% |
| `PORTFOLIO` | 15% |
| `BIENVENIDA` | 10% |

---

## Instalación y Uso Local

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd justphones

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 9002)
npm run dev
```

Abrir [http://localhost:9002](http://localhost:9002) en el navegador.

> No se requieren variables de entorno para correr el proyecto en modo demo.

### Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo con Turbopack
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run typecheck  # Verificación de tipos TypeScript
npm run lint       # Linting con ESLint
```

---

## Rutas Principales

| Ruta | Descripción |
|---|---|
| `/` | Página principal con carrusel y bienvenida |
| `/catalog` | Catálogo completo de productos |
| `/catalog/cases` | Fundas para iPhone |
| `/catalog/accessories` | Accesorios |
| `/catalog/auriculares` | Auriculares |
| `/catalog/[model]` | Productos por modelo (ej: `/catalog/iphone-16`) |
| `/product/[id]` | Detalle de producto con colores y stock |
| `/search` | Búsqueda de productos |
| `/faq` | Preguntas frecuentes |
| `/contact` | Formulario de contacto |
| `/admin` | Dashboard administrativo |
| `/admin/products` | Gestión de productos |
| `/admin/pedidos` | Gestión de pedidos y ventas |
| `/admin/finanzas` | Dashboard financiero |
| `/admin/codigos` | Códigos de descuento |
| `/admin/carousel` | Imágenes del carrusel |
| `/admin/faqs` | Gestión de FAQs |
| `/admin/models` | Modelos de iPhone |

---

## Arquitectura

### Estado en Memoria

El proyecto usa **custom hooks con `useState`** para toda la lógica de datos. Cada hook inicializa su estado con datos de `mock-data.ts` y expone funciones CRUD que mutan el estado local simulando operaciones async con `setTimeout`.

```ts
// Ejemplo: use-products.ts
export function useProductsState() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const addProduct = async (data) => {
    await new Promise(r => setTimeout(r, 400)); // simula latencia
    setProducts(prev => [newProduct, ...prev]);
    return true;
  };
  // ...
}
```

### Flujo del Carrito → WhatsApp

1. El usuario agrega productos al carrito (persiste en `localStorage`)
2. Opcionalmente aplica un código de descuento (validado con `validateDiscountCode()`)
3. Al hacer checkout, se genera un mensaje de texto formateado con todos los productos, cantidades, precios y descuentos
4. Se abre `https://wa.me/<numero>?text=<mensaje>` en una nueva pestaña

### API Routes (Mock)

Las rutas de API no acceden a ninguna base de datos — retornan respuestas simuladas:

| Endpoint | Método | Respuesta |
|---|---|---|
| `/api/admin/finance-closures` | GET | Lista de cierres de caja mock |
| `/api/admin/finance-closures` | POST | Nuevo cierre generado |
| `/api/admin/customer-requests` | DELETE/PATCH | `{ success: true }` |
| `/api/upload/product-cover` | POST | URL de Unsplash mock |
| `/api/upload/product-color` | POST | URL de Unsplash mock |
| `/api/r2/delete` | POST | `{ success: true }` |

---

## Diseño y UX

- **Tema oscuro/claro** con `next-themes` y toggle en el header
- **Responsive** — sidebar en desktop, menú hamburguesa en mobile con accesos rápidos al panel admin
- **Animaciones** con Framer Motion en transiciones de página y elementos interactivos
- **Skeleton loaders** durante estados de carga simulados
- **Toast notifications** para feedback de todas las acciones CRUD
- **Efecto Aurora** animado en el fondo de la página de bienvenida

---

## Notas de Portfolio

Este proyecto fue construido como aplicación de producción real y luego adaptado para demo de portfolio:

- La base de datos **Supabase (PostgreSQL)** fue reemplazada por estado en memoria
- El almacenamiento **Cloudflare R2** fue reemplazado con URLs de Unsplash
- El sistema de **autenticación** del admin fue removido para acceso directo
- Las **imágenes reales** de productos fueron reemplazadas por fotos de stock de Unsplash

El código de integración original (Supabase, R2, auth) sigue presente en el repositorio como referencia de la arquitectura de producción.

---

## Autor

**Felipe Diaz Aimar**

Desarrollado con Next.js 15, TypeScript y mucho café ☕
