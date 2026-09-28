/** Recurring signature events shown inside a destination detail sheet. */
export interface DestinationEvent {
  id?: string;
  title: string;
  schedule: string[];
  description: string;
  url?: string;
}
