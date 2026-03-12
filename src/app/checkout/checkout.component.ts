import {
  AfterViewInit,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule }                         from '@angular/forms';

import { PayboxData, PayboxResponse, ValidationRequest } from '../models/paybox-data.model';
import { PaymentService }                      from '../services/payment.service';

/**
 * Declaración global del puente Angular ↔ PagoPlux SDK.
 * La función vive en src/assets/js/indexPagoPlux.js
 * y se registra en angular.json → "scripts".
 */
declare var iniciarDatos: any;

@Component({
  selector:     'app-checkout',
  standalone:   true,
  imports:      [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl:  './checkout.component.html',
  styleUrls:    ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, AfterViewInit {

  // ── Estado UI ──────────────────────────────────────────────────────────────
  sdkAvailable      = false;
  payboxOverlayOpen = false;
  processingPayment = false;
  paymentResult: PayboxResponse | null = null;
  resultModalOpen = false;

  // ── Formulario comprador ───────────────────────────────────────────────────
  buyerForm!: FormGroup;

  // ── Campos del simulador Paybox ────────────────────────────────────────────
  pbNum     = '';
  pbExp     = '';
  pbCvv     = '';
  pbDoc     = '';
  pbDocType = 'CED';
  pbName    = '';
  pbCuotas  = 'corriente';
  pbErrors: Record<string, string> = {};

  // ── Mapa de resultados por número de tarjeta ───────────────────────────────
  private readonly CARD_DB: Record<string, { ok: boolean | 'par'; issuer: string; err: string | null }> = {
    '4540639936908783': { ok: true,   issuer:'VISA',       err: null },
    '376651861404404':  { ok: true,   issuer:'AMEX',       err: null },
    '5230428590692129': { ok: true,   issuer:'MASTERCARD', err: null },
    '36417200103608':   { ok: true,   issuer:'DINERS',     err: null },
    '6011761603370843': { ok: true,   issuer:'DISCOVER',   err: null },
    '4540633357674263': { ok: false,  issuer:'VISA',       err:'Cupo no disponible' },
    '376651681114324':  { ok: false,  issuer:'AMEX',       err:'Cupo no disponible' },
    '5230426513413979': { ok: false,  issuer:'MASTERCARD', err:'Cupo no disponible' },
    '36707777533427':   { ok: false,  issuer:'DINERS',     err:'Cupo no disponible' },
    '6011635662534327': { ok: false,  issuer:'DISCOVER',   err:'Cupo no disponible' },
    '4540636579673146': { ok: false,  issuer:'VISA',       err:'Tarjeta Expirada' },
    '376651373069836':  { ok: false,  issuer:'AMEX',       err:'Tarjeta Expirada' },
    '5230422993522090': { ok: false,  issuer:'MASTERCARD', err:'Tarjeta Expirada' },
    '36899627890729':   { ok: false,  issuer:'DINERS',     err:'Tarjeta Expirada' },
    '6011584522711685': { ok: false,  issuer:'DISCOVER',   err:'Tarjeta Expirada' },
    '4540632093612050': { ok: false,  issuer:'VISA',       err:'Tarjeta Bloqueada' },
    '376651198045250':  { ok: false,  issuer:'AMEX',       err:'Tarjeta Bloqueada' },
    '5230424748383364': { ok: false,  issuer:'MASTERCARD', err:'Tarjeta Bloqueada' },
    '30513704308648':   { ok: false,  issuer:'DINERS',     err:'Tarjeta Bloqueada' },
    '6011550021804842': { ok: false,  issuer:'DISCOVER',   err:'Tarjeta Bloqueada' },
    '4540639405966494': { ok:'par',   issuer:'VISA',       err:'Día impar — Transacción rechazada' },
    '376651368448755':  { ok:'par',   issuer:'AMEX',       err:'Día impar — Transacción rechazada' },
    '5230424845336083': { ok:'par',   issuer:'MASTERCARD', err:'Día impar — Transacción rechazada' },
    '38164167149624':   { ok:'par',   issuer:'DINERS',     err:'Día impar — Transacción rechazada' },
    '6011994276172051': { ok:'par',   issuer:'DISCOVER',   err:'Día impar — Transacción rechazada' },
  };

  constructor(
    private fb:         FormBuilder,
    private paymentSvc: PaymentService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buyerForm = this.fb.group({
      name:    ['Monica Sanchez',           Validators.required],
      email:   ['juan@ejemplo.com',         [Validators.required, Validators.email]],
      phone:   ['0991234567',               Validators.required],
      address: ['Av. Amazonas 123, Quito',  Validators.required],
    });
  }

  /**
   * Hook indicado en la documentación de PagoPlux para iniciar el SDK.
   * El DOM ya está renderizado en este punto.
   */
  ngAfterViewInit(): void {
    setTimeout(() => this.initPaybox(), 900);
  }

  // ── Inicialización SDK PagoPlux ────────────────────────────────────────────

  private initPaybox(): void {
    try {
      iniciarDatos(this.buildPayboxData());
      this.sdkAvailable = true;
    } catch {
      // SDK externo no disponible → activa botón fallback (simulador)
      this.sdkAvailable = false;
    }
  }

  /**
   * Construye el objeto data de PagoPlux leyendo los valores
   * actuales del formulario del comprador.
   */
  private buildPayboxData(): PayboxData {
    const f = this.buyerForm.value;
    return {
      PayboxRemail:               'test@pagoplux.com',
      PayboxRename:               'TechStore Ecuador',
      PayboxSendmail:             f.email   || 'cliente@ejemplo.com',
      PayboxSendname:             f.name    || 'Cliente',
      PayBoxClientPhone:          f.phone   || '0999999999',
      PayboxDirection:            f.address || 'Quito, Ecuador',
      PayBoxClientIdentification: '1710034065',
      PayboxBase0:                '9.02',
      PayboxBase12:               '1.18',
      PayboxDescription:          'Curso Full Stack con IA Integrada',
      PayboxProduction:           false,
      PayboxEnvironment:          'sandbox',
      PayboxLanguage:             'es',
      PayboxPagoPlux:             false,
      PayboxRecurrent:            false,
      PayboxCobroPrueba:          false,
      consumptionCode:            'ORDER-2025-001',
      onAuthorize: (response: PayboxResponse) => {
        this.payboxOverlayOpen = false;

        if (response.status === 'succeeded' && response.token && response.fecha) {
          const payload: ValidationRequest = {
            token:  response.token,
            date:   response.fecha,
            amount: response.amount,
          };
          this.paymentSvc.validateTransaction(payload, true).subscribe({
            next:  (res) => console.log('[PagoPlux] Validación REST:', res),
            error: (err) => console.warn('[PagoPlux] Validación no disponible en sandbox:', err),
          });
        }

        setTimeout(() => {
          this.paymentResult   = response;
          this.resultModalOpen = true;
        }, 200);
      },
    };
  }

  // ── Callback interno del simulador fallback ────────────────────────────────

  /**
   * Usado por el simulador Paybox (fallback) cuando el SDK real no está disponible.
   * Replica el mismo flujo que onAuthorize del objeto data.
   */
  private handleAuthorize(response: PayboxResponse): void {
    this.payboxOverlayOpen = false;

    if (response.status === 'succeeded' && response.token && response.fecha) {
      const payload: ValidationRequest = {
        token:  response.token,
        date:   response.fecha,
        amount: response.amount,
      };
      this.paymentSvc.validateTransaction(payload, true).subscribe({
        next:  (res) => console.log('[PagoPlux] Validación REST:', res),
        error: (err) => console.warn('[PagoPlux] Validación no disponible en sandbox:', err),
      });
    }

    setTimeout(() => {
      this.paymentResult   = response;
      this.resultModalOpen = true;
    }, 200);
  }

  // ── Simulador Paybox (fallback) ────────────────────────────────────────────

  openPaybox(): void {
    this.pbName   = this.buyerForm.value.name || '';
    this.pbErrors = {};
    this.processingPayment = false;
    this.payboxOverlayOpen = true;
  }

  closePaybox(): void {
    this.payboxOverlayOpen = false;
  }

  procesarPago(): void {
    const num  = this.pbNum.replace(/\s/g, '');
    const doc  = this.pbDoc.replace(/\D/g, '');
    this.pbErrors = {};

    if (num.length < 13)     { this.pbErrors['pbNum']  = 'El número de tarjeta es obligatorio';       return; }
    if (this.pbExp.length < 5) { this.pbErrors['pbExp']  = 'La fecha de vencimiento es obligatoria';   return; }
    if (this.pbCvv.length < 3) { this.pbErrors['pbCvv']  = 'El CVV es obligatorio';                    return; }
    if (!this.pbName.trim())   { this.pbErrors['pbName'] = 'El nombre del titular es obligatorio';     return; }
    if (doc.length === 0)      { this.pbErrors['pbDoc']  = 'La cédula es obligatoria';                 return; }
    if (doc.length !== 10)     { this.pbErrors['pbDoc']  = `Cédula inválida: ingresaste ${doc.length} dígito${doc.length === 1 ? '' : 's'}, se requieren exactamente 10`; return; }

    this.processingPayment = true;

    setTimeout(() => {
      const info    = this.CARD_DB[num] ?? { ok: false, issuer: this.guessIssuer(num), err: 'Tarjeta no reconocida en Sandbox' };
      const success = info.ok === true || (info.ok === 'par' && new Date().getDate() % 2 === 0);
      const errMsg  = (info.ok === 'par' && !success) ? info.err : (!success ? info.err : null);
      this.processingPayment = false;
      this.handleAuthorize(this.buildResponse(success, errMsg, info.issuer, num));
    }, 2000);
  }

  filterDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  formatCard(value: string): string {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  formatExp(value: string): string {
    const v = value.replace(/\D/g, '').slice(0, 4);
    return v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  }

  // ── Modal resultado ────────────────────────────────────────────────────────

  closeResult(): void {
    this.resultModalOpen = false;
    this.paymentResult   = null;
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private buildResponse(ok: boolean, errMsg: string | null, issuer: string, num: string): PayboxResponse {
    const now   = new Date();
    const pad   = (n: number) => n < 10 ? '0' + n : String(n);
    const fecha = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const masked = `${num.slice(0,4)} ${num.slice(4,6)}XX XXXX ${num.slice(-4)}`;

    if (ok) {
      return {
        status:'succeeded', amount:10.20, deferred:0, interests:'NO', interestValue:0,
        amountWoTaxes:'9.02', amountWTaxes:'1.18', cardInfo:masked, cardIssuer:issuer,
        cardType:'credit', clientID:this.pbDoc, clientName:this.pbName.toUpperCase(),
        fecha, id_transaccion:'SBX-'+Date.now(), state:'PAGADO', token:this.makeToken(),
        tipoPago:'TARJETA', description:'Curso Full Stack con IA Integrada',
        acquirer:'INTERNA', paymentType:'UNIQUE', mid:'0000000000', tid:'PX000000',
      };
    }
    return { status:'failed', description: errMsg ?? 'Error', code:2, cardIssuer:issuer, cardInfo:masked, fecha };
  }

  private makeToken(): string {
    const rand = (n: number) => Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');
    const d    = new Date();
    const pad  = (n: number) => n < 10 ? '0' + n : String(n);
    return `${rand(6)}-${String(d.getFullYear()).slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${rand(6)}`;
  }

  private guessIssuer(n: string): string {
    if (/^4/.test(n))               return 'VISA';
    if (/^5[1-5]/.test(n))          return 'MASTERCARD';
    if (/^3[47]/.test(n))           return 'AMEX';
    if (/^3(?:0[0-5]|[68])/.test(n)) return 'DINERS';
    if (/^6011/.test(n))            return 'DISCOVER';
    return 'DESCONOCIDA';
  }
}
