import { useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, FormControl, Grid,
  InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import AssessmentIcon from '@mui/icons-material/Assessment'
import DownloadIcon from '@mui/icons-material/Download'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PrintIcon from '@mui/icons-material/Print'
import type { GapItem, ReadinessResponse, Signal, SignalResponse } from '../types'
import { reportStorage } from '../services/reportStorage'

type ReportType = 'safety' | 'readiness' | 'combined'

const SAFETY_DISCLAIMER = 'Safety signals are statistical associations and do not establish causality. Results require qualified clinical and regulatory review.'
const READINESS_DISCLAIMER = "Submission readiness reflects document completeness against the application's verified CTD requirements. It does not guarantee regulatory acceptance or approval."

function percent(value: number) { return `${(value * 100).toFixed(2)}%` }
function signalLabel(level: Signal['signal_level']) { return level === 'signal' ? 'Potential Safety Signal' : level === 'weak_signal' ? 'Weak / Emerging Signal' : 'No Signal' }
function csvValue(value: unknown) { const text = value == null ? '' : String(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text }
function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => { URL.revokeObjectURL(url); link.remove() }, 1000)
}
function signalCsv(data: SignalResponse) {
  const header = ['Adverse event', 'Target event reports (a)', 'PRR', 'Chi-square', 'Drug %', 'Background %', 'Classification', 'Trend', 'Cluster']
  const rows = data.signals.map((signal) => [signal.adverse_event, signal.a, signal.prr, signal.chi_square, percent(signal.drug_event_proportion), percent(signal.comparison_proportion), signalLabel(signal.signal_level), signal.trend.map((point) => `${point.quarter}: ${point.count}`).join('; '), 'Not available in source result'])
  return [header, ...rows].map((row) => row.map(csvValue).join(',')).join('\n')
}
function readinessCsv(data: ReadinessResponse) {
  const header = ['Record', 'Module', 'Section / title', 'Value', 'Matched', 'Applicable']
  const modules = data.module_scores.map((module) => ['Module completeness', module.module, module.title, `${module.completeness_pct}%`, module.matched, module.total_required])
  const gaps = data.gaps.map((gap) => ['Gap', gap.module, `${gap.section_id}: ${gap.title}`, gap.required ? 'Missing required' : 'Missing optional', '', gap.priority])
  return [header, ...modules, ...gaps].map((row) => row.map(csvValue).join(',')).join('\n')
}
function EmptyReport({ message }: { message: string }) { return <Alert severity="info" sx={{ borderRadius: 2 }}>{message}</Alert> }
function SummaryCard({ label, value, color = 'primary' }: { label: string; value: string | number; color?: 'primary' | 'error' | 'warning' | 'success' }) {
  return <Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="h6" color={`${color}.main`} fontWeight={700}>{value}</Typography></Paper>
}

