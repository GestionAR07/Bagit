export type MerchantCoverActionState = {
  error: string | null;
  success: string | null;
};

export type MerchantHoursActionState = {
  error: string | null;
  success: string | null;
};

export type MerchantHoursIntervalInput = {
  openTime: string;
  closeTime: string;
};

export type MerchantHoursDayInput = {
  weekday: number;
  enabled: boolean;
  intervals: MerchantHoursIntervalInput[];
};
