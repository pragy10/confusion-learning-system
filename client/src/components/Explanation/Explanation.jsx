import VisualExplanation from "./VisualExplanation";

function Explanation({ result, onClose, onSave }) {
  if (!result) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-[#111] p-5 relative">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-100">
            Explanation
          </h2>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-300">
            {result.confusion_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={() => onSave(result)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Save
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">
        {result.explanation}
      </p>

      {result.visual_type !== "NONE" && (
        <div className="mt-5 rounded-lg border border-slate-800/80 bg-black/40 p-4 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Visual Explanation
            </p>

            <h3 className="mt-1 text-sm font-medium text-slate-200 mb-2">
            {result.visual_title}
            </h3>

            <VisualExplanation
            visualType={result.visual_type}
            visual={result.visual}
            />
        </div>
        )}

      <div className="mt-5 rounded-lg border-l-2 border-l-slate-400 border-y border-y-slate-800/50 border-r border-r-slate-800/50 bg-slate-900/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Key Point
        </p>

        <p className="mt-1 text-sm text-slate-300 leading-relaxed">
          {result.key_point}
        </p>
      </div>
    </div>
  );
}

export default Explanation;

