import type { ElementNode } from "lexical";
import {
  AlertTriangleIcon,
  InfoIcon,
  LightbulbIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { CalloutNode } from "../../core/nodes/callout/node";
import type { CalloutType } from "../../core/nodes/callout/node";
import { CALLOUT_MARKDOWN_TRANSFORMER } from "../../core/nodes/callout/transformer";
import type { ExtraEditorFeature } from "../../core/types";
import { replaceCurrentBlock } from "../slash-command/utils";
import { CalloutPlugin } from "./plugin";
import { replaceElementWithCallout } from "./utils";

const applyCalloutCommand =
  (type: CalloutType = "note") =>
  (targetElement: ElementNode): void => {
    replaceElementWithCallout(targetElement, type);
  };

export const calloutFeature: ExtraEditorFeature = {
  id: "callout",
  nodes: [CalloutNode],
  plugin: CalloutPlugin,
  slashCommands: [
    {
      command: {
        description: "Highlighted callout box",
        icon: InfoIcon,
        id: "callout",
        keywords: ["callout", "note", "alert", "box", "info"],
        label: "Callout",
      },
      run: (editor) => {
        replaceCurrentBlock(editor, applyCalloutCommand("note"));
      },
    },
    {
      command: {
        description: "Helpful tip callout",
        icon: LightbulbIcon,
        id: "tip",
        keywords: ["tip", "hint", "callout", "idea"],
        label: "Tip",
      },
      run: (editor) => {
        replaceCurrentBlock(editor, applyCalloutCommand("tip"));
      },
    },
    {
      command: {
        description: "Warning alert callout",
        icon: AlertTriangleIcon,
        id: "warning",
        keywords: ["warning", "alert", "caution", "callout"],
        label: "Warning",
      },
      run: (editor) => {
        replaceCurrentBlock(editor, applyCalloutCommand("warning"));
      },
    },
    {
      command: {
        description: "Critical caution callout",
        icon: ShieldAlertIcon,
        id: "caution",
        keywords: ["caution", "danger", "critical", "callout"],
        label: "Caution",
      },
      run: (editor) => {
        replaceCurrentBlock(editor, applyCalloutCommand("caution"));
      },
    },
  ],
  transformers: [CALLOUT_MARKDOWN_TRANSFORMER],
};
