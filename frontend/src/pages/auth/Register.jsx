import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, Info, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Input, Alert } from '../../components/common'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name:'', email:'', password:'' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true); setServerErr('')
    try {
      await register({ ...form, role:'user' })
      toast.success('Account created! Welcome aboard.')
      navigate('/dashboard')
    } catch (err) { setServerErr(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-scene">
      <div className="dot-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />

      <div className="fade-up" style={{ position:'relative', zIndex:10, width:'100%', maxWidth:420, padding:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:18, margin:'0 auto 12px', background:'linear-gradient(135deg, #FFD600 0%, #FFAB00 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(255,214,0,0.5)', animation:'sunPop 0.7s cubic-bezier(0.22,1,0.36,1) both, floatC 9s ease-in-out 0.7s infinite' }}>
            <User size={26} color="#fff" strokeWidth={2.5}/>
          </div>
          <h1 style={{ fontSize:30, fontWeight:900, letterSpacing:-0.8, color:'var(--grey-900)' }}>Create account</h1>
          <p style={{ fontSize:13, color:'var(--grey-400)', marginTop:4 }}>Join FlowForge as a workflow user</p>
        </div>

        <div style={{ background:'#fff', borderRadius:24, padding:'28px 28px 24px', boxShadow:'0 20px 60px rgba(26,23,18,0.1), 0 4px 16px rgba(26,23,18,0.06)', border:'1.5px solid rgba(26,23,18,0.05)' }}>
          {/* Info notice */}
          <div style={{ display:'flex', gap:9, padding:'10px 13px', borderRadius:10, background:'rgba(255,214,0,0.08)', border:'1.5px solid rgba(255,214,0,0.25)', marginBottom:20 }}>
            <Info size={14} color="var(--sun-deep)" style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:'var(--grey-500)', lineHeight:1.5 }}>
              New accounts start as <strong style={{ color:'var(--grey-900)' }}>User</strong> role. An admin can assign you Developer or Admin access.
            </p>
          </div>

          {serverErr && <div style={{ marginBottom:16 }}><Alert type="error" message={serverErr} onClose={()=>setServerErr('')}/></div>}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Input label="Full name" type="text" placeholder="John Doe" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} error={errors.name} icon={<User size={15}/>} required/>
              <Input label="Email address" type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} error={errors.email} icon={<Mail size={15}/>} required/>
              <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} error={errors.password} icon={<Lock size={15}/>} required/>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', marginTop:22, padding:'13px', background: loading?'rgba(255,214,0,0.6)':'linear-gradient(135deg, #FFD600 0%, #FFAB00 100%)', border:'none', borderRadius:12, color:'var(--grey-900)', fontSize:14, fontWeight:800, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:loading?'none':'0 6px 24px rgba(255,214,0,0.5)', transition:'all 0.2s', fontFamily:'inherit' }}
              onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(255,214,0,0.6)'}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 6px 24px rgba(255,214,0,0.5)'}}>
              {loading?<span style={{width:16,height:16,borderRadius:'50%',border:'2.5px solid rgba(26,23,18,0.3)',borderTopColor:'var(--grey-900)',animation:'spin 0.7s linear infinite'}}/>:<>Create account <ArrowRight size={15}/></>}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--grey-400)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--grey-900)', fontWeight:700, textDecoration:'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
