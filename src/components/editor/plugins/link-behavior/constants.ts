import { createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";

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
