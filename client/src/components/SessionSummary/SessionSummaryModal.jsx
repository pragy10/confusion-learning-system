import { useState, useEffect } from "react";
import {
  BarChart3,
  X,
  Clock,
  HelpCircle,
  FileText,
  Bookmark,
  RotateCcw,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { generateSessionSummaryAI } from "../../services/explanationService";
import { exportSessionSummaryToPdf } from "../../utils/pdfExport";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SessionSummaryModal({
  isOpen,
  onClose,
  events = [],
  duration = 0,
  currentTime = 0,
  savedExplanations = [],
  customNotes = "",
  videoTitle = "Current Video",
  onSeek,
}) {
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate stats from telemetry events
  const confusionEvents = events.filter(
    (e) => e.type === "CONFUSION_SIGNAL" || e.type === "AUTO_CONFUSION_EXPLANATION_REQUEST"
  );

  const rewindEvents = events.filter((e) => e.type === "REWIND");
  const speedEvents = events.filter((e) => e.type === "SPEED_CHANGE");
  const pauseEvents = events.filter((e) => e.type === "PAUSE");

  const byType = {
    TOO_FAST: 0,
    MISSED_TERM: 0,
    LOST_THE_LOGIC: 0,
    LOST_BIGGER_PICTURE: 0,
  };

  confusionEvents.forEach((e) => {
    if (e.confusionType && byType[e.confusionType] !== undefined) {
      byType[e.confusionType] += 1;
    } else if (e.reason) {
      if (e.reason === "REPEATED_REWINDS") byType.TOO_FAST += 1;
      else if (e.reason === "ABRUPT_SPEED_DROP") byType.LOST_THE_LOGIC += 1;
      else byType.LOST_THE_LOGIC += 1;
    }
  });

  const totalConfusions = confusionEvents.length;
  const watchPercentage = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  const handleGenerateAI = async () => {
    setLoadingAi(true);
    try {
      const summary = await generateSessionSummaryAI({
        events,
        confusionStats: {
          totalConfusions,
          byType,
          watchTimeFormatted: `${formatTime(currentTime)} / ${formatTime(duration)}`,
          rewindCount: rewindEvents.length,
          speedChangeCount: speedEvents.length,
        },
        customNotes,
        videoTitle,
      });
      setAiSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const generateMarkdownReport = () => {
    return `# Learning Session Summary: ${videoTitle}
**Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
**Watch Time:** ${formatTime(currentTime)} / ${formatTime(duration)} (${watchPercentage}%)
**Confusion Moments Recorded:** ${totalConfusions}
**Rewinds:** ${rewindEvents.length} | **Speed Changes:** ${speedEvents.length}

## Confusion Breakdown
- Too Fast: ${byType.TOO_FAST}
- Missed Term: ${byType.MISSED_TERM}
- Lost the Logic: ${byType.LOST_THE_LOGIC}
- Bigger Picture: ${byType.LOST_BIGGER_PICTURE}

## AI Learning Synthesis
${aiSummary?.overview || "Active review completed."}

### Stumbling Blocks:
${aiSummary?.stumbling_blocks?.map((s) => `- ${s}`).join("\n") || "- None"}

### Recommended Review:
${aiSummary?.recommended_review?.map((r) => `- ${r}`).join("\n") || "- None"}

## Personal Notes
${customNotes || "(No custom notes recorded)"}

## Saved Explanations (${savedExplanations.length})
${savedExplanations
  .map(
    (exp, idx) => `### ${idx + 1}. [${exp.confusion_type}]
${exp.explanation}
> **Key Point:** ${exp.key_point}
`
  )
  .join("\n")}
`;
  };

  const handleCopyReport = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadReport = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-summary-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    exportSessionSummaryToPdf({
      videoTitle,
      stats: {
        watchTimeFormatted: `${formatTime(currentTime)} / ${formatTime(duration)}`,
        totalConfusions,
        rewindCount: rewindEvents.length,
        speedChangeCount: speedEvents.length,
      },
      byType,
      aiSummary,
      customNotes,
      savedExplanations,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-[#0d0d0d] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#111] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Session Learning Summary</h2>
              <p className="text-xs text-slate-400">
                Cognitive telemetry, friction diagnostics, and retention analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Copy session markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Download session report (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
              title="Export complete session summary as PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition ml-2"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Watch time */}
            <div className="rounded-xl border border-slate-800/60 bg-[#121212] p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Watch Position</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-xl font-bold text-slate-100">
                {formatTime(currentTime)}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                of {formatTime(duration)} ({watchPercentage}%)
              </p>
            </div>

            {/* Confusions */}
            <div className="rounded-xl border border-slate-800/60 bg-[#121212] p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Friction Signals</span>
                <HelpCircle className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-xl font-bold text-slate-100">
                {totalConfusions}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {totalConfusions === 0 ? "Smooth progress" : "Identified & handled"}
              </p>
            </div>

            {/* Rewinds & Speed */}
            <div className="rounded-xl border border-slate-800/60 bg-[#121212] p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Playback Behaviors</span>
                <RotateCcw className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-xl font-bold text-slate-100">
                {rewindEvents.length} <span className="text-xs font-normal text-slate-400">rewinds</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {speedEvents.length} rate changes, {pauseEvents.length} pauses
              </p>
            </div>

            {/* Explanations & Notes */}
            <div className="rounded-xl border border-slate-800/60 bg-[#121212] p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Saved Artifacts</span>
                <Bookmark className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-xl font-bold text-slate-100">
                {savedExplanations.length}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {customNotes.trim() ? `${customNotes.trim().split(/\s+/).length} words written` : "No custom notes"}
              </p>
            </div>
          </div>

          {/* AI Learning Synthesis */}
          <div className="rounded-xl border border-slate-800/80 bg-[#121212] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-300" />
                <h3 className="text-sm font-semibold text-slate-100">AI Learning Synthesis & Review</h3>
              </div>
              <button
                onClick={handleGenerateAI}
                disabled={loadingAi}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingAi ? "animate-spin" : ""}`} />
                <span>{loadingAi ? "Analyzing..." : aiSummary ? "Re-analyze" : "Generate AI Synthesis"}</span>
              </button>
            </div>

            {loadingAi ? (
              <div className="flex items-center justify-center gap-3 py-6 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                <span>Evaluating telemetry patterns and synthesizing review notes...</span>
              </div>
            ) : aiSummary ? (
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                  {aiSummary.overview}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiSummary.stumbling_blocks && (
                    <div className="rounded-lg border border-slate-800/60 bg-[#0a0a0a] p-3.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                        Stumbling Blocks Diagnosed
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiSummary.stumbling_blocks.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-slate-500 mt-0.5">•</span>
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiSummary.recommended_review && (
                    <div className="rounded-lg border border-slate-800/60 bg-[#0a0a0a] p-3.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                        Recommended Next Steps
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiSummary.recommended_review.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-800 bg-[#0a0a0a] p-4 text-xs text-slate-400">
                <span>Click &quot;Generate AI Synthesis&quot; to produce an automated review based on your session confusion patterns.</span>
                <button
                  onClick={handleGenerateAI}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-200 transition shrink-0 ml-4"
                >
                  Analyze Session
                </button>
              </div>
            )}
          </div>

          {/* Two-Column Grid: Confusion Breakdown & Stumbling Blocks Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Confusion Breakdown by Type */}
            <div className="rounded-xl border border-slate-800/60 bg-[#121212] p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Confusion Diagnostics</h3>
              <p className="text-xs text-slate-500 mb-4">Frequency of signaled confusion categories</p>

              <div className="space-y-3">
                {[
                  { key: "TOO_FAST", label: "Too Fast (Pacing)", count: byType.TOO_FAST },
                  { key: "MISSED_TERM", label: "Missed Term (Vocabulary)", count: byType.MISSED_TERM },
                  { key: "LOST_THE_LOGIC", label: "Lost the Logic (Reasoning)", count: byType.LOST_THE_LOGIC },
                  { key: "LOST_BIGGER_PICTURE", label: "Bigger Picture (Architecture)", count: byType.LOST_BIGGER_PICTURE },
                ].map((item) => {
                  const pct = totalConfusions > 0 ? Math.round((item.count / totalConfusions) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{item.label}</span>
                        <span className="text-slate-400 font-mono">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-slate-300 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confusion Moments Timeline */}
            <div className="rounded-xl border border-slate-800/60 bg-[#121212] p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Friction Moments Timeline</h3>
              <p className="text-xs text-slate-500 mb-4">Click any timestamp to seek video</p>

              {confusionEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                  <TrendingUp className="w-6 h-6 mb-2 text-slate-600" />
                  <p className="text-xs">No confusion signals recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {confusionEvents.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-[#0a0a0a] px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            if (onSeek && Number.isFinite(evt.videoTime)) {
                              onSeek(evt.videoTime);
                              onClose();
                            }
                          }}
                          className="font-mono text-[11px] font-semibold text-slate-200 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 transition"
                          title="Seek video to this moment"
                        >
                          {formatTime(evt.videoTime || 0)}
                        </button>
                        <span className="text-slate-300">
                          {evt.confusionType ? evt.confusionType.replace(/_/g, " ") : evt.reason || "Auto detected"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {evt.clientTimestamp ? new Date(evt.clientTimestamp).toLocaleTimeString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* User Notes Preview if any */}
          {customNotes.trim() && (
            <div className="rounded-xl border border-slate-800/60 bg-[#121212] p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-100">Personal Notes From This Session</h3>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-[#0a0a0a] p-3 text-xs leading-relaxed text-slate-300 font-sans">
                {customNotes}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-[#111] px-6 py-3.5">
          <span className="text-xs text-slate-500">
            {events.length} total telemetry events tracked
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-slate-200 transition"
          >
            Close Summary
          </button>
        </div>

      </div>
    </div>
  );
}
