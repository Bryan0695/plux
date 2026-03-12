import { NgModule }            from '@angular/core';
import { BrowserModule }       from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule }         from '@angular/forms';
import { HttpClientModule }    from '@angular/common/http';

import { AppComponent }        from './app.component';
import { CheckoutComponent }   from './checkout/checkout.component';

@NgModule({
  declarations: [
    AppComponent,
    CheckoutComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,   // para buyerForm (FormBuilder)
    FormsModule,           // para [(ngModel)] en el simulador Paybox
    HttpClientModule,      // para PaymentService (validación REST)
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
