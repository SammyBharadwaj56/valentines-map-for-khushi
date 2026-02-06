import React, { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

interface HandTrackingProps {
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number) => void;
  onMarkerHover: (x: number, y: number) => string | null;
  onMarkerClick: (markerId: string) => void;
  enabled: boolean;
  /** When true, horizontal swipes trigger gallery next/prev */
  polaroidOpen?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

// Low-pass filter for smoothing values
class LowPassFilter {
  private value: number = 0;
  private initialized: boolean = false;
  private alpha: number;

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  filter(newValue: number): number {
    if (!this.initialized) {
      this.value = newValue;
      this.initialized = true;
      return newValue;
    }
    this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset() {
    this.initialized = false;
  }
}

const HandTracking: React.FC<HandTrackingProps> = ({
  onPan,
  onZoom,
  onMarkerHover,
  onMarkerClick,
  enabled,
  polaroidOpen = false,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [gesture, setGesture] = useState<string>('none');
  const [isTracking, setIsTracking] = useState(false);
  const [zoomState, setZoomState] = useState<'neutral' | 'in' | 'out'>('neutral');
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [debugHandSize, setDebugHandSize] = useState({ current: 0, neutral: 0 });

  // Smoothed cursor position with low-pass filters
  const filterX = useRef(new LowPassFilter(0.25));
  const filterY = useRef(new LowPassFilter(0.25));
  const filterHandSize = useRef(new LowPassFilter(0.35));

  const cursorPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const prevPos = useRef({ x: 0, y: 0 });

  // Proximity zoom state
  const zoomStateRef = useRef({
    neutralHandSize: 0,
    isCalibrated: false,
    calibrationFrames: 0,
    calibrationSum: 0,
    lastZoomTime: 0,
  });

  // Dwell click state
  const dwellState = useRef({
    markerId: null as string | null,
    startTime: 0,
    progress: 0,
  });

  // Swipe detection: rapid horizontal hand movement (px/ms)
  const swipeState = useRef({
    lastX: 0,
    lastTime: 0,
    lastSwipeTime: 0,
  });
  const SWIPE_VELOCITY_THRESHOLD = 0.6;
  const SWIPE_COOLDOWN_MS = 500;

  // Lerp function for smooth movement
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Calculate hand bounding box area (proxy for hand proximity)
  const calculateHandSize = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return 0;

    // Use distance from wrist (0) to middle finger tip (12) as hand size metric
    const wrist = landmarks[0];
    const middleTip = landmarks[12];

    const distance = Math.hypot(
      middleTip.x - wrist.x,
      middleTip.y - wrist.y,
      (middleTip.z || 0) - (wrist.z || 0)
    );

    return distance;
  }, []);

  // Detect gesture from hand landmarks
  const detectGesture = useCallback((landmarks: any[]): 'open' | 'fist' | 'point' | 'none' => {
    if (!landmarks || landmarks.length < 21) return 'none';

    const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]; // index, middle, ring, pinky
    const fingerBases = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];

    let extendedFingers = 0;

    for (let i = 0; i < 4; i++) {
      if (fingerTips[i].y < fingerBases[i].y) {
        extendedFingers++;
      }
    }

    // Check thumb separately (uses x axis primarily)
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const isThumbExtended = Math.abs(thumbTip.x - thumbBase.x) > 0.05;

    if (extendedFingers >= 3 && isThumbExtended) {
      return 'open';
    }

    if (extendedFingers === 0) {
      return 'fist';
    }

    if (extendedFingers === 1 && fingerTips[0].y < fingerBases[0].y) {
      return 'point';
    }

    return 'none';
  }, []);

  // Animation loop for smooth cursor movement and dwell detection
  useEffect(() => {
    if (!enabled) return;

    let animationId: number;

    const animate = () => {
      // Smooth cursor movement with lerp
      cursorPos.current.x = lerp(cursorPos.current.x, targetPos.current.x, 0.35);
      cursorPos.current.y = lerp(cursorPos.current.y, targetPos.current.y, 0.35);

      // Update cursor element
      if (cursorRef.current) {
        cursorRef.current.style.left = `${cursorPos.current.x}px`;
        cursorRef.current.style.top = `${cursorPos.current.y}px`;
      }

      // Update ring position
      if (ringRef.current) {
        ringRef.current.style.left = `${cursorPos.current.x}px`;
        ringRef.current.style.top = `${cursorPos.current.y}px`;
      }

      // Check for marker hover (dwell click)
      const hoveredMarkerId = onMarkerHover(cursorPos.current.x, cursorPos.current.y);

      if (hoveredMarkerId) {
        if (dwellState.current.markerId !== hoveredMarkerId) {
          // Started hovering new marker
          dwellState.current.markerId = hoveredMarkerId;
          dwellState.current.startTime = Date.now();
          dwellState.current.progress = 0;
        } else {
          // Continue dwelling
          const elapsed = Date.now() - dwellState.current.startTime;
          dwellState.current.progress = Math.min(elapsed / 1500, 1); // 1.5 seconds

          // Update progress ring
      if (ringRef.current) {
            const circumference = 157; // 2 * PI * 25
            const offset = circumference * (1 - dwellState.current.progress);
            ringRef.current.style.setProperty('--progress', `${offset}`);
            ringRef.current.classList.add('active');
            ringRef.current.classList.remove('idle');
          }

          // Trigger click when complete
          if (dwellState.current.progress >= 1) {
            onMarkerClick(hoveredMarkerId);
            dwellState.current.markerId = null;
            dwellState.current.progress = 0;
            if (ringRef.current) {
              ringRef.current.classList.remove('active');
            }
          }
        }

        if (cursorRef.current) {
          cursorRef.current.classList.add('dwelling');
        }
      } else {
        dwellState.current.markerId = null;
        dwellState.current.progress = 0;
        if (ringRef.current) {
          ringRef.current.style.setProperty('--progress', '157');
          ringRef.current.classList.remove('active');
          ringRef.current.classList.add('idle');
        }
        if (cursorRef.current) {
          cursorRef.current.classList.remove('dwelling');
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled, onMarkerHover, onMarkerClick]);

  // Reset calibration when hand tracking is disabled
  useEffect(() => {
    if (!enabled) setIsCalibrated(false);
  }, [enabled]);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!enabled || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Reset filters when re-enabling
    filterX.current.reset();
    filterY.current.reset();
    filterHandSize.current.reset();
    zoomStateRef.current.isCalibrated = false;
    zoomStateRef.current.calibrationFrames = 0;
    zoomStateRef.current.calibrationSum = 0;

    // Wait for MediaPipe to load
    const initMediaPipe = () => {
      if (!window.Hands || !window.Camera) {
        setTimeout(initMediaPipe, 100);
        return;
      }

      const hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results: any) => {
        // Clear canvas
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw camera feed
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];

          // Draw hand skeleton
          if (window.drawConnectors && window.HAND_CONNECTIONS) {
            window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
              color: '#ff007f',
              lineWidth: 2,
            });
          }
          if (window.drawLandmarks) {
            window.drawLandmarks(ctx, landmarks, {
              color: '#ff007f',
              lineWidth: 1,
              radius: 3,
            });
          }

          // Get index finger tip position (landmark 8)
          const indexTip = landmarks[8];

          // Apply low-pass filter for smooth cursor
          const smoothX = filterX.current.filter((1 - indexTip.x) * window.innerWidth);
          const smoothY = filterY.current.filter(indexTip.y * window.innerHeight);

          targetPos.current.x = smoothX;
          targetPos.current.y = smoothY;

          // Swipe detection: rapid horizontal movement (only when polaroid is open)
          if (polaroidOpen && (onSwipeLeft || onSwipeRight)) {
            const now = Date.now();
            const { lastX, lastTime, lastSwipeTime } = swipeState.current;
            const dt = now - lastTime;
            if (dt > 0 && dt < 250 && now - lastSwipeTime > SWIPE_COOLDOWN_MS) {
              const velocity = (smoothX - lastX) / dt;
              if (velocity > SWIPE_VELOCITY_THRESHOLD && onSwipeRight) {
                onSwipeRight();
                swipeState.current.lastSwipeTime = now;
              } else if (velocity < -SWIPE_VELOCITY_THRESHOLD && onSwipeLeft) {
                onSwipeLeft();
                swipeState.current.lastSwipeTime = now;
              }
            }
            swipeState.current.lastX = smoothX;
            swipeState.current.lastTime = now;
          }

          // Detect gesture
          const detectedGesture = detectGesture(landmarks);
          setGesture(detectedGesture);

          // Calculate hand size for proximity zoom
          const rawHandSize = calculateHandSize(landmarks);
          const smoothHandSize = filterHandSize.current.filter(rawHandSize);

          // Update debug display
          setDebugHandSize({
            current: smoothHandSize,
            neutral: zoomStateRef.current.neutralHandSize,
          });

          // Calibration phase (first 30 frames)
          if (!zoomStateRef.current.isCalibrated) {
            zoomStateRef.current.calibrationSum += smoothHandSize;
            zoomStateRef.current.calibrationFrames++;

            if (zoomStateRef.current.calibrationFrames >= 30) {
              zoomStateRef.current.neutralHandSize =
                zoomStateRef.current.calibrationSum / zoomStateRef.current.calibrationFrames;
              zoomStateRef.current.isCalibrated = true;
              setIsCalibrated(true);
            }
          }

          // Handle gestures
          if (detectedGesture === 'fist') {
            // Pan map based on hand movement (fist gesture)
            const dx = (cursorPos.current.x - prevPos.current.x) * 1.5;
            const dy = (cursorPos.current.y - prevPos.current.y) * 1.5;

            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
              onPan(-dx, -dy);
            }

            setZoomState('neutral');

            // Update cursor size for fist
            if (cursorRef.current) {
              cursorRef.current.style.transform = 'translate(-50%, -50%) scale(0.7)';
            }
          } else if (detectedGesture === 'open' && zoomStateRef.current.isCalibrated) {
            // Proximity-based zoom (open palm)
            const neutral = zoomStateRef.current.neutralHandSize;
            // Asymmetric thresholds: easier to zoom out (8%) than zoom in (12%)
            const zoomInThreshold = neutral * 0.12;
            const zoomOutThreshold = neutral * 0.08;
            const now = Date.now();

            // Rate limit zoom to every 120ms
            if (now - zoomStateRef.current.lastZoomTime > 120) {
              console.log(`[HAND] size=${smoothHandSize.toFixed(4)}, neutral=${neutral.toFixed(4)}, inThresh=${zoomInThreshold.toFixed(4)}, outThresh=${zoomOutThreshold.toFixed(4)}`);

              if (smoothHandSize > neutral + zoomInThreshold) {
                // Hand closer = zoom in
                console.log('[HAND] Triggering ZOOM IN');
                onZoom(1);
                setZoomState('in');
                zoomStateRef.current.lastZoomTime = now;

                // Visual feedback - expand cursor
                if (cursorRef.current) {
                  cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1.5)';
                }
              } else if (smoothHandSize < neutral - zoomOutThreshold) {
                // Hand farther = zoom out
                console.log('[HAND] Triggering ZOOM OUT');
                onZoom(-1);
                setZoomState('out');
                zoomStateRef.current.lastZoomTime = now;

                // Visual feedback - shrink cursor
                if (cursorRef.current) {
                  cursorRef.current.style.transform = 'translate(-50%, -50%) scale(0.6)';
                }
              } else {
                setZoomState('neutral');
                // Neutral zone - normal cursor
                if (cursorRef.current) {
                  cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
                }
              }
            }
          } else {
            setZoomState('neutral');
            if (cursorRef.current) {
              cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
            }
          }

          prevPos.current = { x: cursorPos.current.x, y: cursorPos.current.y };
          setIsTracking(true);
        } else {
          setIsTracking(false);
          setGesture('none');
          setZoomState('neutral');

          // Reset calibration when hand is lost
          zoomStateRef.current.isCalibrated = false;
          zoomStateRef.current.calibrationFrames = 0;
          zoomStateRef.current.calibrationSum = 0;
          setIsCalibrated(false);
        }

        ctx.restore();
      });

      // Start camera
      const camera = new window.Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 320,
        height: 240,
      });

      camera.start();
    };

    initMediaPipe();
  }, [enabled, detectGesture, calculateHandSize, onPan, onZoom, polaroidOpen, onSwipeLeft, onSwipeRight]);

  if (!enabled) return null;

  return (
    <>
      {/* Simple webcam preview */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        width: '200px',
        height: '150px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid #ff2d95',
        boxShadow: '0 0 20px rgba(255, 45, 149, 0.4)',
        zIndex: 3000,
        background: '#000',
      }}>
        <video ref={videoRef} style={{ display: 'none' }} />
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />
        {!isCalibrated && isTracking && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            fontSize: '12px',
            fontFamily: 'VT323, monospace',
          }}>
            CALIBRATING...
          </div>
        )}
      </div>

      {/* Gesture indicator */}
      <div className="gesture-indicator">
        <div>
          <span>GESTURE: </span>
          <span className="gesture-name">{isTracking ? gesture : 'no hand'}</span>
        </div>
        {isTracking && zoomState !== 'neutral' && (
          <div className="mt-1">
            <span>ZOOM: </span>
            <span className={zoomState === 'in' ? 'text-green-400' : 'text-red-400'}>
              {zoomState === 'in' ? '+ IN' : '- OUT'}
            </span>
          </div>
        )}
        {isTracking && isCalibrated && (
          <div className="mt-1 text-[10px] text-gray-500">
            SIZE: {debugHandSize.current.toFixed(3)} / {debugHandSize.neutral.toFixed(3)}
          </div>
        )}
      </div>

      {/* Pink cursor dot */}
      <div
        ref={cursorRef}
        className={`hand-cursor ${zoomState !== 'neutral' ? 'zooming' : ''}`}
        style={{
          opacity: isTracking ? 1 : 0.3,
          transition: 'transform 0.15s ease-out, opacity 0.2s',
        }}
      />

      {/* Loading ring: visible around cursor, fills over 1.5s when hovering marker then triggers click */}
      <div
        ref={ringRef}
        className="dwell-ring idle"
        style={{
          left: cursorPos.current.x,
          top: cursorPos.current.y,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle className="ring-bg" cx="30" cy="30" r="25" fill="none" strokeWidth="3" />
          <circle
            className="ring-progress"
            cx="30"
            cy="30"
            r="25"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="157"
            strokeDashoffset="var(--progress, 157)"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
      </div>
    </>
  );
};

export default HandTracking;
