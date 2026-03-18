import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch, Plus, Trash2, Zap, Settings, ChevronRight, CheckCircle, Play, Bell, X, ArrowDown, Edit2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowApi } from '../../services/api'
import { Button, Input, Textarea, Select, Toggle, Alert, Modal } from '../../components/common'

/* ─── constants ─── */
const STEP_TYPES = [
  { value:'task',         label:'Task',         icon:'⚙', desc:'Work to be done',       color:'#6366F1', bg:'rgba(99,102,241,0.1)',  border:'rgba(99,102,241,0.25)'  },
  { value:'approval',     label:'Approval',     icon:'✓', desc:'Human decision needed', color:'#F59E0B', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)'  },
  { value:'notification', label:'Notification', icon:'🔔', desc:'Alert or message',      color:'#22C55E', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.25)'   },
]
const FIELD_TYPES = [
  { value:'string', label:'Text' }, { value:'number', label:'Number' },
  { value:'boolean', label:'Boolean' }, { value:'email', label:'Email' }, { value:'date', label:'Date' },
]

/* ─── Step node component (visual card on canvas) ─── */
function StepNode({ step, index, total, onEdit, onDelete, onMoveUp, onMoveDown }) {
  const meta = STEP_TYPES.find(t => t.value === step.stepType) || STEP_TYPES[0]
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* Connector arrow from above */}
      {index > 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:0 }}>
          <div style={{ width:2, height:20, background:'var(--grey-200)' }} />
          <div style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'8px solid var(--grey-200)' }} />
        </div>
      )}

      {/* The node card */}
      <div style={{
        width:300, background:'#fff',
        border:`2px solid ${meta.border}`,
        borderRadius:16,
        boxShadow:`0 4px 20px ${meta.bg}, 0 2px 8px rgba(26,23,18,0.06)`,
        overflow:'hidden',
        transition:'transform 0.15s, box-shadow 0.15s',
        position:'relative',
      }}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px ${meta.bg}, 0 4px 12px rgba(26,23,18,0.1)`}}
        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 20px ${meta.bg}, 0 2px 8px rgba(26,23,18,0.06)`}}>

        {/* Color bar top */}
        <div style={{ height:4, background:`linear-gradient(90deg, ${meta.color}, ${meta.color}88)` }} />

        <div style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
            {/* Step type icon */}
            <div style={{ width:36, height:36, borderRadius:10, background:meta.bg, border:`1.5px solid ${meta.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
              {meta.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:10, fontWeight:800, color:meta.color, textTransform:'uppercase', letterSpacing:0.8, padding:'1px 7px', borderRadius:20, background:meta.bg, border:`1px solid ${meta.border}` }}>
                  {meta.label}
                </span>
                <span style={{ fontSize:10, color:'var(--grey-300)', fontWeight:600 }}>Step {index + 1}</span>
              </div>
              <p style={{ fontSize:14, fontWeight:800, color:'var(--grey-900)', marginTop:4, lineHeight:1.2 }}>{step.name}</p>
            </div>
          </div>

          {step.assigneeEmail && (
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 8px', background:'var(--grey-50)', borderRadius:8, marginBottom:6 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:meta.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff', flexShrink:0 }}>
                {step.assigneeEmail.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize:11, color:'var(--grey-500)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.assigneeEmail}</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:6 }}>
            <button onClick={() => onMoveUp(index)} disabled={index===0} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--grey-100)', background:'transparent', cursor:index===0?'not-allowed':'pointer', color:index===0?'var(--grey-200)':'var(--grey-500)', fontSize:11, fontFamily:'inherit', transition:'all 0.1s' }}
              onMouseEnter={e=>{if(index>0)e.currentTarget.style.background='var(--grey-50)'}}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>▲</button>
            <button onClick={() => onMoveDown(index)} disabled={index===total-1} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--grey-100)', background:'transparent', cursor:index===total-1?'not-allowed':'pointer', color:index===total-1?'var(--grey-200)':'var(--grey-500)', fontSize:11, fontFamily:'inherit', transition:'all 0.1s' }}
              onMouseEnter={e=>{if(index<total-1)e.currentTarget.style.background='var(--grey-50)'}}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>▼</button>
            <button onClick={() => onEdit(index)} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${meta.border}`, background:meta.bg, cursor:'pointer', color:meta.color, fontSize:11, fontWeight:700, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, transition:'all 0.1s' }}>
              <Edit2 size={10}/> Edit
            </button>
            <button onClick={() => onDelete(index)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.06)', cursor:'pointer', color:'#EF4444', fontSize:11, fontWeight:700, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, transition:'all 0.1s' }}>
              <Trash2 size={10}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── "Add step" picker ─── */
