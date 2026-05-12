export interface CapturedCall {
  id: string;
  phoneNumber: string;
  timestamp: number;
  status: 'captured' | 'syncing' | 'synced' | 'failed';
  telegramInfo?: {
    username?: string;
    bio?: string;
    avatarUrl?: string;
    fullName?: string;
  };
}

export interface AppState {
  calls: CapturedCall[];
  isTracking: boolean;
  lastSimulatedNumber?: string;
  tgApiId?: string;
  tgApiHash?: string;
  selectedCallId?: string;
}
