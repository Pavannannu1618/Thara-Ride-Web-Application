import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';

// ─── Session key — animation plays only once per browser session ─────────────
const INTRO_KEY = 'thara_intro_shown';

// ─── Global keyframes injected once into <head> ───────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=DM+Sans:wght@400;500&display=swap');

  @keyframes th-ptcl-float {
    0%,100% { transform:translateY(0) translateX(0); opacity:var(--op); }
    33%      { transform:translateY(-18px) translateX(6px); opacity:calc(var(--op)*1.5); }
    66%      { transform:translateY(8px) translateX(-8px); opacity:calc(var(--op)*.5); }
  }
  @keyframes th-ptcl-twinkle {
    0%,100% { opacity:var(--op); transform:scale(1) rotate(0deg); }
    50%      { opacity:calc(var(--op)*.1); transform:scale(.3) rotate(180deg); }
  }
  @keyframes th-shoot {
    0%   { transform:rotate(30deg) translateX(0) scaleX(1); opacity:1; }
    100% { transform:rotate(30deg) translateX(320px) scaleX(0); opacity:0; }
  }
  @keyframes th-scanline {
    0%   { top:-4px; } 100% { top:100%; }
  }
  @keyframes th-logo-reveal {
    0%   { opacity:0; transform:scale(.7) translateY(28px); filter:blur(20px) drop-shadow(0 0 0 #f59e0b); }
    60%  { opacity:1; transform:scale(1.05) translateY(-4px); filter:blur(0) drop-shadow(0 0 28px #f59e0baa); }
    100% { opacity:1; transform:scale(1) translateY(0); filter:blur(0) drop-shadow(0 0 12px #f59e0b55); }
  }
  @keyframes th-logo-glow {
    0%,100% { filter:drop-shadow(0 0 10px #f59e0b44) drop-shadow(0 0 24px #f59e0b22); }
    50%      { filter:drop-shadow(0 0 28px #f59e0baa) drop-shadow(0 0 60px #f59e0b55) drop-shadow(0 0 100px #f59e0b22); }
  }
  @keyframes th-logo-float {
    0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); }
  }
  @keyframes th-rise {
    0%   { opacity:0; transform:translateY(36px); }
    100% { opacity:1; transform:translateY(0); }
  }
  @keyframes th-fade-in {
    from { opacity:0; } to { opacity:1; }
  }
  @keyframes th-btn-pulse {
    0%,100% { box-shadow:0 0 20px rgba(245,158,11,.3),0 8px 32px rgba(0,0,0,.6); }
    50%      { box-shadow:0 0 48px rgba(245,158,11,.85),0 8px 44px rgba(0,0,0,.8); }
  }
  @keyframes th-star-burst {
    0%   { opacity:0; transform:scale(0) rotate(-180deg); }
    55%  { opacity:1; transform:scale(1.32) rotate(15deg); }
    75%  { transform:scale(.9) rotate(-5deg); }
    100% { opacity:1; transform:scale(1) rotate(0deg); }
  }
  @keyframes th-star-pulse {
    0%,100% { filter:drop-shadow(0 0 8px #f59e0b) drop-shadow(0 0 22px #f59e0b88); }
    50%      { filter:drop-shadow(0 0 24px #f59e0b) drop-shadow(0 0 60px #f59e0b) drop-shadow(0 0 100px #f59e0b44); }
  }
  @keyframes th-blur-in {
    0%   { opacity:0; transform:scale(.6) translateY(20px); filter:blur(12px); }
    100% { opacity:1; transform:scale(1) translateY(0); filter:blur(0); }
  }
  @keyframes th-ride-in {
    0%   { opacity:0; letter-spacing:28px; } 100% { opacity:.5; letter-spacing:14px; }
  }
  @keyframes th-letter-up {
    0%   { transform:translateY(110%); opacity:0; }
    100% { transform:translateY(0); opacity:1; }
  }
  @keyframes th-orbit {
    from { transform:rotate(0deg) translateX(var(--r)) rotate(0deg); }
    to   { transform:rotate(360deg) translateX(var(--r)) rotate(-360deg); }
  }
  @keyframes th-grid-in {
    from { opacity:0; } to { opacity:1; }
  }
`;

// ─── Particle data (generated once at module level so it's stable) ────────────
const PARTICLES = Array.from({ length: 100 }, (_, i) => ({
  id:     i,
  x:      Math.random() * 100,
  y:      Math.random() * 100,
  size:   Math.random() * 2.8 + 0.4,
  op:     Math.random() * 0.38 + 0.04,
  dur:    3 + Math.random() * 8,
  delay:  Math.random() * 8,
  isStar: i < 28,
  kind:   i < 8 ? '✦' : i < 18 ? '✧' : i < 28 ? '⋆' : '',
}));

const SPARKLES = [
  [ 0,-76],[64,-48],[76, 10],[56, 66],[ 0, 80],
  [-56, 66],[-76, 10],[-64,-48],[34,-84],[-34,-84],
  [ 84,-22],[-84,-22],[ 48, 76],[-48, 76],
];

const ORBIT_DOTS = [
  { r:'52px', dur:'1.8s', sz:4, del:'0s'    },
  { r:'70px', dur:'2.6s', sz:3, del:'-0.9s' },
  { r:'86px', dur:'3.4s', sz:2, del:'-1.7s' },
  { r:'60px', dur:'2.1s', sz:3, del:'-1.1s' },
  { r:'78px', dur:'2.9s', sz:2, del:'-0.5s' },
];

// ─── Particle field component ─────────────────────────────────────────────────
const ParticleField = () => (
  <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
    {PARTICLES.map(p => (
      <div key={p.id} style={{
        position: 'absolute',
        left: p.x + '%',
        top:  p.y + '%',
        width:  p.isStar ? 'auto' : p.size + 'px',
        height: p.isStar ? 'auto' : p.size + 'px',
        borderRadius: '50%',
        background: p.isStar ? 'none' : '#f59e0b',
        color: '#f59e0b',
        fontSize: (p.size * 2.4) + 'px',
        lineHeight: 1,
        '--op': p.op,
        opacity: p.op,
        animation: `${p.isStar ? 'th-ptcl-twinkle' : 'th-ptcl-float'} ${p.dur}s ease ${p.delay}s infinite`,
      }}>
        {p.kind}
      </div>
    ))}
  </div>
);

// ─── Falling star (RAF-driven, no CSS keyframe) ───────────────────────────────
function spawnImpact(container, cx, cy) {
  for (let i = 0; i < 4; i++) {
    const r = document.createElement('div');
    r.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:16px;height:16px;border-radius:50%;border:${1.5-i*.2}px solid #f59e0b;transform:translate(-50%,-50%);pointer-events:none;z-index:20;opacity:${.9-i*.15}`;
    container.appendChild(r);
    const s = performance.now(), d = 750 + i * 200;
    (function a(now) {
      const p = Math.min((now-s)/d, 1), sc = 1+p*(5+i*2.5);
      r.style.transform = `translate(-50%,-50%) scale(${sc})`;
      r.style.opacity   = ((.9-i*.15)*(1-p)) + '';
      if (p < 1) requestAnimationFrame(a); else r.remove();
    })(s);
  }
  SPARKLES.forEach(([dx, dy], i) => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${i%3===0?7:4}px;height:${i%3===0?7:4}px;border-radius:50%;background:${i%2?'#f59e0b':'#fbbf24'};transform:translate(-50%,-50%);pointer-events:none;z-index:20;box-shadow:0 0 8px #f59e0b`;
    container.appendChild(el);
    setTimeout(() => {
      const s = performance.now(), d = 750 + Math.random() * 250;
      (function a(now) {
        const p = Math.min((now-s)/d, 1), e = 1-Math.pow(1-p, 3);
        el.style.transform = `translate(calc(-50% + ${dx*e}px), calc(-50% + ${dy*e}px)) scale(${1-p})`;
        el.style.opacity   = (1-p) + '';
        if (p < 1) requestAnimationFrame(a); else el.remove();
      })(performance.now());
    }, i * 28);
  });
}

const FallingStar = () => {
  const dotRef   = useRef(null);
  const trailRef = useRef(null);
  const rafRef   = useRef(null);
  const fired    = useRef(false);

  useEffect(() => {
    const parent  = dotRef.current?.parentElement;
    if (!parent) return;
    const centerY = parent.clientHeight * 0.44;
    const centerX = parent.clientWidth  / 2;
    const start   = performance.now();
    const dur     = 1100;

    function frame(now) {
      const p   = Math.min((now-start)/dur, 1);
      const dot = dotRef.current;
      const tri = trailRef.current;
      if (!dot) return;

      if (p < 0.88) {
        const q = p / 0.88;
        const top = -20 + q*q*(centerY + 20);
        dot.style.top = top + 'px';
        dot.style.opacity = '1';
        dot.style.transform = 'translateX(-50%) scale(1)';
        dot.style.filter = 'none';
        if (tri) { tri.style.height = (top+20)+'px'; tri.style.opacity = '.75'; }
      } else {
        const q = (p-0.88)/0.12;
        dot.style.top = centerY + 'px';
        dot.style.opacity = (1-q) + '';
        dot.style.transform = `translateX(-50%) scale(${1+q*16})`;
        dot.style.filter = `blur(${q*5}px)`;
        if (tri) tri.style.opacity = ((1-q)*.75) + '';
      }
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
      else if (!fired.current) {
        fired.current = true;
        spawnImpact(parent, centerX, centerY);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      <div ref={trailRef} style={{
        position:'absolute', left:'calc(50% - 1px)', top:'-20px',
        width:'2px', height:0,
        background:'linear-gradient(to bottom,transparent,rgba(245,158,11,.75) 60%,#f59e0b)',
        opacity:0, pointerEvents:'none',
      }} />
      <div ref={dotRef} style={{
        position:'absolute', left:'50%', top:'-20px',
        width:'12px', height:'12px', borderRadius:'50%',
        background:'#f59e0b',
        boxShadow:'0 0 16px #f59e0b,0 0 40px #f59e0baa,0 0 80px #f59e0b55',
        transform:'translateX(-50%)', opacity:0,
      }} />
    </>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate();

  // Skip animation if already seen this session
  const [phase, setPhase] = useState(
    () => sessionStorage.getItem(INTRO_KEY) ? 5 : 0
  );

  const styleRef = useRef(null);
  const shootRef = useRef(null);

  useEffect(() => {
    styleRef.current = document.createElement('style');
    styleRef.current.textContent = STYLES;
    document.head.appendChild(styleRef.current);
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current))
        document.head.removeChild(styleRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase >= 5) return; // already skipped
    const T = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => {
        setPhase(5);
        // Mark animation as seen for this session
        sessionStorage.setItem(INTRO_KEY, '1');
      }, 5100),
    ];
    return () => T.forEach(clearTimeout);
  }, []); // eslint-disable-line

  // Shooting stars on landing page
  useEffect(() => {
    if (phase < 5) return;
    const fire = () => {
      const el = document.getElementById('th-shoot');
      if (!el) return;
      el.style.left = (8 + Math.random() * 58) + '%';
      el.style.top  = (4 + Math.random() * 42) + '%';
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'th-shoot 1.3s cubic-bezier(.4,0,1,1) forwards';
    };
    const t = setTimeout(fire, 1200);
    shootRef.current = setInterval(fire, 4200);
    return () => { clearTimeout(t); clearInterval(shootRef.current); };
  }, [phase]);

  const base = {
    background: '#07070e',
    minHeight:  '100vh',
    width:      '100%',
    position:   'relative',
    overflow:   'hidden',
    fontFamily: "'Unbounded', sans-serif",
  };

  // ─── ANIMATION SCENE ─────────────────────────────────────────────────────
  if (phase < 5) return (
    <div style={base}>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>

        {/* Particles */}
        {phase >= 1 && (
          <div style={{ position:'absolute', inset:0, opacity:0, animation:'th-fade-in 2s ease .5s forwards' }}>
            <ParticleField />
          </div>
        )}

        {/* Radial glow */}
        {phase >= 1 && (
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:'72vmin', height:'72vmin', borderRadius:'50%',
            background:'radial-gradient(circle, rgba(245,158,11,.1) 0%, transparent 65%)',
            transform:'translate(-50%,-50%)',
            opacity:0, animation:'th-fade-in 1.5s ease .3s forwards',
            pointerEvents:'none',
          }} />
        )}

        {/* Scanline */}
        <div style={{
          position:'absolute', left:0, right:0, height:'2px',
          background:'linear-gradient(to right,transparent,rgba(245,158,11,.1),transparent)',
          animation:'th-scanline 4s linear .2s infinite',
          pointerEvents:'none', top:0, zIndex:10,
        }} />

        {/* Phase 1: falling star */}
        {phase >= 1 && <FallingStar />}

        {/* Phase 2: STAR RIDE */}
        {phase === 2 && (
          <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', textAlign:'center' }}>
            <div style={{
              fontSize:'clamp(58px,16vw,108px)', fontWeight:900, color:'#f59e0b',
              letterSpacing:'-3px', lineHeight:1,
              textShadow:'0 0 60px #f59e0b55,0 0 120px #f59e0b22',
              animation:'th-blur-in .55s cubic-bezier(.34,1.4,.64,1) forwards',
            }}>STAR</div>
            <div style={{
              fontSize:'clamp(12px,3vw,20px)', fontWeight:700, color:'#fff',
              letterSpacing:'14px', marginTop:'10px',
              animation:'th-ride-in .45s ease .15s forwards', opacity:0,
            }}>RIDE</div>
          </div>
        )}

        {/* Phase 2→3: STAR fading */}
        {phase === 3 && (
          <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', textAlign:'center', pointerEvents:'none' }}>
            <div style={{
              fontSize:'clamp(58px,16vw,108px)', fontWeight:900, color:'#f59e0b',
              letterSpacing:'-3px', lineHeight:1, textShadow:'0 0 60px #f59e0b55',
              animation:'th-blur-in .4s ease reverse forwards',
            }}>STAR</div>
            <div style={{
              fontSize:'clamp(12px,3vw,20px)', fontWeight:700, color:'#fff',
              letterSpacing:'14px', marginTop:'10px', opacity:.5,
              animation:'th-ride-in .3s ease reverse forwards',
            }}>RIDE</div>
          </div>
        )}

        {/* Phase 3: ★ symbol + orbits */}
        {phase === 3 && (
          <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{
              position:'absolute', width:'185px', height:'185px',
              border:'1px solid rgba(245,158,11,.1)', borderRadius:'50%',
              opacity:0, animation:'th-fade-in .5s ease .1s forwards',
            }} />
            {ORBIT_DOTS.map((od, i) => (
              <div key={i} style={{
                position:'absolute', width:od.sz+'px', height:od.sz+'px',
                '--r': od.r, borderRadius:'50%',
                background:'#f59e0b', boxShadow:'0 0 6px #f59e0b',
                opacity:0,
                animation:`th-orbit ${od.dur} linear ${od.del} infinite, th-fade-in .5s ease .3s forwards`,
              }} />
            ))}
            <div style={{
              fontSize:'clamp(76px,18vw,126px)', color:'#f59e0b',
              lineHeight:1, userSelect:'none',
              animation:'th-star-burst .65s cubic-bezier(.34,1.56,.64,1) .2s forwards, th-star-pulse 1.6s ease .8s infinite',
              opacity:0, filter:'drop-shadow(0 0 20px #f59e0b)',
            }}>★</div>
          </div>
        )}

        {/* Phase 4: THARA RIDE text build */}
        {phase === 4 && (
          <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', textAlign:'left' }}>
            {/* ★ accent */}
            <div style={{
              position:'absolute', top:'-14px', right:'-22px',
              fontSize:'clamp(16px,3.5vw,24px)', color:'#f59e0b',
              animation:'th-star-burst .6s cubic-bezier(.34,1.56,.64,1) .5s forwards, th-star-pulse 2.5s ease 1.3s infinite',
              opacity:0, userSelect:'none', filter:'drop-shadow(0 0 8px #f59e0b)',
            }}>★</div>

            {/* THARA letters */}
            <div style={{
              display:'flex', overflow:'hidden',
              fontSize:'clamp(50px,13vw,100px)',
              fontWeight:900, color:'#f59e0b',
              letterSpacing:'-2px', lineHeight:1.05,
              textShadow:'0 0 80px #f59e0b22',
            }}>
              {'THARA'.split('').map((l, i) => (
                <span key={i} style={{
                  display:'inline-block', opacity:0, transform:'translateY(110%)',
                  animation:`th-letter-up .5s cubic-bezier(.34,1.3,.64,1) ${i*.075}s forwards`,
                }}>{l}</span>
              ))}
            </div>

            {/* RIDE */}
            <div style={{
              fontSize:'clamp(10px,2.2vw,15px)', fontWeight:700,
              color:'rgba(255,255,255,.45)', letterSpacing:'10px',
              marginTop:'6px', paddingLeft:'4px',
              animation:'th-ride-in .5s ease .45s forwards', opacity:0,
            }}>RIDE</div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── LANDING PAGE (phase 5) ───────────────────────────────────────────────
  return (
    <div style={base}>
      {/* Grid */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`
          linear-gradient(rgba(245,158,11,.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,.04) 1px, transparent 1px)
        `,
        backgroundSize:'60px 60px',
        opacity:0, animation:'th-grid-in 2s ease forwards',
        pointerEvents:'none',
      }} />

      {/* Particles */}
      <div style={{ position:'absolute', inset:0, opacity:0, animation:'th-fade-in 1.2s ease .2s forwards' }}>
        <ParticleField />
      </div>

      {/* Radial glow */}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        width:'88vmin', height:'88vmin', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(245,158,11,.08) 0%,transparent 60%)',
        transform:'translate(-50%,-50%)', pointerEvents:'none',
      }} />

      {/* Shooting star */}
      <div id="th-shoot" style={{
        position:'absolute', width:'130px', height:'2px',
        background:'linear-gradient(to right,transparent,rgba(245,158,11,.7),#f59e0b)',
        borderRadius:'2px', pointerEvents:'none', opacity:0, zIndex:2,
      }} />

      {/* Scanline */}
      <div style={{
        position:'absolute', left:0, right:0, height:'2px',
        background:'linear-gradient(to right,transparent,rgba(245,158,11,.07),transparent)',
        animation:'th-scanline 7s linear 1s infinite',
        pointerEvents:'none', top:0, zIndex:3,
      }} />

      {/* ─── CONTENT ─── */}
      <div style={{
        position:'relative', zIndex:4,
        minHeight:'100vh', width:'100%',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'24px',
      }}>
        <div style={{ width:'100%', maxWidth:'420px', textAlign:'center' }}>

          {/* ★ Actual SVG logo from assets/logo.svg ★ */}
          <div style={{ animation:'th-logo-float 4.5s ease 1.2s infinite', marginBottom:'8px', display:'inline-block' }}>
            <img
              src={logoSvg}
              alt="Thara Ride"
              draggable={false}
              style={{
                width:  'clamp(200px, 55vw, 340px)',
                height: 'auto',
                display: 'block',
                margin:  '0 auto',
                opacity: 0,
                animation: 'th-logo-reveal 1s cubic-bezier(.34,1.2,.64,1) .1s forwards, th-logo-glow 3.5s ease 1.3s infinite',
              }}
            />
          </div>

          {/* Tagline */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   'clamp(14px,3.5vw,17px)',
            color:      'rgba(255,255,255,.42)',
            lineHeight: 1.78,
            margin:     '22px 0 40px',
            opacity:     0,
            animation:  'th-rise .7s ease .4s forwards',
          }}>
            Your city. Your ride.
            <br />
            <span style={{ color:'rgba(255,255,255,.22)', fontSize:'12px' }}>
              Fast, safe, always on time.
            </span>
          </p>

          {/* Buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:'14px', opacity:0, animation:'th-rise .7s ease .55s forwards' }}>
            <button
              onClick={() => navigate('/auth/login?role=rider')}
              style={{
                width:'100%', padding:'18px 24px',
                background:'#f59e0b', color:'#07070e',
                border:'none', borderRadius:'16px',
                fontSize:'15px', fontWeight:900,
                fontFamily:"'Unbounded', sans-serif",
                cursor:'pointer', letterSpacing:'.5px',
                animation:'th-btn-pulse 3s ease 1.2s infinite',
                transition:'transform .15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
              onMouseDown={e  => e.currentTarget.style.transform = 'scale(.97)'}
              onMouseUp={e    => e.currentTarget.style.transform = 'translateY(-3px)'}
            >
              Book a Ride →
            </button>

            <button
              onClick={() => navigate('/auth/login?role=driver')}
              style={{
                width:'100%', padding:'17px 24px',
                background:'transparent', color:'#f59e0b',
                border:'1.5px solid rgba(245,158,11,.28)',
                borderRadius:'16px', fontSize:'14px', fontWeight:700,
                fontFamily:"'Unbounded', sans-serif",
                cursor:'pointer', letterSpacing:'.5px',
                transition:'all .2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background   = 'rgba(245,158,11,.07)';
                e.currentTarget.style.borderColor  = 'rgba(245,158,11,.55)';
                e.currentTarget.style.transform    = 'translateY(-3px)';
                e.currentTarget.style.boxShadow    = '0 0 20px rgba(245,158,11,.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background   = 'transparent';
                e.currentTarget.style.borderColor  = 'rgba(245,158,11,.28)';
                e.currentTarget.style.transform    = 'translateY(0)';
                e.currentTarget.style.boxShadow    = 'none';
              }}
            >
              Drive with Thara
            </button>
          </div>

          <p style={{
            fontFamily:"'DM Sans', sans-serif",
            fontSize:'11px', color:'rgba(255,255,255,.16)',
            marginTop:'32px', letterSpacing:'.4px',
            opacity:0, animation:'th-fade-in 1s ease .9s forwards',
          }}>
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;