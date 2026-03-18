import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, XCircle, RefreshCw, Terminal, GitBranch, CheckCircle, XOctagon, Clock, User, Activity, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { executionApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Badge, Button, PageHeader, Spinner, Modal, Textarea, Alert } from '../../components/common'
import { format, formatDistanceToNow } from 'date-fns'

const LOG_META = {
  info:    { color:'#0369A1', bg:'rgba(56,189,248,0.06)',   label:'INFO'    },
  success: { color:'#15803D', bg:'rgba(34,197,94,0.06)',    label:'SUCCESS' },
  warn:    { color:'#854D0E', bg:'rgba(245,158,11,0.06)',   label:'WARN'    },
  error:   { color:'#991B1B', bg:'rgba(239,68,68,0.06)',    label:'ERROR'   },
}

const STATUS_META = {
  completed:   { color:'#15803D', bg:'#DCFCE7', border:'#BBF7D0', icon:'✓', label:'Completed'    },
  failed:      { color:'#991B1B', bg:'#FEE2E2', border:'#FECACA', icon:'✗', label:'Failed'       },
  in_progress: { color:'#0369A1', bg:'#E0F2FE', border:'#BAE6FD', icon:'⟳', label:'In progress' },
  pending:     { color:'#854D0E', bg:'#FEF9C3', border:'#FEF08A', icon:'…', label:'Pending'      },
  canceled:    { color:'#736D65', bg:'#F5F5F3', border:'#E5E5E3', icon:'—', label:'Canceled'     },
}

