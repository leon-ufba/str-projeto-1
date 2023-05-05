export interface Task {
  id:           number,
  period:       number,
  duration:     number,
  deadline:     number,
  color?:       string,
  borderColor?: string,
  isAsync?:     boolean,
  jobs?:        Job[],
}

export interface Job {
  startAt:          number,
  duration:         number,
  isAfterDeadline:  boolean,
}

export type TaskAlgorithm = 'RMS' | 'EDF' | 'ID';

export interface CalcTask extends Task {
  requiredTime:    number,
  isAfterDeadline: boolean,
  nextDeadline:    number,
}