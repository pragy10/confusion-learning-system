import { useState } from "react";
import VideoPlayer from "../components/VideoPlayer/VideoPlayer";
import Dashboard from "../components/Dashboard";
import { ArrowLeft } from "lucide-react";

export default function MainApp() {
  const [currentVideo, setCurrentVideo] = useState(null);

  const handleBack = () => {
    if (currentVideo && currentVideo.file && currentVideo.url) {
      URL.revokeObjectURL(currentVideo.url);
    }
    setCurrentVideo(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {currentVideo && (
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Workspace
          </button>
        </div>
      )}

      {!currentVideo ? (
        <Dashboard onSelectVideo={setCurrentVideo} />
      ) : (
        <VideoPlayer 
          videoUrl={currentVideo.url} 
          videoFile={currentVideo.file}
          isYouTube={currentVideo.isYouTube || false}
          youtubeId={currentVideo.youtubeId || null}
          videoTitle={currentVideo.name || "Video"}
        />
      )}
    </div>
  );
}
