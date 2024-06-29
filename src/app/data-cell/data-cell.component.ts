import { Component, Input } from '@angular/core';
import { IProcessedEventData } from '../model/processedEventData';

@Component({
  selector: 'app-data-cell',
  templateUrl: './data-cell.component.html',
  styleUrls: ['./data-cell.component.scss']
})
export class DataCellComponent {
  @Input() data!: IProcessedEventData;
  @Input() maxEvents!: number;

  tooltip!: string;
  bgColor!: string;

  ngOnInit() {
    this.generateToolTip();
    this.getBgColor();
  }

  generateToolTip() {
    if (this.data.intensity === 0) {
      this.tooltip = `No Events Occured on ${this.getFormattedDate()}`;
    } else {
      this.tooltip = `${this.data.intensity} ${this.data.intensity > 1 ? 'events' : 'event'} occured on ${this.getFormattedDate()}`;
    }
  }

  getBgColor() {
    this.bgColor = `rgba(3, 160, 3, ${this.data.intensity / this.maxEvents})`;
  }

  getFormattedDate(): string {
    let date = new Date(this.data.timestamp);
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();
    const dayWithSuffix = this.getDayWithSuffix(day);
    return `${month} ${dayWithSuffix}`;
  }

  getDayWithSuffix(day: number): string {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
  }

}
