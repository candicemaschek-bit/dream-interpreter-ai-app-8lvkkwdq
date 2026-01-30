import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calculator, Layers, Scale, TrendingUp } from 'lucide-react'
import {
  DEFAULT_SCENARIO,
  calculateScenarioCostUsd,
  formatUsd,
  getMonthlyTierCostEstimates,
  getUnitCostLineItems,
  type ScenarioInputs,
  type VideoType,
} from '@/utils/costScalabilityModel'

function NumberField(props: {
  label: string
  value: number
  onChange: (next: number) => void
  min?: number
  step?: number
  help?: string
}) {
  const { label, value, onChange, min = 0, step = 1, help } = props
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        <Input
          value={String(value)}
          inputMode="numeric"
          className="w-28 h-9"
          onChange={(e) => {
            const parsed = Number(e.target.value)
            onChange(Number.isFinite(parsed) ? Math.max(min, parsed) : min)
          }}
          step={step}
          type="number"
          min={min}
        />
      </div>
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  )
}

export function AdminCostScalability() {
  const [scenario, setScenario] = useState<ScenarioInputs>(DEFAULT_SCENARIO)

  const unitItems = useMemo(() => getUnitCostLineItems(), [])
  const tierEstimates = useMemo(() => getMonthlyTierCostEstimates(), [])

  const totals = useMemo(() => calculateScenarioCostUsd(scenario), [scenario])

  const setVideoCount = (key: VideoType, count: number) => {
    setScenario((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [key]: Math.max(0, count),
      },
    }))
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Cost & Scalability Analysis</h1>
              <Badge variant="secondary">Source of truth</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Canonical constants live in <span className="font-mono">src/config/tierCosts.ts</span>. This page is the unified view.
            </p>
          </div>
        </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Unit cost breakdown
            </CardTitle>
            <CardDescription>Per-action costs used across the product.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-28">Unit</TableHead>
                  <TableHead className="w-28 text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitItems.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell>
                      <div className="font-medium">{item.label}</div>
                      {item.notes ? (
                        <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                    <TableCell className="text-right font-mono">{formatUsd(item.unitCostUsd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Monthly tier cost estimates
            </CardTitle>
            <CardDescription>Estimated platform cost per active user/month by tier (for margins + scaling).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Dreams</TableHead>
                  <TableHead className="text-right">TTS</TableHead>
                  <TableHead className="text-right">Video</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(tierEstimates).map(([tier, v]) => (
                  <TableRow key={tier}>
                    <TableCell className="font-medium">{tier}</TableCell>
                    <TableCell className="text-right font-mono">{formatUsd(v.dreams)}</TableCell>
                    <TableCell className="text-right font-mono">{formatUsd(v.tts)}</TableCell>
                    <TableCell className="text-right font-mono">{formatUsd(v.video)}</TableCell>
                    <TableCell className="text-right font-mono">{formatUsd(v.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Scenario calculator
          </CardTitle>
          <CardDescription>
            Adjust expected usage and see total estimated monthly platform cost. Good for scaling projections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="Dreams analyzed"
              value={scenario.dreams}
              onChange={(dreams) => setScenario((p) => ({ ...p, dreams }))}
              help="Includes interpretation + 1 HD image"
            />
            <NumberField
              label="Transcription minutes"
              value={scenario.transcriptionMinutes}
              onChange={(transcriptionMinutes) => setScenario((p) => ({ ...p, transcriptionMinutes }))}
              step={0.5}
              help="Whisper-style per-minute billing (min charge applies)"
            />
            <NumberField
              label="ReflectAI messages"
              value={scenario.reflectAiMessages}
              onChange={(reflectAiMessages) => setScenario((p) => ({ ...p, reflectAiMessages }))}
            />
            <NumberField
              label="Symbolica analyses"
              value={scenario.symbolicaAnalyses}
              onChange={(symbolicaAnalyses) => setScenario((p) => ({ ...p, symbolicaAnalyses }))}
            />
            <NumberField
              label="TTS characters"
              value={scenario.ttsCharacters}
              onChange={(ttsCharacters) => setScenario((p) => ({ ...p, ttsCharacters }))}
              step={100}
              help="Example: ~2800 chars per narrated dream"
            />
            <div className="space-y-3">
              <div className="text-sm font-medium">Videos generated</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">6s</div>
                  <Input
                    value={String(scenario.videos.dreamcatcher)}
                    type="number"
                    min={0}
                    className="h-9"
                    onChange={(e) => setVideoCount('dreamcatcher', Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">45s</div>
                  <Input
                    value={String(scenario.videos.dreamworlds)}
                    type="number"
                    min={0}
                    className="h-9"
                    onChange={(e) => setVideoCount('dreamworlds', Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">VIP</div>
                  <Input
                    value={String(scenario.videos['dreamworlds-vip'])}
                    type="number"
                    min={0}
                    className="h-9"
                    onChange={(e) => setVideoCount('dreamworlds-vip', Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
            <NumberField
              label="Community shares"
              value={scenario.communityShares}
              onChange={(communityShares) => setScenario((p) => ({ ...p, communityShares }))}
            />
            <NumberField
              label="Community likes"
              value={scenario.communityLikes}
              onChange={(communityLikes) => setScenario((p) => ({ ...p, communityLikes }))}
            />
            <NumberField
              label="Community views tracked"
              value={scenario.communityViews}
              onChange={(communityViews) => setScenario((p) => ({ ...p, communityViews }))}
              step={100}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/50">
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Estimated total</CardTitle>
                <CardDescription className="font-mono text-lg text-foreground">{formatUsd(totals.total)}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card/50">
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Video component</CardTitle>
                <CardDescription className="font-mono text-lg text-foreground">{formatUsd(totals.videoCost)}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card/50">
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Dream analysis component</CardTitle>
                <CardDescription className="font-mono text-lg text-foreground">{formatUsd(totals.dreamCost)}</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-sm text-muted-foreground">Transcription: <span className="font-mono text-foreground">{formatUsd(totals.transcriptionCost)}</span></div>
            <div className="text-sm text-muted-foreground">ReflectAI: <span className="font-mono text-foreground">{formatUsd(totals.reflectAiCost)}</span></div>
            <div className="text-sm text-muted-foreground">Symbolica: <span className="font-mono text-foreground">{formatUsd(totals.symbolicaCost)}</span></div>
            <div className="text-sm text-muted-foreground">TTS: <span className="font-mono text-foreground">{formatUsd(totals.ttsCost)}</span></div>
            <div className="text-sm text-muted-foreground">Community: <span className="font-mono text-foreground">{formatUsd(totals.communityCost)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ScrollArea>
  )
}
