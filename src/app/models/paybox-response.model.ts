/**
 * Modelo tipado completo de la respuesta del callback onAuthorize de PagoPlux.
 * Contiene los 28 campos documentados en el skill paybox-angular.
 *
 * Referencia: paybox-angular-skill/references/response-fields.md
 */
export interface PayboxResponse {
  /** Estado del pago. Solo "succeeded" indica éxito. */
  status: 'succeeded' | 'failed';

  /** Monto total cobrado. */
  amount?: number;

  /** Monto efectivamente autorizado. */
  amountAuthorized?: number;

  /** Monto con impuestos. */
  amountWTaxes?: string;

  /** Monto sin impuestos. */
  amountWoTaxes?: string;

  /** Valor de impuestos desglosados. */
  taxesValue?: string;

  /** Tasa de descuento aplicada. null si no hay descuento. */
  discountRate?: number | null;

  /** Valor de intereses por diferidos. */
  interestValue?: number;

  /** "SI" = con intereses / "NO" = sin intereses. */
  interests?: string;

  /** Número de diferidos. 0 = pago corriente. */
  deferred?: number;

  /** Número de tarjeta enmascarado. Ej: "4540 63XX XXXX 8783" */
  cardInfo?: string;

  /** Marca de la tarjeta. Ej: "VISA", "MASTERCARD". */
  cardIssuer?: string;

  /** "credit" = crédito / "debit" = débito. */
  cardType?: string;

  /** Cédula o RUC del tarjetahabiente (10 dígitos EC). */
  clientID?: string;

  /** Nombre del tarjetahabiente en mayúsculas. */
  clientName?: string;

  /** Nombre completo (campo alternativo a clientName). */
  fullname?: string;

  /** Email del cliente. */
  email?: string;

  /** Teléfono del cliente. */
  phone?: string;

  /** Dirección de facturación. */
  direction?: string;

  /** UUID único de la transacción en PagoPlux. */
  id_transaccion?: string;

  /** Voucher/token de autorización. Usar para validación server-side. */
  token?: string;

  /** Fecha y hora de la transacción. Formato: "YYYY-MM-DD HH:mm:ss" */
  fecha?: string;

  /** Estado descriptivo del pago. Ej: "PAGADO". */
  state?: string;

  /** Tipo de pago usado. Ej: "TARJETA". */
  tipoPago?: string;

  /** "UNIQUE" = pago único. */
  paymentType?: string;

  /** Descripción enviada en el objeto data. */
  description?: string;

  /** Valor del campo PayboxExtras. */
  extras?: string;

  /** Entidad adquirente. */
  acquirer?: string;

  /** Merchant ID del comercio. */
  mid?: string;

  /** Terminal ID. */
  tid?: string;

  /** Código de error (solo en respuestas fallidas). */
  code?: number;
}