function SignalReport({ data }: { data: SignalResponse }) {
  const [selected, setSelected] = useState<Signal | null>(data.signals[0] ?? null)
  const potential = data.signals.filter((signal) => signal.signal_level === 'signal').length
  const weak = data.signals.filter((signal) => signal.signal_level === 'weak_signal').length
  const none = data.signals.filter((signal) => signal.signal_level === 'no_signal').length
  const dateRange = data.data_quality?.date_range
  return <Stack spacing={2}>
    <Typography variant="h6">Safety Signal Analysis</Typography>
    <Grid container spacing={2}><Grid item xs={6} md={3}><SummaryCard label="Drug" value={data.drug_name} /></Grid><Grid item xs={6} md={3}><SummaryCard label="Total reports" value={data.total_reports} /></Grid><Grid item xs={6} md={3}><SummaryCard label="Potential Safety Signals" value={potential} color="error" /></Grid><Grid item xs={6} md={3}><SummaryCard label="Weak / Emerging Signals" value={weak} color="warning" /></Grid></Grid>
    <Typography variant="body2" color="text.secondary">Dataset: {data.data_source} · Analysis date/range: {dateRange ? `${dateRange.min ?? 'Unavailable'} to ${dateRange.max ?? 'Unavailable'}` : 'Unavailable'} · No Signal results: {none}</Typography>
    {data.signals.length === 0 ? <EmptyReport message="No signal analysis available. Run Signal Detection first." /> : <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Adverse event</TableCell><TableCell align="right">Target reports (a)</TableCell><TableCell align="right">PRR</TableCell><TableCell align="right">Chi-square</TableCell><TableCell align="right">Drug %</TableCell><TableCell align="right">Background %</TableCell><TableCell>Classification</TableCell><TableCell>Trend</TableCell></TableRow></TableHead><TableBody>{data.signals.map((signal) => <TableRow key={signal.adverse_event} hover selected={selected?.adverse_event === signal.adverse_event} onClick={() => setSelected(signal)} sx={{ cursor: 'pointer' }}><TableCell>{signal.adverse_event}</TableCell><TableCell align="right">{signal.a}</TableCell><TableCell align="right">{signal.prr === null ? 'N/A' : signal.prr.toFixed(2)}</TableCell><TableCell align="right">{signal.chi_square.toFixed(2)}</TableCell><TableCell align="right">{percent(signal.drug_event_proportion)}</TableCell><TableCell align="right">{percent(signal.comparison_proportion)}</TableCell><TableCell><Chip size="small" label={signalLabel(signal.signal_level)} color={signal.signal_level === 'signal' ? 'error' : signal.signal_level === 'weak_signal' ? 'warning' : 'success'} /></TableCell><TableCell>{signal.trend.length ? `${signal.trend.length} points` : 'Unavailable'}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}
    {selected && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle1" fontWeight={700}>Selected Signal Details: {selected.adverse_event}</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Cluster information: Not available in source result. Quarterly trend points: {selected.trend.length}.</Typography><Table size="small" sx={{ maxWidth: 440 }}><TableHead><TableRow><TableCell /><TableCell align="center">Target event</TableCell><TableCell align="center">Other events</TableCell></TableRow></TableHead><TableBody><TableRow><TableCell>Target drug</TableCell><TableCell align="center">a = {selected.a}</TableCell><TableCell align="center">b = {selected.b}</TableCell></TableRow><TableRow><TableCell>Other drugs</TableCell><TableCell align="center">c = {selected.c}</TableCell><TableCell align="center">d = {selected.d}</TableCell></TableRow></TableBody></Table></Paper>}
    <Alert severity="warning">{SAFETY_DISCLAIMER}</Alert>
  </Stack>
}

function GapTable({ gaps }: { gaps: GapItem[] }) {
  if (!gaps.length) return <Alert severity="success">No gaps were returned by the readiness analysis.</Alert>
  return <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Module</TableCell><TableCell>Section</TableCell><TableCell>Requirement</TableCell><TableCell>Status</TableCell><TableCell>Priority</TableCell><TableCell>Recommended action</TableCell></TableRow></TableHead><TableBody>{gaps.map((gap) => <TableRow key={gap.section_id}><TableCell>{gap.module}</TableCell><TableCell>{gap.section_id}</TableCell><TableCell>{gap.title}</TableCell><TableCell>{gap.required ? 'Missing required' : 'Missing optional'}</TableCell><TableCell>{gap.priority}</TableCell><TableCell>Review and provide this dossier section</TableCell></TableRow>)}</TableBody></Table></TableContainer>
}
function ReadinessReport({ data }: { data: ReadinessResponse }) {
  const present = data.module_scores.reduce((total, module) => total + module.matched, 0)
  const applicable = data.module_scores.reduce((total, module) => total + module.total_required, 0)
  const missing = data.gaps.filter((gap) => gap.required).length
  return <Stack spacing={2}>
    <Typography variant="h6">Submission Readiness</Typography><Typography variant="body2" color="text.secondary">Dossier: {data.filename} · Regulatory region: Not specified by source result</Typography>
    <Grid container spacing={2}><Grid item xs={6} md={3}><SummaryCard label="Overall completeness" value={`${data.overall_completeness_pct}%`} color={data.overall_completeness_pct >= 80 ? 'success' : 'warning'} /></Grid><Grid item xs={6} md={3}><SummaryCard label="Applicable requirements" value={applicable} /></Grid><Grid item xs={6} md={3}><SummaryCard label="Present requirements" value={present} color="success" /></Grid><Grid item xs={6} md={3}><SummaryCard label="Missing required" value={missing} color="error" /></Grid></Grid>
    <Typography variant="subtitle1" fontWeight={700}>Module-wise CTD completeness</Typography><TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Module</TableCell><TableCell>Title</TableCell><TableCell align="right">Completeness</TableCell><TableCell align="right">Present</TableCell><TableCell align="right">Applicable</TableCell></TableRow></TableHead><TableBody>{data.module_scores.map((module) => <TableRow key={module.module}><TableCell>{module.module}</TableCell><TableCell>{module.title}</TableCell><TableCell align="right">{module.completeness_pct}%</TableCell><TableCell align="right">{module.matched}</TableCell><TableCell align="right">{module.total_required}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <Typography variant="subtitle1" fontWeight={700}>Gap Report</Typography><GapTable gaps={data.gaps} /><Typography variant="body2" color="text.secondary">Unrecognized requirements: Not available in source result · Not Applicable requirements: Not available in source result</Typography><Alert severity="info">{READINESS_DISCLAIMER}</Alert>
  </Stack>
}

export default function Reports() {
  const [signalData, setSignalData] = useState<SignalResponse | null>(() => reportStorage.getSignal())
  const [readinessData, setReadinessData] = useState<ReadinessResponse | null>(() => reportStorage.getReadiness())
  const [reportType, setReportType] = useState<ReportType>('combined')
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const hasData = Boolean(signalData || readinessData)
  const refresh = () => { setSignalData(reportStorage.getSignal()); setReadinessData(reportStorage.getReadiness()); setGenerated(false); setStatus('idle') }
  const handleType = (event: SelectChangeEvent) => { setReportType(event.target.value as ReportType); setGenerated(false); setStatus('idle') }
  const reportJson = () => JSON.stringify({ generated_by: 'Drug Safety Signal Detector & Regulatory Submission Readiness Checker', report_type: reportType, signal_analysis: signalData, submission_readiness: readinessData }, null, 2)
  const exportCsv = () => { if (reportType === 'safety' && signalData) downloadFile('safety-signal-report.csv', signalCsv(signalData), 'text/csv;charset=utf-8'); else if (reportType === 'readiness' && readinessData) downloadFile('submission-readiness-report.csv', readinessCsv(readinessData), 'text/csv;charset=utf-8'); else if (signalData || readinessData) downloadFile('combined-regulatory-report.csv', [signalData ? signalCsv(signalData) : '', readinessData ? readinessCsv(readinessData) : ''].filter(Boolean).join('\n\n'), 'text/csv;charset=utf-8') }
  const exportJson = () => downloadFile(`${reportType}-report.json`, reportJson(), 'application/json;charset=utf-8')
  const generate = () => { if (!hasData) { setStatus('error'); return } setGenerating(true); setStatus('idle'); window.setTimeout(() => { setGenerated(true); setGenerating(false); setStatus('success') }, 150) }
  return <Box className="reports-page" sx={{ maxWidth: 1250, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
    <Box className="reports-controls" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}><AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} /><Box><Typography variant="h5" fontWeight={700}>Reports</Typography><Typography variant="body2" color="text.secondary">Presentation and export of completed analyses</Typography></Box><Chip label={hasData ? 'Results available' : 'No results'} color={hasData ? 'success' : 'default'} sx={{ ml: 'auto' }} /></Box>
    <Paper className="reports-controls" variant="outlined" sx={{ p: 2, mb: 3 }}><Grid container spacing={2} alignItems="center"><Grid item xs={12} md={3}><FormControl fullWidth size="small"><InputLabel>Report type</InputLabel><Select value={reportType} label="Report type" onChange={handleType}><MenuItem value="safety" disabled={!signalData}>Safety Signal Report</MenuItem><MenuItem value="readiness" disabled={!readinessData}>Submission Readiness Report</MenuItem><MenuItem value="combined" disabled={!hasData}>Combined Regulatory Report</MenuItem></Select></FormControl></Grid><Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Available results: {signalData ? `Signal Detection (${signalData.drug_name})` : 'No signal analysis'} · {readinessData ? `Submission Readiness (${readinessData.filename})` : 'No readiness analysis'}</Typography></Grid><Grid item xs={12} md={6}><Box className="module-action-row" sx={{ justifyContent: { xs: 'stretch', md: 'flex-end' } }}><Button variant="contained" startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />} onClick={generate} disabled={!hasData || generating}>{generating ? 'Generating...' : 'Generate Report'}</Button><Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={!generated}>PDF</Button><Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={!generated}>CSV</Button><Button variant="outlined" onClick={exportJson} disabled={!generated}>JSON</Button><Button variant="outlined" onClick={refresh}>Refresh</Button></Box></Grid></Grid></Paper>
    {status === 'success' && <Alert className="reports-controls" severity="success" sx={{ mb: 2 }}>Report generated successfully. Use PDF to open the print-to-PDF workflow.</Alert>}{status === 'error' && <Alert className="reports-controls" severity="error" sx={{ mb: 2 }}>No report data available.</Alert>}{!hasData && <EmptyReport message="No analysis results available. Run Signal Detection or Submission Readiness analysis first." />}{hasData && !generated && <Alert className="reports-controls" severity="info">Select a report type and generate a report preview from the latest available analysis.</Alert>}
    {generated && <Paper sx={{ p: { xs: 2, md: 4 } }}><Typography variant="h4" fontWeight={700}>Drug Safety Signal Detector &amp; Regulatory Submission Readiness Checker</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Generated report · {reportType === 'combined' ? 'Combined Regulatory Report' : reportType === 'safety' ? 'Safety Signal Report' : 'Submission Readiness Report'}</Typography><Divider sx={{ my: 3 }} />{reportType === 'safety' && signalData && <SignalReport data={signalData} />}{reportType === 'readiness' && readinessData && <ReadinessReport data={readinessData} />}{reportType === 'combined' && <Stack spacing={3}><Typography variant="h6">Executive Summary</Typography><Typography>Safety analysis: {signalData ? `${signalData.signals.filter((signal) => signal.signal_level === 'signal').length} Potential Safety Signals and ${signalData.signals.filter((signal) => signal.signal_level === 'weak_signal').length} Weak / Emerging Signals for ${signalData.drug_name}.` : 'No signal analysis results are available.'} {readinessData ? `The submission contains ${readinessData.overall_completeness_pct}% applicable CTD requirements as Present.` : 'No submission readiness results are available.'}</Typography>{signalData && <SignalReport data={signalData} />}{readinessData && <ReadinessReport data={readinessData} />}<Typography variant="h6">Recommended Review Areas</Typography><Typography>{signalData?.signals.filter((signal) => signal.signal_level !== 'no_signal').slice(0, 5).map((signal) => signal.adverse_event).join(', ') || 'No safety review areas returned.'}{readinessData?.gaps.length ? `; ${readinessData.gaps.slice(0, 5).map((gap) => gap.title).join(', ')}` : ''}</Typography><Alert severity="warning">{SAFETY_DISCLAIMER}</Alert><Alert severity="info">{READINESS_DISCLAIMER}</Alert></Stack>}</Paper>}
    <style>{'@media print { .reports-controls { display: none !important; } .reports-page { max-width: none !important; padding: 0 !important; } .reports-page > .MuiPaper-root { box-shadow: none !important; } body { background: white !important; } }'}</style>
  </Box>
}