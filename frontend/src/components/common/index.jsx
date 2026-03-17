import React, { useState } from 'react'

/* ── Badge ── */
export function Badge({ status, size = 'sm' }) {
  const map = {
    Active:'green', Inactive:'red', pending:'yellow', in_progress:'blue',
    completed:'green', failed:'red', canceled:'yellow',
    task:'blue', approval:'purple', notification:'orange',
    admin:'red', developer:'indigo', user:'green',
    info:'blue', success:'green', warning:'yellow', error:'red',
    approved:'green', rejected:'red',
  }
  const color = map[status] || 'gray'
  const colors = {
    green:  { bg:'#DCFCE7', text:'#15803D', dot:'#22C55E', border:'#BBF7D0' },
    red:    { bg:'#FEE2E2', text:'#991B1B', dot:'#EF4444', border:'#FECACA' },
    blue:   { bg:'#E0F2FE', text:'#0369A1', dot:'#38BDF8', border:'#BAE6FD' },
    yellow: { bg:'#FEF9C3', text:'#854D0E', dot:'#EAB308', border:'#FEF08A' },
    purple: { bg:'#EDE9FE', text:'#6D28D9', dot:'#A78BFA', border:'#DDD6FE' },
    indigo: { bg:'#E0E7FF', text:'#3730A3', dot:'#6366F1', border:'#C7D2FE' },
    orange: { bg:'#FFEDD5', text:'#9A3412', dot:'#F97316', border:'#FED7AA' },
    gray:   { bg:'#F5F5F3', text:'#736D65', dot:'#9E9890', border:'#E5E5E3' },
  }
  const c = colors[color] || colors.gray
  const p = size === 'xs' ? '1px 7px' : '3px 9px'
  const fs = size === 'xs' ? 10 : 11
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:p, borderRadius:20, background:c.bg, color:c.text,
      fontSize:fs, fontWeight:700, letterSpacing:0.2,
      textTransform:'capitalize', whiteSpace:'nowrap',
      border:`1px solid ${c.border}`,
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0,
        animation: status==='in_progress' ? 'pulse-ring 2s infinite' : 'none' }} />
      {status?.replace(/_/g,' ')}
    </span>
  )
}

/* ── Button ── */
export function Button({ children, variant='primary', size='md', icon, loading, disabled, onClick, type='button', danger, style }) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:7,
    cursor: disabled||loading ? 'not-allowed' : 'pointer',
    border:'none', fontFamily:'Outfit, sans-serif', fontWeight:700,
    transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)', outline:'none',
    borderRadius:'var(--r-md)', opacity: disabled||loading ? 0.5 : 1,
    flexShrink:0,
  }
  const sizes = { xs:{padding:'4px 10px',fontSize:11}, sm:{padding:'6px 13px',fontSize:12}, md:{padding:'8px 16px',fontSize:13}, lg:{padding:'11px 22px',fontSize:14} }
  const variants = {
    primary:   { background:'linear-gradient(135deg, #FFD600 0%, #FFAB00 100%)', color:'var(--grey-900)', boxShadow:'0 4px 16px rgba(255,214,0,0.4)', border:'none' },
    secondary: { background:'#fff', color:'var(--grey-700)', border:'1.5px solid var(--grey-200)', boxShadow:'0 1px 4px rgba(26,23,18,0.07)' },
    ghost:     { background:'transparent', color:'var(--grey-500)', border:'1.5px solid transparent' },
    success:   { background:'#DCFCE7', color:'#15803D', border:'1.5px solid #BBF7D0' },
    danger:    { background:'#FEE2E2', color:'#991B1B', border:'1.5px solid #FECACA' },
    warning:   { background:'#FEF9C3', color:'#854D0E', border:'1.5px solid #FEF08A' },
  }
  const v = danger ? variants.danger : (variants[variant] || variants.primary)
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      style={{ ...base, ...(sizes[size]||sizes.md), ...v, ...style }}
      onMouseEnter={e => { if(!disabled&&!loading){ e.currentTarget.style.opacity='0.85'; e.currentTarget.style.transform='translateY(-1px)' }}}
      onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)' }}>
      {loading ? <span style={{ width:13, height:13, border:'2.5px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
               : icon && <span style={{ display:'flex', alignItems:'center' }}>{icon}</span>}
      {children}
    </button>
  )
}

