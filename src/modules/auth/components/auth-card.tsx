import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

/** 52px pill with the arrow, like the home page CTAs. */
export const AUTH_SUBMIT_CLASS = "h-13 w-full text-base font-semibold";

/** Form card of the auth pages: the page heading, with `top` above it (e.g. a side switch). */
export function AuthCard({
  title,
  description,
  top,
  children,
  footer,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  top?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="gap-6 rounded-[20px] [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
      <CardHeader className="gap-2">
        {top ? <div className="mb-4">{top}</div> : null}
        <h1 className="text-2xl leading-tight font-extrabold tracking-[-0.04em] text-balance sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? <p className="text-base text-pretty text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
