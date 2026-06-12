import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export interface ScrollVideoBackgroundProps {
  page: "home" | "about";
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
}

export const ScrollVideoBackground: React.FC<ScrollVideoBackgroundProps> = ({
  page,
  badge,
  title,
  subtitle,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Use refs to hold target scrubbing time and scroll trigger instance
  const targetTimeRef = useRef<number>(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Initialize and check metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      setIsReady(true);
      return;
    }

    let isDone = false;
    const handleLoadedMetadata = () => {
      if (isDone) return;
      isDone = true;
      setIsReady(true);
      // Explicitly set the initial playback time to 0 to make sure the user sees the start frame immediately
      try {
        video.currentTime = 0;
      } catch (e) {
        console.warn("Setting currentTime failed: ", e);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedMetadata);
    video.addEventListener("canplay", handleLoadedMetadata);
    video.addEventListener("canplaythrough", handleLoadedMetadata);
    video.addEventListener("error", handleLoadedMetadata);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    // Safety timeout: transition after 1.5 seconds regardless of network/loading speed to prevent soft-locks
    const safetyTimer = setTimeout(() => {
      if (!isDone) {
        console.log("Loading overlay released by safety timeout.");
        handleLoadedMetadata();
      }
    }, 1500);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleLoadedMetadata);
      video.removeEventListener("canplaythrough", handleLoadedMetadata);
      video.removeEventListener("error", handleLoadedMetadata);
      clearTimeout(safetyTimer);
    };
  }, []);

  // Synchronize mask and layout animations with scroll progress
  useEffect(() => {
    if (!isReady) return;

    const video = videoRef.current;
    const wrapper = wrapperRef.current;
    const frame = frameRef.current;
    if (!video || !wrapper) return;

    // Bolder "X" shape (12 points) with beefier center and wider arms
    const startPolygon = "polygon(12% 15%, 40% 15%, 50% 35%, 60% 15%, 88% 15%, 66% 50%, 88% 85%, 60% 85%, 50% 65%, 40% 85%, 12% 85%, 34% 50%)";
    
    // Rounded-corner rectangle (12 points) for smooth, seamless morphing without crossover/twists
    const endPolygon = "polygon(10% 10%, 30% 10%, 50% 10%, 70% 10%, 90% 10%, 95% 50%, 90% 90%, 70% 90%, 50% 90%, 30% 90%, 10% 90%, 5% 50%)";

    // Setup an unified timeline for seamless scroll synchronization and pinning the entire viewport container
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: "+=120%", // Scrub distance: holds everything pinned until morph & expansion are complete
        scrub: true,
        pin: true, // Pin the entire root wrapper container to prevent rest of page scrolling up until ends
        pinSpacing: true, // Holds everything below this container from scrolling up
        onUpdate: (self) => {
          if (!video.duration) return;
          // Map scroll progress non-linearly for beautiful cinematic easing
          const easedProgress = 1 - Math.pow(1 - self.progress, 2.2);
          const targetTime = easedProgress * video.duration;
          targetTimeRef.current = targetTime;
        },
      }
    });

    // 1. Mask Reveal Morphing
    tl.fromTo(video,
      {
        clipPath: startPolygon,
        filter: "brightness(0.65) contrast(1.3) saturate(1.1)",
        scale: 1.15,
      },
      {
        clipPath: endPolygon,
        filter: "brightness(0.9) contrast(1) saturate(1)",
        scale: 1,
        ease: "none",
      },
      0
    );

    // 2. Video Frame Expansion Animation (the raw frame scaling itself, completely borderless & tile-free)
    if (frame) {
      tl.fromTo(frame,
        {
          scale: 0.88,
        },
        {
          scale: 1.06,
          ease: "none",
        },
        0
      );
    }

    // Capture trigger reference to clean up later
    scrollTriggerRef.current = tl.scrollTrigger || null;
    ScrollTrigger.refresh();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
      tl.kill();
    };
  }, [isReady]);

  // Handle Resize Events dynamically
  useEffect(() => {
    if (!isReady) return;

    let resizeRafId: number;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(resizeRafId);
    };
  }, [isReady]);

  // Ultra-responsive seek interpolation loop (requestAnimationFrame)
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

      // Tight response tolerance (0.01s) with high speedup (0.35) for crisp, lag-free scrub synchronization
      if (Math.abs(diff) > 0.01) {
        const lerpedTime = currentTime + diff * 0.35;

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
              LOADING ARCHIVES...
            </span>
          </div>
        </div>
      )}

      {/* Hero Outer Wrapper - Scroll Track Container taking up full screen */}
      <div
        ref={wrapperRef}
        className="relative w-full h-screen z-10 flex items-center justify-center"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 pointer-events-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-16 items-center w-full pointer-events-none">
            
            {/* Left Segment: Intro Texts sitting directly on background (No borders or cards under text) */}
            <div className="lg:col-span-5 flex flex-col justify-center pointer-events-auto select-none space-y-3 sm:space-y-6">
              {badge && (
                <div className="gravity-element transition-transform">
                  {badge}
                </div>
              )}
              
              <div className="space-y-2 sm:space-y-4">
                {title}
              </div>
              
              <div className="h-[2px] w-12 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
              
              <p className="text-stone-300 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed font-light tracking-wide max-w-lg lg:max-w-none">
                {subtitle}
              </p>
            </div>

            {/* Right Segment: Video Block with Aircraft Mask Reveal on the RAW body (No borders or tiles under video) */}
            <div className="lg:col-span-7 flex h-full items-center justify-center pointer-events-auto w-full">
              <div 
                ref={frameRef}
                className="relative w-full aspect-[16/10] h-[25vh] sm:h-[42vh] lg:h-[62vh] lg:aspect-auto overflow-hidden bg-transparent max-w-md sm:max-w-2xl lg:max-w-none mx-auto"
              >
                {/* Embedded Video Background */}
                <video
                  ref={videoRef}
                  src="/output.mp4"
                  className="w-full h-full object-cover bg-transparent"
                  muted
                  playsInline
                  preload="auto"
                  style={{
                    willChange: "clip-path, filter, transform",
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
