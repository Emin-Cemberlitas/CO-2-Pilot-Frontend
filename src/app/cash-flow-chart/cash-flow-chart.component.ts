import { Component, ViewChild, ElementRef, Input, AfterViewInit, OnChanges } from '@angular/core';
import * as Plotly from 'plotly.js-dist';

@Component({
  selector: 'app-cash-flow-chart',
  templateUrl: './cash-flow-chart.component.html',
  styleUrls: ['./cash-flow-chart.component.css']
})
export class CashFlowChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('cashFlowContainer', { static: false }) cashFlowContainer!: ElementRef;

  @Input() cash_flows_lifetime: number[] = [];
  @Input() payback: number | null = null;  // Zeitpunkt des Paybacks
  @Input() lifetimeControl: number = 0;
  @Input() sensitivity_results: { [key: string]: [number[], string] } = {};
  @Input() symbol: string = '€';  // Standardwert für das Währungssymbol
  hasViewInitialized = false; 

  ngAfterViewInit() {
    this.hasViewInitialized = true;
    this.createChart();
  }
  ngOnChanges() {
    if (this.hasViewInitialized) {
      this.createChart();
    }
  }

  createChart(): void {
    const chartData: any[] = [
      {
        x: this.cash_flows_lifetime.map((_, index) => index),
        y: this.cash_flows_lifetime.map(value => parseFloat((value / 1_000_000).toFixed(1))),
        type: 'scatter',
        mode: 'lines',
        name: 'Cumulative Cash Flow',
        line: { color: 'rgb(40,186,208)' }
      }
    ];
  
    const shapes: any[] = [];  // Definiere das shapes Array hier
  
    // Sensitivity Results hinzufügen, falls vorhanden
    if (this.sensitivity_results && Object.keys(this.sensitivity_results).length > 0) {
      let colors = ['rgb(35,85,106)', 'rgb(229,0,69)'];  // Definiere die Farben für die Linien
      let i = 0;    
      for (const [key, [sensitivityCashFlows]] of Object.entries(this.sensitivity_results)) {
        chartData.push({
          x: sensitivityCashFlows.map((_, index) => index),
          y: sensitivityCashFlows.map(value => parseFloat((value / 1_000_000).toFixed(1))),
          type: 'scatter',
          mode: 'lines',
          name: `Sensitivity ${key}`,
          line: { color: colors[i % colors.length] }  // Wechsle zwischen den Farben
        });
        i++;
      }
    } else {
      // Wenn keine Sensitivity Results vorhanden sind, füge den Break-even Point hinzu
      const paybackIndex = this.cash_flows_lifetime.findIndex(value => value >= 0);
  
      if (paybackIndex !== -1 && paybackIndex > 0) {
        const previousValue = this.cash_flows_lifetime[paybackIndex - 1];
        const currentValue = this.cash_flows_lifetime[paybackIndex];
        const interpolation = -previousValue / (currentValue - previousValue);
        const paybackPointX = paybackIndex - 1 + interpolation;
  
        // Berechne den interpolierten Y-Wert (dies sollte in der Nähe von 0 liegen)
        const interpolatedYValue = previousValue + interpolation * (currentValue - previousValue);
  
        // Füge eine Markierung für den Break-even-Punkt hinzu
        chartData.push({
          x: [paybackPointX],
          y: [0],  // Der Y-Wert des Break-even-Points ist 0
          type: 'scatter',
          mode: 'markers',
          name: 'Break-even point',
          marker: { color: 'rgb(115, 198, 125)', size: 10, symbol: 'circle' }
        });
  
        // Füge die gestrichelte Linie zu shapes hinzu
        shapes.push({
          type: 'line',
          x0: paybackPointX,
          y0: 0,
          x1: paybackPointX,
          y1: Math.min(...this.cash_flows_lifetime.map(value => parseFloat((value / 1_000_000).toFixed(1)))), // Verwende den minimalen Y-Wert oder 0
          line: {
            color: 'rgb(115, 198, 125)',
            width: 2,
            dash: 'dash'  // Gestrichelte Linie
          }
        });
        
      }
    }
  

    // Füge das Layout hinzu und schließe das shapes Array ein
    const layout = {
      title: {
        text: 'Cumulative cash flow',
        font: {
          size: 14,     // Setzt die Schriftgröße
          family: 'Arial, sans-serif',  // Optionale Schriftfamilie
          weight: 'bold'  // Setzt den Titel fett
        }
      },      xaxis: { 
        title: 'Years',
        titlefont: {  
          size: 12,   
          family: 'Arial, sans-serif'
        },
        tickfont: {  
          size: 12,   
          family: 'Arial, sans-serif'
        },
        standoff: 50,  // Reduziert den Abstand zwischen der Achse und dem Titel (Wert in Pixeln)
      },
      yaxis: { 
        title: `Discounted cash flow (mio. ${this.symbol})`,
        titlefont: {  
          size: 12,   
          family: 'Arial, sans-serif'
        },
        tickfont: {  
          size: 12,   
          family: 'Arial, sans-serif'
        },
        tickformat: ',.0f' 
      },
      legend: { 
        orientation: 'h', 
        x: 0.5, 
        xanchor: 'center', 
        y: -0.2 
      },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      font: { size: 12 },
      width: 500,
      height: 500,
      shapes: shapes
    };
    
  
    if (this.cashFlowContainer) {
      Plotly.react(this.cashFlowContainer.nativeElement, chartData, layout);
    }
  }
  
  
  // Funktion zur Berechnung, ob Break-even erreicht wird
  neverReachesBreakEven(): boolean {
    return Math.max(...this.cash_flows_lifetime) < 0;
  }


}
