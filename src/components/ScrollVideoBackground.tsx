import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger as requested
gsap.registerPlugin(ScrollTrigger);

export const ScrollVideoBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Use refs to hold target scrubbing time and scroll trigger instance to avoid re-renders
  const targetTimeRef = useRef<number>(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Initialize isReady on loadedmetadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsReady(true);
    };

    // Attach native loadedmetadata listener
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // If metadata is already loaded (for instance, due to caching)
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Set up ScrollTrigger only after loading overlay is removed and main layout is rendered
  useEffect(() => {
    if (!isReady) return;

    const video = videoRef.current;
    if (!video) return;

    // Create ScrollTrigger with specified parameters after metadata loads and DOM elements are rendered
    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        if (!video.duration) return;
        // Map progress non-linearly to start smoothly at 0 but speed up rapidly to provide major movement on minor scroll
        const easedProgress = 1 - Math.pow(1 - self.progress, 2.5);
        const targetTime = easedProgress * video.duration;
        targetTimeRef.current = targetTime;
      },
    });

    scrollTriggerRef.current = trigger;
    
    // Initial refresh to force calculation of the newly rendered layout's full height
    ScrollTrigger.refresh();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [isReady]);

  // ResizeObserver to automatically reset/refresh ScrollTrigger on all layout adjustments, paging, searches, etc.
  useEffect(() => {
    if (!isReady) return;

    const resizeObserver = new ResizeObserver(() => {
      ScrollTrigger.refresh();
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isReady]);

  // Update loop for smooth seeking (requestAnimationFrame)
  useEffect(() => {
    if (!isReady) return;
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;
    let lastSeekedTime = -1;

    const updateVideoProgress = () => {
      const targetTime = targetTimeRef.current;
      const currentTime = video.currentTime;
      const diff = targetTime - currentTime;

      // Only update currentTime if the difference is significant to limit seeking latency and encoder lag
      if (Math.abs(diff) > 0.01) {
        // Smoothly lerp towards targetTime with a cinematic speedup (0.28) for high responsiveness
        const lerpedTime = currentTime + diff * 0.28;

        // Ensure we are seek-throttled unless the value differs meaningfully from our last action
        if (Math.abs(lerpedTime - lastSeekedTime) > 0.005) {
          video.currentTime = lerpedTime;
          lastSeekedTime = lerpedTime;
        }
      }

      rafId = requestAnimationFrame(updateVideoProgress);
    };

    rafId = requestAnimationFrame(updateVideoProgress);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isReady]);

  return (
    <>
      {/* Loading Overlay */}
      {!isReady && (
        <div 
          id="loading-overlay"
          className="fixed inset-0 w-full h-full bg-black z-50 flex items-center justify-center select-none"
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-white text-xl font-mono tracking-widest animate-pulse">
              Loading...
            </span>
          </div>
        </div>
      )}

      {/* Video Outer Wrapper */}
      <div
        id="scroll-video-wrapper"
        ref={wrapperRef}
        className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none"
      >
        <video
          ref={videoRef}
          src="/videos/output.mp4"
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />
      </div>
    </>
  );
};
