import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, XCircle, RefreshCw, Terminal, GitBranch, CheckCircle, XOctagon } from 'lucide-react'
import toast from 'react-hot-toast'
import { executionApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Badge, Button, PageHeader, Spinner, Modal, Textarea, Alert } from '../../components/common'
import { format, formatDistanceToNow } from 'date-fns'

const LOG_COLORS = { info:'var(--text-2)', success:'var(--green-dark)', warn:'var(--yellow-dark)', error:'var(--red-dark)' }
const LOG_BG = { info:'transparent', success:'rgba(16,185,129,0.05)', warn:'rgba(245,158,11,0.05)', error:'rgba(239,68,68,0.05)' }

export default function ExecutionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exec, setExec]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [approveModal, setApproveModal] = useState(null) // 'approved' | 'rejected'
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

  const logs     = exec.logs     || []
  const approvals = exec.approvals || []
  const statusStyle = {
    completed:   { bg:'var(--green-light)',  border:'rgba(16,185,129,0.2)',  color:'var(--green-dark)',  label:'Completed'   },
    failed:      { bg:'var(--red-light)',    border:'rgba(239,68,68,0.2)',   color:'var(--red-dark)',    label:'Failed'      },
    in_progress: { bg:'var(--blue-light)',   border:'rgba(59,130,246,0.2)',  color:'var(--blue-dark)',   label:'In progress' },
    pending:     { bg:'var(--yellow-light)', border:'rgba(245,158,11,0.2)',  color:'var(--yellow-dark)', label:'Pending'     },
    canceled:    { bg:'var(--bg-elevated)',  border:'var(--border)',         color:'var(--text-3)',       label:'Canceled'    },
  }[exec.status] || {}

  const isApprovalStep = exec.status === 'in_progress'
  const canApprove = isApprovalStep

  return (
    <div className="fade-up">
      <PageHeader
        title="Execution detail"
        subtitle={`ID: ${exec.id?.slice(0,18)}…`}
        breadcrumb={<><span style={{cursor:'pointer',color:'var(--accent)'}} onClick={()=>navigate('/executions')}>Executions</span> / Detail</>}
        actions={
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={13}/>} onClick={() => navigate('/executions')}>Back</Button>
            <Button variant="secondary" size="sm" icon={<RefreshCw size={13}/>} onClick={load}>Refresh</Button>
            {canApprove && (
              <>
                <Button size="sm" variant="success" icon={<CheckCircle size={13}/>} onClick={() => setApproveModal('approved')}>Approve</Button>
                <Button size="sm" danger icon={<XOctagon size={13}/>} onClick={() => setApproveModal('rejected')}>Reject</Button>
              </>
            )}
            {exec.status === 'failed' && <Button size="sm" icon={<RotateCcw size={13}/>} loading={actioning} onClick={() => doAction(executionApi.retry, 'retried')}>Retry</Button>}
            {(exec.status==='in_progress'||exec.status==='pending') && <Button danger size="sm" icon={<XCircle size={13}/>} loading={actioning} onClick={() => doAction(executionApi.cancel, 'canceled')}>Cancel</Button>}
          </div>
        }
      />

      {/* Status banner */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:statusStyle.bg, border:`1px solid ${statusStyle.border}`, borderRadius:'var(--r-lg)', marginBottom:20 }}>
        <Badge status={exec.status} size="lg"/>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:statusStyle.color }}>{statusStyle.label}</p>
          <p style={{ fontSize:12, color:'var(--text-2)', marginTop:1 }}>Workflow: <strong>{exec.workflowName}</strong> v{exec.workflowVersion}</p>
        </div>
        {(exec.status==='in_progress'||exec.status==='pending') && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--blue-dark)' }}>
            <Spinner size={14} color="var(--blue)"/> Auto-refreshing…
          </div>
        )}
      </div>

      {/* Meta grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        {[
          ['Triggered by', exec.triggeredByName || exec.triggeredBy || '—'],
          ['Retries', exec.retries ?? 0],
          ['Started', exec.startedAt ? format(new Date(exec.startedAt),'MMM d, HH:mm:ss') : '—'],
          ['Ended', exec.endedAt ? format(new Date(exec.endedAt),'MMM d, HH:mm:ss') : <span style={{color:'var(--blue-dark)'}}>Running</span>],
        ].map(([k,v]) => (
          <Card key={k} padding={14}>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:0.6, marginBottom:5 }}>{k}</p>
            <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Input data */}
        <Card>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <GitBranch size={14} color="var(--accent)"/> Input data
          </p>
          <pre style={{ fontSize:11, color:'var(--text-2)', background:'var(--bg-elevated)', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', overflow:'auto', maxHeight:150, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7 }}>
            {exec.input_data ? JSON.stringify(exec.input_data, null, 2) : '{}'}
          </pre>
        </Card>

        {/* Approval history */}
        <Card>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <CheckCircle size={14} color="var(--green)"/> Approval history
          </p>
          {approvals.length === 0 ? (
            <p style={{ fontSize:12, color:'var(--text-4)', fontStyle:'italic' }}>No approval actions yet</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {approvals.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 10px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                  <Badge status={a.action} size="xs"/>
                  <div>
                    <p style={{ fontSize:12, fontWeight:600 }}>{a.actedByName}</p>
                    {a.comment && <p style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>"{a.comment}"</p>}
                    <p style={{ fontSize:10, color:'var(--text-4)', marginTop:2 }}>{a.createdAt ? formatDistanceToNow(new Date(a.createdAt),{addSuffix:true}) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Execution logs */}
      <Card>
        <p style={{ fontSize:13, fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
          <Terminal size={14} color="var(--accent)"/> Execution logs
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-4)', fontWeight:400 }}>{logs.length} entr{logs.length!==1?'ies':'y'}</span>
        </p>
        <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--r-md)', border:'1px solid var(--border)', padding:'10px 12px', maxHeight:320, overflow:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
          {logs.length === 0
            ? <p style={{ color:'var(--text-4)', fontStyle:'italic', fontFamily:'inherit' }}>No logs yet</p>
            : logs.map((log, i) => (
              <div key={log.id || i} style={{ display:'flex', gap:12, padding:'3px 6px', borderRadius:4, background:LOG_BG[log.logLevel]||'transparent', marginBottom:2 }}>
                <span style={{ color:'var(--text-5)', userSelect:'none', flexShrink:0, minWidth:24, textAlign:'right' }}>{i+1}</span>
                <span style={{ color:'var(--text-4)', flexShrink:0, fontSize:10 }}>
                  {log.createdAt ? format(new Date(log.createdAt),'HH:mm:ss') : ''}
                </span>
                <span style={{ color: LOG_COLORS[log.logLevel]||'var(--text-2)', flex:1 }}>{log.message}</span>
              </div>
            ))
          }
        </div>
      </Card>

      {/* Approve/Reject modal */}
      <Modal open={!!approveModal} onClose={() => { setApproveModal(null); setComment('') }}
        title={approveModal === 'approved' ? 'Approve this step' : 'Reject this step'}
        subtitle="Your action will be recorded in the execution log" width={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Alert type={approveModal==='approved'?'success':'error'}
            message={approveModal==='approved' ? 'Approving will advance the execution to the next step.' : 'Rejecting will mark the execution as failed.'}/>
          <Textarea label="Comment (optional)" placeholder="Add a note about your decision…" value={comment} onChange={e=>setComment(e.target.value)} style={{minHeight:80}}/>
          <div style={{ display:'flex', gap:10 }}>
            <Button loading={approveLoading}
              variant={approveModal==='approved'?'success':'danger'}
              icon={approveModal==='approved'?<CheckCircle size={13}/>:<XOctagon size={13}/>}
              onClick={handleApprove}>
              {approveModal==='approved' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
            <Button variant="secondary" onClick={() => { setApproveModal(null); setComment('') }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
