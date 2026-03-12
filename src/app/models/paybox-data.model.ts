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

// ── Respuesta del SDK (campos reales devueltos por PagoPlux onAuthorize) ────
export interface PayboxResponse {
  // Identificadores
  token?:          string;   // token de autorización (indica éxito cuando existe)
  transaccion_id?: string;   // UUID de la transacción
  id_transaccion?: string;   // alias alternativo

  // Tarjeta
  card?:     string;   // número enmascarado  "XXXX XXXX XXXX 8783"
  scheme?:   string;   // marca: "VISA", "MASTERCARD", etc.
  cardType?: string;   // "credit" | "debit"
  cbn?:      string;   // BIN de la tarjeta

  // Montos
  formatedAmount?:    string;   // "10.20"
  base0?:             number;   // subtotal sin IVA
  base12?:            number;   // subtotal con IVA
  discountPercentage?: number | null;

  // Titular / cliente
  sendname?:   string;   // nombre del titular
  sendmail?:   string;   // correo del cliente
  cardphone?:  string;   // teléfono registrado
  codTipoId?:  string;   // código tipo de identificación
  valTipoId?:  string;   // valor del tipo ("CC", "CI", etc.)
  cardid?:     string;   // hash de la cédula

  // Adquirente / comercio
  adquiriente?: string;   // banco adquirente "GUAYAQUIL"
  remail?:      string;   // email del comercio
  rename?:      string;   // nombre del comercio

  // Diferidos
  cuotas?:   number;   // número de cuotas (0 = corriente)
  pmtdn?:    number;
  pmttds?:   number;

  // Descripción
  description?: string;

  // 3DS
  id3DS?:        string;
  threeDSecure?: Record<string, unknown>;

  // Código de error (solo en rechazos con intento real de cobro)
  code?: number;

  // Campos legacy / alternativos que algunas versiones del SDK devuelven
  status?:      'succeeded' | 'failed';
  amount?:      number;
  cardInfo?:    string;
  cardIssuer?:  string;
  clientName?:  string;
  clientID?:    string;
  fecha?:       string;
  state?:       string;
  acquirer?:    string;
  deferred?:    number;
  interests?:   string;
  interestValue?: number;
  amountWTaxes?:  string;
  amountWoTaxes?: string;
  tipoPago?:    string;
  paymentType?: string;
  mid?:         string;
  tid?:         string;
}

// ── Respuesta de la API de validación ──────────────────────────────────────
export interface ValidationRequest {
  date: string;
  amount?: number;
  token: string;
}

export interface ValidationDetail {
  id_transaccion:   string;
  token:            string;
  amount:           number;
  amountAuthorized: number;
  amountWoTaxes:    string;
  amountWTaxes:     string;
  taxesValue:       string;
  discountRate:     number | null;
  interestValue:    number;
  interests:        string;
  deferred:         number;
  cardInfo:         string;
  cardIssuer:       string;
  cardType:         string;
  clientID:         string;
  clientName:       string;
  clientPhone:      string;
  clientDirection:  string;
  fecha:            string;
  state:            string;
  description:      string;
  extras:           string;
  acquirer:         string;
  mid:              string;
  tid:              string;
}

export interface ValidationResponse {
  code:        number;
  description: string;
  detail:      ValidationDetail;
  status:      'succeeded' | 'failed';
}
