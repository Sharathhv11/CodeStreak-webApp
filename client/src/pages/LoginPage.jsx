import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginWithGitHub, clearError } from "../features/auth/authSlice";
import defaultLogo from "../assets/codestreak.png";

// ── SVG Icons ────────────────────────────────────────
const GitHubIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const ShieldCheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// ── Background ───────────────────────────────────────
const SubtleBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
    {/* Subtle central radial glow */}
    <div className="w-[600px] h-[500px] bg-white/[0.015] rounded-[100%] blur-[100px]" />
    {/* Minimal grid noise */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
  </div>
);

// ── Floating Platform Logos ──────────────────────────
const FloatingLogos = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden sm:block">
    <div className="absolute top-[15%] left-[8%] animate-float-1 opacity-60 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center justify-center bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-[#FFA116] mr-2.5 shadow-[0_0_8px_#FFA116]" />
        <span className="text-neutral-300 font-medium tracking-wide text-sm">LeetCode</span>
      </div>
    </div>
    
    <div className="absolute bottom-[20%] left-[12%] animate-float-2 opacity-50 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center justify-center bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-[#2E8B57] mr-2.5 shadow-[0_0_8px_#2E8B57]" />
        <span className="text-neutral-300 font-medium tracking-wide text-sm">GeeksforGeeks</span>
      </div>
    </div>
    
    <div className="absolute top-[25%] right-[10%] animate-float-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center justify-center bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-[#00EA64] mr-2.5 shadow-[0_0_8px_#00EA64]" />
        <span className="text-neutral-300 font-medium tracking-wide text-sm">HackerRank</span>
      </div>
    </div>
    
    <div className="absolute bottom-[25%] right-[8%] animate-float-4 opacity-50 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center justify-center bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-[#5B4636] mr-2.5 shadow-[0_0_8px_#5B4636]" />
        <span className="text-neutral-300 font-medium tracking-wide text-sm">CodeChef</span>
      </div>
    </div>
  </div>
);

export default function LoginPage() {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) dispatch(clearError());
  }, [dispatch, error]);

  const handleGitHubLogin = () => {
    dispatch(loginWithGitHub());
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-[#0A0A0A] font-sans text-neutral-200 relative overflow-hidden selection:bg-white/10">
      {/* ── Internal Styles for Micro-interactions ── */}
      <style>{`
        @keyframes fadeScale {
          0% { opacity: 0; transform: scale(0.96) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-2deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(18px) rotate(3deg); }
        }
        @keyframes float4 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-1deg); }
        }
        .animate-fade-scale {
          animation: fadeScale 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-1 { animation: float1 7s ease-in-out infinite; }
        .animate-float-2 { animation: float2 8s ease-in-out infinite 1s; }
        .animate-float-3 { animation: float3 9s ease-in-out infinite 0.5s; }
        .animate-float-4 { animation: float4 7.5s ease-in-out infinite 1.5s; }
      `}</style>
      
      <SubtleBackground />
      <FloatingLogos />

      <div className="relative z-10 w-full max-w-[400px] flex flex-col animate-fade-scale opacity-0">
        
        {/* ── LOGO HEADER ── */}
        <div className="flex flex-col items-center mb-8">
         
            <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity " />
            <img src={defaultLogo} alt="CodeStreak Icon" className="w-[200px] h-full object-cover relative z-10" />
         
        </div>

        {/* ── LOGIN CARD ── */}
        <div className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden">
          
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white-[0.12] to-transparent shadow-[0_1px_8px_rgba(255,255,255,0.08)]" />

          <div className="text-center w-full mb-8 mt-2">
            <h2 className="text-[1.35rem] font-semibold text-white tracking-tight leading-tight mb-2">
              Welcome back
            </h2>
            <p className="text-neutral-400 text-[14px] leading-relaxed">
              Sign in to sync your contribution history.
            </p>
          </div>

          {error && (
            <div className="w-full mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-sm font-medium items-center justify-center text-center">
              <span>{error}</span>
            </div>
          )}

          {/* ── Primary CTA ── */}
          <button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full bg-[#EAEAEA] text-[#0A0A0A] hover:bg-white transition-all duration-200 py-3.5 rounded-[12px] font-medium text-[14.5px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.015] active:scale-[0.985] shadow-[0_2px_10px_rgba(255,255,255,0.05)]"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-neutral-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <GitHubIcon className="w-5 h-5 text-neutral-900" />
            )}
            {isLoading ? "Authenticating..." : "Continue with GitHub"}
          </button>

          {/* Secure Login Indicator */}
          <div className="mt-8 flex items-center justify-center gap-1.5 opacity-80">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] uppercase tracking-[0.05em] text-neutral-500 font-semibold">
              Secure OAuth Login
            </span>
          </div>
        </div>

        {/* ── FEATURE PILLS ── */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          {["Real-time Sync", "Analytics", "AI Insights"].map((feat, i) => (
            <div key={i} className="text-[12px] text-neutral-500 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-700"></span> 
              {feat}
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-10 text-center px-4">
           <p className="text-[12px] text-neutral-600 leading-relaxed font-medium">
            By connecting, you agree to our <br className="hidden" />
            <a href="#" className="text-neutral-400 hover:text-neutral-200 transition-colors underline decoration-neutral-800 underline-offset-4">Terms of Service</a> &mdash; <a href="#" className="text-neutral-400 hover:text-neutral-200 transition-colors underline decoration-neutral-800 underline-offset-4">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
