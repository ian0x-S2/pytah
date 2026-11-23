import { GlobeIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface WeblinkIconProps {
  className: string;
  icon?: string;
}

export function WeblinkIcon({ className, icon }: WeblinkIconProps) {
  const [failedIconUrl, setFailedIconUrl] = useState<string | null>(null);
  const hasError = Boolean(icon && failedIconUrl === icon);

  if (icon && !hasError) {
    return (
      <img
        alt=""
        className={className}
        onError={() => setFailedIconUrl(icon)}
        src={icon}
      />
    );
  }

  return (
    <GlobeIcon aria-hidden className={cn(className, "text-muted-foreground")} />
  );
}
