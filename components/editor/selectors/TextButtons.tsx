"use client";

import { EditorBubbleItem, useEditor } from "novel";
import { Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon, Strikethrough as StrikethroughIcon, Code as CodeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const TextButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;

  const items = [
    {
      name: "bold",
      isActive: () => editor.isActive("bold"),
      command: () => editor.chain().focus().toggleBold().run(),
      icon: BoldIcon,
    },
    {
      name: "italic",
      isActive: () => editor.isActive("italic"),
      command: () => editor.chain().focus().toggleItalic().run(),
      icon: ItalicIcon,
    },
    {
      name: "underline",
      isActive: () => editor.isActive("underline"),
      command: () => editor.chain().focus().toggleUnderline().run(),
      icon: UnderlineIcon,
    },
    {
      name: "strike",
      isActive: () => editor.isActive("strike"),
      command: () => editor.chain().focus().toggleStrike().run(),
      icon: StrikethroughIcon,
    },
    {
      name: "code",
      isActive: () => editor.isActive("code"),
      command: () => editor.chain().focus().toggleCode().run(),
      icon: CodeIcon,
    },
  ];

  return (
    <div className="flex">
      {items.map((item) => (
        <EditorBubbleItem key={item.name} onSelect={() => item.command()}>
          <button className="rounded-sm p-1 hover:bg-accent" aria-label={item.name}>
            <item.icon
              className={cn("h-4 w-4", {
                "text-blue-500": item.isActive(),
              })}
            />
          </button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
