import { createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";
import { AlignLeftIcon, GlobeIcon, Trash2Icon } from "lucide-react";

const URL_MATCHER_PATTERN =
  /(?<url>(?<scheme>https?:\/\/|www\.)[^\s<]+[^<.,:;"')\]\s])/iu;
const EMAIL_MATCHER_PATTERN =
  /(?<email>(?<emailAddress>[\w.+-]+@[\w-]+\.[\w.-]+))/iu;

const normalizeMatchedUrl = (text: string): string =>
  text.startsWith("http") ? text : `https://${text}`;

const normalizeMatchedEmail = (text: string): string => `mailto:${text}`;

export const AUTO_LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_MATCHER_PATTERN, normalizeMatchedUrl),
  createLinkMatcherWithRegExp(EMAIL_MATCHER_PATTERN, normalizeMatchedEmail),
];

export type LinkPasteOptionId =
  | "inline-link"
  | "inline-weblink"
  | "small-weblink"
  | "wide-weblink"
  | "remove-link";

export interface LinkPasteOption {
  icon: typeof GlobeIcon;
  id: LinkPasteOptionId;
  label: string;
}

export const LINK_PASTE_OPTIONS: readonly LinkPasteOption[] = [
  {
    icon: AlignLeftIcon,
    id: "inline-link",
    label: "Paste inline link",
  },
  {
    icon: GlobeIcon,
    id: "inline-weblink",
    label: "Inline – Weblink",
  },
  {
    icon: GlobeIcon,
    id: "small-weblink",
    label: "Small card – Weblink",
  },
  {
    icon: GlobeIcon,
    id: "wide-weblink",
    label: "Wide card – Weblink",
  },
  {
    icon: Trash2Icon,
    id: "remove-link",
    label: "Remove link",
  },
];
