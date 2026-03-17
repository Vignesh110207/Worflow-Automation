import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Input, Button, Alert } from '../../components/common'
import toast from 'react-hot-toast'

const DEMO_USERS = [
  { label:'Admin',     email:'admin@flowforge.com', password:'admin123', color:'#EF4444' },
  { label:'Developer', email:'dev@flowforge.com',   password:'dev123',   color:'#6366F1' },
  { label:'User',      email:'user@flowforge.com',  password:'user123',  color:'#22C55E' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]       = useState({ email:'', password:'' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [serverErr, setServerErr] = useState('')

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true); setServerErr('')
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) { setServerErr(err.message) }
    finally { setLoading(false) }
  }

  const fillDemo = (u) => { setForm({ email:u.email, password:u.password }); setErrors({}); setServerErr('') }

  return (
    <div className="auth-scene">
      {/* Anti-gravity floating orbs */}
      <div className="dot-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />
      <div className="orb orb-6" />

      {/* Content */}
      <div className="fade-up" style={{ position:'relative', zIndex:10, width:'100%', maxWidth:440, padding:'0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:64, height:64, borderRadius:20, margin:'0 auto 14px',
            background:'linear-gradient(135deg, #FFD600 0%, #FFAB00 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 32px rgba(255,214,0,0.5)',
            animation:'sunPop 0.7s cubic-bezier(0.22,1,0.36,1) both, floatA 7s ease-in-out 0.7s infinite',
          }}>
            <Zap size={30} color="#fff" strokeWidth={2.5} fill="#fff"/>
          </div>
          <h1 style={{ fontFamily:"'Outfit', sans-serif", fontSize:34, fontWeight:900, letterSpacing:-1, color:'var(--grey-900)', lineHeight:1.1 }}>
            FlowForge
          </h1>
          <p style={{ fontSize:13, color:'var(--grey-400)', marginTop:4, fontWeight:500 }}>Workflow automation platform</p>
        </div>

        {/* Card */}
        <div style={{
          background:'#fff',
          borderRadius:24,
          padding:'32px 30px 28px',
          boxShadow:'0 20px 60px rgba(26,23,18,0.1), 0 4px 16px rgba(26,23,18,0.06)',
          border:'1.5px solid rgba(26,23,18,0.05)',
        }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--grey-900)', marginBottom:4 }}>Sign in</h2>
          <p style={{ fontSize:13, color:'var(--grey-400)', marginBottom:24 }}>Welcome back! Enter your credentials below.</p>

          {serverErr && <div style={{ marginBottom:18 }}><Alert type="error" message={serverErr} onClose={() => setServerErr('')}/></div>}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Input label="Email address" type="email" placeholder="you@company.com"
                value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                error={errors.email} icon={<Mail size={15}/>} required />
              <div style={{ position:'relative' }}>
                <Input label="Password" type={showPw?'text':'password'} placeholder="••••••••"
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  error={errors.password} icon={<Lock size={15}/>} required />
                <button type="button" onClick={() => setShowPw(v=>!v)} style={{
                  position:'absolute', right:12, top:30, background:'none', border:'none',
                  color:'var(--grey-400)', cursor:'pointer', padding:4, display:'flex', alignItems:'center',
                }}>{showPw ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width:'100%', marginTop:22, padding:'13px',
              background: loading ? 'rgba(255,214,0,0.6)' : 'linear-gradient(135deg, #FFD600 0%, #FFAB00 100%)',
              border:'none', borderRadius:12, color:'var(--grey-900)',
              fontSize:14, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow: loading ? 'none' : '0 6px 24px rgba(255,214,0,0.5)',
              transition:'all 0.2s', fontFamily:'inherit',
            }}
              onMouseEnter={e=>{ if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(255,214,0,0.6)'}}}
              onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 6px 24px rgba(255,214,0,0.5)'}}>
              {loading ? <span style={{ width:16,height:16,borderRadius:'50%',border:'2.5px solid rgba(26,23,18,0.3)',borderTopColor:'var(--grey-900)',animation:'spin 0.7s linear infinite' }}/> : <>Sign in <ArrowRight size={15}/></>}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--grey-400)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--grey-900)', fontWeight:700, textDecoration:'none' }}>Create one →</Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div style={{ 
          // marginTop:14, padding:'16px 18px', background:'rgba(255,255,255,0.8)', backdropFilter:'blur(8px)', borderRadius:16, border:'1.5px solid rgba(26,23,18,0.06)', boxShadow:'0 4px 16px rgba(26,23,18,0.06)' 
          }}>
          
        </div>
      </div>
    </div>
  )
}
