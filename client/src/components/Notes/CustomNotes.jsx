import { useState, useRef } from "react";
import { PenLine, Clock, Download, Trash2, ChevronDown, ChevronUp, Check, Copy, FileText } from "lucide-react";
import { exportPersonalNotesToPdf } from "../../utils/pdfExport";

function formatSeconds(sec) {
  if (!Number.isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseSeconds(timestampStr) {
  const parts = timestampStr.replace(/[[\]]/g, "").split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  return null;
}

export default function CustomNotes({
  notes = "",
  onChange,
  currentTime = 0,
  onSeek,
  videoKey = "default",
}) {
  const storageKey = `confusion_learning_notes_${videoKey}`;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    const newVal = e.target.value;
    if (onChange) onChange(newVal);
    try {
      localStorage.setItem(storageKey, newVal);
    } catch (err) {
      console.warn("Storage save error", err);
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  };

  const handleInsertTimestamp = () => {
    const formatted = `[${formatSeconds(currentTime)}] `;
    const textarea = textareaRef.current;
    if (!textarea) {
      const updated = notes ? `${notes}\n${formatted}` : formatted;
      if (onChange) onChange(updated);
      try {
        localStorage.setItem(storageKey, updated);
      } catch (e) {
        console.warn("Storage write error", e);
      }
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prefix = start > 0 && notes[start - 1] !== "\n" ? "\n" : "";
    const updated = notes.substring(0, start) + prefix + formatted + notes.substring(end);
    if (onChange) onChange(updated);
    try {
      localStorage.setItem(storageKey, updated);
    } catch (e) {
      console.warn("Storage write error", e);
    }

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length + formatted.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  const handleClear = () => {
    if (!notes.trim()) return;
    if (window.confirm("Clear all your notes for this video?")) {
      if (onChange) onChange("");
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn("Storage remove error", e);
      }
    }
  };

  const handleCopy = () => {
    if (!notes.trim()) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!notes.trim()) return;
    const blob = new Blob([notes], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-notes-${videoKey}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find all timestamps in notes like [01:23]
  const timestampMatches = Array.from(
    new Set(notes.match(/\[\d{1,2}:\d{2}\]/g) || [])
  );

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#111] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0a0a0a] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-200">Personal Notes</span>
          {justSaved && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 transition-opacity">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInsertTimestamp}
            className="flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition"
            title="Insert current video timestamp"
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>+{formatSeconds(currentTime)}</span>
          </button>

          {notes && (
            <>
              <button
                onClick={handleCopy}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                title="Copy notes"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleDownload}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                title="Download notes (.md)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => exportPersonalNotesToPdf({ videoTitle: videoKey, notes })}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                title="Export notes as PDF"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleClear}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
                title="Clear notes"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition ml-1"
            title={isCollapsed ? "Expand notes" : "Collapse notes"}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-3">
          {/* Quick timestamp navigation if any timestamps present */}
          {timestampMatches.length > 0 && onSeek && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5 border-b border-slate-800/50 pb-2">
              <span className="text-[10px] text-slate-500 font-medium">Timestamps:</span>
              {timestampMatches.map((ts) => {
                const sec = parseSeconds(ts);
                return (
                  <button
                    key={ts}
                    onClick={() => sec !== null && onSeek(sec)}
                    className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 hover:border-slate-600 hover:text-white transition"
                    title={`Jump video to ${ts}`}
                  >
                    {ts}
                  </button>
                );
              })}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={notes}
            onChange={handleTextChange}
            placeholder="Type your notes, insights, or questions here. Click '+timestamp' to mark video points..."
            rows={4}
            className="w-full resize-y rounded-lg border border-slate-800/80 bg-[#0a0a0a] p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none leading-relaxed font-sans"
          />

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
            <span>Click timestamps to jump video.</span>
            <span>{notes.trim() ? `${notes.trim().split(/\s+/).length} words` : "Empty"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
