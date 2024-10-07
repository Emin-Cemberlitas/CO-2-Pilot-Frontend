import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { MatButtonModule } from '@angular/material/button'; 
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from '../material.module';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from './api.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CashFlowChartComponent } from './cash-flow-chart/cash-flow-chart.component';
import { SankeyChartComponent } from './sankey-chart/sankey-chart.component';
import { CompressionTechnologyComponent } from './compression-technology/compression-technology.component';

@NgModule({
  imports: [
    MaterialModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule, 
    MatButtonModule, 
    MatSliderModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatRadioModule,
    HammerModule,
    MatSnackBarModule,
    NgxChartsModule,
    MatTooltipModule
  ],
  providers: [
    provideAnimationsAsync(),
    DataService
  ],
  bootstrap: [AppComponent],
  declarations: [AppComponent,
    CashFlowChartComponent,
    SankeyChartComponent,
    CompressionTechnologyComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  
})
export class AppModule { }
