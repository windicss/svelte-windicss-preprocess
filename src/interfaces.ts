export interface Node {
  start: number;
  end: number;
  type: string;
  value?: Text | Expression | (Text | Expression)[];
}

export interface Attribute extends Node {
  type: 'Attribute';
  name: string;
  value: Text | Expression | (Text | Expression)[];
}

export interface Directive extends Node {
  type: 'Directive';
  name: string;
  value: Text | Expression | (Text | Expression)[];
}

export interface Expression extends Node {
  type: 'Expression';
  data: string;
}

export interface Text extends Node {
  type: 'Text';
  data: string;
}

export interface Tag {
  start: number;
  end: number;
  name: string;
  value: (Attribute | Directive)[];
}

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
}
