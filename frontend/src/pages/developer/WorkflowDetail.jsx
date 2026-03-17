import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Play, ChevronDown, ChevronRight, Save, X, Zap, Code, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowApi, stepApi, ruleApi } from '../../services/api'
import { Card, Badge, Button, Input, Select, Textarea, Modal, ConfirmDialog, PageHeader, Spinner, EmptyState, IconBtn, Alert, Toggle, Tag } from '../../components/common'

const STEP_TYPES = [
  { value:'task',         label:'Task — work to be done'       },
  { value:'approval',     label:'Approval — human decision'    },
  { value:'notification', label:'Notification — alert/message' },
]
const FIELD_TYPES = [
  { value:'string',  label:'Text'    },
  { value:'number',  label:'Number'  },
  { value:'boolean', label:'Boolean' },
  { value:'email',   label:'Email'   },
  { value:'date',    label:'Date'    },
]

function SchemaEditor({ schema, onChange }) {
  const fields = schema?.fields || []
  const add = () => onChange({ ...schema, fields:[...fields,{name:'',type:'string',required:false}] })
  const upd = (i,k,v) => { const f=[...fields]; f[i]={...f[i],[k]:v}; onChange({...schema,fields:f,required:f.filter(x=>x.required).map(x=>x.name)}) }
  const rem = (i) => { const f=fields.filter((_,j)=>j!==i); onChange({...schema,fields:f,required:f.filter(x=>x.required).map(x=>x.name)}) }
  return (
    <div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {fields.map((f,i)=>(
          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 130px auto auto',gap:8,alignItems:'flex-start',padding:'10px 12px',background:'var(--bg-elevated)',borderRadius:'var(--r-md)',border:'1px solid var(--border)'}}>
            <Input placeholder="field_name" value={f.name} onChange={e=>upd(i,'name',e.target.value)} hint="No spaces" inputStyle={{fontSize:12}}/>
            <Select value={f.type} options={FIELD_TYPES} onChange={e=>upd(i,'type',e.target.value)}/>
            <div style={{paddingTop:6}}><Toggle checked={f.required} onChange={e=>upd(i,'required',e.target.checked)} label="Req."/></div>
            <div style={{paddingTop:4}}><IconBtn variant="danger" size={30} icon={<Trash2 size={12}/>} onClick={()=>rem(i)} title="Remove"/></div>
          </div>
        ))}
      </div>
      {!fields.length && <p style={{fontSize:12,color:'var(--text-4)',fontStyle:'italic',padding:'8px 0'}}>No fields — add one to define execution inputs</p>}
      <Button variant="secondary" size="sm" icon={<Plus size={13}/>} style={{marginTop:10}} onClick={add}>Add field</Button>
    </div>
  )
}

function RuleRow({ rule, steps, onDelete }) {
  const next = steps.find(s=>s.id===rule.nextStepId)
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 11px',background:'var(--bg-elevated)',borderRadius:'var(--r-md)',border:'1px solid var(--border)',flexWrap:'wrap'}}>
      <span style={{background:'var(--accent-light)',color:'var(--accent)',padding:'2px 8px',borderRadius:12,fontWeight:700,fontSize:10,flexShrink:0}}>P{rule.priority}</span>
      <code style={{flex:1,color:'var(--text-2)',fontFamily:"'JetBrains Mono',monospace",fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:80}}>{rule.ruleCondition}</code>
      <span style={{color:'var(--text-4)',fontSize:11}}>→</span>
      <span style={{fontSize:11,fontWeight:600,color:rule.nextStepId?'var(--green-dark)':'var(--yellow-dark)',background:rule.nextStepId?'var(--green-light)':'var(--yellow-light)',padding:'2px 8px',borderRadius:10,flexShrink:0}}>
        {next?.name || rule.nextStepName || (rule.nextStepId?'Unknown':'End workflow')}
      </span>
      <IconBtn variant="danger" size={26} icon={<Trash2 size={11}/>} onClick={onDelete} title="Delete rule"/>
    </div>
  )
}

