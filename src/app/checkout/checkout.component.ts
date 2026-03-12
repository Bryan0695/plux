import {
  Component,
  NgZone,
  OnInit,
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PayboxData, PayboxResponse, ValidationDetail, ValidationRequest } from '../models/paybox-data.model';
import { PaymentService }        from '../services/payment.service';

declare var iniciarDatos: any;

@Component({
  selector:    'app-checkout',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls:   ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {

  // ── Estado UI ──────────────────────────────────────────────────────────────
  formSubmitted    = false;
  buyerReady       = false;
  resultModalOpen  = false;

  // Éxito: datos completos de la API de validación
  validationDetail: ValidationDetail | null = null;

  // Rechazo: datos crudos del SDK (la API no se llama en fallos)
  paymentError: PayboxResponse | null = null;

  // ── Formulario ─────────────────────────────────────────────────────────────
  buyerForm!: FormGroup;

  constructor(
    private fb:         FormBuilder,
    private paymentSvc: PaymentService,
    private zone:       NgZone,
  ) {}

  ngOnInit(): void {
    this.buyerForm = this.fb.group({
      name:    ['', Validators.required],
      email:   ['', [Validators.required, Validators.email]],
      phone:   ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  // ── Validación y acceso al formulario ──────────────────────────────────────

  /** Devuelve true si el campo debe mostrar error */
  fieldError(field: string): boolean {
    const ctrl = this.buyerForm.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.formSubmitted);
  }

  /** Devuelve true si el campo tiene el error especificado */
  hasError(field: string, error: string): boolean {
    return !!this.buyerForm.get(field)?.hasError(error) && this.fieldError(field);
  }

  // ── Acción: continuar al pago ──────────────────────────────────────────────

  continuar(): void {
    this.formSubmitted = true;
    if (this.buyerForm.invalid) return;

    this.buyerReady = true;
    try {
      iniciarDatos(this.buildPayboxData());
    } catch {
      console.warn('[PagoPlux] SDK no disponible en este entorno.');
    }
  }

  // ── SDK PagoPlux ───────────────────────────────────────────────────────────

  private buildPayboxData(): PayboxData {
    const f = this.buyerForm.value;
    return {
      PayboxRemail:               'correoplux@plusec123.com',
      PayboxRename:               'TechStore Ecuador',
      PayboxSendmail:             f.email,
      PayboxSendname:             f.name,
      PayBoxClientPhone:          f.phone,
      PayboxDirection:            f.address,
      PayBoxClientIdentification: '1710034065',
      PayboxBase0:                '9.02',
      PayboxBase12:               '1.18',
      PayboxDescription:          'Curso Full Stack con IA Integrada',
      PayboxProduction:           false,
      PayboxEnvironment:          'sandbox',
      PayboxLanguage:             'es',
      PayboxPagoPlux:             true,
      PayboxRecurrent:            false,
      PayboxCobroPrueba:          false,
      consumptionCode:            'ORDER-2025-001',
      onAuthorize: (response: PayboxResponse) => {
        this.zone.run(() => {
          // Ignorar cierres por timeout/cancelación (sin token ni datos de tarjeta)
          const hasCardData = !!(response.scheme || response.cardIssuer || response.card || response.cardInfo);
          const hasTxId     = !!(response.transaccion_id || response.id_transaccion);
          if (!response.token && !hasCardData && !response.code) return;

          if (response.token && hasTxId) {
            // ── Éxito: validar con la API y usar su respuesta para el modal ──
            const payload: ValidationRequest = {
              token:  response.token,
              date:   response.fecha ?? new Date().toISOString(),
              amount: response.amount,
            };
            this.paymentSvc.validateTransaction(payload, true).subscribe({
              next: (res) => {
                this.zone.run(() => {
                  this.validationDetail = res.detail;
                  this.resultModalOpen  = true;
                });
              },
              error: () => {
                // Fallback si la API no responde: mostrar datos del SDK
                this.validationDetail = null;
                this.paymentError     = response;
                this.resultModalOpen  = true;
              },
            });
          } else {
            // ── Rechazo: mostrar error con datos del SDK ──
            this.paymentError    = response;
            this.resultModalOpen = true;
          }
        });
      },
    };
  }

  // ── Modal resultado ────────────────────────────────────────────────────────

  closeResult(): void {
    this.resultModalOpen  = false;
    this.validationDetail = null;
    this.paymentError     = null;
  }
}
