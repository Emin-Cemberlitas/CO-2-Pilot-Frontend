import { Component, OnInit, ViewChild, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef,ElementRef,SimpleChanges  } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { COUNTRIES } from './countries'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlider } from '@angular/material/slider';
import { default_prices } from './default_prices';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DataService } from './api.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type Currency = 'EUR' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'DKK' | 'GBP' | 'JPY' | 'NZD' | 'SEK' | 'USD';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class AppComponent implements OnInit {
  
  sensitivityToggle: boolean = false; 
  calculateClicked: boolean = false;
  hasScrolled: boolean = false; // Variable, um zu verhindern, dass mehrfach gescrollt wird
  compareChangedAfterCalculate: boolean = false;

  previousSymbol: string = '€';
  payback_time!: string;
  co2_savings!: number;
  compressionToggle: boolean = false; 
  paybackMin: number = 5.7;
  paybackMax: number = 10;
  payback: number = 1;
  symbol_currency!: string;
  I_cost: number = 1;
  I_TS_cost: number = 1;
  O_M_cost: number = 1;
  E_cost: number = 1;


  roiMin: number = 7;
  roiMax: number = 7.6;
  lcocMin: number = 85;
  lcocMax: number = 97;
  capexMin: number = 650;
  capexMax: number = 700;

  lcoc_sensi_lower: number = 1;
  lcoc_sensi_upper: number = 1;
  payback_period_sensi_lower: number = 1;
  payback_period_sensi_upper: number = 1;
  roi_sensi_lower: number = 1;
  roi_sensi_upper: number = 1;
  
  cumulative_OPEX: number = 1;
 cumulative_O_M: number = 1;
 cumulative_T_S: number = 1;
 capex_without_subsidy: number = 1;
 cumulative_revenue: number = 1;
 subsidy: number = 1;

 effiency_compression: number = 1;
 compression_cost_benefit: number = 1;

 RB_framesize!: string;
 RG_framesize!: string;
 payback_display!: string;
 roi_display!: string;
  showResults: boolean = false;
  loading: boolean = false;
  loading_pdf: boolean = false;
  justCalculated = false;
  sensitivityVisible = false;
  sensitivityEnabledDuringCalculation: boolean = false; // Neue Kontrollvariable
  showCompressionTab: boolean = false;

  results: any = {}; // Variable to store results from Flask


    // Währungsumrechnungskurse
    conversionRates: Record<Currency, number> = {
    "EUR": 1,
    "AUD": 1.6792,
    "CAD": 1.4734,
    "CHF": 0.9623,
    "CNY": 7.9178,
    "DKK": 7.4604,
    "GBP": 0.8623,
    "JPY": 157.5246,
    "NZD": 1.8102,
    "SEK": 11.7227,
    "USD": 1.0970,
  };

  // Währungssymbole
  currencySymbols: Record<Currency, string> = {
    "AUD": "$", "CAD": "$", "CHF": "CHF", "CNY": "¥", "DKK": "kr.",
    "EUR": "€", "GBP": "£", "JPY": "¥", "NZD": "$", "SEK": "kr", "USD": "$"
  };

  symbol: string = '€'; // Default Symbol
  rate: number = 1; // Default Rate

  minValue: number = 0;
  maxValue: number = 100;

  sliderValue: number = 50; 
  @ViewChild('slider') slider!: MatSlider;
  @ViewChild('elPriceInput') elPriceInput!: ElementRef;
  @ViewChild('gasPriceInput') gasPriceInput!: ElementRef;
  @ViewChild('co2PriceInput') co2PriceInput!: ElementRef;
  @ViewChild('subsidyInput') subsidyInput!: ElementRef;
  @ViewChild('resultsContainer') private resultsContainer!: ElementRef;

  sliderValue1: number = 1;
  sliderValue2: number = 15;
  sliderValue3: number = 95;

  minValue1: number = 0.1;
  maxValue1: number = 10;
  minValue2: number = 10;
  maxValue2: number = 80;
  minValue3: number = 80;
  maxValue3: number = 99;

  tooltipText1: string = 'Information about base data';
  tooltipText2: string = 'Scope of heat pump defines the scope of supply. "Equipment (core machines)" mainly refers to the compressor, heat exchanger, valve and motor. Entire Plant means the entire + EPC scope including grid connection, civil work and connection to heat sink and heat source';
  tooltipText3: string = 'Information about heat sink';
  tooltipText4: string = 'Information about heat source';
  tooltipText5: string = 'Information about Current pricings';
  tooltipText6: string = 'Information about Current pricings';

  filteredRegions?: Observable<string[]>;

  // Base data
  industryControl = new FormControl('');
  regionControl = new FormControl('', this.validCountryValidator(COUNTRIES)); 
  currencyControl = new FormControl('EUR');  
  subsidiesControl = new FormControl('No');
  regions: string[] = COUNTRIES;

  validateCountry(control: FormControl) {
    const value = control.value;
    if (!this.regions.includes(value)) {
      return { invalidCountry: true };
    }
    return null;
  }

  // Equipment data
  lifetimeControl = new FormControl(30.0, [Validators.required, Validators.min(1.0)]); 
  op_hoursControl = new FormControl(8500.0, [Validators.required, Validators.min(1000.0), Validators.max(8760.0)]);
  yearControl = new FormControl(2027.0, [Validators.required, Validators.min(2024)]);

  // CO2 figures
  transportControl = new FormControl('Shipping');
  storageControl = new FormControl(800, [Validators.required, Validators.min(10.0)]);

  // Current pricings
  el_priceControl = new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]);
  gas_priceControl = new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]);
  co2_priceControl = new FormControl<number | null>(null);
  discount_rate_Control = new FormControl(8, [Validators.required, Validators.min(0)]); 

  subsidyamount_Control = new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]);

  subsidy_control = new FormControl('No');
  sensitivityElementControl = new FormControl('', Validators.required);
  sensitivityRangeControl = new FormControl('', Validators.required);
  compression_control = new FormControl('Inline');
  compare_control = new FormControl(false); 
  

 

  form: FormGroup;

  constructor(private fb: FormBuilder, private _snackBar: MatSnackBar, private cdr: ChangeDetectorRef, private http: HttpClient, private dataService: DataService) {
    this.form = this.fb.group({
    });
  }





  
  
  ngOnInit() {
    this.form = this.fb.group({
      sliderValue1: [this.sliderValue1, Validators.required],
      // andere Form Controls
    });
  
    const sliderValue1Control = this.form.get('sliderValue1');
    if (sliderValue1Control) {
      sliderValue1Control.valueChanges.subscribe(value => {
        this.sliderValue1 = value;
        this.cdr.detectChanges();
      });
    }

    this.regionControl.valueChanges.subscribe(value => this.onCountryChange(value));
    this.currencyControl.valueChanges.subscribe(value => this.updateCurrencyLabels());

    // Beobachten Sie Änderungen des subsidy_control Wertes
    this.subsidy_control.valueChanges.subscribe(value => {
      if (value === 'No') {
        this.subsidyamount_Control.reset();
      }
    });

    this.updateSliderStyle('slider1');
    this.updateSliderStyle('slider2');
    this.updateSliderStyle('slider3');
    this.updateSliderStyle('slider4');  

    this.transportControl.valueChanges.subscribe(() => {

    });
    this.compare_control.valueChanges.subscribe(value => {
      if (value) {
        // Markiere, dass die Checkbox nach dem letzten Calculate geklickt wurde
        this.compareChangedAfterCalculate = true;
      } else {
        this.showCompressionTab = false; // Verstecke den Tab, wenn die Checkbox deaktiviert wird
      }
    });
  }


  

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sliderValue1'] && !changes['sliderValue1'].isFirstChange()) {
    }
    console.log('OPEX:', this.cumulative_OPEX);
    console.log('O&M:', this.cumulative_O_M);
    console.log('T&S:', this.cumulative_T_S);
    console.log('CAPEX:', this.capex_without_subsidy);
    console.log('Revenue:', this.cumulative_revenue);
    console.log('Subsidy:', this.subsidy);
  }
  

  adjustYear(event: FocusEvent) {
    const inputElement = event.target as HTMLInputElement;
    const yearValue = Number(inputElement.value);
    if (yearValue < 2024) {
      this.yearControl.setValue(2024);
    } else if (yearValue > 2035) {
      this.yearControl.setValue(2035);
    }
  }

  adjustlifetime(event: FocusEvent) {
    const inputElement = event.target as HTMLInputElement;
    const lifetimeValue = Number(inputElement.value);
    if (lifetimeValue < 5) {
      this.lifetimeControl.setValue(5);
    } else if (lifetimeValue > 50) {
      this.lifetimeControl.setValue(50);
    }
    }

  adjustheatdemand(event: FocusEvent) {
    const inputElement = event.target as HTMLInputElement;
    const heatdemandValue = Number(inputElement.value);
    if (heatdemandValue < 1) {
      this.storageControl.setValue(1);
    } else if (heatdemandValue > 10000) {
      this.storageControl.setValue(9999);
    }
  }

  adjustOpHours(event: FocusEvent) {
    const inputElement = event.target as HTMLInputElement;
    const hoursValue = Number(inputElement.value);
    if (hoursValue < 1000) {
      this.op_hoursControl.setValue(1000);
    } else if (hoursValue > 8760) {
      this.op_hoursControl.setValue(8760);
    }
  }
  
  
  resetPlaceholderStyles() {
    const inputs = [this.elPriceInput, this.gasPriceInput, this.co2PriceInput];
    inputs.forEach(input => {
      const nativeElement = input.nativeElement;
      nativeElement.classList.remove('input-active');
      nativeElement.classList.add('input-placeholder');
    });
  }
  

  get_exchange_rate(to_currency: Currency): number {
    return this.conversionRates[to_currency];
  }

  updateCurrencyLabels() {
    const selectedCurrency = this.currencyControl.value as Currency;
    this.rate = this.get_exchange_rate(selectedCurrency);
    this.symbol = this.currencySymbols[selectedCurrency];

    if (!this.calculateClicked) {
      this.updatePricingValues();
  }    this.cdr.detectChanges();
  }

  updatePricingValues() {
    if (this.regionControl.value && default_prices.hasOwnProperty(this.regionControl.value)) {
      const values: [number, number, number] = default_prices[this.regionControl.value];
      this.el_priceControl.setValue(this.roundToOneDecimal(values[0] * this.rate));
      this.gas_priceControl.setValue(this.roundToOneDecimal(values[1] * this.rate));
      this.co2_priceControl.setValue(this.roundToOneDecimal(values[2] * this.rate));
    } else {
      this.el_priceControl.setValue(null);
      this.gas_priceControl.setValue(null);
      this.co2_priceControl.setValue(null);
    }
    this.resetPlaceholderStyles();
  }
  
  onCountryChange(selectedCountry: string | null) {
    if (selectedCountry && default_prices.hasOwnProperty(selectedCountry)) {
      const values: [number, number, number] = default_prices[selectedCountry];
      this.el_priceControl.setValue(values[0] * this.rate);
      this.gas_priceControl.setValue(values[1] * this.rate);
      this.co2_priceControl.setValue(values[2] * this.rate);
    } else {
      this.el_priceControl.setValue(null);
      this.gas_priceControl.setValue(null);
      this.co2_priceControl.setValue(null);
    }
    this.resetPlaceholderStyles();
  }
  
    // Funktion zum 4-Sekunden-Deaktivieren des Buttons
    disableButtonTemporarily() {
      this.loading_pdf = true;  // Deaktivieren des Buttons
  
      // Timer, um den Button nach 4 Sekunden wieder zu aktivieren
      setTimeout(() => {
        this.loading_pdf = false;  // Button wieder aktivieren
        this.cdr.detectChanges(); 
      }, 4000);
      this.cdr.detectChanges();
    }

  downloadPDF() {
    
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType: 'blob' as 'json', 
      withCredentials: true, 
    };
  
    //    this.http.post('http://127.0.0.1:5000/generate_pdf', {}, options)

    this.http.post('https://co-2-pilot-a0h8b8fehudqhbfy.westeurope-01.azurewebsites.net/generate_pdf', {}, options)
      .subscribe((response: any) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'CO-2-Pilot_Results.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      }, error => {
        console.error('Error generating PDF:', error);
      });
  }
  


  onSliderChange(event: any, sliderName: string) {
    this.validateNonNegativeValues(sliderName);
    switch (sliderName) {
      case 'sliderValue1':
        this.form.get('sliderValue1')?.setValue(event.value, { emitEvent: true });
        break;
      case 'sliderValue2':
        this.form.get('sliderValue2')?.setValue(event.value, { emitEvent: true });
        break;
      case 'sliderValue3':
        this.form.get('sliderValue3')?.setValue(event.value, { emitEvent: true });
        break;
      case 'sliderValue4':
        this.form.get('sliderValue4')?.setValue(event.value, { emitEvent: true });
        break;
    }
    this.cdr.detectChanges(); 
    this.updateSliderStyle(sliderName); 
  }

  validateNonNegativeValues(slider: string) {
    const sliderKey = `${slider}Value` as keyof this;
    const value = this[sliderKey] as unknown as number;
    if (value < 0) {
      this[sliderKey] = 0 as any;
    }
  }


  onInputChange(event: any, sliderName: string) {
    this.validateNonNegativeValues(sliderName);
    switch (sliderName) {
      case 'sliderValue1':
        this.form.get('sliderValue1')?.setValue(event.value, { emitEvent: true });
        break;
      case 'sliderValue2':
        this.form.get('sliderValue2')?.setValue(event.value, { emitEvent: true });
        break;
      case 'sliderValue3':
        this.form.get('sliderValue3')?.setValue(event.value, { emitEvent: true });
        break;
      case 'sliderValue4':
        this.form.get('sliderValue4')?.setValue(event.value, { emitEvent: true });
        break;
    }
    this.cdr.detectChanges(); 
    this.updateSliderStyle(sliderName); 
  }

  private _filter(name: string): string[] {
    const filterValue = name.toLowerCase();
    return COUNTRIES.filter(option => option.toLowerCase().includes(filterValue));
  }

  displayFn(country: string): string {
    return country ? country : '';
  }

  private validCountryValidator(countries: string[]): Validators {
    return (control: FormControl): { [key: string]: any } | null => {
      const isValid = countries.includes(control.value);
      return isValid ? null : { invalidCountry: { value: control.value } };
    };
  }


  
  
  

  updateSliderStyle(slider: string) {
    let value: number;
    let minValue: number;
    let maxValue: number;
    let sliderElement: HTMLElement | null;

    switch (slider) {
      case 'slider1':
        value = this.sliderValue1;
        minValue = this.minValue1;
        maxValue = this.maxValue1;
        sliderElement = document.querySelector('#slider1-container .slider') as HTMLElement;
        break;
      case 'slider2':
        value = this.sliderValue2;
        minValue = this.minValue2;
        maxValue = this.maxValue2;
        sliderElement = document.querySelector('#slider2-container .slider') as HTMLElement;
        break;
      case 'slider3':
        value = this.sliderValue3;
        minValue = this.minValue3;
        maxValue = this.maxValue3;
        sliderElement = document.querySelector('#slider3-container .slider') as HTMLElement;
        break;
      default:
        return;
    }

    if (sliderElement) {
      const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
      sliderElement.style.background = `linear-gradient(to right, rgb(40,186,218) 0%, rgb(40,186,218) ${percentage}%, #d3d3d3 ${percentage}%, #d3d3d3 100%)`;
    }
  }


  removePlaceholder(event: FocusEvent): void {
    const inputElement = event.target as HTMLInputElement;
    inputElement.classList.remove('input-placeholder');
    inputElement.classList.add('input-active');
  }

  addPlaceholder(event: FocusEvent): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value === '') {
      inputElement.classList.remove('input-active');
      inputElement.classList.add('input-placeholder');
    }
  }


  // Fehlermeldungen
  returnTempError: string | null = null;
  supplyTempError: string | null = null;
  operatingHoursError: string | null = null;







