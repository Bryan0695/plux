# TechStore Checkout — Documentación Técnica

> Integración de pagos con **PagoPlux** en una aplicación Angular 19 standalone.

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Tecnologías utilizadas](#3-tecnologías-utilizadas)
4. [Configuración inicial](#4-configuración-inicial)
5. [Arquitectura y flujo de pago](#5-arquitectura-y-flujo-de-pago)
6. [Archivos del proyecto](#6-archivos-del-proyecto)
   - [src/index.html](#61-srcindexhtml)
   - [angular.json — scripts](#62-angularjson--scripts)
   - [src/assets/js/indexPagoPlux.js](#63-srcassetsjsindexpagopluxjs)
   - [src/main.ts](#64-srcmaints)
   - [src/styles.scss](#65-srcstylsscss)
   - [AppComponent](#66-appcomponent)
   - [CheckoutComponent — TypeScript](#67-checkoutcomponent--typescript)
   - [CheckoutComponent — HTML](#68-checkoutcomponent--html)
   - [CheckoutComponent — SCSS](#69-checkoutcomponent--scss)
   - [paybox-data.model.ts](#610-paybox-datamodelts)
   - [PaymentService](#611-paymentservice)
7. [Interfaces y modelos](#7-interfaces-y-modelos)
8. [Variables CSS (Design System)](#8-variables-css-design-system)
9. [Validaciones del formulario](#9-validaciones-del-formulario)
10. [Integración PagoPlux SDK](#10-integración-pagoplux-sdk)
11. [API de validación REST](#11-api-de-validación-rest)
12. [Modal de resultado](#12-modal-de-resultado)
13. [Cambiar a producción](#13-cambiar-a-producción)
14. [Tarjetas de prueba (Sandbox)](#14-tarjetas-de-prueba-sandbox)

---

## 1. Descripción general

**TechStore Checkout** es una página de pago de una sola pantalla que permite al usuario:

1. Ingresar sus datos de comprador (nombre, correo, teléfono, dirección).
2. Validar el formulario antes de acceder al pago.
3. Realizar el cobro a través del **SDK de PagoPlux** (iframe oficial).
4. Ver el resultado del pago (aprobado / rechazado) en un modal con todos los detalles de la transacción.

El producto vendido es: **Curso Full Stack con IA Integrada** — USD $10.20 (base $9.02 + IVA $1.18).

---

## 2. Estructura del proyecto

```
Bryan David Gallegos Farinango/
├── angular.json                        ← Configuración Angular CLI
├── package.json
├── tsconfig.json
└── src/
    ├── index.html                      ← Carga jQuery + SDK PagoPlux
    ├── main.ts                         ← Bootstrap de la app
    ├── styles.scss                     ← Estilos globales
    └── app/
        ├── app.component.ts            ← Componente raíz (shell)
        ├── app.module.ts               ← NgModule (configuración)
        ├── checkout/
        │   ├── checkout.component.ts   ← Lógica principal
        │   ├── checkout.component.html ← Template (formulario + modales)
        │   └── checkout.component.scss ← Estilos (dark theme)
        ├── models/
        │   ├── paybox-data.model.ts    ← Interfaces SDK + API
        │   └── paybox-response.model.ts← Interfaz respuesta onAuthorize
        └── services/
            └── payment.service.ts      ← Cliente REST validación PagoPlux
        assets/
        └── js/
            └── indexPagoPlux.js        ← Puente Angular ↔ SDK
```

---

## 3. Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 19 | Framework principal (standalone components) |
| TypeScript | 5.x | Tipado estático |
| RxJS | 7.x | Observable HTTP |
| Angular Reactive Forms | — | Validación formulario comprador |
| SCSS | — | Estilos con variables CSS |
| PagoPlux SDK | sandbox | Iframe de pago (index_angular.js) |
| jQuery | 3.4.1 | Dependencia requerida por PagoPlux SDK |
| Google Fonts | — | DM Serif Display + DM Sans |

---

## 4. Configuración inicial

### Requisitos previos

- Node.js ≥ 18
- Angular CLI: `npm install -g @angular/cli`
- Cuenta activa en PagoPlux sandbox con correo registrado

### Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
ng serve

# Build de producción
ng build --configuration production
```

### Datos del comercio (sandbox)

Configurados en `checkout.component.ts → buildPayboxData()`:

```typescript
PayboxRemail:  'correoplux@plusec123.com'   // Email registrado en PagoPlux
PayboxRename:  'TechStore Ecuador'           // Nombre del comercio
```

> **Importante:** `PayboxRemail` debe corresponder a un comercio registrado en PagoPlux. En sandbox usar el correo proporcionado por PagoPlux.

---

## 5. Arquitectura y flujo de pago

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUJO COMPLETO                               │
│                                                                     │
│  1. Usuario llena el formulario (nombre, email, teléfono, dirección)│
│                          │                                          │
│  2. Click "Continuar al pago"                                       │
│     ├─ Formulario inválido → muestra errores por campo              │
│     └─ Formulario válido  → llama iniciarDatos() con PayboxData     │
│                          │                                          │
│  3. PagoPlux SDK inicializa y muestra botón flotante [Pagar]        │
│                          │                                          │
│  4. Usuario click botón PagoPlux → se abre iframe de pago           │
│                          │                                          │
│  5. Usuario ingresa datos de tarjeta → PagoPlux procesa el cobro    │
│                          │                                          │
│  6. SDK llama onAuthorize(response)                                 │
│     ├─ Sin token ni tarjeta → TIMEOUT/CANCELACIÓN → ignorar        │
│     ├─ Tiene token + transaccion_id → ÉXITO                        │
│     │   └─ Llama validateTransaction(token, date, amount)           │
│     │       └─ API responde con ValidationDetail completo           │
│     │           └─ Muestra MODAL DE ÉXITO con todos los detalles    │
│     └─ Sin token pero con datos de tarjeta → RECHAZO               │
│         └─ Muestra MODAL DE RECHAZO con motivo                      │
└─────────────────────────────────────────────────────────────────────┘
```

### NgZone — detección de cambios

El SDK de PagoPlux ejecuta `onAuthorize` **fuera de la zona de Angular**, por lo que sin `NgZone.run()` el modal no se renderizaría. La solución aplicada:

```typescript
constructor(private zone: NgZone) {}

onAuthorize: (response) => {
  this.zone.run(() => {
    // Todo cambio de estado dentro de zone.run() dispara change detection
    this.validationDetail = res.detail;
    this.resultModalOpen  = true;
  });
}
```

---

## 6. Archivos del proyecto

### 6.1 `src/index.html`

Punto de entrada HTML. Carga en orden:

```html
<!-- 1. jQuery (requerido por PagoPlux) -->
<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>

<!-- 2. SDK PagoPlux Sandbox -->
<script src="https://sandbox-paybox.pagoplux.com/paybox/index_angular.js"></script>

<!-- 3. Tipografía -->
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display..."/>
```

> Para producción cambiar el SDK a: `https://paybox.pagoplux.com/paybox/index_angular.js`

---

### 6.2 `angular.json` — scripts

El puente JavaScript se carga antes que la app:

```json
"scripts": [
  "src/assets/js/indexPagoPlux.js"
]
```

Esto garantiza que `iniciarDatos()` esté disponible globalmente cuando el componente Angular lo llame.

---

### 6.3 `src/assets/js/indexPagoPlux.js`

Puente entre Angular y el objeto global `Data` del SDK de PagoPlux:

```javascript
function iniciarDatos(dataPago) {
  if (typeof Data !== 'undefined' && Data) {
    Data.init(dataPago);       // Inicializa el SDK con los datos del comercio
  } else {
    throw new Error('PagoPlux SDK no disponible');  // El componente captura este error
  }
}

function reload(data) {
  if (typeof Data !== 'undefined' && Data) {
    Data.reload(data);         // Actualiza datos sin reinicializar
  }
}
```

**Por qué es necesario:** Angular no puede llamar directamente a `Data.init()` porque `Data` es un objeto global inyectado por el SDK externo. El puente actúa de adaptador con manejo de errores.

En `checkout.component.ts` se declara como variable global:
```typescript
declare var iniciarDatos: any;
```

---

### 6.4 `src/main.ts`

Bootstrap de la aplicación standalone:

```typescript
bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()]
})
```

`provideHttpClient()` registra `HttpClient` para que `PaymentService` pueda inyectarlo.

---

### 6.5 `src/styles.scss`

Estilos globales mínimos:

```scss
body {
  font-family: 'DM Sans', sans-serif;
  background: #0d0d0f;
  color: #e8e8f0;
}
```

El grueso del diseño está en `checkout.component.scss` con scope de componente.

---

### 6.6 AppComponent

Componente raíz que simplemente monta el checkout:

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CheckoutComponent],
  template: `<app-checkout></app-checkout>`
})
export class AppComponent {}
```

---

### 6.7 CheckoutComponent — TypeScript

**Archivo:** `src/app/checkout/checkout.component.ts`

#### Estado del componente

```typescript
formSubmitted    = false;          // true cuando el usuario intenta continuar
buyerReady       = false;          // true cuando el formulario fue validado
resultModalOpen  = false;          // controla visibilidad del overlay

validationDetail: ValidationDetail | null = null;  // datos del éxito (API)
paymentError:     PayboxResponse | null   = null;  // datos del rechazo (SDK)

buyerForm!: FormGroup;             // formulario reactivo del comprador
```

#### Métodos

| Método | Descripción |
|---|---|
| `ngOnInit()` | Inicializa `buyerForm` con los 4 campos y sus validadores |
| `fieldError(field)` | `true` si el campo está inválido y fue tocado o se intentó enviar |
| `hasError(field, error)` | `true` si el campo tiene el error específico (ej. `'email'`) |
| `continuar()` | Valida formulario; si es válido, llama `iniciarDatos()` con `PayboxData` |
| `buildPayboxData()` | Construye el objeto de configuración para el SDK |
| `closeResult()` | Cierra el modal y limpia el estado de resultado |

#### `buildPayboxData()` — configuración PagoPlux

```typescript
{
  PayboxRemail:               'correoplux@plusec123.com',
  PayboxRename:               'TechStore Ecuador',
  PayboxSendmail:             f.email,      // del formulario
  PayboxSendname:             f.name,       // del formulario
  PayBoxClientPhone:          f.phone,      // del formulario
  PayboxDirection:            f.address,    // del formulario
  PayBoxClientIdentification: '1710034065',
  PayboxBase0:                '9.02',       // subtotal sin IVA
  PayboxBase12:               '1.18',       // IVA
  PayboxDescription:          'Curso Full Stack con IA Integrada',
  PayboxProduction:           false,        // sandbox
  PayboxEnvironment:          'sandbox',
  PayboxLanguage:             'es',
  PayboxPagoPlux:             true,         // usa iframe (requiere id="modalPaybox")
  PayboxRecurrent:            false,
  PayboxCobroPrueba:          false,
  consumptionCode:            'ORDER-2025-001',
  onAuthorize: (response) => { ... }        // callback cuando termina el pago
}
```

#### `onAuthorize` — lógica de detección

```
response recibido
       │
       ├─ !token && !cardData && !code  →  TIMEOUT/CANCEL → return (ignorar)
       │
       ├─ token && transaccion_id       →  ÉXITO
       │   └─ validateTransaction()
       │       ├─ success → validationDetail = res.detail; abrir modal
       │       └─ error  → paymentError = response; abrir modal (fallback)
       │
       └─ sin token pero con cardData   →  RECHAZO
           └─ paymentError = response; abrir modal
```

---

### 6.8 CheckoutComponent — HTML

**Archivo:** `src/app/checkout/checkout.component.html`

#### Estructura general

```
<main>
  <section class="checkout-panel">
    <div class="checkout-card">
      ├── .checkout-title         (título "Resumen de pedido")
      ├── .price-breakdown        (subtotal, IVA, total)
      ├── form[formGroup]         (nombre, email, teléfono, dirección)
      │   └── button.btn-continuar
      ├── .buyer-ready-msg        (*ngIf="buyerReady")
      ├── div#modalPaybox         (contenedor iframe SDK)
      └── button#pay              (botón oficial PagoPlux, gestionado por SDK)
    </div>
  </section>
</main>

<div.result-overlay [class.show]="resultModalOpen">
  ├── div.result-modal *ngIf="validationDetail"   (éxito)
  └── div.result-modal *ngIf="paymentError"       (rechazo)
</div>
```

#### Validación de campos en template

```html
<input
  formControlName="email"
  [class.is-invalid]="fieldError('email')"
/>
<span class="field-error" *ngIf="hasError('email', 'required')">
  El correo es obligatorio
</span>
<span class="field-error" *ngIf="hasError('email', 'email')">
  Ingresa un correo válido
</span>
```

#### Elementos requeridos por PagoPlux SDK

```html
<!-- Contenedor donde el SDK monta el iframe -->
<div id="modalPaybox"></div>

<!-- Botón que el SDK muestra/oculta automáticamente -->
<button id="pay" type="submit" style="display: none; position: fixed; right: 80px; ...">
</button>
```

> Estos IDs son **obligatorios** cuando `PayboxPagoPlux: true`. El SDK los busca en el DOM.

---

### 6.9 CheckoutComponent — SCSS

**Archivo:** `src/app/checkout/checkout.component.scss`

#### Variables CSS (design tokens)

```scss
:host {
  --bg:          #0d0d0f;                    // fondo general
  --surface:     #15151a;                    // superficie secundaria
  --card:        #1c1c24;                    // fondo de tarjeta/card
  --border:      #2a2a38;                    // bordes sutiles
  --accent:      #7c5cfc;                    // morado principal
  --accent-soft: rgba(124,92,252,.15);       // overlay morado suave
  --success:     #22d3a5;                    // verde éxito
  --error:       #f4606a;                    // rojo error
  --text:        #e8e8f0;                    // texto principal
  --muted:       #7a7a9a;                    // texto secundario/labels
}
```

#### Clases clave

| Clase | Propósito |
|---|---|
| `.checkout-panel` | Contenedor centrado, max-width 420px |
| `.checkout-card` | Card con fondo oscuro, bordes redondeados 20px |
| `.price-breakdown` | Tabla de precios con bordes dashed |
| `.buyer-info` | Flex column para los inputs del formulario |
| `.input-group` | Wrapper label + input + error |
| `.input-group input.is-invalid` | Borde rojo + glow en campo inválido |
| `.field-error` | Texto de error en rojo, 0.72rem |
| `.btn-continuar` | Botón morado full-width, hover opacity |
| `.buyer-ready-msg` | Confirmación verde tras validar formulario |
| `.result-overlay` | Overlay fixed con blur, z-index 9999 |
| `.result-modal` | Modal centrado, 450px max, animación scale |
| `.r-icon.ok / .err` | Círculo 76px verde/rojo con glow |
| `.r-details` | Tabla de detalles en fondo `--surface` |
| `.dr` | Fila key/value dentro de detalles |

---

### 6.10 `paybox-data.model.ts`

**Archivo:** `src/app/models/paybox-data.model.ts`

Centraliza todos los tipos TypeScript del proyecto:

#### `PayboxData`
Objeto de configuración que se pasa al SDK. Campos más relevantes:

| Campo | Tipo | Descripción |
|---|---|---|
| `PayboxRemail` | `string` | Email del comercio en PagoPlux |
| `PayboxPagoPlux` | `boolean` | `true` = iframe; `false` = botón externo |
| `PayboxBase0` | `string` | Subtotal sin IVA |
| `PayboxBase12` | `string` | Valor del IVA |
| `PayboxProduction` | `boolean` | `false` = sandbox; `true` = producción |
| `onAuthorize` | `Function` | Callback que recibe la respuesta del SDK |

#### `PayboxResponse`
Respuesta del SDK en `onAuthorize`. Campos principales del SDK real:

| Campo SDK | Descripción |
|---|---|
| `token` | Token de autorización (confirma éxito cuando existe) |
| `transaccion_id` | UUID de la transacción |
| `card` | Número enmascarado `XXXX XXXX XXXX 8783` |
| `scheme` | Marca de tarjeta: `VISA`, `MASTERCARD`, etc. |
| `cardType` | `credit` o `debit` |
| `formatedAmount` | Monto formateado: `"10.20"` |
| `sendname` | Nombre del titular |
| `adquiriente` | Banco adquirente |
| `cuotas` | Número de cuotas (0 = corriente) |

#### `ValidationRequest`
Payload enviado a la API de validación:

```typescript
{
  token:  string;    // del onAuthorize del SDK
  date:   string;    // fecha ISO
  amount?: number;   // monto (opcional)
}
```

#### `ValidationDetail`
Detalle completo devuelto por la API tras validar:

```typescript
{
  id_transaccion:   string;
  token:            string;
  amount:           number;
  amountAuthorized: number;
  amountWoTaxes:    string;   // "9.02"
  amountWTaxes:     string;   // "1.03"
  taxesValue:       string;   // "0.15"
  discountRate:     number | null;
  interestValue:    number;
  interests:        string;   // "NO" | "SI"
  deferred:         number;   // cuotas (0 = corriente)
  cardInfo:         string;   // "4540 63XX XXXX 8783"
  cardIssuer:       string;   // "VISA"
  cardType:         string;   // "credit"
  clientID:         string;   // cédula
  clientName:       string;
  clientPhone:      string;
  clientDirection:  string;
  fecha:            string;   // "2026-03-12 16:53:31"
  state:            string;   // "PAGADO"
  description:      string;
  extras:           string;   // consumptionCode
  acquirer:         string;   // "GUAYAQUIL"
  mid:              string;
  tid:              string;
}
```

#### `ValidationResponse`
Wrapper de la respuesta de la API:

```typescript
{
  code:        number;              // 0 = sin error
  description: string;             // "Transacción procesada correctamente."
  detail:      ValidationDetail;   // datos completos
  status:      'succeeded' | 'failed';
}
```

---

### 6.11 PaymentService

**Archivo:** `src/app/services/payment.service.ts`

Servicio `@Injectable({ providedIn: 'root' })` que consume la API REST de PagoPlux.

#### Endpoints

| Ambiente | URL base |
|---|---|
| Sandbox | `https://apipre.pagoplux.com/transv1` |
| Producción | `https://api.pagoplux.com/transv1` |

**Endpoint de validación:**
```
POST /transaction/validationTokenDateResource
```

#### Generación del token de autorización

PagoPlux requiere un token dinámico en el header `Authorization: Basic <token>`. El algoritmo:

```typescript
private generateToken(secretKey: string): string {
  // 1. Cadena aleatoria de longitud variable
  const longitud = Math.random() * secretKey.length;
  let cadena = '';
  while (cadena.length < longitud) {
    cadena += secretKey.charAt(Math.random() * longitud);
  }

  // 2. Timestamp × 30
  const number = new Date().getTime() * 30;

  // 3. Concatenar y Base64
  return btoa(cadena + 'PPX_' + secretKey + 'PPX_' + number + 'AWS');
}
```

#### Uso en el componente

```typescript
this.paymentSvc.validateTransaction(payload, true).subscribe({
  next: (res) => {
    this.validationDetail = res.detail;
    this.resultModalOpen  = true;
  },
  error: () => {
    // Fallback: mostrar datos del SDK si la API no responde
  }
});
```

---

## 7. Interfaces y modelos

```
src/app/models/
├── paybox-data.model.ts
│   ├── PayboxData           → Configuración del SDK
│   ├── PayboxResponse       → Respuesta cruda del SDK (onAuthorize)
│   ├── ValidationRequest    → Payload para la API de validación
│   ├── ValidationDetail     → Detalle completo de la transacción (API)
│   └── ValidationResponse   → Wrapper de respuesta de la API
│
└── paybox-response.model.ts
    └── PayboxResponse       → Interfaz de referencia (28 campos documentados)
```

---

## 8. Variables CSS (Design System)

El componente usa CSS Custom Properties en `:host` para consistencia visual:

| Variable | Valor | Uso |
|---|---|---|
| `--bg` | `#0d0d0f` | Fondo principal |
| `--surface` | `#15151a` | Inputs y detalles |
| `--card` | `#1c1c24` | Card checkout y modal |
| `--border` | `#2a2a38` | Bordes de separación |
| `--accent` | `#7c5cfc` | Morado (foco, botón continuar) |
| `--accent-soft` | `rgba(124,92,252,.15)` | Glow al enfocar input |
| `--success` | `#22d3a5` | Verde (éxito, confirmación) |
| `--error` | `#f4606a` | Rojo (errores, rechazo) |
| `--text` | `#e8e8f0` | Texto principal |
| `--muted` | `#7a7a9a` | Labels y texto secundario |

---

## 9. Validaciones del formulario

Implementadas con Angular Reactive Forms:

| Campo | Validaciones | Mensajes de error |
|---|---|---|
| Nombre | `required` | "El nombre es obligatorio" |
| Correo | `required`, `email` | "El correo es obligatorio" / "Ingresa un correo válido" |
| Teléfono | `required` | "El teléfono es obligatorio" |
| Dirección | `required` | "La dirección es obligatoria" |

**Cuándo se muestran los errores:**
- Al hacer click en "Continuar al pago" (`formSubmitted = true`)
- O cuando el campo fue tocado y tiene error (`control.touched`)

```typescript
fieldError(field: string): boolean {
  const ctrl = this.buyerForm.get(field);
  return !!ctrl && ctrl.invalid && (ctrl.touched || this.formSubmitted);
}
```

---

## 10. Integración PagoPlux SDK

### Patrón aplicado: `PayboxPagoPlux: true`

Este patrón usa el **iframe oficial** de PagoPlux. Requiere dos elementos en el DOM con IDs exactos:

```html
<!-- El SDK inyecta el iframe de pago aquí -->
<div id="modalPaybox"></div>

<!-- El SDK controla display de este botón -->
<button id="pay" type="submit" style="display: none; position: fixed; right: 80px; ...">
</button>
```

### Inicialización

Se llama **solo después de validar el formulario** (no en `ngAfterViewInit`):

```typescript
continuar(): void {
  this.formSubmitted = true;
  if (this.buyerForm.invalid) return;

  this.buyerReady = true;
  try {
    iniciarDatos(this.buildPayboxData());  // activa SDK + muestra botón
  } catch {
    console.warn('[PagoPlux] SDK no disponible');
  }
}
```

### Detección de timeout vs. pago real

El SDK llama `onAuthorize` en tres situaciones:

| Situación | Token | Datos tarjeta | Acción |
|---|---|---|---|
| Timer expiró sin pagar | ❌ | ❌ | Ignorar, no mostrar modal |
| Pago aprobado | ✅ | ✅ | Validar con API → modal éxito |
| Tarjeta rechazada | ❌ | ✅ | Modal rechazo con datos SDK |

---

## 11. API de validación REST

### Request

```http
POST https://apipre.pagoplux.com/transv1/transaction/validationTokenDateResource
Authorization: Basic <token_generado>
Content-Type: application/json

{
  "token": "091457-260312-892434",
  "date":  "2026-03-12T16:53:31.000Z",
  "amount": 10.20
}
```

### Response exitosa

```json
{
  "code": 0,
  "description": "Transacción procesada correctamente.",
  "status": "succeeded",
  "detail": {
    "id_transaccion":   "b300329e-1fe0-449a-a6d0-39452712edbc",
    "token":            "091457-260312-892434",
    "amount":           10.20,
    "amountAuthorized": 10.20,
    "amountWoTaxes":    "9.02",
    "amountWTaxes":     "1.03",
    "taxesValue":       "0.15",
    "discountRate":     null,
    "interestValue":    0,
    "interests":        "NO",
    "deferred":         0,
    "cardInfo":         "4540 63XX XXXX 8783",
    "cardIssuer":       "VISA",
    "cardType":         "credit",
    "clientID":         "1724233513",
    "clientName":       "JHON DOE",
    "clientPhone":      "0992565625",
    "clientDirection":  "Rafael Troya y Virgen del Carmen...",
    "state":            "PAGADO",
    "fecha":            "2026-03-12 16:53:31",
    "description":      "Curso Full Stack con IA Integrada",
    "extras":           "ORDER-2025-001",
    "acquirer":         "GUAYAQUIL",
    "mid":              "9284794787",
    "tid":              "23434"
  }
}
```

---

## 12. Modal de resultado

### Modal de éxito (`validationDetail !== null`)

Usa los datos de `ValidationDetail` (respuesta de la API):

| Fila | Campo |
|---|---|
| Estado | `detail.state` (ej. `PAGADO`) |
| ID Transacción | `detail.id_transaccion` |
| Token | `detail.token` |
| Monto total | `detail.amount` |
| Sin IVA | `detail.amountWoTaxes` |
| IVA | `detail.amountWTaxes` |
| Tarjeta | `detail.cardIssuer` · `detail.cardType` |
| Número | `detail.cardInfo` |
| Titular | `detail.clientName` |
| Banco adquirente | `detail.acquirer` |
| Diferidos | `detail.deferred === 0 ? 'Corriente' : n + ' cuota(s)'` |
| Fecha | `detail.fecha` |

### Modal de rechazo (`paymentError !== null`)

Usa los datos crudos del SDK:

| Fila | Campo |
|---|---|
| Estado | `RECHAZADO` (fijo) |
| Motivo | `paymentError.description` (si existe) |
| Código | `paymentError.code` (si existe) |
| Tarjeta | `paymentError.scheme \|\| paymentError.cardIssuer` |
| Número | `paymentError.card \|\| paymentError.cardInfo` |

---

## 13. Cambiar a producción

Tres cambios necesarios:

### 1. `src/index.html`
```html
<!-- Cambiar sandbox por producción -->
<script src="https://paybox.pagoplux.com/paybox/index_angular.js"></script>
```

### 2. `checkout.component.ts → buildPayboxData()`
```typescript
PayboxProduction:  true,        // era: false
PayboxEnvironment: 'prod',      // era: 'sandbox'
```

### 3. `payment.service.ts → validateTransaction()`
```typescript
// Llamar con sandbox = false
this.paymentSvc.validateTransaction(payload, false)
```

---

## 14. Tarjetas de prueba (Sandbox)

Las siguientes tarjetas están disponibles en el ambiente sandbox de PagoPlux:

### Tarjetas aprobadas

| Marca | Número |
|---|---|
| VISA | `4540 6399 3690 8783` |
| MASTERCARD | `5230 4285 9069 2129` |
| AMEX | `3766 5186 1404 404` |
| DINERS | `3641 7200 1036 08` |
| DISCOVER | `6011 7616 0337 0843` |

### Tarjetas rechazadas — Cupo no disponible

| Marca | Número |
|---|---|
| VISA | `4540 6333 5767 4263` |
| MASTERCARD | `5230 4265 1341 3979` |
| AMEX | `3766 5168 1114 324` |

### Tarjetas rechazadas — Tarjeta expirada

| Marca | Número |
|---|---|
| VISA | `4540 6365 7967 3146` |
| MASTERCARD | `5230 4229 9352 2090` |

### Tarjetas — Resultado por día par/impar

| Marca | Número | Comportamiento |
|---|---|---|
| VISA | `4540 6394 0596 6494` | Aprobada días pares, rechazada días impares |
| MASTERCARD | `5230 4248 4533 6083` | Aprobada días pares, rechazada días impares |

> Para todas las tarjetas de prueba: usar cualquier CVV (3-4 dígitos) y cualquier fecha de vencimiento futura.

---

*Documentación generada para el proyecto TechStore Checkout — Bryan David Gallegos Farinango — 2026*