/* ── IconBtn ── */
export function IconBtn({ icon, onClick, title, variant='default', disabled, loading, size=32 }) {
  const v = {
    default: { bg:'var(--grey-50)',   color:'var(--grey-500)', border:'1.5px solid var(--grey-200)' },
    accent:  { bg:'rgba(255,214,0,0.15)', color:'#A07800',    border:'1.5px solid rgba(255,214,0,0.3)' },
    success: { bg:'#DCFCE7', color:'#15803D', border:'1.5px solid #BBF7D0' },
    danger:  { bg:'#FEE2E2', color:'#991B1B', border:'1.5px solid #FECACA' },
    warning: { bg:'#FEF9C3', color:'#854D0E', border:'1.5px solid #FEF08A' },
    purple:  { bg:'#EDE9FE', color:'#6D28D9', border:'1.5px solid #DDD6FE' },
  }[variant] || {}
  return (
    <button title={title} onClick={onClick} disabled={disabled||loading}
      style={{ width:size, height:size, ...v, borderRadius:'var(--r-sm)', cursor:disabled?'not-allowed':'pointer',
               display:'inline-flex', alignItems:'center', justifyContent:'center',
               opacity:disabled?0.4:1, transition:'all 0.15s', flexShrink:0 }}
      onMouseEnter={e => { if(!disabled){ e.currentTarget.style.opacity='0.75'; e.currentTarget.style.transform='scale(1.06)' }}}
      onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)' }}>
      {loading ? <span style={{ width:12,height:12,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.6s linear infinite' }}/> : icon}
    </button>
  )
}

/* ── Card ── */
export function Card({ children, style, onClick, padding=20, hover=false, gradient }) {
  return (
    <div onClick={onClick} style={{
      background: gradient || '#fff',
      border:'1.5px solid var(--grey-100)', borderRadius:'var(--r-lg)',
      padding, boxShadow:'0 2px 12px rgba(26,23,18,0.06)',
      transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
      cursor: onClick||hover ? 'pointer' : 'default', ...style,
    }}
      onMouseEnter={e => { if(onClick||hover){ e.currentTarget.style.boxShadow='0 8px 32px rgba(26,23,18,0.12)'; e.currentTarget.style.borderColor='var(--grey-200)'; e.currentTarget.style.transform='translateY(-2px)' }}}
      onMouseLeave={e => { if(onClick||hover){ e.currentTarget.style.boxShadow='0 2px 12px rgba(26,23,18,0.06)'; e.currentTarget.style.borderColor='var(--grey-100)'; e.currentTarget.style.transform='translateY(0)' }}}
    >{children}</div>
  )
}

/* ── Input ── */
export function Input({ label, error, icon, hint, containerStyle, inputStyle, required, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...containerStyle }}>
      {label && <label style={{ fontSize:12, fontWeight:700, color:'var(--grey-700)', letterSpacing:0.1, display:'flex', alignItems:'center', gap:4 }}>
        {label}{required && <span style={{ color:'var(--coral)', marginLeft:2 }}>*</span>}
      </label>}
      <div style={{ position:'relative' }}>
        {icon && <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color: focused ? 'var(--sun-deep)' : 'var(--grey-300)', display:'flex', transition:'color 0.15s', zIndex:1 }}>{icon}</span>}
        <input {...props} required={required}
          onFocus={e => { setFocused(true); props.onFocus?.(e) }}
          onBlur={e => { setFocused(false); props.onBlur?.(e) }}
          style={{
            width:'100%', padding: icon ? '10px 12px 10px 36px' : '10px 12px',
            background:'#fff', border:`1.5px solid ${error ? '#EF4444' : focused ? '#FFD600' : 'var(--grey-200)'}`,
            borderRadius:'var(--r-md)', color:'var(--grey-900)',
            fontFamily:'Outfit, sans-serif', fontSize:13, outline:'none',
            transition:'border-color 0.15s, box-shadow 0.15s',
            boxShadow: focused ? (error ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(255,214,0,0.2)') : 'none',
            ...inputStyle,
          }}
        />
      </div>
      {hint && !error && <span style={{ fontSize:11, color:'var(--grey-400)' }}>{hint}</span>}
      {error && <span style={{ fontSize:11, color:'#EF4444', display:'flex', alignItems:'center', gap:4 }}>⚠ {error}</span>}
    </div>
  )
}

