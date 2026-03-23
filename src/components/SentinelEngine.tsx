/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { AlertTriangle, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    Camera: any;
    FaceMesh: any;
  }
}

export type ViolationType = 
  | "Cell Phone" 
  | "Laptop" 
  | "Book" 
  | "Identity Breach" 
  | "Presence Lost" 
  | "Gaze Deviation";

interface SentinelEngineProps {
  onViolation?: (type: ViolationType, imageBlob: Blob | null) => void;
  onReady?: (ready: boolean) => void;
}

export default function SentinelEngine({ onViolation, onReady }: SentinelEngineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeViolations, setActiveViolations] = useState<Set<ViolationType>>(new Set());
  
  // Throttle logging to avoid spam
  const lastLogTimeRef = useRef<{ [key in ViolationType]?: number }>({});
  
  const gazeDevStartTimeRef = useRef<number | null>(null);

  const presenceDevStartTimeRef = useRef<number | null>(null);

  const onViolationRef = useRef(onViolation);
  const onReadyRef = useRef(onReady);
  
  useEffect(() => {
    onViolationRef.current = onViolation;
    onReadyRef.current = onReady;
  }, [onViolation, onReady]);

  // Take a snapshot
  const captureSnapshotAsync = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8);
    });
  }, []);

  const triggerViolation = useCallback(async (type: ViolationType) => {
    const now = Date.now();
    const lastTime = lastLogTimeRef.current[type] || 0;
    
    // add to active
    setActiveViolations(prev => new Set(prev).add(type));
    
    // Clear violation from UI after 3 seconds
    setTimeout(() => {
      setActiveViolations(prev => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }, 3000);

    // Ensure we only log once per 10 seconds per type
    if (now - lastTime < 10000) return;
    lastLogTimeRef.current[type] = now;

    const blob = await captureSnapshotAsync();
    if (onViolationRef.current) onViolationRef.current(type, blob);
  }, [captureSnapshotAsync]);

  useEffect(() => {
    let objectDetector: cocoSsd.ObjectDetection | null = null;
    let myFaceMesh: any = null;
    let camera: any = null;
    let isDetectingObj = false;

    const initEngine = async () => {
      try {
        await tf.ready();
        objectDetector = await cocoSsd.load({ base: "mobilenet_v2" });

        const FaceMeshConstructor = window.FaceMesh;
        const CameraConstructor = window.Camera;
        
        if (FaceMeshConstructor && CameraConstructor) {
          myFaceMesh = new FaceMeshConstructor({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });

          myFaceMesh.setOptions({
            maxNumFaces: 3,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          myFaceMesh.onResults((results: any) => {
            if (!videoRef.current) return;
            const faces = results.multiFaceLandmarks;

            if (!faces || faces.length === 0) {
              if (!presenceDevStartTimeRef.current) {
                presenceDevStartTimeRef.current = Date.now();
              } else if (Date.now() - presenceDevStartTimeRef.current > 1500) {
                triggerViolation("Presence Lost");
                presenceDevStartTimeRef.current = null;
              }
              gazeDevStartTimeRef.current = null;
              return;
            } else {
              presenceDevStartTimeRef.current = null;
            }

            if (faces.length > 1) {
              triggerViolation("Identity Breach");
            }

            const face = faces[0];
            const nose = face[1];
            const leftCheek = face[234];
            const rightCheek = face[454];
            
            if (nose && leftCheek && rightCheek) {
              const minX = Math.min(leftCheek.x, rightCheek.x);
              const maxX = Math.max(leftCheek.x, rightCheek.x);
              const noseRatio = (nose.x - minX) / (maxX - minX);
              
              // Center is ~0.5. Anything < 0.25 or > 0.75 is a drastic head turn.
              const lookAway = noseRatio < 0.20 || noseRatio > 0.80; 
              
              if (lookAway) {
                if (!gazeDevStartTimeRef.current) {
                  gazeDevStartTimeRef.current = Date.now();
                } else if (Date.now() - gazeDevStartTimeRef.current > 3000) {
                  triggerViolation("Gaze Deviation");
                  gazeDevStartTimeRef.current = null; 
                }
              } else {
                gazeDevStartTimeRef.current = null;
              }
            }
          });

          if (videoRef.current) {
            camera = new CameraConstructor(videoRef.current, {
              onFrame: async () => {
                if (videoRef.current && myFaceMesh) {
                  await myFaceMesh.send({ image: videoRef.current });
                }

                if (!isDetectingObj && videoRef.current && objectDetector) {
                  isDetectingObj = true;
                  const predictions = await objectDetector.detect(videoRef.current);
                  
                  predictions.forEach((pred: any) => {
                    if (pred.score > 0.55) {
                      if (pred.class === "cell phone") triggerViolation("Cell Phone");
                      if (pred.class === "laptop") triggerViolation("Laptop");
                      if (pred.class === "book") triggerViolation("Book");
                    }
                  });
                  isDetectingObj = false;
                }
              },
              width: 1280,
              height: 720,
            });
            
            
            await camera.start();
          }
        }
        setIsLoaded(true);
        if (onReadyRef.current) onReadyRef.current(true);

      } catch (err) {
        console.error("Failed to initialize Sentinel Engine", err);
        if (onReadyRef.current) onReadyRef.current(false);
      }
    };

    initEngine();

    return () => {
      if (camera && typeof camera.stop === 'function') camera.stop();
      if (myFaceMesh && typeof myFaceMesh.close === 'function') myFaceMesh.close();
    };
  }, [triggerViolation]);

  const hasCrit = activeViolations.size > 0;

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/8 bg-white/3 backdrop-blur-2xl transition-all duration-500 font-sans">
      
      {/* Sentinel Pulse Border */}
      <div className={`absolute inset-0 pointer-events-none border-4 transition-all duration-300 z-20 rounded-xl ${
        hasCrit 
          ? "border-red-500 shadow-[inset_0_0_50px_rgba(239,68,68,0.5)] animate-pulse" 
          : "border-purple-500/30 shadow-[inset_0_0_30px_rgba(124,58,237,0.2)] animate-pulse"
      }`} />

      {/* Critical Overlay */}
      {hasCrit && (
        <div className="absolute top-4 left-0 right-0 z-30 flex justify-center animate-bounce">
          <div className="bg-red-500/90 text-white px-6 py-2 rounded-full font-bold tracking-tight flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.8)] border border-red-400">
            <AlertTriangle className="w-5 h-5" />
            CRITICAL: {Array.from(activeViolations).join(", ")}
          </div>
        </div>
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 border border-purple-500/20 rounded-xl">
           <ShieldCheck className="w-16 h-16 text-purple-400 mb-4 animate-pulse opacity-50" />
           <p className="text-purple-400 font-bold text-lg tracking-tight animate-pulse uppercase">Initializing Sentinel AI Engine</p>
           <p className="text-slate-400 text-sm mt-2">Loading neural weights and sensor stream...</p>
        </div>
      )}

      {/* Camera Feed */}
      <video 
        ref={videoRef} 
        className="w-full h-auto rounded-xl object-cover scale-x-[-1]" 
        playsInline 
        muted 
        autoPlay
      />
    </div>
  );
}
