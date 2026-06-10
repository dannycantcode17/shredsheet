import React, { useState } from 'react'
import { Icon } from '../components/icons.jsx'
import BodycompDash from './BodycompDash.jsx'
import CaloriesDash from './CaloriesDash.jsx'
import GymDash from './GymDash.jsx'
import Targets from './Targets.jsx'

// The Data tab — consolidates the trend dashboards + Targets behind a pop-up
// view-picker, so phones get one tab instead of four.
const VIEWS = [
  ['body', 'Body', BodycompDash],
  ['calories', 'Calories', CaloriesDash],
  ['gym', 'Gym', GymDash],
  ['targets', 'Targets', Targets],
]

export default function DataDash() {
  const [sel, setSel] = useState('body')
  const [open, setOpen] = useState(false)
  const current = VIEWS.find(v => v[0] === sel) || VIEWS[0]
  const View = current[2]
  return (
    <>
      <div className="eyebrow">Data</div>
      <div className="data-head">
        <button className="data-picker" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {current[1]}<span className="data-chev"><Icon name="chevron" /></span>
        </button>
        {open && (
          <>
            <div className="data-scrim" onClick={() => setOpen(false)} />
            <div className="data-menu" role="menu">
              {VIEWS.map(([k, label]) => (
                <button key={k} role="menuitem" className={`data-mi ${k === sel ? 'active' : ''}`} onClick={() => { setSel(k); setOpen(false) }}>{label}</button>
              ))}
            </div>
          </>
        )}
      </div>
      <View embedded />
    </>
  )
}