/* ── Select ── */
export function Select({ label, error, options=[], containerStyle, required, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...containerStyle }}>
      {label && <label style={{ fontSize:12, fontWeight:700, color:'var(--grey-700)', letterSpacing:0.1 }}>
        {label}{required && <span style={{ color:'var(--coral)', marginLeft:2 }}>*</span>}
      </label>}
      <select {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width:'100%', padding:'10px 12px',
          background:'#fff', border:`1.5px solid ${error ? '#EF4444' : focused ? '#FFD600' : 'var(--grey-200)'}`,
          borderRadius:'var(--r-md)', color:'var(--grey-900)',
          fontFamily:'Outfit, sans-serif', fontSize:13, outline:'none', cursor:'pointer',
          boxShadow: focused ? '0 0 0 3px rgba(255,214,0,0.2)' : 'none', transition:'all 0.15s',
        }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize:11, color:'#EF4444' }}>{error}</span>}
    </div>
  )
}

/* ── Textarea ── */
export function Textarea({ label, error, hint, containerStyle, required, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...containerStyle }}>
      {label && <label style={{ fontSize:12, fontWeight:700, color:'var(--grey-700)' }}>
        {label}{required && <span style={{ color:'var(--coral)', marginLeft:2 }}>*</span>}
      </label>}
      <textarea {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width:'100%', padding:'10px 12px', minHeight:80, resize:'vertical',
          background:'#fff', border:`1.5px solid ${error ? '#EF4444' : focused ? '#FFD600' : 'var(--grey-200)'}`,
          borderRadius:'var(--r-md)', color:'var(--grey-900)',
          fontFamily:'Outfit, sans-serif', fontSize:13, outline:'none',
          boxShadow: focused ? '0 0 0 3px rgba(255,214,0,0.2)' : 'none', transition:'all 0.15s',
        }}
      />
      {hint && !error && <span style={{ fontSize:11, color:'var(--grey-400)' }}>{hint}</span>}
      {error && <span style={{ fontSize:11, color:'#EF4444' }}>{error}</span>}
    </div>
  )
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, width=520, subtitle }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(26,23,18,0.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'fadeIn 0.15s ease' }}
      onClick={e => { if(e.target===e.currentTarget) onClose() }}>
      <div className="fade-up" style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:24, width:'100%', maxWidth:width, boxShadow:'0 32px 80px rgba(26,23,18,0.18)', overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1.5px solid var(--grey-100)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', background:'var(--grey-50)' }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--grey-900)' }}>{title}</h3>
            {subtitle && <p style={{ fontSize:12, color:'var(--grey-400)', marginTop:2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:'var(--grey-100)', border:'none', color:'var(--grey-500)', cursor:'pointer', fontSize:18, lineHeight:1, padding:'4px 8px', borderRadius:8, transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--grey-200)';e.currentTarget.style.color='var(--grey-900)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--grey-100)';e.currentTarget.style.color='var(--grey-500)'}}>×</button>
        </div>
        <div style={{ padding:'20px 22px', maxHeight:'80vh', overflowY:'auto' }}>{children}</div>
      </div>
    </div>
  )
}

/* ── ConfirmDialog ── */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading, confirmLabel='Delete', variant='danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={400}>
      <p style={{ color:'var(--grey-500)', marginBottom:22, fontSize:13, lineHeight:1.7 }}>{message}</p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button danger={variant==='danger'} variant={variant==='danger'?undefined:'warning'} size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

