import { useEffect, useRef, useState } from "react";
import VideoControls from "./VideoControls";
import { useVideoTelemetry } from "../../hooks/useVideoTelemetry";
import RadialMenu from "../RadialMenu/RadialMenu";
import ConfusionPrompt from "../ConfusionPrompt/ConfusionPrompt";
import { detectConfusion } from "../../utils/confusionDetector";
import {
  getTranscriptContext,
} from "../../utils/transcriptUtils";

import { transcribeVideo } from "../../services/transcriptService";
import { getVideoFile } from "../../utils/videoFile";

function VideoPlayer() {
  const videoRef = useRef(null);
  const confusionCooldownRef = useRef(0);

  

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

  const {
    events,
    recordPlay,
    recordPause,
    recordSeek,
    recordSpeedChange,
    recordConfusionSignal,
    recordExplanationRequest,
    updateCurrentTime,
  } = useVideoTelemetry();

  useEffect(() => {
    let cancelled = false;

    async function loadTranscript() {
      try {
        setTranscriptLoading(true);
        setTranscriptError(null);

        const videoFile = await getVideoFile(
          "/videos/sample.mp4"
        );

        const result = await transcribeVideo(videoFile);

        if (!cancelled) {
          setTranscript(result.segments || []);
        }
      } catch (error) {
        console.error(
          "[TRANSCRIPT ERROR]",
          error
        );

        if (!cancelled) {
          setTranscriptError(error.message);
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
  }, []);

  useEffect(() => {
      const detection = detectConfusion(events);

      if (!detection.detected) {
        return;
      }

      const now = Date.now();

      if (now < confusionCooldownRef.current) {
        return;
      }

      setConfusionDetection(detection);

      confusionCooldownRef.current =
        now + 5000;
    }, [events]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;

    setDuration(videoRef.current.duration);
  };

  const handleTimeUpdate = () => {
  if (!videoRef.current) return;

  const time = videoRef.current.currentTime;

    setCurrentTime(time);
    updateCurrentTime(time);

    const context = getTranscriptContext(
      transcript,
      time
    );

    setTranscriptContext(context);
  };

  const handlePlay = () => {
    if (!videoRef.current) return;

    setIsPlaying(true);
    recordPlay(videoRef.current.currentTime);
  };

  const handlePause = () => {
    if (!videoRef.current) return;

    setIsPlaying(false);
    recordPause(videoRef.current.currentTime);
  };

  const handleSeek = (newTime) => {
    if (!videoRef.current) return;

    const oldTime = videoRef.current.currentTime;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    recordSeek(oldTime, newTime);
  };

  const handleConfusionSelect = (confusionType) => {
    recordConfusionSignal(currentTime, confusionType);
    setShowRadialMenu(false);
  };

  const handleConfusionClose = () => {
    setShowRadialMenu(false);
  };

  const handlePlaybackRateChange = (rate) => {
    if (!videoRef.current) return;

    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);

    recordSpeedChange(
      videoRef.current.currentTime,
      rate
    );
  };

  const handleExplain = () => {
    if (!confusionDetection) {
      return;
    }

    recordExplanationRequest(
      confusionDetection.videoTime,
      confusionDetection.reason
    );

    setConfusionDetection(null);
  };

  const handleDismiss = () => {
    setConfusionDetection(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
        

        <video
        ref={videoRef}
        src="/videos/sample.mp4"
        className="aspect-video w-full bg-black"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        />

        <button
          onClick={() => setShowRadialMenu(true)}
          className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/50 bg-slate-950/90 text-lg font-bold text-cyan-300 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-slate-800"
          title="Signal confusion"
        >
          ?
        </button>

        {showRadialMenu && (
          <RadialMenu
            onSelect={handleConfusionSelect}
            onClose={handleConfusionClose}
          />
        )}

        <ConfusionPrompt
          detection={confusionDetection}
          onExplain={handleExplain}
          onDismiss={handleDismiss}
        />

        <VideoControls
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          onPlayPause={() => {
            if (!videoRef.current) return;

            if (videoRef.current.paused) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
          }}
          onSeek={handleSeek}
          onSpeedChange={handlePlaybackRateChange}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Current Transcript
          </h2>

          <span className="text-xs text-slate-500">
            {currentTime.toFixed(1)}s
          </span>
        </div>

        {transcriptLoading ? (
          <p className="text-sm text-slate-400">
            Transcribing video with Whisper...
          </p>
        ) : transcriptError ? (
          <p className="text-sm text-red-400">
            Transcript error: {transcriptError}
          </p>
        ) : transcriptContext?.current ? (
          <div>
            <div className="rounded-lg border border-cyan-400/20 bg-slate-800 p-3">
              <p className="text-sm leading-relaxed text-white">
                {transcriptContext.current.text}
              </p>

              <p className="mt-2 text-[10px] text-cyan-400">
                {transcriptContext.current.start.toFixed(1)}s
                {" – "}
                {transcriptContext.current.end.toFixed(1)}s
              </p>
            </div>

            {transcriptContext.previous.length > 0 && (
              <div className="mt-3 space-y-1">
                {transcriptContext.previous.map(
                  (segment) => (
                    <p
                      key={segment.id}
                      className="text-xs text-slate-500"
                    >
                      Previous: {segment.text}
                    </p>
                  )
                )}
              </div>
            )}

            {transcriptContext.next.length > 0 && (
              <div className="mt-1 space-y-1">
                {transcriptContext.next.map(
                  (segment) => (
                    <p
                      key={segment.id}
                      className="text-xs text-slate-500"
                    >
                      Next: {segment.text}
                    </p>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No transcript available for this timestamp.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Telemetry Events
          </h2>

          <span className="text-xs text-slate-500">
            {events.length} events
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">
              Interact with the video to generate telemetry.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-cyan-400">
                    {event.type}
                  </span>

                  <pre className="mt-1 whitespace-pre-wrap text-slate-400">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;