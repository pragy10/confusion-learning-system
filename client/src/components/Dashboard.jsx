import { useRef, useState } from "react";
import { UploadCloud, PlayCircle, ArrowRight } from "lucide-react";
import { extractYouTubeId } from "../utils/youtube";

function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function Dashboard({ onSelectVideo }) {
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [ytError, setYtError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      onSelectVideo({ file, url, name: file.name, isYouTube: false, youtubeId: null });
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const handleYouTubeSubmit = (e) => {
    e.preventDefault();
    setYtError(null);
    const ytId = extractYouTubeId(youtubeUrl);
    if (!ytId) {
      setYtError("Please enter a valid YouTube video link (e.g. https://www.youtube.com/watch?v=...)");
      return;
    }
    onSelectVideo({
      file: null,
      url: youtubeUrl.trim(),
      youtubeId: ytId,
      isYouTube: true,
      name: `YouTube: ${ytId}`,
    });
  };

  const handleSelectSampleYouTube = (url, label) => {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      onSelectVideo({
        file: null,
        url,
        youtubeId: ytId,
        isYouTube: true,
        name: label || `YouTube: ${ytId}`,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100 mb-2">Video Workspace</h2>
        <p className="text-slate-400 text-sm">
          Load a lecture or tutorial via direct YouTube link or upload a local file.
        </p>
      </div>

      {/* ── 1. DIRECT YOUTUBE LINK SECTION ── */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <YoutubeIcon className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-semibold text-slate-100">Direct YouTube Video Link</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Skip Whisper transcription entirely! Paste a YouTube URL to automatically fetch its verified transcript instantly.
        </p>

        <form onSubmit={handleYouTubeSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => {
              setYoutubeUrl(e.target.value);
              setYtError(null);
            }}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            className="flex-1 rounded-lg border border-slate-700 bg-[#0a0a0a] px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={!youtubeUrl.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-slate-200 disabled:opacity-50 transition shrink-0"
          >
            <span>Load Video</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {ytError && <p className="mt-2.5 text-xs text-red-400">{ytError}</p>}

        {/* Quick sample YouTube link buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">Quick Samples:</span>
          <button
            type="button"
            onClick={() =>
              handleSelectSampleYouTube(
                "https://www.youtube.com/watch?v=libKVRa01L8",
                "Solar System Formation (Lecture)"
              )
            }
            className="rounded bg-slate-800/70 border border-slate-700/60 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Solar System Formation
          </button>
          <button
            type="button"
            onClick={() =>
              handleSelectSampleYouTube(
                "https://www.youtube.com/watch?v=aircAruvnKk",
                "Neural Networks (3Blue1Brown)"
              )
            }
            className="rounded bg-slate-800/70 border border-slate-700/60 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Neural Networks (3Blue1Brown)
          </button>
        </div>
      </div>

      {/* ── 2. LOCAL FILE DRAG AND DROP ── */}
      <div 
        className={`w-full p-10 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group ${
          dragActive 
            ? "border-slate-400 bg-slate-800/30" 
            : "border-slate-700 bg-slate-900/20 hover:border-slate-500 hover:bg-slate-800/30"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className={`p-4 rounded-full mb-3 transition-colors ${dragActive ? "bg-slate-700 text-white" : "bg-slate-800/50 text-slate-400 group-hover:text-slate-300"}`}>
          <UploadCloud className="w-7 h-7" />
        </div>
        <span className="text-slate-200 font-medium mb-1 text-sm">Upload Local Video File</span>
        <span className="text-xs text-slate-500">Drag & drop or click to browse (MP4, WebM)</span>
        
        <input 
          ref={inputRef}
          type="file" 
          accept="video/*" 
          onChange={handleChange} 
          className="hidden" 
        />
      </div>

      {/* ── 3. LOCAL DEMO VIDEO ── */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between p-5 rounded-xl border border-slate-800/60 bg-[#111]">
        <div className="mb-3 sm:mb-0 text-center sm:text-left">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-0.5">Sample Video Demo</h3>
          <p className="text-xs text-slate-500">Test local player features with a bundled sample file.</p>
        </div>
        <button 
          onClick={() => onSelectVideo({ file: null, url: "/videos/sample.mp4", name: "Demo Lecture", isYouTube: false, youtubeId: null })}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs font-medium border border-slate-700"
        >
          <PlayCircle className="w-4 h-4 text-slate-400" />
          Load Local Demo
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
