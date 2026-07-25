'use client'

import { useEffect, useState, useRef } from 'react'

const DEMO_KEY = 'hive_demo_bodylog'

const DEMO_INPUT = "Three weeks of morning headaches, worse on waking, easing by midday. Also noticing some neck stiffness."

const DEMO_RESPONSE = {
  summary: "Morning headache pattern · 21 days",
  patterns: [
    { label: "Onset", value: "On waking" },
    { label: "Peak", value: "7–8am" },
    { label: "Resolution", value: "~11am" },
    { label: "Associated", value: "Neck stiffness" },
    { label: "Duration trend", value: "Consistent" },
  ],
  flag: "This pattern has been present for 3 weeks — worth mentioning at your next GP appointment.",
  note: "Possible context: posture during sleep, muscle tension, morning dehydration."
}

export default function AutoDemo() {
  const [phase, setPhase] = useState<'hidden' | 'typing' | 'response' | 'fading'>('hidden')
  const [typedText, setTypedText] = useState('')
  const [showResponse, setShowResponse] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    if (typeof window === 'undefined') return
    if (localStorage.getItem(DEMO_KEY)) return

    // Start demo after 1.2s
    const startTimer = setTimeout(() => {
      setPhase('typing')
      let i = 0
      const typeInterval = setInterval(() => {
        i++
        setTypedText(DEMO_INPUT.slice(0, i))
        if (i >= DEMO_INPUT.length) {
          clearInterval(typeInterval)
          // Show response after 600ms pause
          setTimeout(() => {
            setShowResponse(true)
            setPhase('response')
            // Fade after 8 seconds of response visible
            setTimeout(() => {
              setPhase('fading')
              setTimeout(() => {
                setPhase('hidden')
                localStorage.setItem(DEMO_KEY, '1')
              }, 600)
            }, 8000)
          }, 600)
        }
      }, 38)
    }, 1200)

    return () => clearTimeout(startTimer)
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2,4,10,0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
      onClick={() => {
        setPhase('fading')
        setTimeout(() => {
          setPhase('hidden')
          localStorage.setItem(DEMO_KEY, '1')
        }, 600)
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '520px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          animation: 'demoSlideIn 0.5s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Demo label */}
        <div style={{
          fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(74,127,165,0.5)', textAlign: 'center', marginBottom: '4px',
        }}>
          Here's how it works
        </div>

        {/* Fake input */}
        <div style={{
          background: 'rgba(6,12,24,0.95)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '14px', padding: '16px 18px',
          minHeight: '80px', fontSize: '15px', color: '#e8f4ff',
          lineHeight: '1.6', position: 'relative',
        }}>
          {typedText || <span style={{color:'rgba(74,127,165,0.5)'}}>Describe anything — a symptom, how you feel, what you took…</span>}
          {phase === 'typing' && (
            <span style={{
              display: 'inline-block', width: '2px', height: '16px',
              background: '#d4af37', marginLeft: '1px', verticalAlign: 'middle',
              animation: 'blink 0.7s step-end infinite',
            }} />
          )}
        </div>

        {/* AI Response */}
        {showResponse && (
          <div style={{
            background: 'rgba(6,12,24,0.95)',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: '14px', padding: '20px 22px',
            animation: 'demoFadeIn 0.4s ease',
          }}>
            <div style={{fontSize:'13px',color:'rgba(212,175,55,0.6)',letterSpacing:'0.06em',marginBottom:'10px'}}>
              AI ANALYSIS
            </div>
            <div style={{fontSize:'16px',fontWeight:700,color:'#e8f4ff',marginBottom:'14px'}}>
              {DEMO_RESPONSE.summary}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'14px'}}>
              {DEMO_RESPONSE.patterns.map(p => (
                <div key={p.label} style={{display:'flex',gap:'8px',fontSize:'13px'}}>
                  <span style={{color:'rgba(74,127,165,0.6)',minWidth:'90px'}}>{p.label}</span>
                  <span style={{color:'rgba(180,200,225,0.8)'}}>{p.value}</span>
                </div>
              ))}
            </div>
            <div style={{
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: 'rgba(212,175,55,0.8)', lineHeight: '1.5',
              marginBottom: '10px',
            }}>
              ⚑ {DEMO_RESPONSE.flag}
            </div>
            <div style={{fontSize:'12px',color:'rgba(74,127,165,0.5)',lineHeight:'1.5'}}>
              {DEMO_RESPONSE.note}
            </div>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={() => {
            setPhase('fading')
            setTimeout(() => { setPhase('hidden'); localStorage.setItem(DEMO_KEY,'1'); }, 600)
          }}
          style={{
            alignSelf: 'center', marginTop: '4px',
            background: 'none', border: '1px solid rgba(74,127,165,0.25)',
            borderRadius: '100px', padding: '8px 24px',
            color: 'rgba(74,127,165,0.5)', fontSize: '12px',
            fontFamily: 'inherit', cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color='rgba(74,127,165,0.9)'; (e.target as HTMLElement).style.borderColor='rgba(74,127,165,0.5)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color='rgba(74,127,165,0.5)'; (e.target as HTMLElement).style.borderColor='rgba(74,127,165,0.25)'; }}
        >
          Got it — let me try
        </button>
      </div>

      <style>{`
        @keyframes demoSlideIn {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes demoFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
      `}</style>
    </div>
  )
}
