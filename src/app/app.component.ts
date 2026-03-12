import { Component }        from '@angular/core';
import { CheckoutComponent } from './checkout/checkout.component';

@Component({
  selector:    'app-root',
  standalone:  true,
  imports:     [CheckoutComponent],
  template:    '<app-checkout></app-checkout>',
})
export class AppComponent {}
