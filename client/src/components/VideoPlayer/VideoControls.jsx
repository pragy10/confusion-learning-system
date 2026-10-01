function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function VideoControls({
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  onPlayPause,
  onSeek,
  onSpeedChange,
}) {
  const handleRewind = () => {
    onSeek(Math.max(0, currentTime - 10));
  };

  const handleForward = () => {
    onSeek(Math.min(duration, currentTime + 10));
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-4">

      {/* Progress */}
      <input
        type="range"
        min="0"
        max={duration || 0}
        step="0.1"
        value={currentTime}
        onChange={(event) =>
          onSeek(Number(event.target.value))
        }
        className="w-full cursor-pointer accent-cyan-400"
      />

      {/* Time */}
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-3">

        <button
          onClick={handleRewind}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
        >
          -10s
        </button>

        <button
          onClick={onPlayPause}
          className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          onClick={handleForward}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
        >
          +10s
        </button>

        <select
          value={playbackRate}
          onChange={(event) =>
            onSpeedChange(Number(event.target.value))
          }
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
        >
          <option value={0.5}>0.5×</option>
          <option value={0.75}>0.75×</option>
          <option value={1}>1×</option>
          <option value={1.25}>1.25×</option>
          <option value={1.5}>1.5×</option>
          <option value={2}>2×</option>
        </select>

      </div>
    </div>
  );
}

export default VideoControls;