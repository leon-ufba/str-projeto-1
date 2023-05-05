import { Component } from '@angular/core';
import { CalcTask, Job, Task, TaskAlgorithm } from '../app.interfaces';

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
  runOk: boolean = false;
  runTest:  boolean = false;

  newTask: Task = {
    id: 0,
    duration: 1,
    period: 1,
    deadline: 1,
  };

  maxRange!: number;

  gcd = (a: number, b: number): number => (b == 0) ? a : this.gcd(b, a % b);
  lcm = (arr: number[]): number => arr.reduce((ans, curr) => (curr * ans) / this.gcd(curr, ans));

  constructor() {
    // lista de tasks

    this.tasks = [
      // { id: 0, duration: 2, period: 12, deadline: 12 },
      // { id: 0, duration: 1, period:  6, deadline:  6 },
      // { id: 0, duration: 4, period: 24, deadline: 24 },
      // { id: 0, duration: 1, period: 12, deadline: 12 },

      // { id: 0, duration: 2, period: 5 , deadline: 4 },
      // { id: 0, duration: 2, period: 10, deadline: 8 },
      // { id: 0, duration: 3, period: 20, deadline: 7 },

      { id: 0, duration: 2, period: 9, deadline: 9 },
      { id: 0, duration: 2, period: 5, deadline: 5 },
      { id: 0, duration: 1, period: 3, deadline: 3 },
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
    const { period, duration, deadline, isAsync } = this.newTask;
    if(!period || !duration) return;
    const colorHue = Math.floor(Math.random() * 360);
    const newId = Math.max(...this.tasks.map(k => k.id)) + 1;
    const newTask: Task = {
      id: isFinite(newId) ? newId : 0,
      period,
      duration,
      deadline,
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

  runRMS() {
    this.algorithm = 'RMS';
    this.runSomeAlgorithm();
  }

  runEDF() {
    this.algorithm = 'EDF';
    this.runSomeAlgorithm();
  }

  runByID() {
    this.algorithm = 'ID';
    this.runSomeAlgorithm();
  }

  sortTasks(tasks: CalcTask[], algorithm: TaskAlgorithm) {
    switch (algorithm) {
      case 'RMS': tasks.sort((a, b) => a.period - b.period); break;
      case 'EDF': tasks.sort((a, b) => a.nextDeadline - b.nextDeadline); break;
      case 'ID' : tasks.sort((a, b) => a.id - b.id); break;
      default: break;
    }
  }

  runSomeAlgorithm() {
    const tasks: CalcTask[] = structuredClone(this.tasks).map((k: any) => {
      k.requiredTime = 0;
      k.isAfterDeadline = false;
      k.nextDeadline = (this.algorithm === 'EDF') ? k.deadline : k.period;
      k.jobs = [];
      return k;
    });

    const n = tasks.length;
    const a = tasks.reduce((ans, curr) => ans + curr.duration/curr.period, 0);
    const b = (this.algorithm === 'EDF') ? 1 : n*(2**(1/n) - 1);
    this.runTest = (n === 0) || (a <= b);

    let time = 0;
    let unusedTime = 0;

    for(; time < this.maxRange; time++) {
      let availableUnits = this.cpuQty;
      for (const task of tasks) {
        if(time === task.nextDeadline) {
          task.isAfterDeadline = task.requiredTime > 0;
        }
        if(time % task.period === 0) {
          if(time > 0) task.nextDeadline += task.period;
          task.requiredTime += task.duration;
        }
      }
      this.sortTasks(tasks, this.algorithm);
      for (const task of tasks) {
        if(availableUnits > 0 && task.requiredTime > 0) {
          const lastTaskJob = (task.jobs?.length) ? task.jobs[task.jobs.length - 1] : undefined;
          if(lastTaskJob && (lastTaskJob.startAt + lastTaskJob.duration) === time && lastTaskJob.isAfterDeadline === task.isAfterDeadline) {
            lastTaskJob.duration += 1;
          } else {
            const newJob: Job = {
              duration: 1,
              startAt: time,
              isAfterDeadline: task.isAfterDeadline,
            };
            task.jobs?.push(newJob);
          }
          task.requiredTime--;
          availableUnits--;
        }
      }
      unusedTime += availableUnits;
    }
    this.runOk = tasks.every(k => k.requiredTime === 0) && tasks.every(k => k.jobs?.every(o => !o.isAfterDeadline));
    const utilization = ((this.maxRange * this.cpuQty) - unusedTime) / (this.maxRange * this.cpuQty);
    this.utilization = isFinite(utilization) ? Math.round(utilization * 10000) / 100 : 0;
    if(time > this.maxRange) {
      this.maxRange = time;
    }
    this.sortTasks(tasks, this.algorithm);
    this.tasks = structuredClone(tasks);
  }

}
