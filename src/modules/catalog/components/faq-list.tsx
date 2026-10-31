"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FaqItem } from "../faq-data";
import { TOGGLE_PILL } from "./cta-styles";

/** Questions shown before "Show all questions". */
const VISIBLE = 6;

/**
 * The FAQ accordion: the first six questions, then "Show all questions", which
 * reveals the rest in order (already loaded) and turns into "Show fewer".
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  const [all, setAll] = useState(false);
  const listId = useId();
  const shown = all ? items : items.slice(0, VISIBLE);

  return (
    <div className="flex flex-col gap-4 lg:col-span-7">
      <Accordion id={listId} type="single" collapsible className="rounded-[20px] border bg-card px-5 sm:px-6">
        {shown.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-[15px] text-pretty text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {items.length > VISIBLE ? (
        <button
          type="button"
          aria-expanded={all}
          aria-controls={listId}
          onClick={() => setAll((open) => !open)}
          className={TOGGLE_PILL}
        >
          {all ? "Show fewer" : "Show all questions"}
          {all ? <ChevronUp aria-hidden className="size-4" /> : <ChevronDown aria-hidden className="size-4" />}
        </button>
      ) : null}
    </div>
  );
}
