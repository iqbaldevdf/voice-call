import { useRef, useState } from 'react';
import { useRef, useState } from 'react';

export function useAudioCapture(onAudioChunk) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          onAudioChunk(e.data);
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log('[Mic] Started recording');
    } catch (err) {
      console.error('Mic error:', err.message);
      alert('Microphone permission denied. Please allow mic access and try again.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    console.log('[Mic] Stopped recording');
  }

  return { startRecording, stopRecording, isRecording };
}
