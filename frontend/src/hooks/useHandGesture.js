import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export const useHandGesture = (canvasRef, isSensorEnabled) => {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const [gestureData, setGestureData] = useState({ 
    x: 0,      // 【新增】追蹤 X 座標
    y: 0,      // 【新增】追蹤 Y 座標
    scale: 1,
    active: false,
    swipe: null 
  });

  const lastY = useRef(0);
  const lastSwipeTime = useRef(0);
  const swipeThreshold = 0.12; 
  const cooldown = 800; 

  useEffect(() => {
    let handLandmarker;
    let animationFrameId;

    const initializeMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => { 
            setIsReady(true); 
            predictWebcam(); 
          };
        }
      }
    };

    const predictWebcam = async () => {
      if (!videoRef.current || !handLandmarker || !isSensorEnabled) return;
      if (videoRef.current.videoWidth === 0) {
        animationFrameId = requestAnimationFrame(predictWebcam);
        return;
      }

      const results = handLandmarker.detectForVideo(videoRef.current, performance.now());

      if (results.landmarks && results.landmarks.length > 0) {
        const hand = results.landmarks[0];
        const wrist = hand[0];   // 手腕座標，用來當作中心點 x, y
        const thumb = hand[4];  
        const index = hand[8];  

        // 1. 縮放邏輯 (食指與大拇指距離)
        const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
        const currentScale = Math.max(0.4, Math.min(2.5, dist * 8));

        // 2. 上下揮動偵測
        const now = Date.now();
        let detectedSwipe = null;
        if (now - lastSwipeTime.current > cooldown) {
          const dy = wrist.y - lastY.current;
          if (Math.abs(dy) > swipeThreshold) {
            detectedSwipe = dy > 0 ? 'DOWN' : 'UP';
            lastSwipeTime.current = now;
          }
        }
        lastY.current = wrist.y;

        // 【關鍵修復】: 把 wrist.x 和 wrist.y 傳回去給 EnterPage 使用！
        setGestureData({
          x: wrist.x,       // 傳回 normalized x (0~1)
          y: wrist.y,       // 傳回 normalized y (0~1)
          scale: currentScale,
          active: true,
          swipe: detectedSwipe
        });

        // 3. 繪製骨架小窗
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.save();
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          const drawingUtils = new DrawingUtils(ctx);
          drawingUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, { color: "#bc13fe", lineWidth: 3 });
          drawingUtils.drawLandmarks(hand, { color: "#ffffff", radius: 2 });
          ctx.restore();
        }
      } else {
        setGestureData(prev => ({ ...prev, active: false, swipe: null }));
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    if (isSensorEnabled) initializeMediaPipe();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [isSensorEnabled]);

  return { videoRef, isReady, gestureData };
};