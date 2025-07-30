export interface StatusEvent {
  id?: string;
  packageId: string;
  status: string;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  timestamp?: string; // Add this
  location?: string;  // Add this
}