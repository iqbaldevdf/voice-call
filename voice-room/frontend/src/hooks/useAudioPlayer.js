import { useRef } from 'react';

const FLUSH_DELAY_MS = 280;

/**
 * Accumulates WebM/Opus chunks per sender and decodes + plays when a short idle
 * period passes. decodeAudioData() needs a complete segment; single 60ms
 * chunks often fail to decode.
 */
export function useAudioPlayer() {
  const audioCtxRef = useRef(null);
  const nextPlayTimeRef = useRef({});
  const buffersRef = useRef({});
  const flushTimersRef = useRef({});

  function getCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  function flushAndPlay(fromSocketId) {
    flushTimersRef.current[fromSocketId] = null;
    const chunks = buffersRef.current[fromSocketId];
    if (!chunks?.length) return;
    buffersRef.current[fromSocketId] = [];

    const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }

    const copy = merged.buffer.slice(
      merged.byteOffset,
      merged.byteOffset + merged.byteLength
    );

    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    ctx
      .decodeAudioData(copy)
      .then((decoded) => {
        const c = audioCtxRef.current;
        if (!c) return;
        const source = c.createBufferSource();
        source.buffer = decoded;
        source.connect(c.destination);

        if (
          !nextPlayTimeRef.current[fromSocketId] ||
          nextPlayTimeRef.current[fromSocketId] < c.currentTime
        ) {
          nextPlayTimeRef.current[fromSocketId] = c.currentTime + 0.05;
        }

        source.start(nextPlayTimeRef.current[fromSocketId]);
        nextPlayTimeRef.current[fromSocketId] += decoded.duration;
      })
      .catch((err) => {
        console.error('Audio play error:', err.message);
      });
  }

  function playChunk(uint8Array, fromSocketId) {
    if (!uint8Array?.byteLength) return;

    if (!buffersRef.current[fromSocketId]) {
      buffersRef.current[fromSocketId] = [];
    }
    buffersRef.current[fromSocketId].push(uint8Array.slice(0));

    if (flushTimersRef.current[fromSocketId]) {
      clearTimeout(flushTimersRef.current[fromSocketId]);
    }
    flushTimersRef.current[fromSocketId] = setTimeout(() => {
      flushAndPlay(fromSocketId);
    }, FLUSH_DELAY_MS);
  }

  return { playChunk };
}
