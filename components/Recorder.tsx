
import React, { useState, useRef, useEffect } from 'react';
import { transcribeAndSummarize } from '../services/geminiService';
import { saveFileToLocal, downloadBlob } from '../services/fileService';

interface RecorderProps {
  dirHandle: FileSystemDirectoryHandle | null;
  onSessionComplete: (session: any) => void;
  onApiError?: () => void;
}

const Recorder: React.FC<RecorderProps> = ({ dirHandle, onSessionComplete, onApiError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [includeSystemAudio, setIncludeSystemAudio] = useState(false);
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
        console.error("Device error:", err);
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
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined }
      });
      audioContext.createMediaStreamSource(micStream).connect(destination);

      let systemStream: MediaStream | null = null;
      if (includeSystemAudio) {
        try {
          systemStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          const systemAudioTracks = systemStream.getAudioTracks();
          if (systemAudioTracks.length > 0) {
            audioContext.createMediaStreamSource(new MediaStream(systemAudioTracks)).connect(destination);
          }
        } catch (err) {
          console.warn("System audio cancelled");
        }
      }

      const mediaRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        micStream.getTracks().forEach(t => t.stop());
        if (systemStream) systemStream.getTracks().forEach(t => t.stop());
        audioContext.close();
        await handleProcessing(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimer(0);
      setShowSettings(false);
    } catch (err) {
      alert("Recording failed. Check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcessing = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((res) => {
        reader.onloadend = () => res((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const base64Audio = await base64Promise;
      
      const aiResult = await transcribeAndSummarize(base64Audio, 'audio/webm');
      
      const timestamp = new Date().getTime();
      const fileName = `Meeting_${timestamp}.webm`;
      const txtName = `Notes_${timestamp}.txt`;

      if (dirHandle) {
        await saveFileToLocal(dirHandle, fileName, blob);
        await saveFileToLocal(dirHandle, txtName, aiResult);
      } else {
        downloadBlob(blob, fileName);
        downloadBlob(aiResult, txtName);
      }

      onSessionComplete({
        id: String(timestamp),
        title: `Session ${new Date().toLocaleDateString()}`,
        duration: timer,
        transcription: aiResult,
        date: new Date().toLocaleString()
      });

    } catch (error: any) {
      console.error("Processing error details:", error);
      const msg = error?.message || "";
      
      if (msg.includes("API_KEY") || msg.includes("entity was not found") || msg.includes("403") || msg.includes("401")) {
        alert("API Key failed or unauthorized. Please re-enter your key.");
        onApiError?.();
      } else {
        alert("AI Processing failed: " + msg);
      }
    } finally {
      setIsProcessing(false);
      setTimer(0);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center relative min-h-[350px]">
      {!isRecording && !isProcessing && (
        <button onClick={() => setShowSettings(!showSettings)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <i className={`fas ${showSettings ? 'fa-times' : 'fa-cog'}`}></i>
        </button>
      )}

      {showSettings ? (
        <div className="w-full max-w-xs space-y-6 animate-in fade-in duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Mic Source</label>
            <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs">
              {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">System Audio</span>
            <button onClick={() => setIncludeSystemAudio(!includeSystemAudio)} className={`w-10 h-5 rounded-full relative transition-colors ${includeSystemAudio ? 'bg-sky-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeSystemAudio ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`}>
            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-2xl`}></i>
          </div>
          <div className="text-4xl font-mono font-bold mb-2">{formatTime(timer)}</div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-8">
            {isRecording ? 'Recording...' : isProcessing ? 'AI Processing...' : 'Ready'}
          </p>
          
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${isRecording ? 'bg-red-500 hover:bg-red-400' : 'bg-sky-500 hover:bg-sky-400'} text-white`}
          >
            {isRecording ? 'Stop Meeting' : 'Start Meeting'}
          </button>
        </>
      )}
    </div>
  );
};

export default Recorder;
