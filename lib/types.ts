export type Board = {
  id: string;
  name: string;
  home_url: string | null;
  sort_order: number;
  created_at: string;
};

export type Search = {
  id: string;
  board_id: string;
  name: string;
  url: string;
  last_opened_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BoardWithSearches = Board & { searches: Search[] };

export type Resume = {
  id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  is_primary: boolean;
  created_at: string;
};

export type ResumeSource = {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Template = {
  id: string;
  name: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
