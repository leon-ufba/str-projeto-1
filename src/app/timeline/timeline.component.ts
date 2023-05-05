import { Component, Input, OnChanges, SimpleChanges, ViewContainerRef } from '@angular/core';
import { Task, TaskAlgorithm } from '../app.interfaces';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnChanges {
  @Input() task!: Task;
  @Input() algorithm!: TaskAlgorithm;
  @Input() maxRange!: number;

  unitSize: number = 60;

  timesteps: number[] = [];
  periods:   number[] = [];
  deadlines: number[] = [];

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['task'] && this.task) {
      this.updateDeadlines();
    }
    if(changes['maxRange'] && this.maxRange !== undefined) {
      this.timesteps = [...Array(this.maxRange).keys()];
      this.updateDeadlines();
    }
  }

  updateDeadlines = () => {
    if(this.task === undefined || this.maxRange === undefined) return;
    this.periods   = [];
    this.deadlines = [];
    for (let i = 0; i <= this.maxRange; i += this.task.period) {
      this.periods.push(i);
    }
    let firstDeadLine = 0;
    if(this.algorithm === 'EDF') {
      this.deadlines.push(firstDeadLine);
      firstDeadLine = this.task.deadline;
    }
    for (let i = firstDeadLine; i <= this.maxRange; i += this.task.period) {
      this.deadlines.push(i);
    }
  }

}