function StepCard({ step, steps, onDelete, onAddRule, onDeleteRule }) {
  const [exp, setExp] = useState(false)
  const ts = {task:{bg:'var(--blue-light)',c:'var(--blue)'},approval:{bg:'var(--purple-light)',c:'var(--purple)'},notification:{bg:'var(--orange-light)',c:'var(--orange)'}}[step.stepType]||{bg:'var(--bg-elevated)',c:'var(--text-3)'}
  return (
    <Card padding={0} style={{overflow:'hidden'}}>
      <div style={{padding:'13px 16px',display:'flex',alignItems:'center',gap:11,cursor:'pointer',flexWrap:'wrap'}} onClick={()=>setExp(v=>!v)}>
        <div style={{width:34,height:34,borderRadius:10,background:ts.bg,display:'flex',alignItems:'center',justifyContent:'center',color:ts.c,flexShrink:0}}><Zap size={14}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:13,fontWeight:700}}>{step.name}</span>
            <Badge status={step.stepType}/>
            {step.assigneeEmail && <span style={{fontSize:10,color:'var(--text-4)',background:'var(--bg-elevated)',padding:'1px 7px',borderRadius:10,border:'1px solid var(--border)'}}>{step.assigneeEmail}</span>}
          </div>
          <p style={{fontSize:11,color:'var(--text-4)',marginTop:1}}>Order {step.stepOrder} · {step.rules?.length??0} rule{step.rules?.length!==1?'s':''}</p>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
          <button onClick={e=>{e.stopPropagation();onAddRule(step)}} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 11px',background:'var(--accent-light)',color:'var(--accent)',border:'none',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}><Plus size={11}/>Rule</button>
          <IconBtn variant="danger" size={28} icon={<Trash2 size={12}/>} onClick={e=>{e.stopPropagation();onDelete(step)}} title="Delete step"/>
          {exp?<ChevronDown size={14} color="var(--text-4)"/>:<ChevronRight size={14} color="var(--text-4)"/>}
        </div>
      </div>
      {exp && (
        <div style={{borderTop:'1px solid var(--border)',padding:'12px 16px',background:'var(--bg)'}}>
          {step.metadata && Object.keys(step.metadata).length>0 && (
            <div style={{marginBottom:12}}>
              <p style={{fontSize:10,fontWeight:700,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:0.6,marginBottom:6}}>Metadata</p>
              <code style={{fontSize:11,color:'var(--text-2)',background:'var(--bg-elevated)',padding:'7px 10px',borderRadius:'var(--r-sm)',display:'block',border:'1px solid var(--border)',fontFamily:"'JetBrains Mono',monospace",wordBreak:'break-all'}}>{JSON.stringify(step.metadata,null,2)}</code>
            </div>
          )}
          <p style={{fontSize:10,fontWeight:700,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:0.6,marginBottom:7}}>Routing rules</p>
          {!step.rules?.length
            ? <Alert type="info" message="No rules yet — click '+ Rule' to add routing logic."/>
            : <div style={{display:'flex',flexDirection:'column',gap:5}}>{step.rules.map(r=><RuleRow key={r.id} rule={r} steps={steps} onDelete={()=>onDeleteRule(r,step)}/>)}</div>
          }
        </div>
      )}
    </Card>
  )
}

