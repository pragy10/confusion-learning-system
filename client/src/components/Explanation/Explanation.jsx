import { useState } from "react";
import VisualExplanation from "./VisualExplanation";
import {
  HelpCircle,
  RefreshCw,
  Sparkles,
  PenLine,
  Check,
  Send,
  Lightbulb,
  Globe,
  Layers,
  Search,
} from "lucide-react";
import { generateFollowupExplanation } from "../../services/explanationService";

function Explanation({
  result,
  onClose,
  onSave,
  onAddToNotes,
  transcriptContext = "",
}) {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customQuery, setCustomQuery] = useState("");
  const [addedNoteId, setAddedNoteId] = useState(null);

  if (!result) {
    return null;
  }

  const handleRequestFollowup = async (mode, queryText) => {
    setLoading(true);
    setError(null);
    try {
      const followupResult = await generateFollowupExplanation({
        transcriptContext: transcriptContext || result.explanation,
        originalExplanation: result.explanation,
        confusionType: result.confusion_type || "GENERAL",
        query: queryText || mode,
        mode,
      });

      setFollowups((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          mode,
          query: queryText,
          result: followupResult,
          timestamp: Date.now(),
        },
      ]);
      setCustomQuery("");
    } catch (err) {
      console.error(err);
      setError("Could not generate further explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    handleRequestFollowup("CUSTOM", customQuery.trim());
  };

  const handleSaveAll = () => {
    if (!onSave) return;
    onSave({
      ...result,
      followups,
    });
  };

  const handleAddKeyPointToNotes = (text, id = "main") => {
    if (!onAddToNotes) return;
    onAddToNotes(text);
    setAddedNoteId(id);
    setTimeout(() => setAddedNoteId(null), 1500);
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-[#111] p-5 relative shadow-sm">
      {/* Top Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-slate-100">
            Explanation
          </h2>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-300">
            {result.confusion_type}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onAddToNotes && result.key_point && (
            <button
              onClick={() => handleAddKeyPointToNotes(`• ${result.key_point}`, "main")}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Add key point to Personal Notes"
            >
              {addedNoteId === "main" ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Added</span>
                </>
              ) : (
                <>
                  <PenLine className="w-3 h-3 text-slate-400" />
                  <span>Add to Notes</span>
                </>
              )}
            </button>
          )}

          {onSave && (
            <button
              onClick={handleSaveAll}
              className="text-xs px-3 py-1 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Save
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Explanation Body */}
      <p className="text-xs leading-relaxed text-slate-200">
        {result.explanation}
      </p>

      {/* Visual Diagram */}
      {result.visual_type && result.visual_type !== "NONE" && (
        <div className="mt-4 rounded-lg border border-slate-800/80 bg-black/40 p-4 shadow-inner">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Visual Diagram
          </p>

          <h3 className="mt-0.5 text-xs font-medium text-slate-200 mb-2">
            {result.visual_title}
          </h3>

          <VisualExplanation
            visualType={result.visual_type}
            visual={result.visual}
          />
        </div>
      )}

      {/* Key Point */}
      {result.key_point && (
        <div className="mt-4 rounded-lg border-l-2 border-l-slate-400 border-y border-y-slate-800/50 border-r border-r-slate-800/50 bg-slate-900/30 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Key Takeaway
          </p>

          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            {result.key_point}
          </p>
        </div>
      )}

      {/* ── FOLLOW-UP EXPLANATIONS THREAD ── */}
      {followups.length > 0 && (
        <div className="mt-5 space-y-4 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>Further Clarifications</span>
          </div>

          {followups.map((item, idx) => (
            <div
              key={item.id || idx}
              className="rounded-lg border border-slate-800 bg-[#0a0a0a] p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-[11px] border-b border-slate-800/60 pb-2">
                <span className="font-medium text-slate-400">
                  {item.mode === "CUSTOM"
                    ? `Q: "${item.query}"`
                    : `Focus: ${item.mode.replace(/_/g, " ")}`}
                </span>
                {onAddToNotes && item.result.key_point && (
                  <button
                    onClick={() =>
                      handleAddKeyPointToNotes(
                        `• [Clarification] ${item.result.key_point}`,
                        item.id
                      )
                    }
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition"
                  >
                    {addedNoteId === item.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <PenLine className="w-3 h-3" />
                    )}
                    <span>{addedNoteId === item.id ? "Added" : "Add to notes"}</span>
                  </button>
                )}
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                {item.result.explanation}
              </p>

              {item.result.analogy_or_example && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5 text-xs text-slate-300">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Everyday Analogy
                  </span>
                  <p className="italic leading-relaxed">{item.result.analogy_or_example}</p>
                </div>
              )}

              {item.result.visual_type && item.result.visual_type !== "NONE" && (
                <div className="rounded-lg border border-slate-800/80 bg-black/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {item.result.visual_title || "Step Progression"}
                  </p>
                  <VisualExplanation
                    visualType={item.result.visual_type}
                    visual={item.result.visual}
                  />
                </div>
              )}

              {item.result.key_point && (
                <p className="border-l border-slate-500 pl-2 text-[11px] text-slate-400 italic">
                  Key point: {item.result.key_point}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STILL CONFUSED? FURTHER EXPLANATION SECTION ── */}
      <div className="mt-5 border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-200">
              Still confused? Request further explanation
            </h3>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          Select a targeted clarification mode or ask a specific question:
        </p>

        {/* Quick Strategy Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => handleRequestFollowup("SIMPLIFY", "Explain in simpler terms with no jargon")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0a0a] px-2.5 py-2 text-left text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 disabled:opacity-50 transition"
          >
            <Lightbulb className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Simpler terms</span>
          </button>

          <button
            onClick={() => handleRequestFollowup("ANALOGY", "Give a concrete real-world analogy")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0a0a] px-2.5 py-2 text-left text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 disabled:opacity-50 transition"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Real-world analogy</span>
          </button>

          <button
            onClick={() => handleRequestFollowup("STEP_BY_STEP", "Walk through this step by step")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0a0a] px-2.5 py-2 text-left text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 disabled:opacity-50 transition"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Step-by-step breakdown</span>
          </button>

          <button
            onClick={() => handleRequestFollowup("DEEP_DIVE", "Explain the technical details and reasoning")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0a0a] px-2.5 py-2 text-left text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 disabled:opacity-50 transition"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Technical deep-dive</span>
          </button>
        </div>

        {/* Custom question form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Ask a specific question (e.g. 'What does X mean?')..."
            className="flex-1 rounded-lg border border-slate-800 bg-[#0a0a0a] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !customQuery.trim()}
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-200 disabled:opacity-50 transition shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>Clarify</span>
              </>
            )}
          </button>
        </form>

        {loading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
            <span>Generating further explanation tailored to your confusion...</span>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default Explanation;
