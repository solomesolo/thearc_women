export type GkvGuidance = {
  status_label: string;
  user_text: string;
  frequency_text: string | null;
  extra_note: string | null;
};

export type PkvGuidance = {
  status_label: string;
  user_text: string;
  extra_note: string | null;
};

export type HowToAsk = {
  why_this_matters: string;
  suggested_lines: string[];
  self_pay_note: string | null;
};

export type DoctorGuidancePayload = {
  biomarker_name: string;
  gkv: GkvGuidance;
  pkv: PkvGuidance;
  how_to_ask: HowToAsk;
};
