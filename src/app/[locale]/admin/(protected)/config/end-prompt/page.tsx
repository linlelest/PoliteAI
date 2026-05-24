"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  MinusIcon,
  UndoIcon,
  RedoIcon,
  LinkIcon,
  ImageIcon,
  UnlinkIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

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

function useTipTapEditor(initialContent: string) {
  const [mounted, setMounted] = useState(false)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && editor && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [mounted, initialContent, editor])

  return editor
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useTipTapEditor> }) {
  const t = useTranslations("admin.endPrompt")
  if (!editor) return null

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt(previousUrl ? t("editLink") : t("addLink"), previousUrl || "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt(t("addImage"))
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="flex flex-wrap gap-1 border-b p-2">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title={t("bold")}>
        <BoldIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title={t("italic")}>
        <ItalicIcon className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 w-px bg-border" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title={t("bulletList")}>
        <ListIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title={t("orderedList")}>
        <ListOrderedIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title={t("blockquote")}>
        <QuoteIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title={t("horizontalRule")}>
        <MinusIcon className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 w-px bg-border" />
      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title={editor.isActive("link") ? t("editLink") : t("addLink")}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      {editor.isActive("link") && (
        <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} active={false} title={t("removeLink")}>
          <UnlinkIcon className="h-4 w-4" />
        </ToolbarButton>
      )}
      <ToolbarButton onClick={addImage} active={false} title={t("addImage")}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 w-px bg-border" />
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title={t("undo")}>
        <UndoIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title={t("redo")}>
        <RedoIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}

export default function EndPromptConfigPage() {
  const t = useTranslations("admin.endPrompt")
  const [cnInitial, setCnInitial] = useState("")
  const [enInitial, setEnInitial] = useState("")
  const [tab, setTab] = useState<"cn" | "en">("cn")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const editorCn = useTipTapEditor(cnInitial)
  const editorEn = useTipTapEditor(enInitial)

  useEffect(() => {
    fetch("/api/admin/config/end-prompt")
      .then((r) => r.json())
      .then((d) => {
        setCnInitial(d.cn ?? "")
        setEnInitial(d.en ?? "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const cn = editorCn?.getHTML() ?? cnInitial
      const en = editorEn?.getHTML() ?? enInitial
      const res = await fetch("/api/admin/config/end-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cn, en }),
      })
      if (res.ok) {
        toast.success(t("saveSuccess"))
      } else {
        toast.error(t("saveFailed"))
      }
    } catch {
      toast.error(t("networkError"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-32 animate-pulse rounded-lg bg-muted" />

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("desc")}
      </p>

      <div className="mb-4 flex gap-2">
        <Button variant={tab === "cn" ? "default" : "outline"} size="sm" onClick={() => setTab("cn")}>
          {t("cnTab")}
        </Button>
        <Button variant={tab === "en" ? "default" : "outline"} size="sm" onClick={() => setTab("en")}>
          {t("enTab")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{tab === "cn" ? t("cnContent") : t("enContent")}</CardTitle>
          <CardDescription>
            {tab === "cn" ? t("cnDesc") : t("enDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tab === "cn" && editorCn && (
            <div className="rounded-lg border">
              <EditorToolbar editor={editorCn} />
              <EditorContent editor={editorCn} className="prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px] [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:cursor-pointer [&_a]:text-blue-600 [&_a]:underline" />
            </div>
          )}
          {tab === "en" && editorEn && (
            <div className="rounded-lg border">
              <EditorToolbar editor={editorEn} />
              <EditorContent editor={editorEn} className="prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px] [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:cursor-pointer [&_a]:text-blue-600 [&_a]:underline" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
