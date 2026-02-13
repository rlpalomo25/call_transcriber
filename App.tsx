
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Recorder from './components/Recorder';
import { AppRoute, RecordingSession } from './types';
import { pickDirectory } from './services/fileService';

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [selectedSession, setSelectedSession] = useState<RecordingSession | null>(null);
  const [isPickerBlocked, setIsPickerBlocked] = useState(false);

  // Load state from local storage
  useEffect(() => {
    const saved = localStorage.getItem('bobby_ai_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bobby_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleSessionComplete = (newSession: RecordingSession) => {
    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession);
    setRoute(AppRoute.RECORDINGS);
  };

  const handlePickDirectory = async () => {
    try {
      const handle = await pickDirectory();
      if (handle) {
        setDirHandle(handle);
        setIsPickerBlocked(false);
      }
    } catch (err: any) {
      if (err.message.includes('Cross origin sub frames') || err.name === 'SecurityError') {
        setIsPickerBlocked(true);
      } else {
        alert("Could not open directory picker: " + err.message);
      }
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold mb-2">Welcome to <span className="gradient-text">BobbyAi.notes</span></h2>
        <p className="text-slate-400">Intelligent meeting capture and team insights.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Recorder dirHandle={dirHandle} onSessionComplete={handleSessionComplete} />
        </div>
        <div className="glass rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Calendar Sync</h3>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">Mocked</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
            {[
              { time: '10:00 AM', title: 'Daily Standup', platform: 'Teams' },
              { time: '02:00 PM', title: 'Product Review', platform: 'Google' },
            ].map((meeting, i) => (
              <div key={i} className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex flex-col items-center justify-center text-[8px]">
                  <span className="font-bold text-slate-400">SEP</span>
                  <span className="text-white font-bold text-xs">24</span>
                </div>
                <div>
                  <h4 className="font-semibold text-xs">{meeting.title}</h4>
                  <p className="text-[10px] text-slate-500">{meeting.time} • {meeting.platform}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold">
             Sync Calendars
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Quick Setup</h3>
        <div className="glass rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <i className={`fas ${dirHandle ? 'fa-folder-check' : 'fa-folder-open'} text-xl`}></i>
             </div>
             <div>
                <p className="font-bold text-slate-200">
                  {dirHandle ? `Saving to: ${dirHandle.name}` : 'Local storage not configured'}
                </p>
                <p className="text-xs text-slate-500">Recordings are saved locally to your hard drive.</p>
             </div>
          </div>
          <button onClick={handlePickDirectory} className="px-6 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold">
            {dirHandle ? 'Change Path' : 'Set Path'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecordings = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <header>
        <h2 className="text-3xl font-bold mb-2">Recordings</h2>
      </header>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-2 overflow-y-auto max-h-[70vh]">
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => setSelectedSession(s)}
              className={`p-4 rounded-2xl cursor-pointer border transition-all ${selectedSession?.id === s.id ? 'bg-sky-500/10 border-sky-500/30' : 'bg-slate-800/40 border-transparent'}`}
            >
              <h4 className="font-semibold text-sm line-clamp-1">{s.title}</h4>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{s.date}</p>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-slate-500 text-sm italic p-4">No recordings yet.</p>}
        </div>
        <div className="xl:col-span-3">
          {selectedSession ? (
            <div className="glass rounded-3xl p-8 min-h-[500px] flex flex-col">
              <h3 className="text-2xl font-bold mb-6">{selectedSession.title}</h3>
              <div className="flex-1 bg-slate-900/50 rounded-2xl p-6 border border-white/5 whitespace-pre-wrap text-slate-300 text-sm leading-relaxed overflow-y-auto">
                {selectedSession.transcription}
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl p-8 min-h-[500px] flex items-center justify-center text-slate-500 italic">
               Select a recording to view
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="glass rounded-3xl p-8 space-y-8">
          <div>
            <h4 className="font-bold">Storage Routing</h4>
            <p className="text-sm text-slate-500 mb-4">Direct your recording files to a specific local folder.</p>
            <div className="p-4 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between">
              <code className="text-sky-400 text-xs">
                {dirHandle ? `Path: ${dirHandle.name}` : isPickerBlocked ? 'Mode: Browser Downloads' : 'Not Set'}
              </code>
              <button onClick={handlePickDirectory} className="text-xs text-sky-500 hover:underline font-bold">
                {dirHandle ? 'Update' : 'Configure'}
              </button>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8">
            <h4 className="font-bold text-red-400 mb-4">Danger Zone</h4>
            <button 
              onClick={() => { if(confirm("Clear all meeting data? This cannot be undone.")) { setSessions([]); localStorage.removeItem('bobby_ai_sessions'); }}} 
              className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Clear Local Cache
            </button>
          </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (route) {
      case AppRoute.DASHBOARD: return renderDashboard();
      case AppRoute.RECORDINGS: return renderRecordings();
      case AppRoute.SETTINGS: return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar currentRoute={route} setRoute={setRoute} />
      <main className="flex-1 p-10 bg-slate-950 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
