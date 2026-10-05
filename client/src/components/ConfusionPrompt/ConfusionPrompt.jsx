function ConfusionPrompt({
  detection,
  depth,
  onDepthChange,
  onExplain,
  onDismiss,
}) {
  if (!detection) {
    return null;
  }

  const reasonMessages = {
    REPEATED_REWINDS:
      "You have rewound this section several times.",

    RAPID_PAUSE_PLAY:
      "You have paused and resumed this section repeatedly.",

    ABRUPT_SPEED_DROP:
      "You significantly reduced the playback speed here.",
  };

  return (
    <div className="absolute bottom-24 left-1/2 z-30 w-[90%] max-w-md -translate-x-1/2 rounded-xl border border-slate-700 bg-[#0a0a0a]/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">
            Having trouble with this part?
          </p>

          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {reasonMessages[detection.reason] ||
              "Your interaction pattern suggests you may need help with this section."}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-500 transition hover:text-white"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Explanation depth
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[
            {
              value: "BRIEF",
              label: "Brief",
            },
            {
              value: "STANDARD",
              label: "Standard",
            },
            {
              value: "DEEP",
              label: "Deep",
            },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                onDepthChange(option.value)
              }
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                depth === option.value
                  ? "border-slate-400 bg-slate-800/80 text-white"
                  : "border-slate-800 bg-[#111] text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onExplain}
          className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-slate-200"
        >
          Explain this
        </button>

        <button
          onClick={onDismiss}
          className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-200"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

export default ConfusionPrompt;