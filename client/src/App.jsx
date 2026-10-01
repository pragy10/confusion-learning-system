import VideoPlayer from "./components/VideoPlayer/VideoPlayer";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-xl font-bold">
            Confusion Learning System
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Real-time confusion signalling for video-based learning
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">

        <VideoPlayer />

      </main>

    </div>
  );
}

export default App;