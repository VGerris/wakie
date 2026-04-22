export type SunriseSettings = {
  color: string;
  brightness: number;
};

export type Alarm = {
  id: string;
  time: Date;
  label?: string;
  isEnabled: boolean;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  sunriseSettings?: SunriseSettings;
};
