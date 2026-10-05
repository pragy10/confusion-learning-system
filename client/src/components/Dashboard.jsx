import { useRef, useState } from "react";
import { UploadCloud, PlayCircle } from "lucide-react";

function Dashboard({ onSelectVideo }) {
  const [dragActive, setDragActive] = useState(false);
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
      onSelectVideo({ file, url, name: file.name });
    } else {
      alert("Please upload a valid video file.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100 mb-2">Video Workspace</h2>
        <p className="text-slate-500 text-sm">
          Upload a lecture or tutorial. Videos are processed locally on your device.
        </p>
      </div>

      <div 
        className={`w-full p-12 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group ${
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
        <div className={`p-4 rounded-full mb-4 transition-colors ${dragActive ? "bg-slate-700 text-white" : "bg-slate-800/50 text-slate-400 group-hover:text-slate-300"}`}>
          <UploadCloud className="w-8 h-8" />
        </div>
        <span className="text-slate-200 font-medium mb-1">Click to upload or drag and drop</span>
        <span className="text-xs text-slate-500">MP4 or WebM formats supported</span>
        
        <input 
          ref={inputRef}
          type="file" 
          accept="video/*" 
          onChange={handleChange} 
          className="hidden" 
        />
      </div>

      <div className="mt-12 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between p-6 rounded-xl border border-slate-800/60 bg-slate-900/20">
        <div className="mb-4 sm:mb-0 text-center sm:text-left">
          <h3 className="text-sm font-medium text-slate-200 mb-1">Try a Demo Video</h3>
          <p className="text-xs text-slate-500">Test the features without uploading your own file.</p>
        </div>
        <button 
          onClick={() => onSelectVideo({ file: null, url: "/videos/sample.mp4", name: "Demo Lecture" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
        >
          <PlayCircle className="w-4 h-4 text-slate-400" />
          Load Demo
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
