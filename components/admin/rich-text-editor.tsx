"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Markdown } from "tiptap-markdown";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  /** Markdown source — this editor reads and writes Markdown, not HTML. */
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Start met schrijven…" }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image,
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        width: 640,
        height: 360,
        HTMLAttributes: { class: "rounded-xl overflow-hidden mx-auto my-4 w-full aspect-video h-auto" },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose-blog max-w-none focus:outline-none min-h-[360px] px-md py-sm text-body-md text-on-surface",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (content !== current) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const addImage = () => fileInputRef.current?.click();

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const alt = window.prompt("Alt-tekst (verplicht voor SEO en toegankelijkheid):");
    if (!alt) {
      window.alert("Alt-tekst is verplicht. Afbeelding niet toegevoegd.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload mislukt");
      editor.chain().focus().setImage({ src: result.url, alt }).run();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload mislukt");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const addLink = () => {
    const url = window.prompt("Link URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt("YouTube URL:");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  };

  const charCount = editor.getText().length;

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-xs border-b border-outline-variant bg-surface-container-low p-xs">
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} icon="format_bold" title="Vet (Ctrl+B)" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} icon="format_italic" title="Cursief (Ctrl+I)" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} icon="format_underlined" title="Onderstreept" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} icon="strikethrough_s" title="Doorhalen" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} icon="code" title="Code" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} icon="format_h1" title="Kop 2" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} icon="format_h2" title="Kop 3" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} icon="format_h3" title="Kop 4" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} icon="format_list_bulleted" title="Opsomming" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} icon="format_list_numbered" title="Genummerde lijst" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} icon="format_quote" title="Citaat" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} icon="format_align_left" title="Links uitlijnen" />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} icon="format_align_center" title="Centreren" />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} icon="format_align_right" title="Rechts uitlijnen" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton onClick={addLink} active={editor.isActive("link")} icon="link" title="Link toevoegen" />
          <ToolbarButton onClick={addImage} icon={isUploadingImage ? "progress_activity" : "image"} title="Afbeelding uploaden" />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageFile} className="hidden" />
          <ToolbarButton onClick={addYoutube} icon="smart_display" title="YouTube-video invoegen" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} icon="ink_highlighter" title="Markeren" />
        </ToolbarGroup>

        <ToolbarGroup last>
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon="undo" title="Ongedaan maken (Ctrl+Z)" />
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon="redo" title="Opnieuw (Ctrl+Y)" />
        </ToolbarGroup>
      </div>

      <EditorContent editor={editor} className="bg-surface-container-lowest" />

      <div className="flex justify-between border-t border-outline-variant bg-surface-container-low px-sm py-xs text-label-sm text-on-surface-variant">
        <span>{charCount} tekens</span>
        <span>~{Math.max(1, Math.ceil(charCount / 5))} woorden</span>
      </div>
    </div>
  );
}

function ToolbarGroup({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div className={cn("flex gap-1", !last && "border-r border-outline-variant pr-xs mr-xs")}>{children}</div>;
}

function ToolbarButton({
  onClick,
  active = false,
  icon,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  icon: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-primary/10 hover:text-primary",
      )}
    >
      <Icon name={icon} className="text-[18px]" />
    </button>
  );
}
