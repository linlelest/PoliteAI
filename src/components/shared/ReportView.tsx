"use client"

export interface ReportSummary {
  totalSessions: number
  totalSubmissions: number
  totalRounds: number
  latestActivity: string
}

export interface ReportDimData {
  dimId: string
  title: string
  avgScore: number
}

export interface ReportLevelData {
  level: number
  dimensions: ReportDimData[]
}

export interface ReportModelData {
  ai_name: string
  levels: ReportLevelData[]
}

export interface ReportDistData {
  dimId: string
  title: string
  counts: Record<string, number>
}

export interface ReportData {
  summary: ReportSummary
  tree: ReportModelData[]
  distributions: ReportDistData[]
}

export function ReportView({ data }: { data: ReportData }) {
  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Cover */}
      <section className="mb-12 text-center">
        <h1 className="text-3xl font-bold">AI礼貌性评估实验报告</h1>
        <p className="mt-2 text-muted-foreground">
          导出时间: {new Date().toLocaleDateString("zh-CN")}
        </p>
      </section>

      {/* Summary */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">实验概览</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold">{data.summary.totalSessions}</div>
            <div className="text-sm text-muted-foreground">总参与用户</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold">{data.summary.totalSubmissions}</div>
            <div className="text-sm text-muted-foreground">总评分数</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold">{data.summary.totalRounds}</div>
            <div className="text-sm text-muted-foreground">总轮次</div>
          </div>
        </div>
      </section>

      {/* Tree */}
      {data.tree.map((model) => (
        <section key={model.ai_name} className="mb-8 break-inside-avoid">
          <h2 className="mb-3 text-lg font-semibold">{model.ai_name}</h2>
          {model.levels.map((lvl) => (
            <div key={lvl.level} className="mb-4">
              <h3 className="mb-2 font-medium">L{lvl.level}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-1 pr-4">维度</th>
                    <th className="py-1">平均分</th>
                  </tr>
                </thead>
                <tbody>
                  {lvl.dimensions.map((dim) => (
                    <tr key={dim.dimId} className="border-b">
                      <td className="py-1 pr-4">{dim.title}</td>
                      <td className="py-1">{dim.avgScore}/5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ))}

      {/* Distributions */}
      {data.distributions.length > 0 && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="mb-3 text-lg font-semibold">评分分布</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.distributions.map((d) => (
              <div key={d.dimId} className="rounded-lg border p-4">
                <div className="mb-2 font-medium">{d.title}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex-1 text-center">
                      <div className="text-lg font-bold">{d.counts[String(s)] || 0}</div>
                      <div className="text-xs text-muted-foreground">{s}星</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}