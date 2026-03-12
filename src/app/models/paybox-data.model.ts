/**
 * Tipado completo del objeto de configuración que consume el SDK de PagoPlux.
 * Incluye campos obligatorios, opcionales y los exclusivos de pagos recurrentes.
 */
export interface PayboxData {
  // ── Obligatorios ──────────────────────────────────────────────────────────
  /** Email del comercio registrado en PagoPlux (valida MID/TID). */
  PayboxRemail: string;
  /** Email del cliente que realiza el pago. */
  PayboxSendmail: string;
  /** Nombre del establecimiento en PagoPlux. */
  PayboxRename: string;
  /** Nombre del cliente / tarjetahabiente. */
  PayboxSendname: string;
  /** Subtotal sin IVA (máx. 2 decimales). */
  PayboxBase0: string;
  /** Subtotal con IVA incluido (máx. 2 decimales). */
  PayboxBase12: string;
  /** Descripción visible en el recibo de pago. */
  PayboxDescription: string;
  /** true = Producción (cobra real), false = Sandbox (no afecta). */
  PayboxProduction: boolean;
  /** 'prod' | 'sandbox' — ambiente de ejecución del botón. */
  PayboxEnvironment: 'prod' | 'sandbox';
  /** Idioma del widget. 'es' = español. */
  PayboxLanguage: string;
  /** true = usa iframe PagoPlux; false = usa botón externo del comercio. */
  PayboxPagoPlux: boolean;
  /** Dirección del tarjetahabiente. */
  PayboxDirection: string;
  /** Teléfono del tarjetahabiente. */
  PayBoxClientPhone: string;

  // ── Opcionales ────────────────────────────────────────────────────────────
  PayBoxClientName?: string;
  PayBoxClientIdentification?: string;
  PayboxOnlyCredit?: boolean;
  PayboxOnlyDebit?: boolean;
  PayboxEvento?: string;
  PayboxExtras?: string;
  PayboxPermitirBloquearDiferimientos?: boolean;
  PayboxPermitirDatosAdicionales?: boolean;
  PayboxIdElement?: string;
  consumptionCode?: string;

  // ── Pagos recurrentes ──────────────────────────────────────────────────────
  PayboxRecurrent?: boolean;
  PayboxIdPlan?: string;
  PayboxPermitirCalendarizar?: boolean;
  PayboxPagoInmediato?: boolean;
  PayboxCobroPrueba?: boolean;
  PayboxAmountVariablePlan?: boolean;
  PayboxFrequencyPlan?: 'SEM' | 'MEN' | 'BME' | 'TME' | 'SME' | 'ANU';
  PayboxTieneIvaPlan?: boolean;
  PayboxDescriptionPlan?: string;

  // ── Callback de autorización ───────────────────────────────────────────────
  /** Se invoca automáticamente cuando el SDK completa el proceso de pago. */
  onAuthorize?: (response: PayboxResponse) => void;
}

// ── Respuesta del SDK ───────────────────────────────────────────────────────
export interface PayboxResponse {
  status: 'succeeded' | 'failed';
  amount?: number;
  amountAuthorized?: number;
  amountWTaxes?: string;
  amountWoTaxes?: string;
  acquirer?: string;
  cardInfo?: string;
  cardIssuer?: string;
  cardType?: string;
  clientID?: string;
  clientName?: string;
  deferred?: number;
  description?: string;
  direction?: string;
  discountRate?: number | null;
  email?: string;
  extras?: string;
  fecha?: string;
  fullname?: string;
  id_transaccion?: string;
  interests?: string;
  interestValue?: number;
  mid?: string;
  paymentType?: string;
  phone?: string;
  state?: string;
  taxesValue?: string;
  tid?: string;
  tipoPago?: string;
  token?: string;
  code?: number;
}

// ── Respuesta de la API de validación ──────────────────────────────────────
export interface ValidationRequest {
  date: string;
  amount?: number;
  token: string;
}

export interface ValidationResponse {
  code: number;
  description: string;
  detail: Record<string, unknown>;
  status: 'succeeded' | 'failed';
}
