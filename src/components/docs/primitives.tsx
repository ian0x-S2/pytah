import { cn } from "@/lib/utils";

export function PageHeader({
  children,
  className,
  description,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <div className={cn("mb-10 space-y-2", className)}>
      <h1 className="font-bold text-3xl text-foreground tracking-tight">
        {title}
      </h1>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2
      className="mt-10 mb-4 font-semibold text-2xl text-foreground tracking-tight first:mt-0"
      id={id}
    >
      {children}
    </h2>
  );
}

export function SubHeading({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h3
      className="mt-6 mb-3 font-semibold text-foreground text-lg tracking-tight"
      id={id}
    >
      {children}
    </h3>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-foreground/90 leading-7 [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]">
      {children}
    </p>
  );
}

export function CodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  return (
    <div className="group relative my-4">
      {language ? (
        <div className="rounded-t-lg border border-border border-b-0 bg-muted/50 px-4 py-2">
          <span className="font-mono text-muted-foreground text-xs">
            {language}
          </span>
        </div>
      ) : null}
      <pre
        className={cn(
          "overflow-x-auto bg-muted p-4 font-mono text-sm leading-relaxed",
          language ? "rounded-b-lg border border-border" : "rounded-lg"
        )}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Table({
  children,
  headers,
}: {
  children: React.ReactNode;
  headers: string[];
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b bg-muted/50">
            {headers.map((header) => (
              <th
                className="px-4 py-2.5 text-left font-medium text-foreground"
                key={header}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-border border-b last:border-0">{children}</tr>;
}

export function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-foreground/90">{children}</td>;
}

export function Callout({
  children,
  title,
  variant = "info",
}: {
  children: React.ReactNode;
  title?: string;
  variant?: "info" | "warning" | "tip";
}) {
  const styles = {
    info: "border-primary/30 bg-primary/5",
    tip: "border-accent-foreground/30 bg-accent/50",
    warning: "border-destructive/30 bg-destructive/5",
  };

  return (
    <div className={cn("my-4 rounded-lg border p-4", styles[variant])}>
      {title ? (
        <p className="mb-1 font-medium text-foreground text-sm">{title}</p>
      ) : null}
      <div className="text-foreground/80 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function FileTree({ items }: { items: string[] }) {
  return (
    <div className="my-4 rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm">
      {items.map((item) => (
        <div className="py-0.5 text-foreground/80" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}
