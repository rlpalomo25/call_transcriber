
export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  platform: 'teams' | 'zoom' | 'google' | 'local';
  attendees: string[];
}

export interface RecordingSession {
  id: string;
  date: string;
  title: string;
  duration: number;
  transcription?: string;
  summary?: string;
  actionItems?: string[];
  audioBlob?: Blob;
}

export interface StorageSettings {
  basePath: string;
  autoSave: boolean;
  filePrefix: string;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  CALENDAR = 'calendar',
  RECORDINGS = 'recordings',
  SETTINGS = 'settings'
}
