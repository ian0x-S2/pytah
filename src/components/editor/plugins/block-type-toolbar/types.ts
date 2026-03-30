export type BlockTypeValue =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code"
  | "table";

export interface BlockOption {
  description: string;
  label: string;
  value: BlockTypeValue;
}
