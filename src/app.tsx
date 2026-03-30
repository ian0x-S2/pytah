import { EyeIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { Editor } from "@/components/editor/editor";
import { Button } from "@/components/ui/button";

function App() {
  const [editable, setEditable] = useState(true);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Pytah Notion-style editor
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Copy-paste-ready rich text editing with Lexical, shadcn/ui and Base
            UI. Includes slash commands, floating formatting, block controls and
            live HTML/Markdown output.
          </p>
        </div>
        <Button
          onClick={() => setEditable((prev) => !prev)}
          size="sm"
          variant="outline"
        >
          {editable ? (
            <>
              <EyeIcon /> Read-only
            </>
          ) : (
            <>
              <PencilIcon /> Edit
            </>
          )}
        </Button>
      </div>
      <Editor editable={editable} />
    </div>
  );
}

export default App;
