import React from 'react'
import { useNavigate } from 'react-router-dom'

const stats = [
  { v: '500+', l: 'Startups Incubated' },
  { v: '₹52 Cr+', l: 'Funding Facilitated' },
  { v: '200+', l: 'Expert Mentors' },
  { v: '85%', l: 'Graduation Success Rate' },
]
const features = [
  { icon: '🚀', title: 'Startup Incubation', desc: 'End-to-end incubation from idea to scale with structured cohort programs and milestone tracking.' },
  { icon: '🔬', title: 'Technology Transfer', desc: 'Connect university technologies with industry through our TRL-tracked marketplace and licensing engine.' },
  { icon: '🎯', title: 'Open Innovation', desc: 'Industry problem statement exchange connecting enterprises with startup and research solutions.' },
  { icon: '👥', title: 'Expert Mentorship', desc: '200+ domain experts offering 1:1 guidance, feedback, and strategic support through structured sessions.' },
  { icon: '💰', title: 'Funding Access', desc: 'Government grants, angel investors, and VC connections with application tracking and deal flow management.' },
  { icon: '📊', title: 'Analytics & Assessment', desc: 'AI-powered startup scoring on 6 parameters with institutional-grade reporting and evaluation workflows.' },
]
const programs = [
  { name: 'Pre-Incubation Bootcamp', type: 'Pre-Incubation', dur: '3 months', size: '20 startups', status: 'Open' },
  { name: 'MVP Accelerator', type: 'Incubation', dur: '6 months', size: '15 startups', status: 'Rolling' },
  { name: 'Growth Catalyst', type: 'Acceleration', dur: '9 months', size: '10 startups', status: 'Selective' },
  { name: 'Innovation Fellowship', type: 'Fellowship', dur: '6 months', size: '12 fellows', status: 'Open' },
]

export default function Home() {
  const navigate = useNavigate()
  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      {/* Header */}
      <header className="pub-header">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 24 }}>🏛️</span>
          <span style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: '#fff', fontSize: 16 }}>VIC Platform</span>
        </div>
        <nav className="pub-nav">
          {['Programs','Technologies','Mentors','Events','About'].map(l => (
            <span key={l} className="pub-nav-link">{l}</span>
          ))}
        </nav>
        <div className="flex gap-2">
          <button className="btn btn-ghost" style={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)' }} onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-gold" onClick={() => navigate('/register')}>Apply Now</button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero" style={{ padding: '100px 80px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(184,134,11,.2)', color: '#FFF3A3', padding: '4px 14px', borderRadius: 3, fontSize: 12, fontWeight: 700, letterSpacing: '.5px', marginBottom: 20 }}>
            INDIA'S COMPREHENSIVE VIRTUAL INCUBATION CENTER
          </div>
          <h1 style={{ fontSize: 48, marginBottom: 20, lineHeight: 1.15 }}>Transforming Ideas Into<br />Market-Ready Ventures</h1>
          <p style={{ fontSize: 18, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px', opacity: .85 }}>
            A complete ecosystem for startups, researchers, mentors, and investors — with technology transfer, open innovation, and institutional-grade program management.
          </p>
          <div className="flex gap-3" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-gold btn-lg" onClick={() => navigate('/register')}>Register Your Startup</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.4)', padding: '11px 22px', fontSize: 15 }} onClick={() => navigate('/login')}>Sign In to Platform</button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#fff', padding: '40px 80px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center', gap: 32 }}>
          {stats.map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: "'Merriweather',serif", fontSize: 36, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{s.v}</div>
              <div style={{ color: 'var(--text-3)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 80px', maxWidth: 1260, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>A Complete Innovation Ecosystem</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 15, maxWidth: 560, margin: '0 auto' }}>Every module you need — from startup registration to technology commercialization, research collaboration, and investor connectivity.</p>
        </div>
        <div className="grid-3" style={{ gap: 20 }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ borderTop: '3px solid var(--navy)' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-3)', lineHeight: 1.6, fontSize: 13 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section style={{ background: 'var(--navy-light)', padding: '64px 80px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 32, textAlign: 'center' }}>Active Programs & Cohorts</h2>
          <div className="grid-4" style={{ gap: 16 }}>
            {programs.map(p => (
              <div key={p.name} className="card" style={{ borderLeft: '4px solid var(--navy)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="badge badge-navy">{p.type}</span>
                  <span className="badge badge-green">{p.status}</span>
                </div>
                <h3 style={{ marginBottom: 8, fontSize: 14 }}>{p.name}</h3>
                <div className="text-muted text-small">{p.dur} · {p.size}</div>
                <button className="btn btn-primary btn-sm w-full mt-3" onClick={() => navigate('/register')}>Apply Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--navy)', color: '#fff', padding: '72px 80px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 32, marginBottom: 16 }}>Ready to Begin Your Journey?</h2>
        <p style={{ color: 'rgba(255,255,255,.75)', marginBottom: 32, fontSize: 16 }}>Join 500+ startups, researchers, mentors, and investors already on the platform.</p>
        <button className="btn btn-gold btn-lg" onClick={() => navigate('/register')}>Get Started — It's Free</button>
      </section>

      <footer style={{ background: 'var(--navy-dark)', color: 'rgba(255,255,255,.6)', padding: '28px 80px', textAlign: 'center', fontSize: 13 }}>
        <p>© 2026 VIC Platform — Virtual Incubation Center | Powered by Anthropic Claude AI</p>
      </footer>
    </div>
  )
}
