import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Magnet, 
  Search, 
  ChevronDown, 
  ExternalLink, 
  User, 
  Briefcase, 
  FileText, 
  ArrowUp, 
  Rocket, 
  Facebook
} from "lucide-react";
import { ScrollVideoBackground } from "./components/ScrollVideoBackground";
import { PAPERS, TEAM_MEMBERS, Paper } from "./data/papers";

export default function App() {
  const [activePage, setActivePage] = useState<"home" | "about">("home");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Gravity state
  const [isGravityMode, setIsGravityMode] = useState(false);
  const gravityStartTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Scroll Progress and Back to Top tracking
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Apply Theme class permanently
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Handle click ripple effect
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      document.body.appendChild(ripple);
      
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      
      const onEnd = () => {
        ripple.remove();
      };
      ripple.addEventListener("animationend", onEnd);
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  // Update scroll percentage and Back to Top visibility
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollPercentage(scrolled);
      setShowBackToTop(winScroll > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 0 Gravity floating loop animation using query selectors on mounting pages
  useEffect(() => {
    if (!isGravityMode) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Reset transforms
      const elements = document.querySelectorAll<HTMLElement>(".gravity-element");
      elements.forEach(el => {
        el.style.transform = "";
        el.style.transition = "transform 1s cubic-bezier(0.4, 0, 0.2, 1)";
      });
      return;
    }

    gravityStartTimeRef.current = Date.now();
    
    // Disable normal transitions for smooth frame updates
    const elements = document.querySelectorAll<HTMLElement>(".gravity-element");
    elements.forEach(el => {
      el.style.transition = "none";
    });

    const loop = () => {
      const time = Date.now() * 0.0015;
      const elapsed = Date.now() - gravityStartTimeRef.current;
      const easeFactor = Math.min(elapsed / 2000, 1);
      const smoothFactor = easeFactor < 0.5 
        ? 2 * easeFactor * easeFactor 
        : 1 - Math.pow(-2 * easeFactor + 2, 2) / 2;

      const gravityEls = document.querySelectorAll<HTMLElement>(".gravity-element");
      gravityEls.forEach((el, index) => {
        const speedX = 0.8 + (index % 3) * 0.1;
        const speedY = 1.2 + (index % 2) * 0.2;
        const phase = index * 1.5;
        
        const floatY = Math.sin(time * speedY + phase) * 12 * smoothFactor;
        const floatX = Math.cos(time * speedX + phase) * 8 * smoothFactor;
        const rotate = Math.sin(time * 0.5 + phase) * 1.5 * smoothFactor;
        
        el.style.transform = `translate(${floatX}px, ${floatY}px) rotate(${rotate}deg)`;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isGravityMode, activePage, currentPage, search, sortBy]); // Triggers when components change or re-render

  // Reactive filters and search calculation
  const filteredPapers = useMemo(() => {
    const term = search.toLowerCase();
    let result = PAPERS.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.subject.toLowerCase().includes(term) ||
      p.dept.toLowerCase().includes(term) ||
      p.date.toLowerCase().includes(term)
    );

    // Sorting block
    result.sort((a, b) => {
      switch (sortBy) {
        case "latest": {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          return dateDiff === 0 ? parseInt(b.id) - parseInt(a.id) : dateDiff;
        }
        case "oldest": {
          const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
          return dateDiff === 0 ? parseInt(a.id) - parseInt(b.id) : dateDiff;
        }
        case "subject-az":
          return a.subject.localeCompare(b.subject);
        case "subject-za":
          return b.subject.localeCompare(a.subject);
        case "author-az":
          return a.name.localeCompare(b.name);
        case "author-za":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [search, sortBy]);

  // Reset pagination on search filter adjustments
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  // Paginated partition
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPapers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPapers, currentPage]);

  const totalPages = Math.ceil(filteredPapers.length / itemsPerPage);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbersContainerRef = useRef<HTMLDivElement | null>(null);

  // Center active page in paginator
  useEffect(() => {
    if (pageNumbersContainerRef.current) {
      const activeBtn = document.getElementById(`page-btn-${currentPage}`);
      const container = pageNumbersContainerRef.current;
      if (activeBtn && container) {
        const scrollLeft = activeBtn.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [currentPage]);

  return (
    <div className="relative min-h-screen font-sans bg-gradient-to-b from-[#0B0D14] via-[#050608] to-black text-stone-100 overflow-x-hidden selection:bg-white selection:text-[#0B0D14] pt-20">
      
      {/* Scroll Progress Bar */}
      <div 
        id="scrollProgress" 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-stone-600 via-stone-100 to-stone-600 z-[100]" 
        style={{ width: `${scrollPercentage}%` }}
      />

      {/* Radial Nebula Aurora Blobs */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden opacity-25">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-500 rounded-[100%] blur-[120px] mix-blend-screen animate-pulse-glow" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-fuchsia-500 rounded-[100%] blur-[150px] mix-blend-screen animate-pulse-glow" style={{ animationDuration: "15s", animationDelay: "2s" }} />
        <div className="absolute top-[10%] right-[20%] w-[60%] h-[60%] bg-cyan-500 rounded-[100%] blur-[130px] mix-blend-screen animate-pulse-glow" style={{ animationDuration: "18s", animationDelay: "5s" }} />
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-violet-500 rounded-[100%] blur-[140px] mix-blend-screen animate-pulse-glow" style={{ animationDuration: "14s", animationDelay: "1s" }} />
        
        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-grid text-stone-800 opacity-20" />
      </div>

      {/* Header and Navbar */}
      <nav className="fixed w-full top-0 left-0 z-50 transition-all duration-500 border-b border-white/12 bg-black/35 backdrop-blur-3xl shadow-[0_12px_45px_rgba(0,0,0,0.7)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsGravityMode(!isGravityMode)}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:scale-[1.03] transition-all active:scale-95 flex items-center gap-2.5 border backdrop-blur-md shadow-lg ${
                isGravityMode 
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                  : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/20 text-stone-200 hover:text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
              }`}
            >
              <Magnet size={14} className={isGravityMode ? "animate-bounce" : ""} />
              <span>{isGravityMode ? "Disable 0 Gravity" : "Enable 0 Gravity"}</span>
            </button>
          </div>
          <div className="flex items-center p-1.5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <button 
              onClick={() => setActivePage("home")}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-350 hover:scale-[1.02] ${
                activePage === "home" 
                  ? "bg-white/10 text-white border border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]" 
                  : "text-stone-400 hover:text-stone-100"
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => setActivePage("about")}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-350 hover:scale-[1.02] ${
                activePage === "about" 
                  ? "bg-white/10 text-white border border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]" 
                  : "text-stone-400 hover:text-stone-100"
              }`}
            >
              About
            </button>
          </div>
        </div>
      </nav>

      {/* Pages Frame rendering */}
      {activePage === "home" ? (
        <>
          {/* Home Hero Header */}
          <div className="relative w-full border-b border-white/5 mb-24 min-h-[85vh] flex items-center justify-center -mt-20">
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <ScrollVideoBackground />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0D14]"></div>
            </div>
            
            <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center select-none pt-32 pb-20">
              <div className="gravity-element transition-transform">
                <div className="relative inline-flex p-[1px] mb-8 rounded-full overflow-hidden group">
                  {/* Rotating Neon Border */}
                  <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,transparent_0%,#3b82f6_25%,transparent_50%,#3b82f6_75%,transparent_100%)] animate-rotate-border"></div>
                  
                  {/* Badge Label */}
                  <div className="relative inline-flex items-center gap-2 px-5 py-2 glass text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden">
                    <span className="relative z-10">Levitate Beyond Infinity</span>
                  </div>
                </div>
              </div>
              
              <h1 className="text-6xl md:text-9xl font-serif font-bold mb-10 tracking-tighter leading-[0.85] text-white flex flex-col items-center gap-2 drop-shadow-lg">
                <span className="gravity-element transition-transform inline-block">Team Xiro</span>
                <span className="italic text-stone-300 hover:text-stone-100 transition-colors duration-700 cursor-default gravity-element transition-transform inline-block">
                  Gravity
                </span>
              </h1>
              
              <p className="text-stone-200 drop-shadow-md text-xl md:text-3xl max-w-3xl mx-auto leading-relaxed font-medium tracking-tight gravity-element transition-transform">
                An elite repository of pioneering research and technical breakthroughs, dedicated to pushing the boundaries of human knowledge.
              </p>
            </header>
          </div>

          {/* Main papers browser and engine */}
          <main className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            
            {/* Search & Sort Panel */}
            <div className="flex flex-col md:flex-row gap-6 mb-20">
              <div className="relative flex-1 group gravity-element transition-transform">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-white transition-colors" size={22} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the archives..."
                  className="w-full pl-14 pr-6 py-5 glass rounded-3xl focus:outline-none focus:ring-8 focus:ring-white/5 focus:border-white transition-all shadow-2xl shadow-black/40 text-lg text-white placeholder-stone-500"
                />
              </div>
              <div className="relative gravity-element transition-transform">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-8 pr-14 py-5 glass rounded-3xl focus:outline-none focus:ring-8 focus:ring-white/5 focus:border-white transition-all shadow-2xl shadow-black/40 font-bold cursor-pointer w-full md:w-72 text-stone-100 bg-stone-950/40 border border-white/10"
                >
                  <option value="latest" className="bg-stone-900 text-white font-bold">LATEST RECORDS</option>
                  <option value="oldest" className="bg-stone-900 text-white font-bold">ARCHIVAL ORDER</option>
                  <option value="subject-az" className="bg-stone-900 text-white font-bold">SUBJECT A-Z</option>
                  <option value="subject-za" className="bg-stone-900 text-white font-bold">SUBJECT Z-A</option>
                  <option value="author-az" className="bg-stone-900 text-white font-bold">AUTHOR A-Z</option>
                  <option value="author-za" className="bg-stone-900 text-white font-bold">AUTHOR Z-A</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
              </div>
            </div>

            {/* Grid display */}
            {filteredPapers.length === 0 ? (
              <div className="text-center py-24 glass rounded-[2rem] border border-dashed border-stone-800">
                <FileText className="mx-auto text-stone-700 mb-4" size={64} />
                <p className="text-stone-400 font-mono text-sm tracking-wide">No records found in the current sector.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {paginatedPapers.map((paper, index) => (
                  <div 
                    key={paper.id}
                    className="glass-card shiny-effect rounded-[2rem] p-8 transition-all duration-300 card-hover hover:shadow-2xl group flex flex-col h-full animate-reveal gravity-element"
                    style={{ transitionDelay: `${(index % 3) * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-6 gravity-element transition-transform">
                      <span className="glass text-stone-300 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {paper.status || "Active"}
                      </span>
                      <span className="text-stone-400 text-xs font-mono">{paper.date}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-blue-50/90 group-hover:text-white transition-colors leading-tight flex-grow gravity-element transition-transform">
                      {paper.subject}
                    </h3>

                    <div className="space-y-3 mb-8 gravity-element transition-transform">
                      <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                        <User size={16} />
                        <span className="font-medium">{paper.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-stone-400 text-sm">
                        <Briefcase size={14} />
                        <span>{paper.dept}</span>
                      </div>
                    </div>

                    <a 
                      href={paper.pdfLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="shiny-effect flex items-center justify-center gap-2 w-full py-4 text-white rounded-2xl bg-blue-600/30 border border-blue-400/30 hover:bg-blue-500/50 hover:border-blue-300/50 transition-all font-bold shadow-xl shadow-blue-900/20 gravity-element transition-transform"
                    >
                      <ExternalLink size={18} />
                      Access Record
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination widgets */}
            {totalPages > 1 && (
              <div className="mt-16 flex flex-col items-center gap-6">
                <p className="text-stone-400 text-sm font-medium tracking-wide">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredPapers.length)} of {filteredPapers.length} papers
                </p>
                
                <div className="flex justify-center gap-2">
                  <div className="inline-flex items-center p-1.5 glass rounded-2xl shadow-sm">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center px-4 h-10 rounded-xl text-sm font-semibold transition-all ${currentPage === 1 ? "opacity-30 cursor-not-allowed text-stone-600" : "hover:bg-white/10 text-stone-100 active:scale-95"}`}
                    >
                      <span className="mr-1">&larr;</span> Prev
                    </button>

                    <div 
                      ref={pageNumbersContainerRef}
                      className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide w-[140px]"
                      style={{ padding: "0 8px" }}
                    >
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                        <button
                          key={pNum}
                          id={`page-btn-${pNum}`}
                          onClick={() => setCurrentPage(pNum)}
                          className={`flex-shrink-0 w-10 h-10 rounded-xl text-sm font-bold transition-all snap-center ${pNum === currentPage ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-stone-400 hover:bg-white/10 active:scale-95"}`}
                        >
                          {pNum}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center px-4 h-10 rounded-xl text-sm font-semibold transition-all ${currentPage === totalPages ? "opacity-30 cursor-not-allowed text-stone-600" : "hover:bg-white/10 text-stone-100 active:scale-95"}`}
                    >
                      Next <span className="ml-1">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </main>
        </>
      ) : (
        /* About active view */
        <>
          <div className="relative w-full border-b border-white/5 mb-24 min-h-[75vh] flex items-center justify-center -mt-20">
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <ScrollVideoBackground />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0D14]"></div>
            </div>
            
            <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center select-none pt-32 pb-24">
              <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tighter text-white flex flex-col items-center gap-2 drop-shadow-lg">
                <span className="gravity-element transition-transform inline-block">About</span>
                <span className="italic text-stone-300 gravity-element transition-transform inline-block">Team Xiro Gravity</span>
              </h1>
              <p className="text-stone-200 drop-shadow-md text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium gravity-element transition-transform">
                Student-driven innovation from the Aviation and Aerospace University of Bangladesh.
              </p>
            </header>
          </div>

          <main className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              <div className="glass-card shiny-effect p-10 rounded-[2.5rem] gravity-element transition-transform">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                  <Rocket className="text-white" />
                  Our Mission
                </h2>
                <p className="text-stone-300 leading-relaxed mb-6 text-lg">
                  Team Xiro Gravity is a passionate student-driven team from the Aviation and Aerospace University of Bangladesh (Batch 2026), dedicated to advancing knowledge and innovation in the fields of aeronautics and astronautics, to rise beyond limits and touch the sky. We are driven by curiosity, innovation, and the fearless pursuit of aerospace excellence.
                </p>
                <p className="text-stone-300 leading-relaxed text-lg">
                  We believe the future belongs to those who dare to explore. In an era of rapid aeronautical and astronautical revolutions, we stand committed to learning, building, and pushing boundaries. From the science of flight to the complexity of air defense systems, we transform knowledge into action and ideas into reality.
                </p>
              </div>
              
              <div className="glass-card shiny-effect p-10 rounded-[2.5rem] flex flex-col justify-center gravity-element transition-transform">
                <blockquote className="text-2xl md:text-3xl font-serif italic text-stone-200 leading-snug mb-6">
                  "For us, aerospace is not just a field of study — it is a passion, a responsibility, and a vision for the future."
                </blockquote>
                <div className="h-1 w-20 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Team listing Grid */}
            <div>
              <h2 className="text-4xl font-bold mb-12 text-center text-white gravity-element transition-transform">The Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TEAM_MEMBERS.map((member, idx) => (
                  <div 
                    key={member.name}
                    className="glass-card shiny-effect rounded-[2.25rem] p-8 card-hover flex flex-col h-full gravity-element"
                    style={{ transitionDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex flex-col items-center text-center h-full justify-center">
                      
                      {/* Name area + link */}
                      <div className="flex items-center justify-center gap-2 mb-2 min-h-[3.5rem] gravity-element transition-transform">
                        <h3 className="font-bold text-xl leading-tight text-white">{member.name}</h3>
                        {member.fb && (
                          <a 
                            href={member.fb} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="shiny-effect p-1.5 glass rounded-full hover:bg-blue-500/20 transition-all text-stone-300 hover:text-blue-400 shrink-0"
                            aria-label={`${member.name} Facebook link`}
                          >
                            <Facebook size={14} />
                          </a>
                        )}
                      </div>

                      {/* Subtitles Area for badges alignment */}
                      <div className="h-6 flex items-center justify-center gap-2 mb-2 gravity-element transition-transform">
                        {member.subtitle && (
                          <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full ${
                            member.subtitle === 'EX' 
                              ? 'text-red-400 bg-red-950/30 border border-red-500/20' 
                              : member.subtitle === 'Best Writer' 
                                ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/20' 
                                : member.subtitle === 'Team Lead' 
                                  ? 'text-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-500/30' 
                                  : 'text-blue-400 bg-blue-950/30 border border-blue-500/20'
                          }`}>
                            {member.subtitle}
                          </span>
                        )}
                        {member.streakChamp && (
                          <span className="text-[10px] font-black text-yellow-400 bg-yellow-950/30 border border-yellow-500/20 uppercase tracking-[0.25em] px-3 py-1 rounded-full">
                            Streak Champ
                          </span>
                        )}
                      </div>

                      {/* Role representation info */}
                      <div className="border-t border-white/10 pt-4 w-full gravity-element transition-transform">
                        <p className="text-stone-400 text-sm font-semibold tracking-wide uppercase">
                          {member.role}
                        </p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </>
      )}

      {/* Persistent global Footer */}
      <footer className="relative z-30 border-t border-white/10 py-2 bg-stone-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Real Counter integration */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">
                Total Visitors:
              </span>
              <div className="flex items-center justify-center">
                <a href="https://www.freecounterstat.com" title="free website counter" target="_blank" rel="noopener noreferrer">
                  <img 
                    src="https://counter1.optistats.ovh/private/freecounterstat.php?c=h9rmy4g567dnpe75jw1sx6wtncyrbk11" 
                    className="border-0 h-4" 
                    title="free website counter" 
                    alt="free website counter"
                  />
                </a>
              </div>
            </div>

            <p className="text-stone-400 text-xs font-medium tracking-wide uppercase">
              © 2026 Team Xiro Gravity
            </p>
          </div>
        </div>
      </footer>

      {/* Smooth scroll Back to top buttons */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-4 glass text-white rounded-2xl shadow-2xl transition-all duration-500 z-50 hover:scale-110 active:scale-95 ${
          showBackToTop ? "opacity-100 translate-y-0 cursor-pointer" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ArrowUp size={24} />
      </button>

    </div>
  );
}