export default function ExecutionDetail() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exec, setExec]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [approveModal, setApproveModal] = useState(null)
  const [comment, setComment] = useState('')
  const [approveLoading, setApproveLoading] = useState(false)

  const load = useCallback(() => {
    executionApi.get(id)
      .then(r => setExec(r.data.data))
      .catch(e => { toast.error(e.message); navigate('/executions') })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!exec) return
    if (exec.status === 'in_progress' || exec.status === 'pending') {
      const t = setInterval(load, 5000)
      return () => clearInterval(t)
    }
  }, [exec, load])

  const doAction = async (action, label) => {
    setActioning(true)
    try { await action(id); toast.success(`Execution ${label}`); load() }
    catch (e) { toast.error(e.message) }
    finally { setActioning(false) }
  }

  const handleApprove = async () => {
    setApproveLoading(true)
    try {
      await executionApi.approve(id, { action: approveModal, comment })
      toast.success(`Step ${approveModal}!`)
      setApproveModal(null); setComment('')
      load()
    } catch (e) { toast.error(e.message) }
    finally { setApproveLoading(false) }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Spinner size={36}/></div>
  if (!exec) return null

  const logs      = exec.logs      || []
  const approvals = exec.approvals || []
  const sm = STATUS_META[exec.status] || STATUS_META.pending
  const canApprove = exec.status === 'in_progress'
  const roleColor = { admin:'#EF4444', developer:'#6366F1', user:'#22C55E' }

  return (
    <div className="fade-up">
      <PageHeader
        title="Execution Detail"
        subtitle={`Run ID: ${exec.id?.slice(0,14)}…`}
        breadcrumb={
          <><span style={{ cursor:'pointer', color:'var(--sun-deep,#F5C000)', fontWeight:600 }} onClick={() => navigate('/executions')}>Executions</span> / Detail</>
        }
        actions={
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={13}/>} onClick={() => navigate('/executions')}>Back</Button>
            <Button variant="secondary" size="sm" icon={<RefreshCw size={13}/>} onClick={load}>Refresh</Button>
            {canApprove && (<>
              <Button size="sm" variant="success" icon={<CheckCircle size={13}/>} onClick={() => setApproveModal('approved')}>Approve</Button>
              <Button size="sm" danger icon={<XOctagon size={13}/>} onClick={() => setApproveModal('rejected')}>Reject</Button>
            </>)}
            {exec.status === 'failed' && (
              <Button size="sm" icon={<RotateCcw size={13}/>} loading={actioning} onClick={() => doAction(executionApi.retry, 'retried')}>Retry</Button>
            )}
            {(exec.status==='in_progress'||exec.status==='pending') && (
              <Button danger size="sm" icon={<XCircle size={13}/>} loading={actioning} onClick={() => doAction(executionApi.cancel, 'canceled')}>Cancel</Button>
            )}
          </div>
        }
      />

      {/* ── Status banner ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:sm.bg, border:`1.5px solid ${sm.border}`, borderRadius:16, marginBottom:20, boxShadow:'0 2px 12px rgba(26,23,18,0.05)' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.7)', border:`1.5px solid ${sm.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:sm.color, flexShrink:0 }}>
          {sm.icon}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:16, fontWeight:900, color:sm.color, lineHeight:1.2 }}>{sm.label}</p>
          <p style={{ fontSize:12, color:'var(--grey-500)', marginTop:3 }}>
            <strong style={{ color:'var(--grey-800,var(--grey-900))' }}>{exec.workflowName}</strong>
            {' '}version v{exec.workflowVersion}
          </p>
        </div>
        {(exec.status==='in_progress'||exec.status==='pending') && (
          <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#0369A1', background:'rgba(56,189,248,0.08)', padding:'6px 12px', borderRadius:20, border:'1px solid #BAE6FD' }}>
            <Spinner size={12} color="#38BDF8"/> Auto-refreshing every 5s
          </div>
        )}
      </div>

      {/* ── Meta cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:'Triggered by', value: exec.triggeredByName || '—', icon:<User size={13}/> },
          { label:'Retries',      value: exec.retries ?? 0,            icon:<RotateCcw size={13}/> },
          { label:'Started',      value: exec.startedAt ? format(new Date(exec.startedAt),'MMM d, HH:mm:ss') : '—', icon:<Clock size={13}/> },
          { label:'Ended',        value: exec.endedAt ? format(new Date(exec.endedAt),'MMM d, HH:mm:ss') : 'Running…', icon:<CheckCircle size={13}/> },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:14, padding:'14px 16px', boxShadow:'0 2px 8px rgba(26,23,18,0.04)', transition:'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(26,23,18,0.09)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 8px rgba(26,23,18,0.04)'}}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6, color:'var(--grey-400)' }}>
              {icon}
              <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:0.7 }}>{label}</p>
            </div>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--grey-900)', lineHeight:1.3 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Input data + Approval history ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Input data */}
        <div style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 8px rgba(26,23,18,0.04)' }}>
          <p style={{ fontSize:13, fontWeight:800, marginBottom:12, display:'flex', alignItems:'center', gap:7, color:'var(--grey-900)' }}>
            <span style={{ width:26, height:26, borderRadius:7, background:'rgba(255,214,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GitBranch size={13} color="#A07800"/>
            </span>
            Input data
          </p>
          <pre style={{ fontSize:11, color:'var(--grey-700)', background:'var(--grey-50)', padding:'10px 12px', borderRadius:10, border:'1.5px solid var(--grey-100)', overflow:'auto', maxHeight:160, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7, margin:0 }}>
            {exec.input_data ? JSON.stringify(exec.input_data, null, 2) : '{}'}
          </pre>
        </div>

        {/* Approval history */}
        <div style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 8px rgba(26,23,18,0.04)' }}>
          <p style={{ fontSize:13, fontWeight:800, marginBottom:12, display:'flex', alignItems:'center', gap:7, color:'var(--grey-900)' }}>
            <span style={{ width:26, height:26, borderRadius:7, background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CheckCircle size={13} color="#15803D"/>
            </span>
            Approval history
          </p>
          {approvals.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--grey-300)' }}>
              <CheckCircle size={24} style={{ marginBottom:6, opacity:0.3 }}/>
              <p style={{ fontSize:12 }}>No approval actions yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {approvals.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'var(--grey-50)', borderRadius:10, border:'1.5px solid var(--grey-100)' }}>
                  <Badge status={a.action} size="xs"/>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:'var(--grey-900)' }}>{a.actedByName}</p>
                    {a.comment && <p style={{ fontSize:11, color:'var(--grey-500)', marginTop:2 }}>"{a.comment}"</p>}
                    <p style={{ fontSize:10, color:'var(--grey-400)', marginTop:2 }}>{a.createdAt ? formatDistanceToNow(new Date(a.createdAt),{addSuffix:true}) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Execution logs ── */}
      <div style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(26,23,18,0.04)' }}>
        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1.5px solid var(--grey-100)', display:'flex', alignItems:'center', gap:10, background:'var(--grey-50)' }}>
          <span style={{ width:28, height:28, borderRadius:8, background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Terminal size={14} color="#6366F1"/>
          </span>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:'var(--grey-900)' }}>Execution logs</p>
            <p style={{ fontSize:11, color:'var(--grey-400)' }}>{logs.length} log entr{logs.length!==1?'ies':'y'}</p>
          </div>
          {/* Level legend */}
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            {Object.entries(LOG_META).map(([k,v]) => (
              <span key={k} style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:10, background:v.bg, color:v.color, border:`1px solid ${v.color}22`, letterSpacing:0.5 }}>{v.label}</span>
            ))}
          </div>
        </div>

        {/* Log rows */}
        <div style={{ background:'#FAFAF9', fontFamily:"'JetBrains Mono',monospace", fontSize:11, maxHeight:360, overflow:'auto' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'36px', color:'var(--grey-300)' }}>
              <Terminal size={28} style={{ marginBottom:8, opacity:0.3 }}/>
              <p>No logs yet</p>
            </div>
          ) : (
            logs.map((log, i) => {
              const m = LOG_META[log.logLevel] || LOG_META.info
              return (
                <div key={log.id||i} style={{ display:'flex', gap:10, padding:'6px 16px', background:m.bg, borderBottom:'1px solid rgba(26,23,18,0.04)', alignItems:'baseline' }}
                  onMouseEnter={e=>e.currentTarget.style.filter='brightness(0.97)'}
                  onMouseLeave={e=>e.currentTarget.style.filter='none'}>
                  <span style={{ color:'var(--grey-300)', userSelect:'none', flexShrink:0, minWidth:28, textAlign:'right', fontSize:10 }}>{i+1}</span>
                  <span style={{ color:'var(--grey-400)', flexShrink:0, fontSize:10, minWidth:60 }}>
                    {log.createdAt ? format(new Date(log.createdAt),'HH:mm:ss') : ''}
                  </span>
                  <span style={{ fontSize:9, fontWeight:800, padding:'1px 6px', borderRadius:8, background:`${m.color}18`, color:m.color, flexShrink:0, letterSpacing:0.4, alignSelf:'center', fontFamily:'Outfit,sans-serif' }}>
                    {m.label}
                  </span>
                  <span style={{ color: m.color === '#0369A1' ? 'var(--grey-700)' : m.color, flex:1, lineHeight:1.6 }}>
                    {log.message}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Approve/Reject modal ── */}
      <Modal
        open={!!approveModal}
        onClose={() => { setApproveModal(null); setComment('') }}
        title={approveModal === 'approved' ? '✓ Approve this step' : '✗ Reject this step'}
        subtitle="Your decision is recorded permanently in the execution log"
        width={440}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Alert
            type={approveModal==='approved' ? 'success' : 'error'}
            message={approveModal==='approved'
              ? 'Approving will advance the execution to the next step.'
              : 'Rejecting will stop the execution and mark it as failed.'}
          />
          <Textarea
            label="Comment (optional)"
            placeholder="Add a note about your decision…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ minHeight:80 }}
          />
          <div style={{ display:'flex', gap:10 }}>
            <Button
              loading={approveLoading}
              variant={approveModal==='approved' ? 'success' : 'danger'}
              icon={approveModal==='approved' ? <CheckCircle size={13}/> : <XOctagon size={13}/>}
              onClick={handleApprove}
            >
              {approveModal==='approved' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
            <Button variant="secondary" onClick={() => { setApproveModal(null); setComment('') }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
