import { Checkbox, Input, Select, Textarea, SegmentedControl, Feedback, EmptyState } from "@/components/ui/health-kit";
import { RatingScale } from "@/components/ui/rating-scale";
import { useState } from 'react';
import { DashboardPanel as Panel, DashboardButton as Action } from '../dashboard/components/DashboardSystem';
import { useHealthStore } from '../../stores/health-store';
import { dates, DEMO_END } from './demo';
import { normalize, type Analytics } from './engine';
import { reportingDate, timestamp, validateEntry, type ManualEntry } from './entries';

export function WellnessJournal({ data }: { data: Analytics }) {
  const entries = useHealthStore(s => s.entries);
  const save = useHealthStore(s => s.saveEntry);
  const remove = useHealthStore(s => s.deleteEntry);
  const connections = useHealthStore(s => s.connections);
  const permissions = useHealthStore(s => s.permissions);
  const [kind, setKind] = useState<ManualEntry['kind']>('checkin');
  const [editing, setEditing] = useState<ManualEntry | null>(null);
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const visible = entries.filter(e => {
    const date = e.kind === 'checkin' ? e.date : reportingDate(e.kind === 'sleep' ? e.end : e.start);
    return date >= data.period.start && date <= data.period.end;
  }).sort((a, b) => {
    const date = (e: ManualEntry) => e.kind === 'checkin' ? e.date : e.kind === 'sleep' ? e.end : e.start;
    return date(b).localeCompare(date(a));
  });
  function startEdit(entry: ManualEntry) {
    setKind(entry.kind); setEditing(entry); setError(''); setMessage('');
    document.getElementById('journal-form-title')?.focus();
  }
  function clear() { setEditing(null); setGeneration(n => n + 1); }
  const checkin = editing?.kind === 'checkin' ? editing : null;
  const sleep = editing?.kind === 'sleep' ? editing : null;
  const workout = editing?.kind === 'workout' ? editing : null;
  return <>
    <Panel className="dashboard-hero"><div><h2>A little context for your numbers.</h2><p>Record how you feel, estimated sleep windows and workouts. Stored on this browser. Demo calendar: {dates[0]}–{DEMO_END} · All times GMT+7.</p></div></Panel>
    <div className="dashboard-content-grid">
      <Panel>
        <h2 id="journal-form-title" tabIndex={-1}>{editing ? 'Edit journal entry' : 'Add a journal entry'}</h2>
        <SegmentedControl label="Entry type" value={kind} options={[
          { value: 'checkin', label: 'Wellness check-in' }, { value: 'sleep', label: 'Sleep window' }, { value: 'workout', label: 'Workout' },
        ]} onChange={value => { setKind(value); clear(); setError(''); setMessage(''); }} />
        <form key={`${kind}-${editing?.id ?? generation}`} className="health-journal-form" onSubmit={event => {
          event.preventDefault(); setError(''); setMessage('');
          const form = new FormData(event.currentTarget);
          const text = (name: string) => String(form.get(name) ?? '');
          const optional = (name: string) => text(name) === '' ? null : Number(text(name));
          const base = { id: editing?.id ?? crypto.randomUUID(), notes: text('notes') };
          try {
            const entry = validateEntry(kind === 'checkin' ? { ...base, kind, date: text('date'), energy: Number(text('energy')), stress: Number(text('stress')) } : kind === 'sleep' ? { ...base, kind, start: text('start'), end: text('end'), quality: Number(text('quality')), resolution: text('resolution') } : { ...base, kind, start: text('start'), activity: text('activity'), duration: Number(text('duration')), distance: optional('distance'), intensity: optional('intensity') });
            // Known wearable workout duplicates require an explicit decision before saving.
            if (entry.kind === 'workout') {
              const sources = (['apple', 'garmin', 'strava'] as const).filter(id => connections[id].connected);
              const duplicate = normalize(sources, { permissions }).workouts.some(w => Math.abs(Date.parse(w.start) - Date.parse(timestamp(entry.start))) < 15 * 60000);
              if (duplicate && !form.has('distinct')) throw new Error('A wearable workout starts within 15 minutes. Confirm this is a separate session, or keep the imported record.');
            }
            save(entry); clear(); setMessage('Entry saved. Dashboard and AI context updated.');
          } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save entry.'); }
        }}>
          {kind === 'checkin' ? <>
            <label>Date<Input type="date" name="date" required min={dates[0]} max={DEMO_END} defaultValue={checkin?.date ?? DEMO_END} /></label>
            <RatingScale name="energy" label="Energy · 1 low, 5 high" defaultValue={checkin?.energy ?? 3} />
            <RatingScale name="stress" label="Stress · 1 low, 5 high" defaultValue={checkin?.stress ?? 3} />
          </> : <>
            {kind === 'workout' && <label>Workout type<Input name="activity" required maxLength={60} defaultValue={workout?.activity ?? 'Walking'} /></label>}
            <label>{kind === 'sleep' ? 'Bedtime' : 'Start time'} · GMT+7<Input type="datetime-local" name="start" required defaultValue={sleep?.start ?? workout?.start ?? `${kind === 'sleep' ? '2026-10-17' : DEMO_END}T${kind === 'sleep' ? '23:00' : '18:00'}`} /></label>
            {kind === 'sleep' ? <>
              <label>Wake time · GMT+7<Input type="datetime-local" name="end" required defaultValue={sleep?.end ?? `${DEMO_END}T07:00`} /></label>
              <RatingScale name="quality" label="Sleep quality · 1 low, 5 high" defaultValue={sleep?.quality ?? 3} />
              <label>If wearable sleep exists for the wake date<Select name="resolution" defaultValue={sleep?.resolution ?? 'wearable'}><option value="wearable">Keep wearable measurement in analysis</option><option value="manual">Use my estimated window instead</option></Select></label>
              <p className="muted">One session per wake date. Time in bed is an estimate, not measured time asleep. Only the chosen source enters analytics; both records are retained.</p>
            </> : <>
              <label>Duration · minutes<Input type="number" name="duration" min="1" max="1440" step="1" required defaultValue={workout?.duration ?? 30} /></label>
              <label>Distance · km (optional)<Input type="number" name="distance" min="0" max="1000" step="0.01" defaultValue={workout?.distance ?? ''} /></label>
              <label>Perceived intensity · 1–5 (optional)<Input type="number" name="intensity" min="1" max="5" step="1" defaultValue={workout?.intensity ?? ''} /></label>
              <Checkbox name="distinct">This is a separate session if an imported workout overlaps.</Checkbox>
              <p className="muted">Workout duration updates workout history and totals. It does not add to provider exercise minutes, which may already include this activity.</p>
            </>}
          </>}
          <label>Notes (optional, kept on this browser)<Textarea name="notes" maxLength={1000} rows={3} defaultValue={editing?.notes ?? ''} /></label>
          <div className="source-actions"><Action type="submit" variant="default">{editing ? 'Save changes' : 'Save entry'}</Action>{editing && <Action type="button" onClick={clear}>Cancel editing</Action>}</div>
          {error && <Feedback tone="danger">{error}</Feedback>}
        </form>
        {message && <Feedback tone="success">{message}</Feedback>}
      </Panel>
      <Panel><h2>Journal history</h2><p className="muted">{data.period.start}–{data.period.end} · {visible.length} entries · One check-in and sleep window per date. Select Edit to update an existing entry.</p>
        {visible.length === 0 ? <EmptyState title="No entries in this period." /> : visible.map(entry => <article className="health-insight" key={entry.id}>
          <h3>{entry.kind === 'checkin' ? 'Wellness check-in' : entry.kind === 'sleep' ? 'Estimated sleep window' : entry.activity}</h3>
          <p>{entry.kind === 'checkin' ? `${entry.date} · Energy ${entry.energy}/5 · Stress ${entry.stress}/5 · Self-reported` : entry.kind === 'sleep' ? `${entry.start.replace('T', ' ')} → ${entry.end.replace('T', ' ')} · ${((Date.parse(timestamp(entry.end)) - Date.parse(timestamp(entry.start))) / 3600000).toFixed(1)}h estimated · Quality ${entry.quality}/5 · ${entry.resolution === 'manual' ? 'Manual preferred' : 'Wearable preferred'}` : `${entry.start.replace('T', ' ')} · ${entry.duration} min · ${entry.distance ?? '—'} km · Manual entry`}</p>
          {entry.notes && <p className="muted">{entry.notes}</p>}
          <div className="source-actions"><Action onClick={() => startEdit(entry)}>Edit</Action><Action variant="destructive" onClick={() => setPendingDelete(entry.id)}>Delete</Action></div>
          {pendingDelete === entry.id && <div><p>Delete this entry?</p><div className="source-actions"><Action variant="destructive" onClick={() => { remove(entry.id); if (editing?.id === entry.id) clear(); setPendingDelete(null); setMessage('Entry deleted. Analytics updated.'); }}>Confirm delete</Action><Action onClick={() => setPendingDelete(null)}>Keep entry</Action></div></div>}
        </article>)}
      </Panel>
    </div>
  </>;
}
