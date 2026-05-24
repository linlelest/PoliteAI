import { NextRequest, NextResponse } from "next/server"
import { initDb, getDbSync } from "@/lib/db"
import { session } from "@/lib/db/schema/session"
import { submission } from "@/lib/db/schema/submission"
import { topic } from "@/lib/db/schema/topic"
import { aiModel } from "@/lib/db/schema/ai-model"
import { dimension as dimTable } from "@/lib/db/schema/dimension"
import { eq } from "drizzle-orm"
import { verifyAuth } from "@/lib/auth/guard"

const T = (lang: string, zh: string, en: string) => lang === "zh" ? zh : en

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const lang = request.nextUrl.searchParams.get("lang") || "zh"

  await initDb()
  const db = getDbSync()

  const sessions = db.select().from(session).all()
  const submissions = db.select().from(submission).all()
  const topics = db.select().from(topic).all()
  const models = db.select().from(aiModel).where(eq(aiModel.is_active, true)).all()
  const dims = db.select().from(dimTable).where(eq(dimTable.is_active, true)).all()

  const topicMap = new Map(topics.map((t) => [t.id, t]))
  const dimMap = new Map(dims.map((d) => [d.id, d]))

  const dimTitle = (d: typeof dims[0]) => lang === "zh" ? d.title_cn : d.title_en

  let treeHtml = ""
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
    if (levelMap.size === 0) continue
    treeHtml += `<div class="model"><h2>${model.custom_name}</h2>`
    for (const [level, dimScores] of levelMap) {
      treeHtml += `<div class="level"><h3>${T(lang, "礼貌等级", "Level")} L${level}</h3>`
      for (const [dimId, scores] of dimScores) {
        const d = dimMap.get(dimId)
        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "0"
        treeHtml += `<div class="dim"><span>${d ? dimTitle(d) : dimId}</span><span class="score">${avg}/5</span></div>`
      }
      treeHtml += `</div>`
    }
    treeHtml += `</div>`
  }

  let distHtml = ""
  for (const d of dims) {
    const dimSubs = submissions.filter((s) => s.dimension_id === d.id)
    const counts = [0, 0, 0, 0, 0]
    for (const s of dimSubs) { if (s.score >= 1 && s.score <= 5) counts[s.score - 1]++ }
    const maxCount = Math.max(...counts, 1)
    distHtml += `<div class="dist"><h3>${dimTitle(d)}</h3><div class="bars">`
    counts.forEach((c, i) => {
      distHtml += `<div class="bar-wrap"><div class="bar" style="height:${Math.round((c / maxCount) * 100)}%">${c}</div><span>${i + 1}${T(lang, "星", "★")}</span></div>`
    })
    distHtml += `</div></div>`
  }

  const dateStr = new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US")
  const title = T(lang, "AI礼貌性评估实验报告", "AI Politeness Evaluation Report")
  const overviewTitle = T(lang, "实验概览", "Overview")
  const modelTitle = T(lang, "AI模型评分详情", "AI Model Scores")
  const distTitle = T(lang, "评分分布", "Score Distribution")
  const usersLabel = T(lang, "总参与用户", "Total Sessions")
  const subsLabel = T(lang, "总评分数", "Total Submissions")

  const html = `<!DOCTYPE html>
<html lang="${lang === "zh" ? "zh-CN" : "en"}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#333;background:#fff}
h1{text-align:center;margin-bottom:8px;font-size:28px;color:#111}
.meta{text-align:center;color:#666;margin-bottom:40px;font-size:14px}
.section{margin-bottom:32px}
.section h2{font-size:20px;margin-bottom:16px;border-bottom:2px solid #eee;padding-bottom:8px;color:#222}
.model{margin-bottom:24px;padding:16px;border:1px solid #e5e7eb;border-radius:8px}
.model h2{font-size:16px;margin-bottom:12px;cursor:pointer;color:#2563eb}
.level{margin-bottom:12px}
.level h3{font-size:14px;color:#666;margin-bottom:8px}
.dim{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f3f4f6;font-size:13px}
.score{font-weight:600;color:#2563eb}
.dists{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.dist{padding:16px;border:1px solid #e5e7eb;border-radius:8px}
.dist h3{font-size:14px;margin-bottom:12px}
.bars{display:flex;gap:8px;align-items:flex-end;height:120px}
.bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;height:100%}
.bar{width:100%;background:#2563eb;border-radius:4px 4px 0 0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;min-height:20px}
.bar-wrap span{font-size:11px;color:#666;margin-top:4px}
@media print{.model,.dist{break-inside:avoid}}
</style></head>
<body>
<h1>${title}</h1>
<p class="meta">${T(lang, "导出时间", "Exported")}: ${dateStr} | PoliteAI</p>
<div class="section"><h2>${overviewTitle}</h2><p>${usersLabel}: ${sessions.length}</p><p>${subsLabel}: ${submissions.length}</p></div>
<div class="section"><h2>${modelTitle}</h2>${treeHtml}</div>
<div class="section"><h2>${distTitle}</h2><div class="dists">${distHtml}</div></div>
<script>document.querySelectorAll('.model h2').forEach(function(h){h.onclick=function(){var l=this.parentNode.querySelector('.level');l.style.display=l.style.display==='none'?'':'none'}})</script>
</body></html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${lang}-${dateStr}.html"`,
    },
  })
}