/* ── EmptyState ── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ textAlign:'center', padding:'52px 20px', color:'var(--grey-400)' }}>
      <div style={{ marginBottom:14, display:'flex', justifyContent:'center', opacity:0.4 }}>{icon}</div>
      <h3 style={{ fontSize:15, fontWeight:700, color:'var(--grey-700)', marginBottom:6 }}>{title}</h3>
      <p style={{ fontSize:13, color:'var(--grey-400)', marginBottom: action?18:0, lineHeight:1.6 }}>{description}</p>
      {action}
    </div>
  )
}

/* ── Spinner ── */
export function Spinner({ size=22, color='var(--sun-deep)' }) {
  return (
    <span style={{ display:'inline-block', width:size, height:size, border:'2.5px solid var(--grey-200)', borderTopColor:color, borderRadius:'50%', animation:'spin 0.65s linear infinite' }} />
  )
}

/* ── PageHeader ── */
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div style={{ marginBottom:24 }}>
      {breadcrumb && <p style={{ fontSize:12, color:'var(--grey-400)', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>{breadcrumb}</p>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4, color:'var(--grey-900)', lineHeight:1.2 }}>{title}</h2>
          {subtitle && <p style={{ fontSize:13, color:'var(--grey-400)', marginTop:4 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>{actions}</div>}
      </div>
    </div>
  )
}

/* ── StatCard ── */
export function StatCard({ label, value, icon, color='var(--sun-deep)', bg, change, suffix='' }) {
  return (
    <div style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:16, padding:18, position:'relative', overflow:'hidden', boxShadow:'0 2px 12px rgba(26,23,18,0.06)', transition:'all 0.2s ease' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(26,23,18,0.12)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(26,23,18,0.06)'}}>
      <div style={{ position:'absolute', top:-24, right:-24, width:96, height:96, borderRadius:'50%', background: bg||'rgba(255,214,0,0.12)', opacity:0.8 }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
        <div>
          <p style={{ fontSize:10, fontWeight:800, color:'var(--grey-300)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>{label}</p>
          <p style={{ fontSize:30, fontWeight:900, color:'var(--grey-900)', letterSpacing:-1, lineHeight:1 }}>
            {value}<span style={{ fontSize:14, fontWeight:600, marginLeft:2, color:'var(--grey-400)' }}>{suffix}</span>
          </p>
          {change !== undefined && (
            <p style={{ fontSize:11, color: change>=0?'#15803D':'#991B1B', marginTop:7, fontWeight:700 }}>
              {change>=0?'↑':'↓'} {Math.abs(change)}% this week
            </p>
          )}
        </div>
        <div style={{ width:42, height:42, borderRadius:12, background: bg||'rgba(255,214,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0, border:'1.5px solid rgba(26,23,18,0.05)' }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

/* ── DataTable ── */
export function DataTable({ columns, data, loading, emptyState, onRowClick, skeletonRows=5 }) {
  return (
    <div style={{ background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(26,23,18,0.06)' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
          <thead>
            <tr style={{ background:'var(--grey-50)', borderBottom:'1.5px solid var(--grey-100)' }}>
              {columns.map(col => (
                <th key={col.key} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:800, color:'var(--grey-400)', textTransform:'uppercase', letterSpacing:0.9, whiteSpace:'nowrap', width:col.width }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:skeletonRows}).map((_,i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--grey-50)' }}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding:'13px 16px' }}>
                      <div style={{ height:12, width:col.skeletonWidth||'70%', background:'linear-gradient(90deg, var(--grey-100) 25%, var(--grey-50) 50%, var(--grey-100) 75%)', backgroundSize:'800px 100%', animation:'shimmer 1.4s infinite', borderRadius:6 }}/>
                    </td>
                  ))}
                </tr>
              ))
              : !data?.length
                ? <tr><td colSpan={columns.length}>{emptyState || <div style={{ padding:'40px', textAlign:'center', color:'var(--grey-400)', fontSize:13 }}>No data found</div>}</td></tr>
                : data.map((row,i) => (
                  <tr key={row.id||i} style={{ borderBottom:'1px solid var(--grey-50)', cursor:onRowClick?'pointer':'default', transition:'background 0.1s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='var(--grey-50)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background=''}}
                    onClick={()=>onRowClick?.(row)}>
                    {columns.map(col => (
                      <td key={col.key} style={{ padding:'11px 16px', fontSize:13, ...col.cellStyle }}>
                        {col.render ? col.render(row[col.key], row) : <span style={{ color:'var(--grey-700)' }}>{row[col.key]??'—'}</span>}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Pagination ── */
export function Pagination({ page, totalPages, onPageChange, totalElements, size }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 4px', flexWrap:'wrap', gap:8 }}>
      <span style={{ fontSize:12, color:'var(--grey-400)', fontWeight:500 }}>
        Showing {page*size+1}–{Math.min((page+1)*size, totalElements)} of {totalElements}
      </span>
      <div style={{ display:'flex', gap:5, alignItems:'center' }}>
        <Button variant="secondary" size="sm" disabled={page===0} onClick={()=>onPageChange(page-1)}>← Prev</Button>
        {Array.from({length:Math.min(totalPages,5)}).map((_,i)=>{
          const p = page < 3 ? i : page-2+i
          if(p>=totalPages) return null
          return (
            <button key={p} onClick={()=>onPageChange(p)} style={{ width:32, height:32, borderRadius:'var(--r-sm)', border: p===page?'none':'1.5px solid var(--grey-200)', background: p===page?'linear-gradient(135deg,#FFD600,#FFAB00)':'transparent', color: p===page?'var(--grey-900)':'var(--grey-500)', cursor:'pointer', fontSize:12, fontWeight:700, boxShadow: p===page?'0 4px 12px rgba(255,214,0,0.4)':'none' }}>{p+1}</button>
          )
        })}
        <Button variant="secondary" size="sm" disabled={page>=totalPages-1} onClick={()=>onPageChange(page+1)}>Next →</Button>
      </div>
    </div>
  )
}

/* ── Toggle ── */
export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer' }}>
      <div style={{ width:38, height:22, borderRadius:11, position:'relative', background: checked?'linear-gradient(135deg,#FFD600,#FFAB00)':'var(--grey-200)', transition:'background 0.2s', flexShrink:0, boxShadow: checked?'0 0 12px rgba(255,214,0,0.4)':'none' }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ position:'absolute', opacity:0, width:'100%', height:'100%', margin:0, cursor:'pointer' }} />
        <div style={{ position:'absolute', top:3, left: checked?18:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
      </div>
      {label && <span style={{ fontSize:13, color:'var(--grey-700)', fontWeight:500 }}>{label}</span>}
    </label>
  )
}

/* ── Alert ── */
export function Alert({ type='info', title, message, onClose }) {
  const colors = {
    info:    { bg:'#E0F2FE', border:'#BAE6FD', text:'#0369A1', icon:'ℹ' },
    success: { bg:'#DCFCE7', border:'#BBF7D0', text:'#15803D', icon:'✓' },
    warning: { bg:'#FEF9C3', border:'#FEF08A', text:'#854D0E', icon:'⚠' },
    error:   { bg:'#FEE2E2', border:'#FECACA', text:'#991B1B', icon:'✗' },
  }
  const c = colors[type]||colors.info
  return (
    <div style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:'var(--r-md)', padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:10 }}>
      <span style={{ color:c.text, fontWeight:800, flexShrink:0 }}>{c.icon}</span>
      <div style={{ flex:1 }}>
        {title && <p style={{ fontSize:13, fontWeight:700, color:c.text, marginBottom:2 }}>{title}</p>}
        <p style={{ fontSize:12, color:c.text, lineHeight:1.5 }}>{message}</p>
      </div>
      {onClose && <button onClick={onClose} style={{ background:'none', border:'none', color:c.text, cursor:'pointer', opacity:0.6, fontSize:16 }}>×</button>}
    </div>
  )
}

/* ── Tag ── */
export function Tag({ label, onRemove, color='yellow' }) {
  const colors = {
    yellow: { bg:'#FEF9C3', text:'#854D0E', border:'#FEF08A' },
    blue:   { bg:'#E0F2FE', text:'#0369A1', border:'#BAE6FD' },
    green:  { bg:'#DCFCE7', text:'#15803D', border:'#BBF7D0' },
  }
  const c = colors[color]||colors.yellow
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', background:c.bg, color:c.text, borderRadius:20, fontSize:11, fontWeight:700, border:`1.5px solid ${c.border}` }}>
      {label}
      {onRemove && <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:0.7, fontSize:13, lineHeight:1, padding:0, marginLeft:2 }}>×</button>}
    </span>
  )
}
