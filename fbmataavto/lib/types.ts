export type AdGroup = {
  name: string;
  creativePath: string;
  destinationUrl: string;
};

export type LaunchPayload = {
  offer: string;
  offerId?: string;
  geo: string;
  ageMin: number;
  ageMax: number;
  dailyBudget: number;
  creativesLocation: string;
  adGroups: AdGroup[];
};

export type Job = {
  id: string;
  status: "queued" | "running" | "done" | "error";
  payload: LaunchPayload;
  result: unknown;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FacebookSnapshot = {
  id: string;
  jobId: string | null;
  leads: number;
  spend: number;
  note: string | null;
  createdAt: string;
};
