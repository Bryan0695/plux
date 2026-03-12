import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ValidationRequest, ValidationResponse } from '../models/paybox-data.model';

/**
 * Servicio que expone la API REST de validación de transacciones de PagoPlux.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  HOST  Sandbox    → https://apipre.pagoplux.com/transv1                 │
 * │        Producción → https://api.pagoplux.com/transv1                    │
 * │  AUTH  Basic con CADENA_BASICA generada por generateToken()             │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {

  // ── Claves secretas (decodificadas de Base64 en la documentación) ──────────
  private readonly SECRET_KEY_SANDBOX =
    'UGFnb1BsdXhBZG1pblByZTIwMjAlXzpQYWdvUGx1eEFwaV9QcmUwNF8yMDIw';
  private readonly SECRET_KEY_PROD =
    'UGFnb1BsdXhBZG1pblBybzIwMjAlXzpQYWdvUGx1eEFwaV9Qcm8wNF8yMDIw';

  private readonly BASE_SANDBOX = 'https://apipre.pagoplux.com/transv1';
  private readonly BASE_PROD    = 'https://api.pagoplux.com/transv1';

  constructor(private http: HttpClient) {}

  // ── API de validación ──────────────────────────────────────────────────────

  /**
   * Valida una transacción autorizada contra el servidor de PagoPlux.
   * @param payload   Objeto con date, amount y token obtenidos del onAuthorize.
   * @param sandbox   true (default) = usa entorno de pruebas.
   */
  validateTransaction(
    payload: ValidationRequest,
    sandbox = true
  ): Observable<ValidationResponse> {
    const host    = sandbox ? this.BASE_SANDBOX : this.BASE_PROD;
    const secret  = sandbox ? this.SECRET_KEY_SANDBOX : this.SECRET_KEY_PROD;
    const headers = new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Basic ${this.generateToken(secret)}`,
    });

    return this.http.post<ValidationResponse>(
      `${host}/transaction/validationTokenDateResource`,
      payload,
      { headers }
    );
  }

  // ── Generación del token de seguridad ──────────────────────────────────────

  /**
   * Algoritmo exacto de la documentación de PagoPlux para generar
   * la CADENA_BASICA que va en el header Authorization.
   *
   * Pasos:
   *  1. Genera una cadena aleatoria de longitud variable basada en secretKey.
   *  2. Obtiene un timestamp = Date.now() × 30.
   *  3. Concatena: cadena + 'PPX_' + secretKey + 'PPX_' + timestamp + 'AWS'.
   *  4. Codifica todo en Base64 con btoa().
   */
  private generateToken(secretKey: string): string {
    const longitud = Math.random() * secretKey.length;
    let cadena = '';
    while (cadena.length < longitud) {
      cadena += secretKey.charAt(Math.random() * longitud);
    }

    const number = new Date().getTime() * 30;

    return btoa(
      cadena + 'PPX_' + secretKey + 'PPX_' + number + 'AWS'
    );
  }
}
