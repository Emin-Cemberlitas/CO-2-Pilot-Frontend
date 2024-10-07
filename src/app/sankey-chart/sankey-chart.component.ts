import { Component, ViewChild, ElementRef, Input, AfterViewInit, OnChanges } from '@angular/core';
import * as Plotly from 'plotly.js-dist';

@Component({
  selector: 'app-sankey-chart',
  templateUrl: './sankey-chart.component.html',
  styleUrls: ['./sankey-chart.component.css']
})
export class SankeyChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('sankeyContainer', { static: false }) sankeyContainer!: ElementRef;

  @Input() cumulative_OPEX!: number;
  @Input() cumulative_O_M!: number;
  @Input() cumulative_T_S!: number;
  @Input() capex_without_subsidy!: number;
  @Input() cumulative_revenue!: number;
  @Input() subsidy!: number;

  hasViewInitialized = false; // Um sicherzustellen, dass das Diagramm erst nach der Initialisierung erstellt wird

  ngAfterViewInit() {
    // Markiere die View als initialisiert
    this.hasViewInitialized = true;
    // Generiere das Diagramm, wenn die Inputs bereits vorhanden sind
    this.createSankey();
  }

  ngOnChanges() {
    // Generiere das Diagramm nur, wenn die View bereits initialisiert wurde
    if (this.hasViewInitialized) {
      this.createSankey();
    }
  }

  createSankey() {
    const net_profit = this.cumulative_revenue + this.subsidy - (this.cumulative_OPEX + this.cumulative_O_M + this.cumulative_T_S + this.capex_without_subsidy);

    const sankeyData = {
      type: 'sankey',
      orientation: 'h',
      node: {
        label: ["Revenues", "Subsidy", "Total", "Net Profit", "CAPEX", "OPEX", "O&M", "T&S"],
        color: ["rgb(171,0,52,0)", "rgb(243,109,30)", "rgb(228,246,250)", "rgb(115, 198, 125)",
                "rgb(35,85,106)", "rgb(40,186,218)", "rgb(198,198,198)", "rgb(48,60,73)"],
        thickness: 10  // Setze die Dicke der Nodes hier niedriger, um sie schmaler zu machen
      },
      link: {
        source: [0, 1, 2, 2, 2, 2, 2],
        target: [2, 2, 3, 4, 5, 6, 7],
        value: [this.cumulative_revenue, this.subsidy, net_profit, this.capex_without_subsidy, this.cumulative_OPEX, this.cumulative_O_M, this.cumulative_T_S],
        color: [
          "rgba(171,0,52,0.6)",
          "rgba(243,109,30,0.6)",
          "rgba(115, 198, 125,0.6)",
          "rgba(35,85,106,0.6)",
          "rgba(40,186,218,0.6)",
          "rgba(198,198,198,0.6)",
          "rgba(48,60,73,0.6)"
        ]
      }
    };

    const layout = {
      title: {
        text: 'CCUS business case sankey diagram',
        font: {
          size: 14,     // Setzt die Schriftgröße
          family: 'Arial, sans-serif',  // Optionale Schriftfamilie
          weight: 'bold'  // Setzt den Titel fett
        }
      },
      font: { size: 12 },
      width: 500,
      height: 500
    };
    

    // Prüfe, ob das Element existiert, bevor das Diagramm gerendert wird
    if (this.sankeyContainer) {
      Plotly.react(this.sankeyContainer.nativeElement, [sankeyData], layout);
    }
  }
}