export default function WorkflowDetail() {
  const {id}=useParams(); const navigate=useNavigate(); const [sp]=useSearchParams()
  const [wf,setWf]=useState(null); const [loading,setLoading]=useState(true)
  const [editing,setEditing]=useState(false); const [editForm,setEditForm]=useState({})
  const [schemaEdit,setSchemaEdit]=useState(false)
  const [stepModal,setStepModal]=useState(false)
  const [stepForm,setStepForm]=useState({name:'',stepType:'task',stepOrder:1,assigneeEmail:'',metadata:'{}'})
  const [stepErrors,setStepErrors]=useState({}); const [stepLoading,setStepLoading]=useState(false)
  const [ruleModal,setRuleModal]=useState(null)
  const [ruleForm,setRuleForm]=useState({ruleCondition:'',nextStepId:'',priority:1})
  const [ruleErrors,setRuleErrors]=useState({}); const [ruleLoading,setRuleLoading]=useState(false)
  const [execModal,setExecModal]=useState(false); const [execInputs,setExecInputs]=useState({}); const [execLoading,setExecLoading]=useState(false)
  const [delStep,setDelStep]=useState(null); const [delStepL,setDelStepL]=useState(false)
  const [delRule,setDelRule]=useState(null); const [delRuleL,setDelRuleL]=useState(false)

  const load=useCallback(()=>{
    setLoading(true)
    workflowApi.get(id).then(r=>{const d=r.data.data;setWf(d);setEditForm({name:d.name,description:d.description||'',isActive:d.isActive})}).catch(e=>{toast.error(e.message);navigate('/workflows')}).finally(()=>setLoading(false))
  },[id])
  useEffect(()=>{load()},[load])
  useEffect(()=>{if(sp.get('tab')==='execute'&&wf)setExecModal(true)},[sp,wf])

  const saveWf=async()=>{try{await workflowApi.update(id,{name:editForm.name,description:editForm.description,isActive:editForm.isActive,inputSchema:wf.inputSchema});toast.success('Saved');setEditing(false);load()}catch(e){toast.error(e.message)}}
  const saveSchema=async()=>{try{await workflowApi.update(id,{name:wf.name,isActive:wf.isActive,inputSchema:wf.inputSchema});toast.success('Schema saved');load()}catch(e){toast.error(e.message)}}
  const addStep=async()=>{
    const e={}; if(!stepForm.name.trim())e.name='Required'; if(stepForm.assigneeEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stepForm.assigneeEmail))e.assigneeEmail='Invalid email'
    if(stepForm.metadata){try{JSON.parse(stepForm.metadata)}catch{e.metadata='Invalid JSON'}}
    setStepErrors(e); if(Object.keys(e).length)return
    setStepLoading(true)
    try{await workflowApi.addStep(id,{name:stepForm.name,stepType:stepForm.stepType,stepOrder:stepForm.stepOrder,assigneeEmail:stepForm.assigneeEmail||null,metadata:stepForm.metadata?JSON.parse(stepForm.metadata):{}});toast.success('Step added');setStepModal(false);setStepForm({name:'',stepType:'task',stepOrder:1,assigneeEmail:'',metadata:'{}'});load()}catch(e){toast.error(e.message)}finally{setStepLoading(false)}
  }
  const addRule=async()=>{
    const e={}; if(!ruleForm.ruleCondition.trim())e.ruleCondition='Required'; if(!ruleForm.priority||ruleForm.priority<1)e.priority='Must be ≥ 1'
    setRuleErrors(e); if(Object.keys(e).length)return
    setRuleLoading(true)
    try{await stepApi.addRule(ruleModal.id,{ruleCondition:ruleForm.ruleCondition,nextStepId:ruleForm.nextStepId||null,priority:Number(ruleForm.priority)});toast.success('Rule added');setRuleModal(null);setRuleForm({ruleCondition:'',nextStepId:'',priority:1});load()}catch(e){toast.error(e.message)}finally{setRuleLoading(false)}
  }
  const execWf=async()=>{
    setExecLoading(true)
    try{const r=await workflowApi.execute(id,{inputData:execInputs});toast.success('Execution started!');setExecModal(false);navigate(`/executions/${r.data.data.id}`)}catch(e){toast.error(e.message)}finally{setExecLoading(false)}
  }

  if(loading)return<div style={{display:'flex',justifyContent:'center',paddingTop:80}}><Spinner size={36}/></div>
  if(!wf)return null
  const steps=wf.steps||[]; const schema=wf.inputSchema||{fields:[],required:[]}; const fields=schema.fields||[]

  return (
    <div className="fade-up">
      <PageHeader title={wf.name} subtitle={`v${wf.version} · ${steps.length} step${steps.length!==1?'s':''}`}
        breadcrumb={<><span style={{cursor:'pointer',color:'var(--accent)'}} onClick={()=>navigate('/workflows')}>Workflows</span> / {wf.name}</>}
        actions={<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={13}/>} onClick={()=>navigate('/workflows')}>Back</Button>
          <Button variant="secondary" size="sm" icon={editing?<X size={13}/>:<Settings size={13}/>} onClick={()=>setEditing(v=>!v)}>{editing?'Cancel':'Edit'}</Button>
          <Button size="sm" icon={<Play size={13}/>} onClick={()=>setExecModal(true)}>Execute</Button>
        </div>}
      />

      <Card style={{marginBottom:20}}>
        {editing?(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Input label="Name" required value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontSize:12,fontWeight:600,color:'var(--text-2)'}}>Status</label>
                <Toggle checked={editForm.isActive} onChange={e=>setEditForm(f=>({...f,isActive:e.target.checked}))} label={editForm.isActive?'Active':'Inactive'}/>
              </div>
            </div>
            <Textarea label="Description" value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} style={{minHeight:60}}/>
            <div style={{display:'flex',gap:8}}><Button size="sm" icon={<Save size={13}/>} onClick={saveWf}>Save</Button><Button variant="secondary" size="sm" onClick={()=>setEditing(false)}>Cancel</Button></div>
          </div>
        ):(
          <div style={{display:'flex',gap:28,flexWrap:'wrap'}}>
            {[['Status',<Badge status={wf.isActive?'Active':'Inactive'}/>],['Version',<code style={{fontSize:11,background:'var(--bg-elevated)',padding:'2px 8px',borderRadius:6,border:'1px solid var(--border)',fontFamily:"'JetBrains Mono',monospace",color:'var(--text-2)'}}>v{wf.version}</code>],['Steps',steps.length],['Created by',wf.createdByName||'—'],['Updated',wf.updatedAt?new Date(wf.updatedAt).toLocaleDateString():'—']].map(([k,v])=>(
              <div key={k}><p style={{fontSize:10,fontWeight:700,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:0.6,marginBottom:4}}>{k}</p><div style={{fontSize:13}}>{v}</div></div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:schemaEdit?14:0}}>
          <div>
            <h3 style={{fontSize:14,fontWeight:700,display:'flex',alignItems:'center',gap:7}}><Code size={14} color="var(--purple)"/>Input schema</h3>
            <p style={{fontSize:11,color:'var(--text-4)',marginTop:2}}>Fields users must fill when executing</p>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--text-4)'}}>{fields.length} field{fields.length!==1?'s':''}</span>
            <Button variant="secondary" size="sm" onClick={()=>setSchemaEdit(v=>!v)}>{schemaEdit?'Collapse':'Edit schema'}</Button>
            {schemaEdit&&<Button size="sm" icon={<Save size={12}/>} onClick={saveSchema}>Save</Button>}
          </div>
        </div>
        {schemaEdit&&<SchemaEditor schema={wf.inputSchema} onChange={s=>setWf(w=>({...w,inputSchema:s}))}/>}
        {!schemaEdit&&fields.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>{fields.map(f=><Tag key={f.name} label={`${f.name}(${f.type})${f.required?'*':''}`} color={f.required?'purple':'blue'}/>)}</div>}
      </Card>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3 style={{fontSize:15,fontWeight:700,display:'flex',alignItems:'center',gap:7}}><Zap size={15} color="var(--accent)"/>Steps</h3>
        <Button size="sm" icon={<Plus size={13}/>} onClick={()=>setStepModal(true)}>Add step</Button>
      </div>

      {steps.length===0
        ?<Card><EmptyState icon={<Zap size={36} color="var(--text-5)"/>} title="No steps yet" description="Add steps to define workflow stages" action={<Button size="sm" icon={<Plus size={13}/>} onClick={()=>setStepModal(true)}>Add first step</Button>}/></Card>
        :<div style={{display:'flex',flexDirection:'column',gap:8}}>{steps.map(s=><StepCard key={s.id} step={s} steps={steps} onDelete={setDelStep} onAddRule={s=>{setRuleModal(s);setRuleForm({ruleCondition:'',nextStepId:'',priority:1});setRuleErrors({})}} onDeleteRule={(r,s)=>setDelRule({rule:r,step:s})}/>)}</div>
      }

      <Modal open={stepModal} onClose={()=>setStepModal(false)} title="Add step" subtitle="Define a stage in your workflow">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Input label="Step name" required placeholder="e.g. Manager Approval" value={stepForm.name} onChange={e=>setStepForm(f=>({...f,name:e.target.value}))} error={stepErrors.name}/>
          <Select label="Step type" required value={stepForm.stepType} options={STEP_TYPES} onChange={e=>setStepForm(f=>({...f,stepType:e.target.value}))}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Order" type="number" min={1} value={stepForm.stepOrder} onChange={e=>setStepForm(f=>({...f,stepOrder:+e.target.value}))}/>
            <Input label="Assignee email" type="email" placeholder="manager@co.com" value={stepForm.assigneeEmail} onChange={e=>setStepForm(f=>({...f,assigneeEmail:e.target.value}))} error={stepErrors.assigneeEmail}/>
          </div>
          <Textarea label="Metadata (JSON)" placeholder='{"channel":"slack"}' value={stepForm.metadata} onChange={e=>setStepForm(f=>({...f,metadata:e.target.value}))} error={stepErrors.metadata}/>
          <div style={{display:'flex',gap:8}}><Button loading={stepLoading} icon={<Plus size={13}/>} onClick={addStep}>Add step</Button><Button variant="secondary" onClick={()=>setStepModal(false)}>Cancel</Button></div>
        </div>
      </Modal>

      <Modal open={!!ruleModal} onClose={()=>setRuleModal(null)} title={`Add rule — ${ruleModal?.name}`} subtitle="Rules control routing based on conditions">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Alert type="info" message='Examples: amount > 500 | country == "US" | DEFAULT'/>
          <Input label="Condition" required placeholder='amount > 500 && country == "US"' value={ruleForm.ruleCondition} onChange={e=>setRuleForm(f=>({...f,ruleCondition:e.target.value}))} error={ruleErrors.ruleCondition} icon={<Code size={14}/>}/>
          <Select label="Next step (empty = end workflow)" value={ruleForm.nextStepId}
            options={[{value:'',label:'— End workflow —'},...steps.filter(s=>s.id!==ruleModal?.id).map(s=>({value:s.id,label:s.name}))]}
            onChange={e=>setRuleForm(f=>({...f,nextStepId:e.target.value}))}/>
          <Input label="Priority (1 = checked first)" required type="number" min={1} max={100} value={ruleForm.priority} hint="Use 999 for DEFAULT catch-all" onChange={e=>setRuleForm(f=>({...f,priority:+e.target.value}))} error={ruleErrors.priority}/>
          <div style={{display:'flex',gap:8}}><Button loading={ruleLoading} icon={<Code size={13}/>} onClick={addRule}>Add rule</Button><Button variant="secondary" onClick={()=>setRuleModal(null)}>Cancel</Button></div>
        </div>
      </Modal>

      <Modal open={execModal} onClose={()=>setExecModal(false)} title={`Execute — ${wf.name}`} subtitle={`v${wf.version} · ${fields.length} input field${fields.length!==1?'s':''}`} width={540}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {fields.length===0?<Alert type="warning" message="No input schema defined. Execution will start with empty data."/>
            :fields.map(f=>(
              <div key={f.name}>
                {f.type==='boolean'?(
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:12,fontWeight:600,color:'var(--text-2)'}}>{f.name}{f.required&&<span style={{color:'var(--red)',marginLeft:2}}>*</span>} <span style={{fontSize:10,color:'var(--text-4)',fontWeight:400}}>(boolean)</span></label>
                    <select value={String(execInputs[f.name]??false)} onChange={e=>setExecInputs(p=>({...p,[f.name]:e.target.value==='true'}))}
                      style={{padding:'9px 12px',width:'100%',border:'1.5px solid var(--border)',borderRadius:'var(--r-md)',fontFamily:'inherit',fontSize:13,background:'var(--bg-surface)',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'}>
                      <option value="false">False</option><option value="true">True</option>
                    </select>
                  </div>
                ):(
                  <Input label={`${f.name}${f.required?' *':''}`} type={f.type==='number'?'number':f.type==='email'?'email':'text'}
                    placeholder={`Enter ${f.type}…`} required={f.required} hint={f.type}
                    value={execInputs[f.name]??''}
                    onChange={e=>setExecInputs(p=>({...p,[f.name]:f.type==='number'?Number(e.target.value):e.target.value}))}/>
                )}
              </div>
            ))
          }
          <div style={{background:'var(--bg-elevated)',borderRadius:'var(--r-md)',padding:'10px 12px',border:'1px solid var(--border)'}}>
            <p style={{fontSize:10,fontWeight:700,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:0.6,marginBottom:5}}>Input preview</p>
            <code style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:'var(--text-2)',whiteSpace:'pre-wrap'}}>{JSON.stringify(execInputs,null,2)||'{}'}</code>
          </div>
          <div style={{display:'flex',gap:10}}><Button loading={execLoading} icon={<Play size={13}/>} onClick={execWf}>Start execution</Button><Button variant="secondary" onClick={()=>setExecModal(false)}>Cancel</Button></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delStep} onClose={()=>setDelStep(null)} onConfirm={async()=>{setDelStepL(true);try{await stepApi.delete(delStep.id);toast.success('Step deleted');setDelStep(null);load()}catch(e){toast.error(e.message)}finally{setDelStepL(false)}}} loading={delStepL} title="Delete step" message={`Delete "${delStep?.name}"? All rules removed too.`}/>
      <ConfirmDialog open={!!delRule} onClose={()=>setDelRule(null)} onConfirm={async()=>{setDelRuleL(true);try{await ruleApi.delete(delRule.rule.id);toast.success('Rule deleted');setDelRule(null);load()}catch(e){toast.error(e.message)}finally{setDelRuleL(false)}}} loading={delRuleL} title="Delete rule" message={`Delete rule "${delRule?.rule?.ruleCondition}"?`}/>
    </div>
  )
}
