
import React, { useState, useRef, useEffect } from 'react';
import { transcribeAndSummarize } from '../services/geminiService';
import { saveFileToLocal, downloadBlob } from '../services/fileService';

interface RecorderProps {
  dirHandle: FileSystemDirectoryHandle | null;
  onSessionComplete: (session: any) => void;
}

const Recorder: React.FC<RecorderProps> = ({ dirHandle, onSessionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const mics = allDevices.filter(device => device.kind === 'audioinput');
        setDevices(mics);
        if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId);
      } catch (err) {
        console.error("Could not access microphone list:", err);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => setTimer(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined }
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await handleProcessing(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimer(0);
      setShowSettings(false);
    } catch (err) {
      alert("Failed to start recording. Please check your microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcessing = async (blob: Blob) => {
    if (blob.size < 1000) {
      alert("Recording was too short. Please try again.");
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      });
      
      const base64Audio = await base64Promise;
      const aiResult = await transcribeAndSummarize(base64Audio, 'audio/webm');
      
      const timestamp = new Date().getTime();
      const fileName = `BobbyMeeting_${timestamp}.webm`;
      const txtName = `BobbyNotes_${timestamp}.txt`;

      if (dirHandle) {
        await saveFileToLocal(dirHandle, fileName, blob);
        await saveFileToLocal(dirHandle, txtName, aiResult);
      } else {
        downloadBlob(blob, fileName);
        downloadBlob(aiResult, txtName);
      }

      onSessionComplete({
        id: String(timestamp),
        title: `Meeting - ${new Date().toLocaleDateString()}`,
        duration: timer,
        transcription: aiResult,
        date: new Date().toLocaleString()
      });

    } catch (error: any) {
      console.error("Processing error:", error);
      alert(`AI Processing Failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setTimer(0);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center relative min-h-[350px] shadow-2xl">
      {!isRecording && !isProcessing && (
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="absolute top-6 right-6 text-slate-500 hover:text-sky-400 transition-colors"
          title="Audio Settings"
        >
          <i className={`fas ${showSettings ? 'fa-times' : 'fa-cog'} text-xl`}></i>
        </button>
      )}

      {showSettings ? (
        <div className="w-full max-w-xs space-y-6 animate-in fade-in zoom-in duration-300">
          <h3 className="text-center font-bold text-slate-300">Audio Settings</h3>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Input Device</label>
            <select 
              value={selectedMic} 
              onChange={e => setSelectedMic(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-sky-500"
            >
              {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 5)}`}</option>)}
              {devices.length === 0 && <option value="">No microphones found</option>}
            </select>
          </div>
          <p className="text-[10px] text-slate-500 text-center italic">Make sure your browser has mic permissions enabled.</p>
        </div>
      ) : (
        <>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isRecording ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse' : isProcessing ? 'bg-sky-500 shadow-[0_0_30px_rgba(56,189,248,0.5)]' : 'bg-slate-800'}`}>
            <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : isRecording ? 'fa-stop' : 'fa-microphone'} text-3xl text-white`}></i>
          </div>
          <div className="text-5xl font-mono font-bold mb-2 tracking-tighter text-white">
            {formatTime(timer)}
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-10">
            {isRecording ? 'LIVE RECORDING' : isProcessing ? 'AI ANALYZING...' : 'READY TO RECORD'}
          </p>
          
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`px-12 py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500 hover:bg-red-400' : 'bg-sky-500 hover:bg-sky-400'} text-white text-lg`}
          >
            {isRecording ? 'End Meeting' : 'Start Recording'}
          </button>
        </>
      )}
    </div>
  );
};

export default Recorder;