validateNumberInput(event: any) {
  const input = event.target.value;
  event.target.value = input.replace(/[^0-9]/g, '');
}



validateInputs(): boolean {
    


    if (this.el_priceControl.invalid || this.gas_priceControl.invalid || this.lifetimeControl.invalid || 
        this.op_hoursControl.invalid || this.storageControl.invalid || this.returnTempError || 
        this.supplyTempError) {
        return false;
    }
    return true;
}

validateElPrice(): void {
  let value = this.el_priceControl.value;
  if (value === null || value < 10) {
    this.el_priceControl.setValue(10);
  } else {
    this.el_priceControl.setValue(this.roundToOneDecimal(value));
  }
}

validategasPrice(): void {
  let value = this.gas_priceControl.value;
  if (value === null || value < 10) {
    this.gas_priceControl.setValue(10);
  } else {
    this.gas_priceControl.setValue(this.roundToOneDecimal(value));
  }
}

roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}



validateForm(): boolean {
  // Überprüfen Sie die Gültigkeit jedes Formularfeldes
  if (this.industryControl.invalid || this.regionControl.invalid || this.currencyControl.invalid || this.lifetimeControl.invalid ||
      this.op_hoursControl.invalid || this.yearControl.invalid || this.storageControl.invalid ||
      this.el_priceControl.invalid || this.gas_priceControl.invalid || this.co2_priceControl.invalid) {
    return false;
  }
  return true;
}

