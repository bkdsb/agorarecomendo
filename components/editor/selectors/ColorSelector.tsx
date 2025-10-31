"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";
import type { Dispatch, SetStateAction } from "react";

export interface BubbleColorMenuItem {
  name: string;
  color: string;
}

const TEXT_COLORS: BubbleColorMenuItem[] = [
  { name: "Default", color: "var(--novel-black)" },
  { name: "Purple", color: "#9333EA" },
  { name: "Red", color: "#E00000" },
  { name: "Yellow", color: "#EAB308" },
  { name: "Blue", color: "#2563EB" },
  { name: "Green", color: "#008A00" },
  { name: "Orange", color: "#FFA500" },
  { name: "Pink", color: "#BA4081" },
  { name: "Gray", color: "#A8A29E" },
];

const HIGHLIGHT_COLORS: BubbleColorMenuItem[] = [
  { name: "Default", color: "var(--novel-highlight-default)" },
  { name: "Purple", color: "var(--novel-highlight-purple)" },
  { name: "Red", color: "var(--novel-highlight-red)" },
  { name: "Yellow", color: "var(--novel-highlight-yellow)" },
  { name: "Blue", color: "var(--novel-highlight-blue)" },
  { name: "Green", color: "var(--novel-highlight-green)" },
  { name: "Orange", color: "var(--novel-highlight-orange)" },
  { name: "Pink", color: "var(--novel-highlight-pink)" },
  { name: "Gray", color: "var(--novel-highlight-gray)" },
];

interface ColorSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ColorSelector = ({ open, onOpenChange }: ColorSelectorProps) => {
  const { editor } = useEditor();
  if (!editor) return null;

  const activeColorItem = TEXT_COLORS.find(({ color }) => editor.isActive("textStyle", { color }));
  const activeHighlightItem = HIGHLIGHT_COLORS.find(({ color }) => editor.isActive("highlight", { color }));

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent">
          <span
            className="rounded-sm px-1"
            style={{
              color: activeColorItem?.color,
              backgroundColor: activeHighlightItem?.color,
            }}
          >
            A
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </Popover.Trigger>

      <Popover.Content
        sideOffset={6}
        align="start"
        className="z-50 my-1 max-h-80 w-48 overflow-y-auto rounded border bg-background p-1 shadow-xl outline-none"
        onMouseDown={(e) => {
          // Evita perder o foco/seleção do editor ao interagir com o popover
          e.preventDefault();
        }}
      >
        <div className="flex flex-col">
          <div className="my-1 px-2 text-sm font-semibold text-muted-foreground">Color</div>
          {TEXT_COLORS.map(({ name, color }, index) => (
            <EditorBubbleItem
              key={index}
              onSelect={() => {
                editor.commands.unsetColor();
                if (name !== "Default") editor.chain().focus().setColor(color || "").run();
              }}
              className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <div className="rounded-sm border px-2 py-px font-medium" style={{ color }}>
                  A
                </div>
                <span>{name}</span>
              </div>
              {editor.isActive("textStyle", { color }) && <Check className="h-4 w-4" />}
            </EditorBubbleItem>
          ))}
        </div>
        <div>
          <div className="my-1 px-2 text-sm font-semibold text-muted-foreground">Background</div>
          {HIGHLIGHT_COLORS.map(({ name, color }, index) => (
            <EditorBubbleItem
              key={index}
              onSelect={() => {
                editor.commands.unsetHighlight();
                if (name !== "Default") editor.commands.setHighlight({ color });
              }}
              className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <div className="rounded-sm border px-2 py-px font-medium" style={{ backgroundColor: color }}>
                  A
                </div>
                <span>{name}</span>
              </div>
              {editor.isActive("highlight", { color }) && <Check className="h-4 w-4" />}
            </EditorBubbleItem>
          ))}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
};
