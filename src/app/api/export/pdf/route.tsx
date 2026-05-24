import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth/guard"
import { initDb, getDbSync } from "@/lib/db"
import { session } from "@/lib/db/schema/session"
import { submission } from "@/lib/db/schema/submission"
import { topic } from "@/lib/db/schema/topic"
import { aiModel } from "@/lib/db/schema/ai-model"
import { dimension as dimTable } from "@/lib/db/schema/dimension"
import { eq, desc } from "drizzle-orm"
import path from "path"
import { existsSync } from "fs"

const LANG = { zh: "zh", en: "en" } as const

const T = (lang: string, zh: string, en: string) => lang === "zh" ? zh : en

function getFontPath(name: string) {
  const p = path.join(process.cwd(), "public", "fonts", name)
  return existsSync(p) ? p : null
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const lang = request.nextUrl.searchParams.get("lang") || "zh"

  try {
    const { Document, Page, View, Text, StyleSheet, pdf, Font } = await import("@react-pdf/renderer")

    // Register fonts
    const fontPath = getFontPath("noto-sans-sc-regular.otf")
    if (fontPath) {
      Font.register({ family: "NotoSansSC", src: fontPath })
    }
    const fontFamily = fontPath ? "NotoSansSC" : "Helvetica"

    // Query data
    await initDb()
    const db = getDbSync()

    const sessions = db.select().from(session).all()
    const submissions = db.select().from(submission).all()
    const topics = db.select().from(topic).all()
    const models = db.select().from(aiModel).where(eq(aiModel.is_active, true)).all()
    const dims = db.select().from(dimTable).where(eq(dimTable.is_active, true)).orderBy(dimTable.sort_order).all()

    const topicMap = new Map(topics.map((t) => [t.id, t]))
    const dimMap = new Map(dims.map((d) => [d.id, d]))

    // Build model-level-dimension data
    interface DimScore { title: string; avgScore: number }
    interface LevelData { level: number; dimensions: DimScore[] }
    interface ModelData { name: string; levels: LevelData[] }

    const tree: ModelData[] = []
    for (const model of models) {
      const modelTopicIds = new Set(topics.filter((t) => t.ai_model_id === model.id).map((t) => t.id))
      const modelSubs = submissions.filter((s) => modelTopicIds.has(s.topic_id))
      const levelMap = new Map<number, Map<string, number[]>>()
      for (const s of modelSubs) {
        const t = topicMap.get(s.topic_id); if (!t) continue
        if (!levelMap.has(t.politeness_level)) levelMap.set(t.politeness_level, new Map())
        const ds = levelMap.get(t.politeness_level)!
        if (!ds.has(s.dimension_id)) ds.set(s.dimension_id, [])
        ds.get(s.dimension_id)!.push(s.score)
      }
      const levels: LevelData[] = []
      for (const [level, dimScores] of levelMap) {
        const dimensions: DimScore[] = dims.map((d) => {
          const scores = dimScores.get(d.id) || []
          const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
          return { title: lang === "zh" ? d.title_cn : d.title_en, avgScore: avg }
        }).filter((d) => d.avgScore > 0)
        if (dimensions.length > 0) levels.push({ level, dimensions })
      }
      if (levels.length > 0) tree.push({ name: model.custom_name, levels })
    }

    // Build distribution data
    const dists = dims.map((d) => {
      const counts = [0, 0, 0, 0, 0]
      for (const s of submissions.filter((x) => x.dimension_id === d.id)) {
        if (s.score >= 1 && s.score <= 5) counts[s.score - 1]++
      }
      return { title: lang === "zh" ? d.title_cn : d.title_en, counts }
    })

    const dateStr = new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US")

    const styles = StyleSheet.create({
      page: { padding: 30, fontSize: 9, fontFamily },
      title: { fontSize: 18, textAlign: "center", marginBottom: 4, fontWeight: "bold" },
      subtitle: { fontSize: 10, textAlign: "center", marginBottom: 20, color: "#888" },
      section: { marginBottom: 16 },
      h2: { fontSize: 13, marginBottom: 6, fontWeight: "bold", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 3 },
      h3: { fontSize: 11, marginBottom: 4, fontWeight: "bold", color: "#444" },
      row: { flexDirection: "row", marginBottom: 2, paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
      label: { width: "60%", fontSize: 9 },
      value: { width: "40%", fontSize: 9, textAlign: "right" as const, fontWeight: "bold" },
      dimRow: { flexDirection: "row", marginBottom: 1, paddingLeft: 12 },
      dimLabel: { width: "70%", fontSize: 8, color: "#555" },
      dimValue: { width: "30%", fontSize: 8, textAlign: "right" as const },
      distRow: { flexDirection: "row", marginBottom: 2 },
      distCell: { flex: 1, alignItems: "center" as const },
      distNum: { fontSize: 10, fontWeight: "bold", textAlign: "center" as const },
      distLabel: { fontSize: 7, color: "#888", textAlign: "center" as const },
    })

    const Doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>{T(lang, "AI礼貌性评估实验报告", "AI Politeness Evaluation Report")}</Text>
          <Text style={styles.subtitle}>{T(lang, "导出时间", "Exported")}: {dateStr}</Text>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.h2}>{T(lang, "实验概览", "Overview")}</Text>
            <View style={styles.row}><Text style={styles.label}>{T(lang, "总参与用户", "Total Sessions")}</Text><Text style={styles.value}>{sessions.length}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{T(lang, "总评分数", "Total Submissions")}</Text><Text style={styles.value}>{submissions.length}</Text></View>
          </View>

          {/* AI Model details */}
          {tree.map((model) => (
            <View key={model.name} style={styles.section}>
              <Text style={styles.h2}>{model.name}</Text>
              {model.levels.map((lvl) => (
                <View key={lvl.level}>
                  <Text style={styles.h3}>{T(lang, "礼貌等级", "Level")} L{lvl.level}</Text>
                  {lvl.dimensions.map((dim) => (
                    <View key={dim.title} style={styles.dimRow}>
                      <Text style={styles.dimLabel}>{dim.title}</Text>
                      <Text style={styles.dimValue}>{dim.avgScore}/5</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}

          {/* Distribution */}
          {dists.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.h2}>{T(lang, "评分分布", "Score Distribution")}</Text>
              {dists.map((d) => (
                <View key={d.title} style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 10, marginBottom: 4 }}>{d.title}</Text>
                  <View style={styles.distRow}>
                    {d.counts.map((c, i) => (
                      <View key={i} style={styles.distCell}>
                        <Text style={styles.distNum}>{c}</Text>
                        <Text style={styles.distLabel}>{i + 1}{T(lang, "星", "★")}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Page>
      </Document>
    )

    const blob = await pdf(Doc).toBlob()
    const buffer = Buffer.from(await blob.arrayBuffer())

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="politeai-report-${dateStr}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF export error:", error)
    return NextResponse.json({ error: "PDF generation failed: " + (error instanceof Error ? error.message : "unknown") }, { status: 500 })
  }
}