import { createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";

const URL_MATCHER_PATTERN = /((https?:\/\/|www\.)[^\s<]+[^<.,:;"')\]\s])/i;
const EMAIL_MATCHER_PATTERN = /(([\w.+-]+@[\w-]+\.[\w.-]+))/i;

const normalizeMatchedUrl = (text: string): string => {
  return text.startsWith("http") ? text : `https://${text}`;
};

const normalizeMatchedEmail = (text: string): string => {
  return `mailto:${text}`;
};

export const AUTO_LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_MATCHER_PATTERN, normalizeMatchedUrl),
  createLinkMatcherWithRegExp(EMAIL_MATCHER_PATTERN, normalizeMatchedEmail),
];
