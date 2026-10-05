function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);

  const remainingSeconds =
    Math.floor(seconds % 60);

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(
    2,
    "0"
  )}`;
}


function VideoControls({
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  heatmapData = [],
  onPlayPause,
  onSeek,
  onSpeedChange,
}) {
  const handleRewind = () => {
    onSeek(
      Math.max(
        0,
        currentTime - 10
      )
    );
  };


  const handleForward = () => {
    onSeek(
      Math.min(
        duration,
        currentTime + 10
      )
    );
  };


  /*
   * Convert a heatmap bucket into a percentage
   * position on the timeline.
   */
  const getLeftPosition = (start) => {
    if (!duration || duration <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        (start / duration) * 100
      )
    );
  };


  /*
   * Convert the bucket duration into a percentage
   * width on the timeline.
   */
  const getWidth = (start, end) => {
    if (!duration || duration <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        ((end - start) / duration) * 100
      )
    );
  };


  /*
   * Convert the confusion count into visual
   * intensity.
   *
   * Higher peer confusion count =
   * more visible heatmap section.
   */
  const getOpacity = (count) => {
    const safeCount =
      Number(count) || 0;

    return Math.min(
      0.9,
      0.25 + safeCount * 0.1
    );
  };


  return (
    <div className="border-t border-slate-800/60 bg-[#111] p-4">

      {/* Timeline + Peer Confusion Heatmap */}

      <div className="relative">

        {/* Heatmap layer */}

        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-2 overflow-hidden rounded-full"
          title="Peer confusion"
        >

          {heatmapData.map(
            (bucket, index) => {
              const left =
                getLeftPosition(
                  bucket.start
                );

              const width =
                getWidth(
                  bucket.start,
                  bucket.end
                );

              const opacity =
                getOpacity(
                  bucket.count
                );

              return (
                <div
                  key={`${bucket.start}-${bucket.end}-${index}`}
                  className="absolute top-0 h-full rounded-full bg-slate-400"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    opacity,
                  }}
                />
              );
            }
          )}

        </div>


        {/* Actual seek bar */}

        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={(event) =>
            onSeek(
              Number(
                event.target.value
              )
            )
          }
          className="relative z-10 w-full cursor-pointer accent-slate-300"
        />

      </div>


      {/* Heatmap Legend */}

      {heatmapData.length > 0 && (
        <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-slate-500">

          <span>
            Peer confusion
          </span>

          <span className="h-2 w-8 rounded-full bg-slate-500/30" />

          <span>
            Higher density
          </span>

        </div>
      )}


      {/* Time */}

      <div className="mt-2 flex justify-between text-xs text-slate-400">

        <span>
          {formatTime(currentTime)}
        </span>

        <span>
          {formatTime(duration)}
        </span>

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
          className="rounded-lg bg-white text-black font-medium hover:bg-slate-200 px-6 py-2 text-sm font-semibold transition hover:bg-slate-200"
        >
          {isPlaying
            ? "Pause"
            : "Play"}
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
            onSpeedChange(
              Number(
                event.target.value
              )
            )
          }
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
        >
          <option value={0.5}>
            0.5×
          </option>

          <option value={0.75}>
            0.75×
          </option>

          <option value={1}>
            1×
          </option>

          <option value={1.25}>
            1.25×
          </option>

          <option value={1.5}>
            1.5×
          </option>

          <option value={2}>
            2×
          </option>
        </select>

      </div>

    </div>
  );
}


export default VideoControls;