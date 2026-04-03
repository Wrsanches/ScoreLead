import Link from "next/link"
import "./globals.css"

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-[#09090B] font-sans antialiased">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-12px) rotate(5deg); }
                75% { transform: translateY(8px) rotate(-3deg); }
              }
              @keyframes glitch {
                0%, 100% { text-shadow: 2px 0 #10b981, -2px 0 #ef4444; }
                25% { text-shadow: -2px -2px #10b981, 2px 2px #ef4444; }
                50% { text-shadow: 2px 2px #10b981, -2px -2px #ef4444; clip-path: inset(20% 0 40% 0); }
                75% { text-shadow: -2px 2px #10b981, 2px -2px #ef4444; clip-path: inset(60% 0 10% 0); }
              }
              @keyframes glitchBase {
                0%, 100% { clip-path: inset(0 0 0 0); }
                50% { clip-path: inset(0 0 0 0); }
              }
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              @keyframes scanline {
                0% { top: -10%; }
                100% { top: 110%; }
              }
              @keyframes pulse {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
              }
              @keyframes particle1 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                25% { transform: translate(30px, -40px) scale(0.6); opacity: 0.6; }
                50% { transform: translate(-20px, -70px) scale(0.3); opacity: 0; }
                75% { transform: translate(10px, 20px) scale(0.8); opacity: 0.1; }
              }
              @keyframes particle2 {
                0%, 100% { transform: translate(0, 0) scale(0.5); opacity: 0.2; }
                33% { transform: translate(-40px, -30px) scale(1); opacity: 0.5; }
                66% { transform: translate(25px, -60px) scale(0.2); opacity: 0; }
              }
              @keyframes particle3 {
                0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0.4; }
                20% { transform: translate(50px, -20px) scale(0.4); opacity: 0.6; }
                60% { transform: translate(-30px, -50px) scale(0.1); opacity: 0; }
                80% { transform: translate(-10px, 10px) scale(0.6); opacity: 0.2; }
              }
              .glitch-404 {
                animation: glitchBase 3s ease-in-out infinite;
              }
              .glitch-404::before,
              .glitch-404::after {
                content: "404";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                overflow: hidden;
              }
              .glitch-404::before {
                animation: glitch 3s ease-in-out infinite;
                color: transparent;
              }
              .glitch-404::after {
                animation: glitch 3s ease-in-out infinite reverse;
                color: transparent;
              }
            `,
          }}
        />
        <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Subtle background particles */}
          <div
            className="absolute w-2 h-2 rounded-full bg-emerald-500/30"
            style={{ top: "20%", left: "25%", animation: "particle1 8s ease-in-out infinite" }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/20"
            style={{ top: "60%", right: "20%", animation: "particle2 10s ease-in-out infinite" }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-emerald-300/25"
            style={{ top: "40%", left: "60%", animation: "particle3 7s ease-in-out infinite" }}
          />
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500/15"
            style={{ bottom: "30%", left: "15%", animation: "particle2 9s ease-in-out infinite 2s" }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-zinc-500/30"
            style={{ top: "15%", right: "35%", animation: "particle1 11s ease-in-out infinite 1s" }}
          />

          {/* Big glitchy 404 */}
          <div className="relative mt-8 mb-6 select-none">
            <h1
              className="glitch-404 relative text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #10b981 50%, #a1a1aa 100%)",
                backgroundSize: "200% 200%",
                animation: "glitchBase 3s ease-in-out infinite, gradientShift 6s ease infinite",
              }}
            >
              404
            </h1>
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden rounded"
              aria-hidden="true"
            >
              <div
                className="absolute left-0 w-full h-[2px] bg-emerald-500/10"
                style={{ animation: "scanline 4s linear infinite" }}
              />
            </div>
          </div>

          {/* Text content */}
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
            Page not found
          </h2>
          <p className="text-sm text-zinc-500 mb-10 text-center max-w-sm leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>

          {/* Back home button with glow */}
          <Link
            href="/"
            className="group relative px-6 py-3 text-sm font-medium text-white rounded-lg bg-zinc-800/80 border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all duration-300"
          >
            <span
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "radial-gradient(circle at center, rgba(16,185,129,0.15) 0%, transparent 70%)",
              }}
            />
            <span className="relative">Back to home</span>
          </Link>

          {/* Ambient glow behind 404 */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none -z-0"
            style={{
              background: "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
              animation: "pulse 5s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
        </div>
      </body>
    </html>
  )
}
