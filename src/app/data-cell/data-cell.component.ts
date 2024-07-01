import { Component, Input } from '@angular/core';
import { IProcessedEventData } from '../model/processedEventData';

@Component({
  selector: 'app-data-cell',
  templateUrl: './data-cell.component.html',
  styleUrls: ['./data-cell.component.scss']
})
export class DataCellComponent {
  @Input({ required: true }) data!: IProcessedEventData;

}
