export interface Options {
  safeList?: string[]; // in readme
  mode?: string;
  debug?: boolean;
  silent?: boolean; // in readme
  config?: string; // in readme
  compile?: boolean; // in readme
  prefix?: string; // in readme
  bundle?: string;
  verbosity?: number; // TODO: add mapping in docs for people
  devTools?: {
    completions?: boolean;
    enabled?: boolean;
  },
  kit?: boolean,
  disableFormat?: boolean
}
