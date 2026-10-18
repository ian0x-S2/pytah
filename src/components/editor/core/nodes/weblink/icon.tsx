import { GlobeIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface WeblinkIconProps {
  className: string;
  icon?: string;
}

export function WeblinkIcon({ className, icon }: WeblinkIconProps) {
  const [error, setError] = useState(false);

  if (icon && !error) {
    return (
      <img
        alt=""
        className={className}
        onError={() => setError(true)}
        src={icon}
      />
    );
  }

  return <GlobeIcon className={cn(className, "text-muted-foreground")} />;
}
