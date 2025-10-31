"use client";

import * as Popover from "@radix-ui/react-popover";
import { Trash, Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useEditor } from "novel";

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch (e) {
    return null;
  }
  return null;
}

interface LinkSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useEditor();

  useEffect(() => {
    inputRef.current?.focus();
  }, [open]);

  if (!editor) return null;

  const href = editor.getAttributes("link").href || "";

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button className="gap-2 rounded-sm px-2 py-1 text-sm underline decoration-stone-400 underline-offset-4 hover:bg-accent">
          <span className={cn({ "text-blue-500": editor.isActive("link") })}>Link</span>
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        sideOffset={8}
        className="z-50 w-64 rounded border bg-background p-1 shadow-xl outline-none"
        onMouseDown={(e) => {
          // Mantém o foco do editor enquanto interage com o popover
          e.preventDefault();
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = inputRef.current;
            if (!input) return;
            const url = getUrlFromString(input.value);
            if (url) editor.chain().focus().setLink({ href: url }).run();
            onOpenChange(false);
          }}
          className="flex gap-1 p-1"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Paste a link"
            className="flex-1 rounded border bg-background px-2 py-1 text-sm outline-none"
            defaultValue={href}
          />
          {href ? (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded border p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-800"
              onClick={() => editor.chain().focus().unsetLink().run()}
              aria-label="Remove link"
            >
              <Trash className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" className="flex h-8 w-8 items-center justify-center rounded border p-1">
              <Check className="h-4 w-4" />
            </button>
          )}
        </form>
      </Popover.Content>
    </Popover.Root>
  );
};
