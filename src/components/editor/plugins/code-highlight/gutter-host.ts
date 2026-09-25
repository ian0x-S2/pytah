"use client";

import { createContext } from "react";

/**
 * Host element for the code gutter overlay, rendered inside the positioned
 * editor wrapper by the composition surface. The overlay must live in
 * React-owned DOM: portalling into the editable root would have Lexical's
 * reconciler remove it as a foreign node.
 */
export const CodeGutterHostContext = createContext<HTMLElement | null>(null);