calculate() {
  this.loading = true;
  this.showResults = false;
  this.sensitivityVisible = false;
  this.sensitivityEnabledDuringCalculation = this.sensitivityToggle; // Speichern, ob Sensitivity-Toggle aktiv war
  this.calculateClicked = true;
  this.hasScrolled = false;  // Stelle sicher, dass beim nächsten Berechnen wieder gescrollt werden kann

  this.cdr.detectChanges();
  this.compareChangedAfterCalculate = false; 

  let dataReady = false;
  let timerCompleted = false;

  if (this.compare_control.value) {
    this.showCompressionTab = true;  // Der Tab wird angezeigt, wenn die Checkbox aktiviert und Calculate geklickt wird
  } else {
    this.showCompressionTab = false; // Der Tab wird ausgeblendet, wenn die Checkbox deaktiviert und Calculate geklickt wird
  }


  // Starte den 2-Sekunden-Timer
  setTimeout(() => {
    timerCompleted = true;
    if (dataReady) {
      this.displayResults();
    }
  }, 2000);


  let requestData = {
    // Base information
    industry: this.industryControl.value,
    country: this.regionControl.value,
    currency: this.currencyControl.value,

    // Operating figures 
    lifetime: this.lifetimeControl.value,
    operationHours: this.op_hoursControl.value,
    installyear: this.yearControl.value,

    // CO2 figures 

    captured_co2: this.sliderValue1,
    co2_content: this.sliderValue2,
    co2_capture_rate: this.sliderValue3,
    transport_type: this.transportControl.value,
    distance_storage: this.storageControl.value,

    // Sensitivity analysis 
    co2Price: this.co2_priceControl.value,
    electricityPrice: this.el_priceControl.value, 
    discount_rate: this.discount_rate_Control.value,
    subsidy_amount: this.subsidyamount_Control.value,

    // Sensitivity analysis 
    sensitivity_parameter: this.sensitivityElementControl.value, 
    sensitivity_range: this.sensitivityRangeControl.value,
    sensitivity_toggle: this.sensitivityToggle ? "true" : "false",

    compression_technology: this.compression_control.value
  };

  console.log('Sending requestData:', requestData);

  this.dataService.sendData(requestData).subscribe(
    results => {
      console.log('Response from Flask:', results);
      this.results = results; // Store the results in the component variable
      this.sensitivityVisible = this.sensitivityToggle;
      this.paybackMin = results.Payback_Period_lower;
      this.paybackMax = results.Payback_Period_upper;
      this.payback = results.Payback_Period;
      this.roiMin = results.ROI_lower;
      this.roiMax = results.ROI_upper;
      this.lcocMin = results.lcoc_min;
      this.lcocMax = results.lcoc_max;

      this.I_cost =                   results.I_cost;
      this.I_TS_cost =                results.I_TS_cost;
      this.O_M_cost =                 results.O_M_cost;
      this.E_cost =                   results.E_cost;

      this.lcoc_sensi_lower =         results.lcoc_sensi_lower;
      this.lcoc_sensi_upper =         results.lcoc_sensi_upper;
      this.payback_period_sensi_lower = results.payback_period_sensi_lower;
      this.payback_period_sensi_upper = results.payback_period_sensi_upper;
      this.roi_sensi_lower =          results.roi_sensi_lower;
      this.roi_sensi_upper =          results.roi_sensi_upper;

      this.cumulative_OPEX =          results.cumulative_OPEX;
      this.cumulative_O_M =           results.cumulative_O_M;
      this.cumulative_T_S =           results.cumulative_T_S;
      this.capex_without_subsidy =    results.capex_without_subsidy;
      this.cumulative_revenue =       results.cumulative_revenue;
      this.subsidy =                  results.subsidy;
      
      this.effiency_compression =     results.effiency_compression;
      this.compression_cost_benefit = results.compression_cost_benefit;

      this.RB_framesize = results.RB_framesize;
      this.RG_framesize = results.RG_framesize;
      this.payback_display = results.payback_display;
      this.roi_display = results.roi_display;
      this.symbol_currency = results.symbol_currency;

      const cumulative_costs = results.cumulative_costs;
      const cumulative_revenues = results.cumulative_revenues;
      const cash_flows_lifetime = results.cash_flows_lifetime;
      const sensitivity_results = results.sensitivity_results;
      const RB_flow = results.RB_flow;
      const RG_flow = results.RG_flow;

      this.previousSymbol = this.symbol;
      this.updateCurrencyLabels();
      this.cdr.detectChanges();
      dataReady = true;
      if (timerCompleted) {
        this.displayResults();
      }
    },
    error => {
      console.error('Error occurred:', error);
      this.loading = false;
      this._snackBar.open('Error occurred while sending data', 'Close', { duration: 3000 });
    }
  );

}

// Hilfsmethode zum Anzeigen der Ergebnisse
displayResults() {
  this.loading = false;
  this.showResults = true;
  if (this.calculateClicked && this.sensitivityEnabledDuringCalculation) {
    this.sensitivityVisible = true;
  }
  this.cdr.detectChanges();

  // Scrollt zum Seitenanfang
  this.scrollToResults();
}



  ngAfterViewChecked() {
    if (this.showResults) {
      this.scrollToResults();
    }
  }
  
  scrollToResults() {
    if (!this.hasScrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.hasScrolled = true;  // Nach dem Scrollen setzen wir die Variable auf true
    }
  }
  


  onSubmit() {
    this.calculate();
  }
}
