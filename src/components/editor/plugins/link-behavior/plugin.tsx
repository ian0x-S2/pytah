"use client";

import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AUTO_LINK_MATCHERS } from "./constants";
import { isValidEditorLinkUrl } from "./utils";

interface LinkBehaviorPluginProps {
  editable: boolean;
}

export function LinkBehaviorPlugin({ editable }: LinkBehaviorPluginProps) {
  return (
    <>
      <LinkPlugin validateUrl={isValidEditorLinkUrl} />
      <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
      <ClickableLinkPlugin disabled={editable} newTab />
    </>
  );
}
