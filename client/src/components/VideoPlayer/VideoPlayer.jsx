import { useEffect, useRef, useState } from "react";

import VideoControls from "./VideoControls";

import { useVideoTelemetry } from "../../hooks/useVideoTelemetry";

import RadialMenu from "../RadialMenu/RadialMenu";

import ConfusionPrompt from "../ConfusionPrompt/ConfusionPrompt";

import { detectConfusion } from "../../utils/confusionDetector";

import { getTranscriptContext } from "../../utils/transcriptUtils";

import { generateExplanation } from "../../services/explanationService";

import Explanation from "../Explanation/Explanation";

import { transcribeVideo } from "../../services/transcriptService";

import { getVideoFile } from "../../utils/videoFile";

import MermaidDiagram from "../MermaidDiagram";
import CustomNotes from "../Notes/CustomNotes";
import SessionSummaryModal from "../SessionSummary/SessionSummaryModal";
import { FileText, Bookmark, MessageCircleQuestion, RefreshCw, LayoutList, BarChart3, FileDown } from "lucide-react";
import { exportNotesToPdf } from "../../utils/pdfExport";
import { AI_SERVICE_URL, BACKEND_URL } from "../../config/api";

function VideoPlayer({
  videoUrl = "/videos/sample.mp4",
  videoFile = null,
  isYouTube = false,
  youtubeId = null,
  videoTitle = "",
}) {
  const ytPlayerRef = useRef(null);
  const videoRef = useRef(null);

  const confusionCooldownRef = useRef(0);

  // One session ID for the current video-learning session (stable, never re-renders).
  const [sessionId] = useState(() => crypto.randomUUID());

  /*
   * Watched intervals for the current learner.
   */
  const [watchedIntervals, setWatchedIntervals] = useState([]);

  const [duration, setDuration] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  const [playbackRate, setPlaybackRate] = useState(1);

  const [showRadialMenu, setShowRadialMenu] = useState(false);

  const [confusionDetection, setConfusionDetection] = useState(null);

  const [transcriptContext, setTranscriptContext] = useState(null);

  const [transcript, setTranscript] = useState([]);

  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const [transcriptError, setTranscriptError] = useState(null);

  const [transcriptStatus, setTranscriptStatus] = useState("idle"); // "transcribing" | "ready" | "error"

  const [explanationResult, setExplanationResult] = useState(null);

  const [savedExplanations, setSavedExplanations] = useState([]);

  const [notesData, setNotesData] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState(null);

  const [explanationLoading, setExplanationLoading] = useState(false);

  const [explanationError, setExplanationError] = useState(null);

  const [explanationDepth, setExplanationDepth] = useState("STANDARD");

  const [activeTab, setActiveTab] = useState("transcript");

  /*
   * Peer confusion heatmap data.
   */
  const [heatmapData, setHeatmapData] = useState([]);

  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const [heatmapError, setHeatmapError] = useState(null);

  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const videoStorageKey = `confusion_learning_notes_${videoFile?.name || videoUrl}`;
  const [customNotes, setCustomNotes] = useState(() => {
    try {
      return localStorage.getItem(`confusion_learning_notes_${videoFile?.name || videoUrl}`) || "";
    } catch {
      return "";
    }
  });

  // Listen for global "open-session-summary" event from top nav
  useEffect(() => {
    const handleOpenSummary = () => setShowSessionSummary(true);
    window.addEventListener("open-session-summary", handleOpenSummary);
    return () => window.removeEventListener("open-session-summary", handleOpenSummary);
  }, []);

  const {
    events,
    recordPlay,
    recordPause,
    recordSeek,
    recordSpeedChange,
    recordConfusionSignal,
    recordExplanationRequest,
    updateCurrentTime,
  } = useVideoTelemetry(sessionId);

  /*
   * Add a watched interval.
   */
  const addWatchedInterval = (start, end) => {
    if (typeof start !== "number" || typeof end !== "number") {
      return;
    }

    if (end <= start) {
      return;
    }

    setWatchedIntervals((prev) => {
      const intervals = [
        ...prev,
        { start, end },
      ].sort((a, b) => a.start - b.start);

      const merged = [];

      for (const interval of intervals) {
        const last = merged[merged.length - 1];

        if (!last || interval.start > last.end) {
          merged.push({ start: interval.start, end: interval.end });
        } else {
          last.end = Math.max(last.end, interval.end);
        }
      }

      return merged;
    });
  };

  // ── YOUTUBE IFRAME PLAYER API INTEGRATION ──
  useEffect(() => {
    if (!isYouTube || !youtubeId) return;

    let player = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      try {
        player = new window.YT.Player("yt-player-frame", {
          videoId: youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              ytPlayerRef.current = event.target;
              const dur = event.target.getDuration();
              if (dur && Number.isFinite(dur)) {
                setDuration(dur);
              }
            },
            onStateChange: (event) => {
              if (event.data === 1) {
                // PLAYING
                setIsPlaying(true);
                const cur = event.target.getCurrentTime();
                recordPlay(cur);
              } else if (event.data === 2) {
                // PAUSED
                setIsPlaying(false);
                const cur = event.target.getCurrentTime();
                recordPause(cur);
              }
            },
          },
        });
      } catch (err) {
        console.warn("[YT_INIT_ERROR]", err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      window.onYouTubeIframeAPIReady = initPlayer;
      document.body.appendChild(tag);
    } else {
      initPlayer();
    }

    return () => {
      if (player && typeof player.destroy === "function") {
        try {
          player.destroy();
        } catch (e) {
          console.warn("YT destroy error", e);
        }
      }
    };
  }, [isYouTube, youtubeId, recordPlay, recordPause]);

  // YouTube playhead polling
  useEffect(() => {
    if (!isYouTube) return;
    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        const cur = ytPlayerRef.current.getCurrentTime();
        if (Number.isFinite(cur)) {
          setCurrentTime(cur);
          updateCurrentTime(cur);
          addWatchedInterval(Math.max(0, cur - 1), cur + 1);
          const context = getTranscriptContext(transcript, cur);
          setTranscriptContext(context);
        }
        const dur = ytPlayerRef.current.getDuration();
        if (Number.isFinite(dur) && dur > 0 && dur !== duration) {
          setDuration(dur);
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isYouTube, updateCurrentTime, transcript, duration]);


  const handleAddToNotes = (text) => {
    const formatTimestamp = (sec) => {
      if (!Number.isFinite(sec)) return "[00:00]";
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `[${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}]`;
    };
    const prefix = `${formatTimestamp(currentTime)} `;
    const newEntry = `${prefix}${text}`;
    setCustomNotes((prev) => {
      const updated = prev ? `${prev}\n\n${newEntry}` : newEntry;
      try {
        localStorage.setItem(videoStorageKey, updated);
      } catch (err) {
        console.warn("Storage save error", err);
      }
      return updated;
    });
  };

  // Sync snapshot of session for global Session Summary access
  useEffect(() => {
    try {
      localStorage.setItem(
        "last_learning_session",
        JSON.stringify({
          events,
          duration,
          currentTime,
          savedExplanations,
          customNotes,
          videoTitle: videoFile?.name || "Sample Video",
        })
      );
    } catch (err) {
      console.warn("Session snapshot error", err);
    }
  }, [events, duration, currentTime, savedExplanations, customNotes, videoFile]);

  /*
   * Load and transcribe the video.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadTranscript() {
      try {
        setTranscriptLoading(true);
        setTranscriptError(null);
        setTranscriptStatus("transcribing");

        // 1. YouTube direct transcript (bypass local Whisper)
        if (isYouTube && youtubeId) {
          const res = await fetch(`${AI_SERVICE_URL}/youtube/transcript?videoId=${youtubeId}`);
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.detail || `YouTube transcript fetch failed (${res.status})`);
          }
          const data = await res.json();
          if (!cancelled) {
            setTranscript(data.segments || []);
            setTranscriptStatus("ready");
          }
          return;
        }

        // 2. Local video Whisper transcription
        let fileToTranscribe;
        if (videoFile) {
          fileToTranscribe = videoFile;
        } else {
          fileToTranscribe = await getVideoFile(videoUrl || "/videos/sample.mp4");
        }

        const result = await transcribeVideo(fileToTranscribe);

        if (!cancelled) {
          setTranscript(result?.segments || []);
          setTranscriptStatus("ready");
        }
      } catch (error) {
        console.error("[TRANSCRIPT ERROR]", error);

        if (!cancelled) {
          setTranscriptError(error?.message || "Could not transcribe video.");
          setTranscriptStatus("error");
        }
      } finally {
        if (!cancelled) {
          setTranscriptLoading(false);
        }
      }
    }

    loadTranscript();

    return () => {
      cancelled = true;
    };
  }, [videoUrl, videoFile, isYouTube, youtubeId]);

  /*
   * Load peer confusion heatmap.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadHeatmap() {
      try {
        setHeatmapLoading(true);
        setHeatmapError(null);

        const response = await fetch(
          `${BACKEND_URL}/api/events/heatmap?sessionId=${sessionId}`,
        );

        if (!response.ok) {
          throw new Error(
            `Heatmap request failed with status ${response.status}`,
          );
        }

        const result = await response.json();

        if (!cancelled) {
          setHeatmapData(result?.heatmap || []);
        }
      } catch (error) {
        console.error("[HEATMAP ERROR]", error);

        if (!cancelled) {
          setHeatmapError(
            error?.message || "Could not load peer confusion heatmap.",
          );
        }
      } finally {
        if (!cancelled) {
          setHeatmapLoading(false);
        }
      }
    }

    loadHeatmap();

    const intervalId = setInterval(loadHeatmap, 30000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [sessionId]);

  /*
   * Detect possible confusion from telemetry.
   */
  useEffect(() => {
    const detection = detectConfusion(events);

    if (!detection?.detected) {
      return;
    }

    const now = Date.now();

    if (now < confusionCooldownRef.current) {
      return;
    }

    setConfusionDetection(detection);

    confusionCooldownRef.current = now + 5000;
  }, [events]);

  /*
   * Keyboard Shortcuts Handler:
   * - Space: Pause / Play video
   * - Left Arrow / '<': Seek backward 10 seconds
   * - Right Arrow / '>': Seek forward 10 seconds
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (isYouTube && ytPlayerRef.current) {
          if (isPlaying) {
            if (typeof ytPlayerRef.current.pauseVideo === "function") ytPlayerRef.current.pauseVideo();
          } else {
            if (typeof ytPlayerRef.current.playVideo === "function") ytPlayerRef.current.playVideo();
          }
        } else if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      } else if (e.key === "ArrowLeft" || e.key === "<") {
        e.preventDefault();
        if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
          const oldTime = currentTime;
          const newTime = Math.max(0, oldTime - 10);
          ytPlayerRef.current.seekTo(newTime, true);
          setCurrentTime(newTime);
          recordSeek(oldTime, newTime);
        } else if (videoRef.current) {
          const oldTime = videoRef.current.currentTime;
          const newTime = Math.max(0, oldTime - 10);
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
          recordSeek(oldTime, newTime);
        }
      } else if (e.key === "ArrowRight" || e.key === ">") {
        e.preventDefault();
        if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
          const oldTime = currentTime;
          const newTime = Math.min(duration || 0, oldTime + 10);
          ytPlayerRef.current.seekTo(newTime, true);
          setCurrentTime(newTime);
          recordSeek(oldTime, newTime);
        } else if (videoRef.current) {
          const oldTime = videoRef.current.currentTime;
          const newTime = Math.min(videoRef.current.duration || 0, oldTime + 10);
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
          recordSeek(oldTime, newTime);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recordSeek, isYouTube, isPlaying, currentTime, duration]);

  /*
   * Check whether a heatmap bucket has already been watched.
   */
  const hasWatchedInterval = (start, end) => {
    return watchedIntervals.some(
      (interval) => interval.start <= start && interval.end >= end,
    );
  };

  /*
   * Only expose heatmap buckets inside watched portions.
   */
  const visibleHeatmapData = heatmapData.filter((bucket) =>
    hasWatchedInterval(bucket.start, bucket.end),
  );

  const handleLoadedMetadata = () => {
    if (!videoRef?.current) {
      return;
    }

    setDuration(videoRef.current.duration);
  };

  const handleTimeUpdate = () => {
    if (!videoRef?.current) {
      return;
    }

    const time = videoRef.current.currentTime;

    addWatchedInterval(
      Math.max(0, time - 1),
      Math.min(videoRef.current.duration || time, time + 1),
    );

    setCurrentTime(time);

    updateCurrentTime(time);

    const context = getTranscriptContext(transcript, time);

    setTranscriptContext(context);
  };

  const handlePlay = () => {
    if (!videoRef?.current) {
      return;
    }

    setIsPlaying(true);

    recordPlay(videoRef.current.currentTime);
  };

  const handlePause = () => {
    if (!videoRef?.current) {
      return;
    }

    setIsPlaying(false);

    recordPause(videoRef.current.currentTime);
  };

  const handleSeek = (newTime) => {
    if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      const oldTime = currentTime;
      ytPlayerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
      recordSeek(oldTime, newTime);
      const context = getTranscriptContext(transcript, newTime);
      setTranscriptContext(context);
    } else if (videoRef?.current) {
      const oldTime = videoRef.current.currentTime;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      recordSeek(oldTime, newTime);
    }
  };

  const handlePlayPause = () => {
    if (isYouTube && ytPlayerRef.current) {
      if (isPlaying) {
        if (typeof ytPlayerRef.current.pauseVideo === "function") ytPlayerRef.current.pauseVideo();
      } else {
        if (typeof ytPlayerRef.current.playVideo === "function") ytPlayerRef.current.playVideo();
      }
    } else if (videoRef?.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleConfusionSelect = (confusionType) => {
    recordConfusionSignal(currentTime, confusionType);

    setConfusionDetection({
      detected: true,
      reason: confusionType,
      videoTime: currentTime,
    });

    setShowRadialMenu(false);
  };

  const handleConfusionClose = () => {
    setShowRadialMenu(false);
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === "function") {
      ytPlayerRef.current.setPlaybackRate(rate);
      recordSpeedChange(currentTime, rate);
    } else if (videoRef?.current) {
      videoRef.current.playbackRate = rate;
      recordSpeedChange(videoRef.current.currentTime, rate);
    }
  };

  const handleExplain = async () => {
    if (!confusionDetection) {
      return;
    }

    recordExplanationRequest(
      confusionDetection.videoTime,
      confusionDetection.reason,
    );

    setConfusionDetection(null);

    if (!transcriptContext?.current) {
      setExplanationError(
        "No transcript context is available for this timestamp.",
      );

      return;
    }

    try {
      setActiveTab("explanation");
      setExplanationLoading(true);

      setExplanationError(null);

      setExplanationResult(null);

      const contextParts = [
        ...transcriptContext.previous,
        transcriptContext.current,
        ...transcriptContext.next,
      ];

      const transcriptText = contextParts
        .map(
          (segment) =>
            `[${segment.start.toFixed(1)}s - ${segment.end.toFixed(
              1,
            )}s] ${segment.text}`,
        )
        .join("\n");

      const result = await generateExplanation(
        transcriptText,
        confusionDetection.reason,
        explanationDepth,
      );

      setExplanationResult(result);

      const explanationEvent = {
        type: "EXPLANATION_GENERATED",

        videoTime: confusionDetection.videoTime,

        confusionType: confusionDetection.reason,

        reason: confusionDetection.reason,

        depth: explanationDepth,

        explanation: result?.explanation ?? null,

        visualType: result?.visual_type ?? null,

        visualTitle: result?.visual_title ?? null,

        keyPoint: result?.key_point ?? null,

        metadata: {
          visual: result?.visual ?? null,
        },

        timestamp: Date.now(),
      };

      const { saveTelemetryEvent } =
        await import("../../services/eventService");

      saveTelemetryEvent(explanationEvent, sessionId);
    } catch (error) {
      console.error("[EXPLANATION ERROR]", error);

      setExplanationError(error?.message || "Could not generate explanation.");
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleDismiss = () => {
    setConfusionDetection(null);
  };

  const handleGenerateNotes = async () => {
    if (!transcript || transcript.length === 0) return;
    try {
      setNotesLoading(true);
      setNotesError(null);
      const response = await fetch(`${AI_SERVICE_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate notes");
      }
      const data = await response.json();
      setNotesData(data);
    } catch (err) {
      console.error(err);
      setNotesError(err.message || "Could not generate notes.");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleVideoClick = () => {
    if (!videoRef?.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const TABS = [
    { id: "explanation", label: "Explanation", icon: <MessageCircleQuestion className="w-4 h-4 mb-1" /> },
    { id: "transcript", label: "Transcript", icon: <LayoutList className="w-4 h-4 mb-1" /> },
    { id: "saved", label: "Saved Explanations", icon: <Bookmark className="w-4 h-4 mb-1" /> },
  ];

  return (
    <div className="w-full space-y-4">
      {/* ── TOP NOTIFICATION STATUS BAR FOR TRANSCRIPTION ── */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-[#111] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
          {transcriptStatus === "transcribing" && (
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
              <span>Transcribing video audio with Whisper...</span>
            </div>
          )}
          {transcriptStatus === "ready" && (
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span>{isYouTube ? `YouTube Transcript Synced (${transcript.length} segments) ✓` : "Transcript Ready & Synced ✓"}</span>
            </div>
          )}
          {transcriptStatus === "error" && (
            <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/80 px-3 py-1 text-xs font-medium text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span>Transcript Error: {transcriptError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSessionSummary(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
            title="View learning session analytics and retention summary"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Session Summary</span>
          </button>

          {/* Shortcuts Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span>Shortcuts:</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300 border border-slate-700">Space</span> Play/Pause
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300 border border-slate-700">← / &lt;</span> -10s
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300 border border-slate-700">→ / &gt;</span> +10s
        </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN: Video + Below-Video Video Notes & Heatmap ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Video container */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800/60 bg-black overflow-hidden">
            {isYouTube ? (
              <div className="aspect-video w-full bg-black flex items-center justify-center">
                <div id="yt-player-frame" className="w-full h-full" />
              </div>
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                className="aspect-video w-full bg-black cursor-pointer"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                onClick={handleVideoClick}
              />
            )}

            <button
              onClick={() => {
                if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
                  ytPlayerRef.current.pauseVideo();
                } else if (videoRef.current && !videoRef.current.paused) {
                  videoRef.current.pause();
                }
                setShowRadialMenu(true);
              }}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#111] text-slate-200 shadow-sm transition-transform hover:scale-105 hover:bg-slate-800"
              title="Signal confusion"
            >
              <MessageCircleQuestion className="w-5 h-5" />
            </button>

            {showRadialMenu && (
              <RadialMenu
                onSelect={handleConfusionSelect}
                onClose={handleConfusionClose}
              />
            )}

            <ConfusionPrompt
              detection={confusionDetection}
              depth={explanationDepth}
              onDepthChange={setExplanationDepth}
              onExplain={handleExplain}
              onDismiss={handleDismiss}
            />

            {explanationError && (
              <div className="m-3 rounded-xl border border-red-400/20 bg-slate-900 p-3">
                <p className="text-sm text-red-400">
                  Explanation error: {explanationError}
                </p>
              </div>
            )}

            <VideoControls
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              heatmapData={visibleHeatmapData}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onSpeedChange={handlePlaybackRateChange}
            />
          </div>

          {/* ── VIDEO NOTES (UNDER THE VIDEO) ── */}
          <div className="rounded-xl border border-slate-800/60 bg-[#111] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <h2 className="text-base font-bold text-white">Instant Video Notes</h2>
              </div>
              <div className="flex items-center gap-2">
                {notesData && (
                  <button
                    onClick={() =>
                      exportNotesToPdf({
                        videoTitle: videoTitle || videoFile?.name || (isYouTube ? `YouTube ${youtubeId}` : "Video Notes"),
                        summary: notesData.summary,
                        notes: notesData.notes,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
                    title="Export notes and summary as PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export PDF</span>
                  </button>
                )}
                <button
                  onClick={handleGenerateNotes}
                  disabled={notesLoading || transcriptLoading}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black hover:bg-slate-200 disabled:opacity-50 transition"
                >
                  {notesLoading ? "Generating Notes..." : notesData ? "Regenerate Notes" : "Generate Instant Notes"}
                </button>
              </div>
            </div>

            {notesError && <p className="mb-3 text-sm text-red-400">{notesError}</p>}

            {!notesData && !notesLoading && (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-slate-500 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6">
                <FileText className="w-8 h-8 text-slate-500" />
                <p className="text-sm font-medium text-slate-300">No notes generated yet</p>
                <p className="text-xs text-slate-400 max-w-md">
                  Click <strong className="text-slate-300">Generate Instant Notes</strong> above to create an automated summary, key takeaways, and an interactive concept diagram.
                </p>
              </div>
            )}

            {notesLoading && (
              <div className="flex items-center justify-center gap-3 py-10 rounded-xl bg-[#0a0a0a]">
                <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">Analyzing video transcript & generating notes with LLM...</p>
              </div>
            )}

            {notesData && (
              <div className="space-y-6">
                <div className="rounded-xl bg-[#0a0a0a] p-4 border border-slate-800">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    Video Executive Summary
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-200">{notesData.summary}</p>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                    Key Takeaways & Concepts
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {notesData.notes?.map((n, i) => (
                      <li key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-800/80 p-3 text-xs text-slate-200 border border-slate-700/60">
                        <span className="mt-0.5 flex-shrink-0 text-slate-300 font-bold">▸</span>
                        <span className="leading-relaxed">{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {notesData.mermaid_diagram && (
                  <div>
                    <h3 className="mb-3 border-b border-slate-800 pb-2 text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span>Concept Architecture Diagram</span>
                    </h3>
                    <div className="w-full min-h-[250px] overflow-x-auto rounded-xl bg-[#0a0a0a] p-4 border border-slate-800 shadow-inner">
                      <MermaidDiagram chart={notesData.mermaid_diagram} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Peer Confusion Heatmap */}
          <div className="rounded-xl border border-slate-800/60 bg-[#111] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Peer Confusion Heatmap</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Shows aggregate confusion from previously watched sections.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {visibleHeatmapData.length} visible points
              </span>
            </div>

            {heatmapLoading ? (
              <p className="text-sm text-slate-500">Loading peer confusion data...</p>
            ) : heatmapError ? (
              <p className="text-sm text-red-400">Heatmap error: {heatmapError}</p>
            ) : visibleHeatmapData.length === 0 ? (
              <p className="text-sm text-slate-500">
                Peer confusion data will appear after you watch the relevant portions of the video.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleHeatmapData.map((bucket) => (
                  <div key={`${bucket.start}-${bucket.end}`} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-slate-500">
                      {bucket.start.toFixed(0)}s &ndash; {bucket.end.toFixed(0)}s
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-slate-300 transition-all"
                        style={{
                          width: `${Math.min(100, bucket.count * 10)}%`,
                          opacity: Math.min(1, 0.25 + bucket.count * 0.1),
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-slate-300">
                      {bucket.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Telemetry */}
          <details className="rounded-xl border border-slate-800/60 bg-[#111] p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Telemetry Events (Debug)</h2>
              <span className="text-xs text-slate-500">{events.length} events</span>
            </summary>
            <div className="mt-4 max-h-48 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">Interact with the video to generate telemetry.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-lg bg-slate-800 px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-300">{event.type}</span>
                      <pre className="mt-1 whitespace-pre-wrap text-slate-400">
                        {JSON.stringify(event, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

        </div>

        {/* ── RIGHT COLUMN: Right Navigation Panel ── */}
        <div className="flex flex-col space-y-4">
          {/* Custom Note Taking - above explanations card */}
          <CustomNotes
            notes={customNotes}
            onChange={setCustomNotes}
            currentTime={currentTime}
            onSeek={handleSeek}
            videoKey={videoFile?.name || videoUrl}
          />

          <div className="sticky top-4 z-20 rounded-xl border border-slate-800/60 bg-[#111] overflow-hidden">
            
            {/* Navigation Bar */}
            <nav className="flex border-b border-slate-800 bg-[#0a0a0a]">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const badge =
                  tab.id === "explanation" && (explanationResult || explanationLoading)
                    ? "●"
                    : tab.id === "saved" && savedExplanations.length > 0
                    ? savedExplanations.length
                    : null;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "relative flex flex-1 flex-col items-center gap-1 px-2 py-3 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-slate-900 text-slate-300"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40",
                    ].join(" ")}
                  >
                    <span className="text-sm leading-none">{tab.icon}</span>
                    <span className="text-[11px]">{tab.label}</span>
                    {badge && (
                      <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-slate-950">
                        {badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-300" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Section Body */}
            <div className="p-4 max-h-[calc(100vh-10rem)] overflow-y-auto">

              {/* ── EXPLANATION TAB ── */}
              {activeTab === "explanation" && (
                <div>
                  {explanationLoading && (
                    <div className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-slate-800 p-4">
                      <span className="animate-pulse text-slate-300">⏳</span>
                      <p className="text-sm text-slate-300">Generating explanation...</p>
                    </div>
                  )}
                  {!explanationLoading && !explanationResult && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
                      <MessageCircleQuestion className="w-8 h-8 text-slate-500" />
                      <p className="text-sm font-medium">No active explanation</p>
                      <p className="text-xs text-slate-400">
                        Press the <strong className="text-slate-300">?</strong> button on the video player to ask a question or signal confusion.
                      </p>
                    </div>
                  )}
                  {explanationResult && (
                    <Explanation
                      result={explanationResult}
                      transcriptContext={transcriptContext?.current?.text || ""}
                      onClose={() => setExplanationResult(null)}
                      onSave={(result) => {
                        setSavedExplanations((prev) => [...prev, result]);
                        setExplanationResult(null);
                        setActiveTab("saved");
                      }}
                      onAddToNotes={handleAddToNotes}
                    />
                  )}
                </div>
              )}

              {/* ── TRANSCRIPT TAB ── */}
              {activeTab === "transcript" && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Live Transcript</h2>
                    <span className="text-xs text-slate-500">{currentTime.toFixed(1)}s</span>
                  </div>

                  {transcriptLoading ? (
                    <p className="text-sm text-slate-400">Transcribing video with Whisper...</p>
                  ) : transcriptError ? (
                    <p className="text-sm text-red-400">Transcript error: {transcriptError}</p>
                  ) : transcriptContext?.current ? (
                    <div className="space-y-3">
                      {transcriptContext.previous.length > 0 && (
                        <div className="space-y-1.5">
                          {transcriptContext.previous.map((seg) => (
                            <p key={seg.id} className="rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
                              {seg.text}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3">
                        <p className="text-sm leading-relaxed font-medium text-white">{transcriptContext.current.text}</p>
                        <p className="mt-2 text-[10px] font-mono text-slate-300">
                          {transcriptContext.current.start.toFixed(1)}s – {transcriptContext.current.end.toFixed(1)}s
                        </p>
                      </div>

                      {transcriptContext.next.length > 0 && (
                        <div className="space-y-1.5">
                          {transcriptContext.next.map((seg) => (
                            <p key={seg.id} className="rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
                              {seg.text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No transcript available for this timestamp.</p>
                  )}
                </div>
              )}

              {/* ── SAVED EXPLANATIONS TAB ── */}
              {activeTab === "saved" && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-white">Saved Explanations</h2>

                  {savedExplanations.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
                      <Bookmark className="w-8 h-8 text-slate-500" />
                      <p className="text-sm font-medium">No saved explanations</p>
                      <p className="text-xs text-slate-400">
                        When an explanation is generated, click <strong className="text-slate-300">Save</strong> to store it here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedExplanations.map((exp, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-700 bg-slate-800 p-3.5 shadow-sm"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="rounded-full bg-slate-300/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                              {exp.confusion_type}
                            </span>
                            <button
                              onClick={() => {
                                setExplanationResult(exp);
                                setActiveTab("explanation");
                              }}
                              className="text-[11px] font-medium text-slate-300 hover:text-slate-300 underline"
                            >
                              View full →
                            </button>
                          </div>
                          <p className="line-clamp-3 text-xs leading-relaxed text-slate-300">
                            {exp.explanation}
                          </p>
                          {exp.key_point && (
                            <p className="mt-2 border-l-2 border-amber-400/50 pl-2 text-[11px] italic text-amber-300">
                              {exp.key_point}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* Session Summary Screen Modal */}
      <SessionSummaryModal
        isOpen={showSessionSummary}
        onClose={() => setShowSessionSummary(false)}
        events={events}
        duration={duration}
        currentTime={currentTime}
        savedExplanations={savedExplanations}
        customNotes={customNotes}
        videoTitle={videoFile?.name || "Sample Video"}
        onSeek={handleSeek}
      />
    </div>
  );
}

export default VideoPlayer;
