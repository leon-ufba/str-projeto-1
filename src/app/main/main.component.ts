import { Component } from '@angular/core';
import { Job, Task, TaskAlgorithm } from '../app.interfaces';

@Component({
  selector: 'main-root',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  tasks: Task[];

  algorithm: TaskAlgorithm = 'RMS';

  cpuQty = 1;
  utilization = 1;
  runError: boolean = false;

  newTask: Task = {
    id: 0,
    duration: 1,
    period: 1,
  };

  maxRange!: number;

  gcd = (a: number, b: number): number => (b == 0) ? a : this.gcd(b, a % b);
  lcm = (arr: number[]): number => arr.reduce((ans, curr) => (curr * ans) / this.gcd(curr, ans));

  constructor() {
    // lista de tasks

    this.tasks = [
      // { id: 0, duration: 2, period: 12 },
      // { id: 0, duration: 1, period:  6 },
      // { id: 0, duration: 4, period: 24 },
      // { id: 0, duration: 1, period: 12 },

      // { id: 0, duration: 2, period: 5  },
      // { id: 0, duration: 2, period: 10 },
      // { id: 0, duration: 3, period: 20 },

      { id: 0, duration: 2, period: 9 },
      { id: 0, duration: 2, period: 5 },
      { id: 0, duration: 1, period: 3 },
    ];
    this.tasks.forEach((k, i) => {
      const colorHue = Math.floor(Math.random() * 360);
      k.color = this.backgroundColor(colorHue);
      k.borderColor = this.borderColor(colorHue);
      k.id = i;
      k.isAsync = false;
      k.jobs = [];
    });
    this.updateParameters();
  }

  backgroundColor = (hue: number) => {
    return `hsl(${hue} 90% 87% / 1)`;
  }

  borderColor = (hue: number) => {
    return `hsl(${hue} 70% 60% / 1)`;
  }

  updateParameters() {
    const periods = this.tasks.filter(k => !k.isAsync).map(k => k.period);
    this.maxRange = (periods.length) ? this.lcm(periods) : 0;
    if(this.algorithm === 'RMS') this.runRMS();
    if(this.algorithm === 'EDF') this.runEDF();
    if(this.algorithm === 'ID') this.runByID();
  }

  addTask() {
    const { period, duration, isAsync } = this.newTask;
    if(!period || !duration) return;
    const colorHue = Math.floor(Math.random() * 360);
    const newId = Math.max(...this.tasks.map(k => k.id)) + 1;
    const newTask: Task = {
      id: isFinite(newId) ? newId : 0,
      period,
      duration,
      isAsync,
      color: this.backgroundColor(colorHue),
      borderColor: this.borderColor(colorHue),
      jobs: [],
    };
    this.tasks.push(newTask);
    this.updateParameters();
  }

  removeTask(id: number = -1) {
    const index = this.tasks.findIndex(k => k.id === id);
    if(index >= 0) {
      this.tasks.splice(index, 1);
      this.updateParameters();
    }
  }

  runSomeAlgorithm() {
    this.tasks.forEach(k => k.jobs = []);
    let time = 0;
    let unusedTime = 0;
    const requiredTime: number[] = this.tasks.map(k => 0);
    const isAfterDeadline: boolean[] = this.tasks.map(k => false);
    for(; time < this.maxRange; time++) {
      let availableUnits = this.cpuQty;
      for (let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i];
        if(time % task.period === 0) {
          isAfterDeadline[i] = requiredTime[i] > 0;
          requiredTime[i] += task.duration;
        }
        if(availableUnits > 0 && requiredTime[i] > 0) {
          const lastTaskJob = (task.jobs?.length) ? task.jobs[task.jobs.length - 1] : undefined;
          if(lastTaskJob && (lastTaskJob.startAt + lastTaskJob.duration) === time && lastTaskJob.isAfterDeadline === isAfterDeadline[i]) {
            lastTaskJob.duration += 1;
          } else {
            const newJob: Job = {
              duration: 1,
              startAt: time,
              isAfterDeadline: isAfterDeadline[i],
            };
            task.jobs?.push(newJob);
          }
          requiredTime[i]--;
          availableUnits--;
        }
      }
      unusedTime += availableUnits;
    }
    this.runError = requiredTime.some(k => k !== 0) || this.tasks.some(k => k.jobs?.some(o => o.isAfterDeadline));
    const utilization = ((this.maxRange * this.cpuQty) - unusedTime) / (this.maxRange * this.cpuQty);
    this.utilization = Math.round(utilization * 10000) / 100;
    if(time > this.maxRange) {
      this.maxRange = time;
    }
  }

  runRMS() {
    this.algorithm = 'RMS';
    this.tasks.sort((a, b) => a.period - b.period);
    this.runSomeAlgorithm();
  }

  runEDF() {
    this.algorithm = 'EDF';
    this.tasks.sort((a, b) => a.period - b.period);
    this.runSomeAlgorithm();
  }

  runByID() {
    this.algorithm = 'ID';
    this.tasks.sort((a, b) => a.id - b.id);
    this.runSomeAlgorithm();
  }

}