function StepTypePicker({ onSelect, onCancel }) {
  return (
    <div style={{ width:300 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:4 }}>
        <div style={{ width:2, height:20, background:'var(--grey-200)' }} />
        <div style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'8px solid var(--grey-200)' }} />
      </div>
      <div style={{ background:'#fff', border:'2px dashed var(--grey-200)', borderRadius:16, padding:16, boxShadow:'0 4px 16px rgba(26,23,18,0.06)' }}>
        <p style={{ fontSize:12, fontWeight:800, color:'var(--grey-400)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, textAlign:'center' }}>Choose step type</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {STEP_TYPES.map(t => (
            <button key={t.value} onClick={() => onSelect(t.value)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              border:`1.5px solid ${t.border}`, borderRadius:12, background:t.bg,
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', textAlign:'left',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(3px)';e.currentTarget.style.boxShadow=`0 4px 12px ${t.bg}`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.boxShadow='none'}}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:t.color, lineHeight:1.2 }}>{t.label}</p>
                <p style={{ fontSize:11, color:'var(--grey-400)', marginTop:1 }}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={{ width:'100%', marginTop:10, padding:'7px', border:'1px solid var(--grey-100)', borderRadius:8, background:'transparent', cursor:'pointer', color:'var(--grey-400)', fontSize:12, fontFamily:'inherit' }}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── Start node ─── */
function StartNode() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ width:120, padding:'10px 16px', background:'linear-gradient(135deg,#FFD600,#FFAB00)', borderRadius:30, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 4px 16px rgba(255,214,0,0.45)', fontWeight:800, fontSize:13, color:'var(--grey-900)' }}>
        <Play size={14} fill="var(--grey-900)" strokeWidth={0}/> Start
      </div>
      <div style={{ width:2, height:20, background:'var(--grey-200)' }} />
      <div style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'8px solid var(--grey-200)' }} />
    </div>
  )
}

/* ─── End node ─── */
function EndNode() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ width:2, height:20, background:'var(--grey-200)' }} />
      <div style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'8px solid var(--grey-200)', marginBottom:0 }} />
      <div style={{ width:120, padding:'10px 16px', background:'#fff', border:'2px solid var(--grey-200)', borderRadius:30, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontWeight:800, fontSize:13, color:'var(--grey-400)' }}>
        <CheckCircle size={14} color="var(--grey-300)"/> End
      </div>
    </div>
  )
}

const emptyStepForm = (type='task') => ({ name:'', stepType:type, assigneeEmail:'' })

