"use client"

import { useCallback, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  MinusIcon,
  UndoIcon,
  RedoIcon,
} from "lucide-react"

interface MarkdownEditorProps {
  initialContent?: string
  onSave?: (html: string) => void
}

export function MarkdownEditor({ initialContent = "", onSave }: MarkdownEditorProps) {
  const [wordCount, setWordCount] = useState(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText()
      setWordCount(text.length)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        onSave?.(ed.getHTML())
      }, 500)
    },
  })

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor])
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor])
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor])
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor])
  const toggleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor])
  const addHorizontalRule = useCallback(() => editor?.chain().focus().setHorizontalRule().run(), [editor])
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor])
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor])

  if (!editor) return null

  const overLimit = wordCount > 500

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap gap-1 border-b p-2">
        <ToolbarButton onClick={toggleBold} active={editor.isActive("bold")} title="加粗">
          <BoldIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleItalic} active={editor.isActive("italic")} title="斜体">
          <ItalicIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 w-px bg-border" />
        <ToolbarButton onClick={toggleBulletList} active={editor.isActive("bulletList")} title="无序列表">
          <ListIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleOrderedList} active={editor.isActive("orderedList")} title="有序列表">
          <ListOrderedIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleBlockquote} active={editor.isActive("blockquote")} title="引用">
          <QuoteIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addHorizontalRule} active={false} title="分割线">
          <MinusIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 w-px bg-border" />
        <ToolbarButton onClick={undo} active={false} title="撤销">
          <UndoIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={redo} active={false} title="重做">
          <RedoIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 focus:outline-none" />
      <div className="flex items-center justify-end border-t px-4 py-2">
        <span className={`text-xs ${overLimit ? "font-bold text-destructive" : "text-muted-foreground"}`}>
          {wordCount} / 500
        </span>
      </div>
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1 transition-colors ${
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}