import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

export function TableBehaviorPlugin() {
  return <TablePlugin hasCellBackgroundColor={false} hasHorizontalScroll />;
}