export default function WorkflowCreate() {
  const navigate = useNavigate()

  /* workflow meta */
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [isActive, setIsActive] = useState(true)
  const [nameErr, setNameErr]   = useState('')

  /* input schema fields */
  const [fields, setFields]     = useState([])

  /* visual steps */
  const [steps, setSteps]       = useState([])
  const [showPicker, setShowPicker] = useState(false)

  /* step edit modal */
  const [editIdx, setEditIdx]   = useState(null)
  const [editForm, setEditForm] = useState(emptyStepForm())
  const [editErr, setEditErr]   = useState({})

  /* submit */
  const [loading, setLoading]   = useState(false)

  /* ── step logic ── */
  const openPicker = () => setShowPicker(true)

  const selectType = (type) => {
    setShowPicker(false)
    setEditIdx(-1)  // -1 = new step
    setEditForm(emptyStepForm(type))
    setEditErr({})
  }

  const saveStep = () => {
    const e = {}
    if (!editForm.name.trim()) e.name = 'Step name is required'
    if (editForm.assigneeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.assigneeEmail)) e.assigneeEmail = 'Invalid email'
    setEditErr(e)
    if (Object.keys(e).length) return

    if (editIdx === -1) {
      // new step
      setSteps(s => [...s, { ...editForm, stepOrder: s.length + 1, _id: Date.now() }])
    } else {
      // edit existing
      setSteps(s => s.map((x, i) => i === editIdx ? { ...x, ...editForm } : x))
    }
    setEditIdx(null)
  }

  const deleteStep = (i) => setSteps(s => s.filter((_,j) => j !== i).map((x,j) => ({...x, stepOrder:j+1})))

  const moveUp = (i) => {
    if (i === 0) return
    setSteps(s => { const a=[...s]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a.map((x,j)=>({...x,stepOrder:j+1})) })
  }
  const moveDown = (i) => {
    if (i === steps.length - 1) return
    setSteps(s => { const a=[...s]; [a[i],a[i+1]]=[a[i+1],a[i]]; return a.map((x,j)=>({...x,stepOrder:j+1})) })
  }

  const openEdit = (i) => {
    setEditIdx(i)
    setEditForm({ name:steps[i].name, stepType:steps[i].stepType, assigneeEmail:steps[i].assigneeEmail||'' })
    setEditErr({})
  }

  /* ── field logic ── */
  const addField    = () => setFields(f => [...f, { name:'', type:'string', required:false }])
  const updField    = (i,k,v) => setFields(f => { const n=[...f]; n[i]={...n[i],[k]:v}; return n })
  const removeField = (i) => setFields(f => f.filter((_,j) => j !== i))

  /* ── submit ── */
  const handleCreate = async () => {
    if (!name.trim()) { setNameErr('Workflow name is required'); return }
    setNameErr('')
    setLoading(true)
    try {
      const inputSchema = {
        fields,
        required: fields.filter(f=>f.required).map(f=>f.name),
        optional: fields.filter(f=>!f.required).map(f=>f.name),
      }
      const r = await workflowApi.create({ name, description:desc, isActive, inputSchema })
      const wfId = r.data.data.id
      for (const step of steps) {
        await workflowApi.addStep(wfId, {
          name: step.name, stepType: step.stepType,
          stepOrder: step.stepOrder,
          assigneeEmail: step.assigneeEmail || null,
          metadata: {},
        })
      }
      toast.success(`"${name}" created with ${steps.length} step${steps.length!==1?'s':''}!`)
      navigate(`/workflows/${wfId}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const metaForType = (type) => STEP_TYPES.find(t=>t.value===type) || STEP_TYPES[0]

  return (
    <div className="fade-up" style={{ maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:-0.4, color:'var(--grey-900)' }}>New Workflow</h1>
          <p style={{ fontSize:13, color:'var(--grey-400)', marginTop:2 }}>Design visually — drag, connect and configure steps below</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/workflows')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', border:'1.5px solid var(--grey-200)', borderRadius:10, background:'#fff', color:'var(--grey-600,#736D65)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <ArrowLeft size={14}/> Back
          </button>
          <button onClick={handleCreate} disabled={loading} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 20px', border:'none', borderRadius:10, background: loading?'rgba(255,214,0,0.6)':'linear-gradient(135deg,#FFD600,#FFAB00)', color:'var(--grey-900)', fontSize:13, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(255,214,0,0.4)', transition:'all 0.2s' }}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(255,214,0,0.5)'}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 16px rgba(255,214,0,0.4)'}}>
            {loading ? <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(26,23,18,0.3)',borderTopColor:'var(--grey-900)',animation:'spin 0.7s linear infinite'}}/> : <GitBranch size={14}/>}
            Create workflow
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start' }}>

        {/* ── LEFT PANEL: settings ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:84 }}>

          {/* Basic info card */}
          <div style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(26,23,18,0.05)' }}>
            <div style={{ padding:'12px 16px', background:'rgba(255,214,0,0.06)', borderBottom:'1.5px solid rgba(255,214,0,0.15)', display:'flex', alignItems:'center', gap:7 }}>
              <Settings size={13} color="#A07800"/>
              <span style={{ fontSize:12, fontWeight:800, color:'#A07800', textTransform:'uppercase', letterSpacing:0.6 }}>Workflow settings</span>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:800, color:'var(--grey-500)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:5 }}>
                  Name <span style={{ color:'#EF4444' }}>*</span>
                </label>
                <input
                  placeholder="e.g. Employee Onboarding"
                  value={name}
                  onChange={e=>{setName(e.target.value);if(nameErr)setNameErr('')}}
                  style={{ width:'100%', padding:'9px 11px', border:`1.5px solid ${nameErr?'#EF4444':'var(--grey-200)'}`, borderRadius:8, fontFamily:'Outfit,sans-serif', fontSize:13, outline:'none', color:'var(--grey-900)', background:'#fff', transition:'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e=>e.target.style.borderColor='#FFD600'}
                  onBlur={e=>e.target.style.borderColor=nameErr?'#EF4444':'var(--grey-200)'}
                />
                {nameErr && <p style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>⚠ {nameErr}</p>}
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:800, color:'var(--grey-500)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:5 }}>Description</label>
                <textarea
                  placeholder="What does this workflow automate?"
                  value={desc}
                  onChange={e=>setDesc(e.target.value)}
                  rows={3}
                  style={{ width:'100%', padding:'9px 11px', border:'1.5px solid var(--grey-200)', borderRadius:8, fontFamily:'Outfit,sans-serif', fontSize:12, outline:'none', color:'var(--grey-900)', resize:'vertical', background:'#fff', transition:'border-color 0.15s' }}
                  onFocus={e=>e.target.style.borderColor='#FFD600'}
                  onBlur={e=>e.target.style.borderColor='var(--grey-200)'}
                />
              </div>
              <Toggle checked={isActive} onChange={e=>setIsActive(e.target.checked)} label={isActive?'Active':'Inactive'}/>
            </div>
          </div>

          {/* Input schema card */}
          <div style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(26,23,18,0.05)' }}>
            <div style={{ padding:'12px 16px', background:'rgba(99,102,241,0.04)', borderBottom:'1.5px solid rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:14 }}>⚡</span>
                <span style={{ fontSize:12, fontWeight:800, color:'#6366F1', textTransform:'uppercase', letterSpacing:0.6 }}>Input fields</span>
              </div>
              <button onClick={addField} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', border:'1px solid rgba(99,102,241,0.25)', borderRadius:6, background:'rgba(99,102,241,0.08)', color:'#6366F1', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                <Plus size={10}/> Add
              </button>
            </div>
            <div style={{ padding:'10px 12px' }}>
              {fields.length === 0 ? (
                <p style={{ fontSize:11, color:'var(--grey-300)', textAlign:'center', padding:'10px 0', lineHeight:1.5 }}>No input fields.<br/>Users run with empty data.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {fields.map((f,i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6, alignItems:'start', padding:'8px 10px', background:'var(--grey-50)', borderRadius:8, border:'1px solid var(--grey-100)' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <input placeholder="field_name" value={f.name} onChange={e=>updField(i,'name',e.target.value)} style={{ padding:'5px 8px', border:'1px solid var(--grey-200)', borderRadius:6, fontSize:11, fontFamily:'Outfit,sans-serif', outline:'none', background:'#fff', color:'var(--grey-900)' }} onFocus={e=>e.target.style.borderColor='#FFD600'} onBlur={e=>e.target.style.borderColor='var(--grey-200)'}/>
                        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                          <select value={f.type} onChange={e=>updField(i,'type',e.target.value)} style={{ flex:1, padding:'4px 6px', border:'1px solid var(--grey-200)', borderRadius:6, fontSize:10, fontFamily:'Outfit,sans-serif', outline:'none', background:'#fff', color:'var(--grey-700)' }}>
                            {FIELD_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <label style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--grey-400)', cursor:'pointer', whiteSpace:'nowrap' }}>
                            <input type="checkbox" checked={f.required} onChange={e=>updField(i,'required',e.target.checked)} style={{ width:11, height:11, accentColor:'#FFD600' }}/> Req.
                          </label>
                        </div>
                      </div>
                      <button onClick={()=>removeField(i)} style={{ padding:'4px 6px', border:'none', borderRadius:6, background:'rgba(239,68,68,0.08)', color:'#EF4444', cursor:'pointer', marginTop:1 }}>
                        <Trash2 size={10}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding:'12px 14px', background:'rgba(255,214,0,0.06)', border:'1.5px solid rgba(255,214,0,0.2)', borderRadius:12 }}>
            <p style={{ fontSize:11, fontWeight:800, color:'#A07800', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Summary</p>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {[
                ['Workflow', name || '(untitled)'],
                ['Steps', `${steps.length} step${steps.length!==1?'s':''}`],
                ['Input fields', `${fields.length} field${fields.length!==1?'s':''}`],
                ['Status', isActive ? 'Active' : 'Inactive'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                  <span style={{ color:'var(--grey-400)' }}>{k}</span>
                  <span style={{ fontWeight:700, color:'var(--grey-700)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: visual canvas ── */}
        <div>
          <div style={{ background:'var(--grey-50)', border:'1.5px solid var(--grey-100)', borderRadius:20, minHeight:400, padding:'32px 20px', position:'relative', overflow:'hidden' }}>
            {/* Grid bg */}
            <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, var(--grey-200) 1px, transparent 1px)', backgroundSize:'24px 24px', opacity:0.6, pointerEvents:'none' }}/>

            <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>

              {/* Canvas label */}
              <div style={{ position:'absolute', top:-14, left:16, background:'var(--grey-50)', padding:'0 8px', fontSize:10, fontWeight:800, color:'var(--grey-300)', textTransform:'uppercase', letterSpacing:1 }}>
                Workflow canvas
              </div>

              {/* Start */}
              <StartNode />

              {/* Step nodes */}
              {steps.map((step, i) => (
                <StepNode
                  key={step._id}
                  step={step}
                  index={i}
                  total={steps.length}
                  onEdit={openEdit}
                  onDelete={deleteStep}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}

              {/* Add step picker or button */}
              {showPicker ? (
                <StepTypePicker onSelect={selectType} onCancel={() => setShowPicker(false)} />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginTop: steps.length > 0 ? 0 : 0 }}>
                  {steps.length > 0 && (
                    <>
                      <div style={{ width:2, height:20, background:'var(--grey-200)' }} />
                      <div style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'8px solid var(--grey-200)', marginBottom:6 }} />
                    </>
                  )}
                  <button onClick={openPicker} style={{
                    display:'flex', alignItems:'center', gap:7,
                    padding:'11px 22px',
                    border:'2px dashed rgba(255,214,0,0.5)',
                    borderRadius:30, background:'rgba(255,214,0,0.06)',
                    color:'#A07800', fontSize:13, fontWeight:800,
                    cursor:'pointer', fontFamily:'inherit',
                    transition:'all 0.15s',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,214,0,0.12)';e.currentTarget.style.borderColor='rgba(255,214,0,0.8)';e.currentTarget.style.transform='scale(1.02)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,214,0,0.06)';e.currentTarget.style.borderColor='rgba(255,214,0,0.5)';e.currentTarget.style.transform='scale(1)'}}>
                    <Plus size={15}/> {steps.length === 0 ? 'Add first step' : 'Add next step'}
                  </button>
                </div>
              )}

              {/* End node */}
              {steps.length > 0 && !showPicker && <EndNode />}

              {/* Empty canvas hint */}
              {steps.length === 0 && !showPicker && (
                <p style={{ fontSize:12, color:'var(--grey-300)', marginTop:16, textAlign:'center', lineHeight:1.6 }}>
                  Click "Add first step" to start<br/>building your workflow visually
                </p>
              )}
            </div>
          </div>

          {/* Step type legend */}
          <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap' }}>
            {STEP_TYPES.map(t => (
              <div key={t.value} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:t.bg, border:`1px solid ${t.border}` }}>
                <span style={{ fontSize:12 }}>{t.icon}</span>
                <span style={{ fontSize:11, fontWeight:700, color:t.color }}>{t.label}</span>
                <span style={{ fontSize:10, color:'var(--grey-400)' }}>— {t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step edit modal ── */}
      <Modal
        open={editIdx !== null}
        onClose={() => setEditIdx(null)}
        title={editIdx === -1 ? 'Configure new step' : `Edit step — ${steps[editIdx]?.name || ''}`}
        subtitle="Define what this step does and who handles it"
        width={440}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Type selector (only for new step) */}
          {editIdx === -1 && (
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--grey-700)', display:'block', marginBottom:8 }}>Step type</label>
              <div style={{ display:'flex', gap:8 }}>
                {STEP_TYPES.map(t => (
                  <button key={t.value} onClick={() => setEditForm(f=>({...f,stepType:t.value}))} style={{
                    flex:1, padding:'8px 6px', border:`2px solid ${editForm.stepType===t.value?t.color:t.border}`,
                    borderRadius:10, background: editForm.stepType===t.value ? t.bg : 'transparent',
                    cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                  }}>
                    <span style={{ fontSize:18 }}>{t.icon}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:t.color }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step name */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--grey-700)', display:'block', marginBottom:5 }}>
              Step name <span style={{ color:'#EF4444' }}>*</span>
            </label>
            <input
              placeholder="e.g. Manager Approval"
              value={editForm.name}
              onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}
              style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${editErr.name?'#EF4444':'var(--grey-200)'}`, borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:13, outline:'none', color:'var(--grey-900)', background:'#fff', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor='#FFD600'}
              onBlur={e=>e.target.style.borderColor=editErr.name?'#EF4444':'var(--grey-200)'}
            />
            {editErr.name && <p style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>⚠ {editErr.name}</p>}
          </div>

          {/* Assignee */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--grey-700)', display:'block', marginBottom:5 }}>
              Assignee email <span style={{ fontSize:11, fontWeight:500, color:'var(--grey-400)' }}>(optional)</span>
            </label>
            <input
              type="email"
              placeholder="manager@company.com"
              value={editForm.assigneeEmail}
              onChange={e=>setEditForm(f=>({...f,assigneeEmail:e.target.value}))}
              style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${editErr.assigneeEmail?'#EF4444':'var(--grey-200)'}`, borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:13, outline:'none', color:'var(--grey-900)', background:'#fff', transition:'border-color 0.15s', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor='#FFD600'}
              onBlur={e=>e.target.style.borderColor=editErr.assigneeEmail?'#EF4444':'var(--grey-200)'}
            />
            {editErr.assigneeEmail && <p style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>⚠ {editErr.assigneeEmail}</p>}
            <p style={{ fontSize:11, color:'var(--grey-400)', marginTop:4 }}>The person responsible for completing this step</p>
          </div>

          {/* Preview */}
          {editForm.name && (
            <div style={{ padding:'10px 12px', borderRadius:10, background: metaForType(editForm.stepType).bg, border:`1.5px solid ${metaForType(editForm.stepType).border}` }}>
              <p style={{ fontSize:11, fontWeight:700, color:metaForType(editForm.stepType).color, marginBottom:2 }}>Preview</p>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--grey-900)' }}>{editForm.name}</p>
              {editForm.assigneeEmail && <p style={{ fontSize:11, color:'var(--grey-500)', marginTop:2 }}>→ {editForm.assigneeEmail}</p>}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button onClick={saveStep} style={{ flex:1, padding:'11px', border:'none', borderRadius:10, background:'linear-gradient(135deg,#FFD600,#FFAB00)', color:'var(--grey-900)', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 4px 14px rgba(255,214,0,0.35)' }}>
              <Save size={14}/> {editIdx === -1 ? 'Add to canvas' : 'Save changes'}
            </button>
            <button onClick={()=>setEditIdx(null)} style={{ padding:'11px 18px', border:'1.5px solid var(--grey-200)', borderRadius:10, background:'#fff', color:'var(--grey-600,#736D65)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
