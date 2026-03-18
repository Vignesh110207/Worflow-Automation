import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Search, GitBranch, Eye, RotateCcw, XCircle, CheckCircle, Activity, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowApi, executionApi } from '../../services/api'
import {
  Card, Badge, Button, Input, Select, PageHeader, DataTable,
  Pagination, EmptyState, IconBtn, Modal, StatCard, Spinner, Alert
} from '../../components/common'
import { formatDistanceToNow } from 'date-fns'

/* ── Dynamic field renderer for execute form ── */
function DynamicField({ field, value, onChange }) {
  if (field.type === 'boolean') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        <label style={{ fontSize:12, fontWeight:600, color:'var(--text-2)' }}>
          {field.name}{field.required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
          <span style={{ fontSize:10, color:'var(--text-4)', fontWeight:400, marginLeft:6 }}>(boolean)</span>
        </label>
        <select value={String(value ?? false)} onChange={e => onChange(e.target.value === 'true')}
          style={{ padding:'9px 12px', width:'100%', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', fontFamily:'Inter, sans-serif', fontSize:13, background:'var(--bg-surface)', outline:'none', cursor:'pointer' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}>
          <option value="false">False</option>
          <option value="true">True</option>
        </select>
      </div>
    )
  }
  return (
    <Input
      label={`${field.name}${field.required ? ' *' : ''}`}
      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
      placeholder={`Enter ${field.type}…`}
      required={field.required}
      value={value ?? ''}
      hint={field.type}
      onChange={e => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  )
}

/* ── User: Workflow list (browse + execute) ── */
export function UserWorkflowList() {
  const navigate = useNavigate()
  const [data, setData]       = useState({ content:[], totalElements:0, totalPages:0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)
  const [execTarget, setExecTarget]   = useState(null)
  const [execInputs, setExecInputs]   = useState({})
  const [execLoading, setExecLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    workflowApi.list(page, 10, search)
      .then(r => setData(r.data.data || { content:[], totalElements:0, totalPages:0 }))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const startExecution = async () => {
    // Validate required fields
    const fields = execTarget?.inputSchema?.fields || []
    const missing = fields.filter(f => f.required && (execInputs[f.name] === undefined || execInputs[f.name] === ''))
    if (missing.length) {
      toast.error(`Missing required fields: ${missing.map(f => f.name).join(', ')}`)
      return
    }
    setExecLoading(true)
    try {
      const r = await workflowApi.execute(execTarget.id, { inputData: execInputs })
      toast.success('Execution started!')
      setExecTarget(null)
      setExecInputs({})
      navigate(`/executions/${r.data.data.id}`)
    } catch (e) { toast.error(e.message) }
    finally { setExecLoading(false) }
  }

  const openExec = (row) => {
    setExecTarget(row)
    setExecInputs({})
  }

  const columns = [
    {
      key: 'name', label: 'Workflow',
      render: (v, row) => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)', flexShrink:0 }}>
            <GitBranch size={14}/>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{v}</p>
            {row.description && (
              <p style={{ fontSize:11, color:'var(--text-4)', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    { key:'stepCount', label:'Steps', width:70, render: v => <span style={{ fontWeight:600, color:'var(--text-2)' }}>{v ?? 0}</span> },
    {
      key: 'version', label: 'Ver', width:70,
      render: v => <code style={{ fontSize:11, background:'var(--bg-elevated)', padding:'2px 7px', borderRadius:6, border:'1px solid var(--border)', color:'var(--text-2)', fontFamily:"'JetBrains Mono',monospace" }}>v{v}</code>,
    },
    {
      key: '_actions', label: 'Action', width:110,
      render: (_, row) => (
        <Button size="sm" icon={<Play size={12}/>}
          onClick={e => { e.stopPropagation(); openExec(row) }}>
          Execute
        </Button>
      ),
    },
  ]

  const fields = execTarget?.inputSchema?.fields || []

  return (
    <div className="fade-up">
      <PageHeader
        title="My Workflows"
        subtitle="Browse active workflows and start executions"
        actions={
          <Button icon={<Plus size={13}/>} onClick={() => navigate('/user/workflows/new')}>
            Create workflow
          </Button>
        }
      />

      <div style={{ marginBottom:14 }}>
        <Input placeholder="Search workflows…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          icon={<Search size={14}/>}
          containerStyle={{ maxWidth:300 }} />
      </div>

      <DataTable
        columns={columns}
        data={data.content.filter(w => w.isActive)}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<GitBranch size={36} color="var(--text-5)"/>}
            title="No workflows yet"
            description="Create your first workflow or wait for an admin to activate one."
            action={<Button icon={<Plus size={13}/>} onClick={() => navigate('/user/workflows/new')}>Create workflow</Button>}
          />
        }
      />
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPageChange={setPage} />

      {/* Execute modal — dynamic form built from input schema */}
      <Modal
        open={!!execTarget}
        onClose={() => { setExecTarget(null); setExecInputs({}) }}
        title={`Execute — ${execTarget?.name}`}
        subtitle={fields.length ? `Fill in ${fields.length} input field${fields.length !== 1 ? 's' : ''} below` : 'No input required'}
        width={520}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {fields.length === 0 ? (
            <Alert type="info" message="This workflow requires no input data. Click execute to start immediately." />
          ) : (
            <>
              {fields.map(f => (
                <DynamicField
                  key={f.name}
                  field={f}
                  value={execInputs[f.name]}
                  onChange={val => setExecInputs(p => ({ ...p, [f.name]: val }))}
                />
              ))}

              {/* Live preview */}
              <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:'10px 12px', border:'1px solid var(--border)' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:0.6, marginBottom:5 }}>Input preview</p>
                <code style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:'var(--text-2)', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                  {JSON.stringify(execInputs, null, 2)}
                </code>
              </div>
            </>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <Button loading={execLoading} icon={<Play size={13}/>} onClick={startExecution}>Start execution</Button>
            <Button variant="secondary" onClick={() => { setExecTarget(null); setExecInputs({}) }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ── User: My executions ── */
export function UserExecutionList() {
  const navigate  = useNavigate()
  const [data, setData]           = useState({ content:[], totalElements:0, totalPages:0 })
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(0)
  const [statusFilter, setStatus] = useState('')
  const [actioning, setActioning] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    executionApi.list(page, 10, statusFilter ? { status: statusFilter } : {})
      .then(r => setData(r.data.data || { content:[], totalElements:0, totalPages:0 }))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const doAction = async (id, action, label) => {
    setActioning(a => ({ ...a, [id]: true }))
    try {
      await action(id)
      toast.success(`Execution ${label}`)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setActioning(a => ({ ...a, [id]: false })) }
  }

  const all = data.content
  const statCounts = {
    completed:   all.filter(e => e.status === 'completed').length,
    in_progress: all.filter(e => e.status === 'in_progress').length,
    failed:      all.filter(e => e.status === 'failed').length,
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="My executions"
        subtitle="All workflow runs you have triggered"
        actions={
          <Button variant="secondary" size="sm" onClick={load}>↻ Refresh</Button>
        }
      />

      {/* Mini stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard label="Completed"  value={statCounts.completed}   icon={<CheckCircle size={16}/>} color="var(--green)"  bg="var(--green-light)" />
        <StatCard label="Running"    value={statCounts.in_progress} icon={<Activity size={16}/>}    color="var(--blue)"   bg="var(--blue-light)"  />
        <StatCard label="Failed"     value={statCounts.failed}      icon={<XCircle size={16}/>}     color="var(--red)"    bg="var(--red-light)"   />
      </div>

      {/* Filter */}
      <div style={{ marginBottom:14 }}>
        <Select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(0) }}
          containerStyle={{ maxWidth:200 }}
          options={[
            { value:'',            label:'All statuses'  },
            { value:'pending',     label:'Pending'       },
            { value:'in_progress', label:'In progress'   },
            { value:'completed',   label:'Completed'     },
            { value:'failed',      label:'Failed'        },
            { value:'canceled',    label:'Canceled'      },
          ]}
        />
      </div>

      <Card padding={0} style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:520 }}>
            <thead>
              <tr style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)' }}>
                {['Workflow','Version','Status','Started','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length:5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                    {Array.from({ length:5 }).map((_, j) => (
                      <td key={j} style={{ padding:'13px 16px' }}>
                        <div className="skeleton" style={{ height:13, width:'75%' }} />
                      </td>
                    ))}
                  </tr>
                ))
                : data.content.length === 0
                  ? (
                    <tr><td colSpan={5}>
                      <EmptyState
                        icon={<Play size={32} color="var(--text-5)"/>}
                        title="No executions yet"
                        description="Go to Workflows and execute one to see it here"
                        action={<Button size="sm" icon={<Play size={13}/>} onClick={() => navigate('/user/workflows')}>Browse workflows</Button>}
                      />
                    </td></tr>
                  )
                  : data.content.map(ex => (
                    <tr key={ex.id}
                      style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => navigate(`/executions/${ex.id}`)}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:30, height:30, borderRadius:8, flexShrink:0,
                            background: ex.status==='completed' ? 'var(--green-light)' : ex.status==='failed' ? 'var(--red-light)' : ex.status==='in_progress' ? 'var(--blue-light)' : 'var(--yellow-light)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color: ex.status==='completed' ? 'var(--green-dark)' : ex.status==='failed' ? 'var(--red-dark)' : ex.status==='in_progress' ? 'var(--blue-dark)' : 'var(--yellow-dark)',
                          }}>
                            <Play size={11}/>
                          </div>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{ex.workflowName || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <code style={{ fontSize:11, background:'var(--bg-elevated)', padding:'2px 6px', borderRadius:4, border:'1px solid var(--border)', color:'var(--text-2)', fontFamily:"'JetBrains Mono',monospace" }}>v{ex.workflowVersion}</code>
                      </td>
                      <td style={{ padding:'12px 16px' }}><Badge status={ex.status}/></td>
                      <td style={{ padding:'12px 16px', fontSize:11, color:'var(--text-4)', whiteSpace:'nowrap' }}>
                        {ex.startedAt ? formatDistanceToNow(new Date(ex.startedAt), { addSuffix:true }) : '—'}
                      </td>
                      <td style={{ padding:'12px 16px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:4 }}>
                          <IconBtn title="View logs" variant="accent" size={28} icon={<Eye size={12}/>}
                            onClick={() => navigate(`/executions/${ex.id}`)} />
                          {ex.status === 'failed' && (
                            <IconBtn title="Retry" variant="success" size={28} icon={<RotateCcw size={12}/>}
                              disabled={actioning[ex.id]}
                              onClick={() => doAction(ex.id, executionApi.retry, 'retried')} />
                          )}
                          {(ex.status === 'in_progress' || ex.status === 'pending') && (
                            <IconBtn title="Cancel" variant="danger" size={28} icon={<XCircle size={12}/>}
                              disabled={actioning[ex.id]}
                              onClick={() => doAction(ex.id, executionApi.cancel, 'canceled')} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPageChange={setPage} />
    </div>
  )
}


/* ── UserCreateWorkflow is no longer needed here — App.jsx uses WorkflowCreate directly ── */
