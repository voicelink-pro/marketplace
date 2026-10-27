"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PASSWORD_MIN_LENGTH } from "../schemas";

/** Password input with a show/hide toggle inside its right edge. */
export function PasswordInput({ className, id, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Show password"
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((current) => !current)}
        // Centred with margins, not translate: the button's press nudge uses translate.
        className="absolute inset-y-0 right-0.5 my-auto text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
    </div>
  );
}

// Mirrors newPasswordSchema; the server still validates.
const PASSWORD_RULES = [
  { label: `${PASSWORD_MIN_LENGTH}+ characters`, met: (value: string) => value.length >= PASSWORD_MIN_LENGTH },
  { label: "Letters and numbers", met: (value: string) => /[A-Za-z]/.test(value) && /[0-9]/.test(value) },
];

/** Requirements that tick as the password meets them. Reference it from the input with aria-describedby. */
export function PasswordChecklist({ id, password }: { id: string; password: string }) {
  return (
    <ul id={id} className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.met(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2 transition-colors duration-300 ease-out motion-reduce:transition-none",
              met ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-4.5 place-items-center rounded-full border transition-colors duration-300 ease-out motion-reduce:transition-none",
                met ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25",
              )}
            >
              <Check
                strokeWidth={3}
                className={cn(
                  "size-3 transition-opacity duration-300 ease-out motion-reduce:transition-none",
                  met ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
            {rule.label}
            <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
