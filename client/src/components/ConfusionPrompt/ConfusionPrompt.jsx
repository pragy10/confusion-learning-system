function ConfusionPrompt({
  detection,
  onExplain,
  onDismiss,
}) {
  if (!detection?.detected) {
    return null;
  }

  const messages = {
    REPEATED_REWINDS:
      "You seem to be revisiting this section.",
    RAPID_PAUSE_PLAY:
      "You seem to be pausing and replaying this section frequently.",
    ABRUPT_SPEED_DROP:
      "You slowed the video down significantly here.",
  };

  const message =
    messages[detection.reason] ||
    "You may be having trouble with this section.";

  return (
    <div className="absolute bottom-24 left-1/2 z-30 w-[90%] max-w-md -translate-x-1/2">
      <div className="rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
            ?
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">
              Having trouble with this part?
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {message}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={onExplain}
                className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Explain this
              </button>

              <button
                onClick={onDismiss}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-700"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfusionPrompt;