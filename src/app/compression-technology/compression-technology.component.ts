import { Component, ViewChild, ElementRef, Input, AfterViewInit, OnChanges } from '@angular/core';
import * as Plotly from 'plotly.js-dist';

@Component({
  selector: 'app-compression-technology',
  templateUrl: './compression-technology.component.html',
  styleUrls: ['./compression-technology.component.css']
})
export class CompressionTechnologyComponent implements AfterViewInit, OnChanges {

  @ViewChild('compressionContainer', { static: false }) compressionContainer!: ElementRef;

  @Input() RB_flow: number[] = [];
  @Input() RG_flow: number[] = [];
  @Input() symbol: string = '€';  
  
  hasViewInitialized = false; 
  intersectionPoint: { x: number, y: number } | null = null;

  ngAfterViewInit() {
    this.hasViewInitialized = true;
    this.createChart();
  }

  ngOnChanges() {
    if (this.hasViewInitialized) {
      this.createChart();
    }
  }

  // Funktion zur Berechnung des Schnittpunkts der beiden Kurven
  findIntersection(): { x: number, y: number } | null {
    for (let i = 1; i < this.RB_flow.length; i++) {
      if ((this.RB_flow[i - 1] < this.RG_flow[i - 1] && this.RB_flow[i] > this.RG_flow[i]) ||
          (this.RB_flow[i - 1] > this.RG_flow[i - 1] && this.RB_flow[i] < this.RG_flow[i])) {
        // Linearinterpolation, um den genauen Schnittpunkt zu finden
        const x1 = i - 1;
        const x2 = i;
        const y1_rb = this.RB_flow[i - 1];
        const y2_rb = this.RB_flow[i];
        const y1_rg = this.RG_flow[i - 1];
        const y2_rg = this.RG_flow[i];

        const slope_rb = (y2_rb - y1_rb) / (x2 - x1);
        const slope_rg = (y2_rg - y1_rg) / (x2 - x1);

        const intersection_x = (y1_rg - y1_rb) / (slope_rb - slope_rg) + x1;
        const intersection_y = slope_rb * (intersection_x - x1) + y1_rb;

        return { x: intersection_x, y: intersection_y };
      }
    }
    return null;  
  }

  createChart() {
    // Aktualisiere die Daten für das Diagramm
    this.intersectionPoint = this.findIntersection();
  
    const chartData: any[] = [
      {
        x: this.RB_flow.map((_, index) => index),
        y: this.RB_flow.map(value => parseFloat((value / 1_000_000).toFixed(2))),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Costs for inline compressor',
        line: { color: 'rgb(40,186,208)' }
      },
      {
        x: this.RG_flow.map((_, index) => index),
        y: this.RG_flow.map(value => parseFloat((value / 1_000_000).toFixed(2))),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Costs for gear type compressor',
        line: { color: 'rgb(229,0,69)' }
      }
    ];
  
    // Wenn ein Schnittpunkt gefunden wurde, füge ihn als Marker hinzu
    let shapes: any[] = [];
    if (this.intersectionPoint) {
      chartData.push({
        x: [this.intersectionPoint.x],
        y: [parseFloat((this.intersectionPoint.y / 1_000_000).toFixed(2))],
        type: 'scatter',
        mode: 'markers',  // Nur 'markers' für den Schnittpunkt
        name: 'Point of cost benefit',
        marker: { color: 'rgb(0, 0, 0)', size: 10, symbol: 'circle' }
      });
  
      // Füge eine gestrichelte Linie von dem Schnittpunkt zur x-Achse hinzu
      shapes.push({
        type: 'line',
        x0: this.intersectionPoint.x,
        y0: 0,
        x1: this.intersectionPoint.x,
        y1: parseFloat((this.intersectionPoint.y / 1_000_000).toFixed(2)),
        line: {
          color: 'rgb(0,0,0)',
          width: 2,
          dash: 'dash'  // Gestrichelte Linie
        }
      });
    }
  
    const layout = {
      title: {
        text: 'Compression technology discounted costs',
        font: {
          size: 14,     // Setzt die Schriftgröße
          family: 'Arial, sans-serif',  // Optionale Schriftfamilie
          weight: 'bold'  // Setzt den Titel fett
        }
      },
      xaxis: {
        title: 'Years',
        family: 'Arial, sans-serif',  // Optionale Schriftfamilie
      },
      yaxis: {
        title: `Discounted costs (mio. ${this.symbol})`,
        family: 'Arial, sans-serif',  // Optionale Schriftfamilie
        tickformat: ',.0f'  // Formatierung für Millionen ohne Nachkommastellen
      },
      legend: {
        orientation: 'h',
        x: 0.5,
        xanchor: 'center',
        y: -0.2
      },
      margin: {
        l: 50, r: 50, t: 50, b: 50
      },
      shapes: shapes,  // Füge die Shapes (gestrichelte Linie) zum Layout hinzu
      width: 500,
      height: 500
    };
  
    // Prüfe, ob das Element existiert, bevor das Diagramm gerendert wird
    if (this.compressionContainer) {
      Plotly.react(this.compressionContainer.nativeElement, chartData, layout);
    }
  }
  

}
