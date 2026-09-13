'use client';
import { useEffect, useRef, useState } from 'react';

const EVENT_TYPES = [
  { k: 'MENS_SINGLES', label: "Men's singles", gender: 'M', team: false },
  { k: 'MENS_DOUBLES', label: "Men's doubles", gender: 'M', team: true },
  { k: 'MENS_MIXED', label: "Men's mixed doubles", gender: 'MIX', team: true },
  { k: 'WOMENS_SINGLES', label: "Women's singles", gender: 'F', team: false },
  { k: 'WOMENS_DOUBLES', label: "Women's doubles", gender: 'F', team: true },
  { k: 'WOMENS_MIXED', label: "Women's mixed doubles", gender: 'MIX', team: true },
];
const AREA_TYPES = [{ k: 'DISTRICT', label: 'District' }, { k: 'RURAL', label: 'Rural' }];
const AGE_GROUPS = [{ k: 'OPEN', label: 'Open' }, { k: '40PLUS', label: '40+' }];
const STATUSES = ['CONFIRMED', 'TBD', 'OPEN', 'DUMMY'];

const evLabel = (k) => EVENT_TYPES.find((x) => x.k === k)?.label || k;
const areaLabel = (k) => AREA_TYPES.find((x) => x.k === k)?.label || k;
const ageLabel = (k) => AGE_GROUPS.find((x) => x.k === k)?.label || k;

async function api(path, opts) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }
  return res.json();
}

export default function Page() {
  const [tab, setTab] = useState('dashboard');
  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [entries, setEntries] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({ people: null, teams: null, entries: null, matches: null });
  const [status, setStatusMsg] = useState('');

  async function refreshAll() {
    const [p, t, e, m] = await Promise.all([
      api('/api/people'), api('/api/teams'), api('/api/entries'), api('/api/matches'),
    ]);
    setPeople(p); setTeams(t); setEntries(e); setMatches(m);
  }

  useEffect(() => {
    refreshAll().finally(() => setLoading(false));
  }, []);

  function personName(id) { return people.find((p) => p.id === id)?.name || 'Unknown'; }
  function teamLabel(id) {
    const t = teams.find((x) => x.id === id);
    if (!t) return 'Unknown team';
    return `${personName(t.player1Id)} & ${personName(t.player2Id)}`;
  }
  function participantLabel(entry) {
    if (!entry) return '—';
    if (!entry.participantId) return '— open slot —';
    return entry.participantType === 'TEAM' ? teamLabel(entry.participantId) : personName(entry.participantId);
  }
  function entryById(id) { return entries.find((e) => e.id === id); }
  function teamPlayerIds(teamId) {
    const t = teams.find((x) => x.id === teamId);
    return t ? [t.player1Id, t.player2Id] : [];
  }

  async function withStatus(fn, label) {
    setStatusMsg(label + '…');
    try {
      await fn();
      await refreshAll();
      setStatusMsg('Saved');
      setTimeout(() => setStatusMsg(''), 1500);
    } catch (err) {
      setStatusMsg(err.message || 'Something went wrong');
    }
  }

  const tabs = [
    ['dashboard', 'Dashboard'], ['people', 'People'], ['teams', 'Teams'],
    ['entries', 'Entries'], ['matches', 'Matches'], ['earnings', 'Earnings'],
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 60px' }}>
      <div style={{ padding: '26px 4px 14px', borderBottom: '2px solid var(--ink)', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--marigold-dark)', fontWeight: 600 }}>KHEL MAHAKUMBH</div>
          <div style={{ fontSize: 26, fontWeight: 600, marginTop: 2 }}>Surendranagar tournament manager</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{status}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => (
          <div key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{label}</div>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--ink-soft)', padding: '20px 4px' }}>Loading…</div>
      ) : (
        <>
          {tab === 'dashboard' && <Dashboard {...{ people, teams, entries, matches }} />}
          {tab === 'people' && (
            <PeopleTab
              people={people} editingId={editing.people}
              onEdit={(id) => setEditing((s) => ({ ...s, people: id }))}
              onCancel={() => setEditing((s) => ({ ...s, people: null }))}
              onSave={(rec, id) => withStatus(async () => {
                if (id) { await api(`/api/people/${id}`, { method: 'PUT', body: JSON.stringify(rec) }); }
                else { await api('/api/people', { method: 'POST', body: JSON.stringify(rec) }); }
                setEditing((s) => ({ ...s, people: null }));
              }, 'Saving person')}
              onDelete={(id) => {
                if (!confirm('Delete this person? Teams and entries referencing them will show as unknown.')) return;
                withStatus(() => api(`/api/people/${id}`, { method: 'DELETE' }), 'Deleting');
              }}
            />
          )}
          {tab === 'teams' && (
            <TeamsTab
              people={people} teams={teams} entries={entries} editingId={editing.teams}
              teamLabel={teamLabel}
              onEdit={(id) => setEditing((s) => ({ ...s, teams: id }))}
              onCancel={() => setEditing((s) => ({ ...s, teams: null }))}
              onSave={(rec, id) => withStatus(async () => {
                if (id) { await api(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(rec) }); }
                else { await api('/api/teams', { method: 'POST', body: JSON.stringify(rec) }); }
                setEditing((s) => ({ ...s, teams: null }));
              }, 'Saving team')}
              onDelete={(id) => {
                if (!confirm('Delete this team? Entries referencing it will show as unknown.')) return;
                withStatus(() => api(`/api/teams/${id}`, { method: 'DELETE' }), 'Deleting');
              }}
            />
          )}
          {tab === 'entries' && (
            <EntriesTab
              people={people} teams={teams} entries={entries} editingId={editing.entries}
              participantLabel={participantLabel} teamLabel={teamLabel}
              onEdit={(id) => setEditing((s) => ({ ...s, entries: id }))}
              onCancel={() => setEditing((s) => ({ ...s, entries: null }))}
              onSave={(rec, id) => withStatus(async () => {
                if (id) { await api(`/api/entries/${id}`, { method: 'PUT', body: JSON.stringify(rec) }); }
                else { await api('/api/entries', { method: 'POST', body: JSON.stringify(rec) }); }
                setEditing((s) => ({ ...s, entries: null }));
              }, 'Saving entry')}
              onDelete={(id) => {
                if (!confirm('Delete this entry?')) return;
                withStatus(() => api(`/api/entries/${id}`, { method: 'DELETE' }), 'Deleting');
              }}
            />
          )}
          {tab === 'matches' && (
            <MatchesTab
              entries={entries} matches={matches} editingId={editing.matches}
              participantLabel={participantLabel} entryById={entryById}
              onEdit={(id) => setEditing((s) => ({ ...s, matches: id }))}
              onCancel={() => setEditing((s) => ({ ...s, matches: null }))}
              onSave={(rec, id) => withStatus(async () => {
                if (id) { await api(`/api/matches/${id}`, { method: 'PUT', body: JSON.stringify(rec) }); }
                else { await api('/api/matches', { method: 'POST', body: JSON.stringify(rec) }); }
                setEditing((s) => ({ ...s, matches: null }));
              }, 'Saving match')}
              onDelete={(id) => {
                if (!confirm('Delete this match?')) return;
                withStatus(() => api(`/api/matches/${id}`, { method: 'DELETE' }), 'Deleting');
              }}
            />
          )}
          {tab === 'earnings' && (
            <EarningsTab entries={entries} matches={matches} personName={personName} entryById={entryById} teamPlayerIds={teamPlayerIds} />
          )}
        </>
      )}
    </div>
  );
}

function metricCard(n, l) {
  return (
    <div className="metric" key={l}>
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

function Dashboard({ people, teams, entries, matches }) {
  const confirmedEntries = entries.filter((e) => e.status === 'CONFIRMED').length;
  const totalPrize = matches.reduce((s, m) => s + (Number(m.prize) || 0), 0);
  const groups = {};
  entries.forEach((e) => {
    const k = e.areaType + '|' + e.ageGroup + '|' + e.eventType;
    if (!groups[k]) groups[k] = { areaType: e.areaType, ageGroup: e.ageGroup, eventType: e.eventType, CONFIRMED: 0, TBD: 0, OPEN: 0, DUMMY: 0 };
    groups[k][e.status] = (groups[k][e.status] || 0) + 1;
  });
  const rows = Object.values(groups);
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {metricCard(people.length, 'People')}
        {metricCard(teams.length, 'Teams / pairs')}
        {metricCard(confirmedEntries, 'Confirmed entries')}
        {metricCard(matches.length, 'Matches logged')}
        {metricCard('₹' + totalPrize.toLocaleString('en-IN'), 'Prize money distributed')}
      </div>
      <div className="card">
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Entries by event</div>
        <table>
          <tbody>
            <tr><th>Location</th><th>Age group</th><th>Event</th><th>Confirmed</th><th>TBD</th><th>Open</th></tr>
            {!rows.length && <tr><td colSpan={6} style={{ color: 'var(--ink-soft)' }}>No entries yet. Add people, then create entries in the Entries tab.</td></tr>}
            {rows.map((g, i) => (
              <tr key={i}><td>{areaLabel(g.areaType)}</td><td>{ageLabel(g.ageGroup)}</td><td>{evLabel(g.eventType)}</td><td>{g.CONFIRMED || 0}</td><td>{g.TBD || 0}</td><td>{g.OPEN || 0}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PeopleTab({ people, editingId, onEdit, onCancel, onSave, onDelete }) {
  const editingPerson = editingId ? people.find((p) => p.id === editingId) : null;
  const nameRef = useRef(); const genderRef = useRef(); const ageRef = useRef(); const areaRef = useRef(); const notesRef = useRef();

  function submit() {
    const name = nameRef.current.value.trim();
    if (!name) { alert('Enter a name first.'); return; }
    onSave({ name, gender: genderRef.current.value, ageGroup: ageRef.current.value, areaType: areaRef.current.value, notes: notesRef.current.value.trim() }, editingId);
  }

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 500, marginBottom: 12 }}>{editingPerson ? 'Edit person' : 'Add a person'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
          <div className="field"><label>Name</label><input ref={nameRef} key={editingId + 'n'} defaultValue={editingPerson?.name || ''} placeholder="Full name" /></div>
          <div className="field"><label>Gender</label>
            <select ref={genderRef} key={editingId + 'g'} defaultValue={editingPerson?.gender || 'F'}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </div>
          <div className="field"><label>Age group</label>
            <select ref={ageRef} key={editingId + 'a'} defaultValue={editingPerson?.ageGroup || 'OPEN'}>
              {AGE_GROUPS.map((a) => <option key={a.k} value={a.k}>{a.label}</option>)}
            </select>
          </div>
          <div className="field"><label>Area</label>
            <select ref={areaRef} key={editingId + 'ar'} defaultValue={editingPerson?.areaType || 'DISTRICT'}>
              {AREA_TYPES.map((a) => <option key={a.k} value={a.k}>{a.label}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Notes</label><input ref={notesRef} key={editingId + 'no'} defaultValue={editingPerson?.notes || ''} placeholder="Optional — e.g. relation, contact" /></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={submit}>{editingPerson ? 'Save changes' : 'Add person'}</button>
          {editingPerson && <button onClick={onCancel}>Cancel</button>}
        </div>
      </div>
      <table>
        <tbody>
          <tr><th>Name</th><th>Gender</th><th>Age group</th><th>Area</th><th>Notes</th><th></th></tr>
          {!people.length && <tr><td colSpan={6} style={{ color: 'var(--ink-soft)' }}>No people yet — add the first one above.</td></tr>}
          {[...people].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.gender === 'M' ? 'Male' : 'Female'}</td><td>{ageLabel(p.ageGroup)}</td><td>{areaLabel(p.areaType)}</td>
              <td style={{ color: 'var(--ink-soft)' }}>{p.notes}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="tiny" onClick={() => onEdit(p.id)}>Edit</button>{' '}
                <button className="tiny danger" onClick={() => onDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function TeamsTab({ people, teams, entries, editingId, teamLabel, onEdit, onCancel, onSave, onDelete }) {
  const editingTeam = editingId ? teams.find((t) => t.id === editingId) : null;
  const p1Ref = useRef(); const p2Ref = useRef();

  function submit() {
    const p1 = p1Ref.current.value, p2 = p2Ref.current.value;
    if (!p1 || !p2 || p1 === p2) { alert('Pick two different players.'); return; }
    onSave({ player1Id: p1, player2Id: p2 }, editingId);
  }

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 500, marginBottom: 12 }}>{editingTeam ? 'Edit team' : 'Add a team / pair'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field"><label>Player 1</label>
            <select ref={p1Ref} key={editingId + 'p1'} defaultValue={editingTeam?.player1Id || ''}>
              <option value="">Select…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Player 2</label>
            <select ref={p2Ref} key={editingId + 'p2'} defaultValue={editingTeam?.player2Id || ''}>
              <option value="">Select…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={submit}>{editingTeam ? 'Save changes' : 'Add team'}</button>
          {editingTeam && <button onClick={onCancel}>Cancel</button>}
        </div>
      </div>
      <table>
        <tbody>
          <tr><th>Team</th><th>Used in entries</th><th></th></tr>
          {!people.length && <tr><td colSpan={3} style={{ color: 'var(--ink-soft)' }}>Add people first, then pair them into teams here.</td></tr>}
          {people.length > 0 && !teams.length && <tr><td colSpan={3} style={{ color: 'var(--ink-soft)' }}>No teams yet.</td></tr>}
          {teams.map((t) => {
            const usedCount = entries.filter((e) => e.participantId === t.id).length;
            return (
              <tr key={t.id}>
                <td>{teamLabel(t.id)}</td><td>{usedCount}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="tiny" onClick={() => onEdit(t.id)}>Edit</button>{' '}
                  <button className="tiny danger" onClick={() => onDelete(t.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function EntriesTab({ people, teams, entries, editingId, participantLabel, teamLabel, onEdit, onCancel, onSave, onDelete }) {
  const editingEntry = editingId ? entries.find((e) => e.id === editingId) : null;
  const [area, setArea] = useState(editingEntry?.areaType || 'DISTRICT');
  const [age, setAge] = useState(editingEntry?.ageGroup || 'OPEN');
  const [eventType, setEventType] = useState(editingEntry?.eventType || 'WOMENS_SINGLES');
  const [ptype, setPtype] = useState(editingEntry ? (editingEntry.participantId ? editingEntry.participantType : 'NONE') : 'PERSON');
  const participantRef = useRef(); const statusRef = useRef();

  useEffect(() => {
    setArea(editingEntry?.areaType || 'DISTRICT');
    setAge(editingEntry?.ageGroup || 'OPEN');
    setEventType(editingEntry?.eventType || 'WOMENS_SINGLES');
    setPtype(editingEntry ? (editingEntry.participantId ? editingEntry.participantType : 'NONE') : 'PERSON');
  }, [editingId]);

  const ev = EVENT_TYPES.find((x) => x.k === eventType);
  const eligiblePeople = !ev || ev.gender === 'MIX' ? people : people.filter((p) => p.gender === ev.gender);

  function submit() {
    const participantId = ptype === 'NONE' ? null : (participantRef.current?.value || null);
    onSave({
      areaType: area, ageGroup: age, eventType,
      participantType: ptype === 'NONE' ? 'PERSON' : ptype,
      participantId, status: statusRef.current.value,
    }, editingId);
  }

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 500, marginBottom: 12 }}>{editingEntry ? 'Edit entry' : 'Add an entry'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 10 }}>
          <div className="field"><label>Location</label>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {AREA_TYPES.map((a) => <option key={a.k} value={a.k}>{a.label}</option>)}
            </select>
          </div>
          <div className="field"><label>Age group</label>
            <select value={age} onChange={(e) => setAge(e.target.value)}>
              {AGE_GROUPS.map((a) => <option key={a.k} value={a.k}>{a.label}</option>)}
            </select>
          </div>
          <div className="field"><label>Event</label>
            <select value={eventType} onChange={(e) => { setEventType(e.target.value); const nev = EVENT_TYPES.find((x) => x.k === e.target.value); setPtype(nev.team ? 'TEAM' : 'PERSON'); }}>
              {EVENT_TYPES.map((e) => <option key={e.k} value={e.k}>{e.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 10 }}>
          <div className="field"><label>Participant type</label>
            <select value={ptype} onChange={(e) => setPtype(e.target.value)}>
              <option value="PERSON">Person</option><option value="TEAM">Team</option><option value="NONE">Open slot (no one yet)</option>
            </select>
          </div>
          <div className="field"><label>Participant</label>
            {ptype === 'NONE' ? (
              <select disabled><option>— open slot —</option></select>
            ) : (
              <select ref={participantRef} key={editingId + eventType + ptype} defaultValue={editingEntry?.participantId || ''}>
                <option value="">Select…</option>
                {ptype === 'TEAM'
                  ? teams.map((t) => <option key={t.id} value={t.id}>{teamLabel(t.id)}</option>)
                  : eligiblePeople.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div className="field"><label>Status</label>
            <select ref={statusRef} key={editingId + 's'} defaultValue={editingEntry?.status || 'CONFIRMED'}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={submit}>{editingEntry ? 'Save changes' : 'Add entry'}</button>
          {editingEntry && <button onClick={onCancel}>Cancel</button>}
        </div>
      </div>
      <table>
        <tbody>
          <tr><th>Location</th><th>Age group</th><th>Event</th><th>Participant</th><th>Status</th><th></th></tr>
          {!entries.length && <tr><td colSpan={6} style={{ color: 'var(--ink-soft)' }}>No entries yet.</td></tr>}
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{areaLabel(e.areaType)}</td><td>{ageLabel(e.ageGroup)}</td><td>{evLabel(e.eventType)}</td>
              <td>{participantLabel(e)}</td><td><span className={'badge b-' + e.status}>{e.status}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="tiny" onClick={() => onEdit(e.id)}>Edit</button>{' '}
                <button className="tiny danger" onClick={() => onDelete(e.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MatchesTab({ entries, matches, editingId, participantLabel, entryById, onEdit, onCancel, onSave, onDelete }) {
  const editingMatch = editingId ? matches.find((m) => m.id === editingId) : null;
  const [area, setArea] = useState(editingMatch?.areaType || 'DISTRICT');
  const [age, setAge] = useState(editingMatch?.ageGroup || 'OPEN');
  const [eventType, setEventType] = useState(editingMatch?.eventType || 'WOMENS_SINGLES');
  const roundRef = useRef(); const aRef = useRef(); const bRef = useRef(); const winnerRef = useRef(); const scoreRef = useRef(); const prizeRef = useRef();

  useEffect(() => {
    setArea(editingMatch?.areaType || 'DISTRICT');
    setAge(editingMatch?.ageGroup || 'OPEN');
    setEventType(editingMatch?.eventType || 'WOMENS_SINGLES');
  }, [editingId]);

  const matchingEntries = entries.filter((e) => e.areaType === area && e.ageGroup === age && e.eventType === eventType && e.participantId);

  function submit() {
    if (!aRef.current?.value || !bRef.current?.value) { alert('Pick both entries — add entries for this event first if the list is empty.'); return; }
    onSave({
      areaType: area, ageGroup: age, eventType, round: roundRef.current.value.trim(),
      entryAId: aRef.current.value, entryBId: bRef.current.value,
      winnerEntryId: winnerRef.current.value || aRef.current.value,
      score: scoreRef.current.value.trim(), prize: Number(prizeRef.current.value) || 0,
    }, editingId);
  }

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 500, marginBottom: 12 }}>{editingMatch ? 'Edit match' : 'Log a match'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1fr', gap: 10 }}>
          <div className="field"><label>Location</label>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {AREA_TYPES.map((a) => <option key={a.k} value={a.k}>{a.label}</option>)}
            </select>
          </div>
          <div className="field"><label>Age group</label>
            <select value={age} onChange={(e) => setAge(e.target.value)}>
              {AGE_GROUPS.map((a) => <option key={a.k} value={a.k}>{a.label}</option>)}
            </select>
          </div>
          <div className="field"><label>Event</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((e) => <option key={e.k} value={e.k}>{e.label}</option>)}
            </select>
          </div>
          <div className="field"><label>Round</label><input ref={roundRef} key={editingId + 'r'} defaultValue={editingMatch?.round || ''} placeholder="e.g. Final" /></div>
        </div>

        {!matchingEntries.length ? (
          <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 12 }}>No confirmed entries for this event yet — add entries first in the Entries tab.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field"><label>Entry A</label>
                <select ref={aRef} key={editingId + eventType + 'a'} defaultValue={editingMatch?.entryAId || ''}>
                  <option value="">Select…</option>
                  {matchingEntries.map((e) => <option key={e.id} value={e.id}>{participantLabel(e)}</option>)}
                </select>
              </div>
              <div className="field"><label>Entry B</label>
                <select ref={bRef} key={editingId + eventType + 'b'} defaultValue={editingMatch?.entryBId || ''}>
                  <option value="">Select…</option>
                  {matchingEntries.map((e) => <option key={e.id} value={e.id}>{participantLabel(e)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="field"><label>Winner</label>
                <select ref={winnerRef} key={editingId + eventType + 'w'} defaultValue={editingMatch?.winnerEntryId || ''}>
                  <option value="">Select…</option>
                  {matchingEntries.map((e) => <option key={e.id} value={e.id}>{participantLabel(e)}</option>)}
                </select>
              </div>
              <div className="field"><label>Score</label><input ref={scoreRef} key={editingId + 'sc'} defaultValue={editingMatch?.score || ''} placeholder="21-18, 21-15" /></div>
              <div className="field"><label>Prize (₹)</label><input ref={prizeRef} key={editingId + 'pr'} type="number" min="0" defaultValue={editingMatch?.prize ?? 0} /></div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={submit}>{editingMatch ? 'Save changes' : 'Log match'}</button>
          {editingMatch && <button onClick={onCancel}>Cancel</button>}
        </div>
      </div>
      <table>
        <tbody>
          <tr><th>Event</th><th>Round</th><th>A</th><th>B</th><th>Winner</th><th>Score</th><th>Prize</th><th></th></tr>
          {!matches.length && <tr><td colSpan={8} style={{ color: 'var(--ink-soft)' }}>No matches logged yet.</td></tr>}
          {matches.map((m) => {
            const eA = entryById(m.entryAId), eB = entryById(m.entryBId), eW = entryById(m.winnerEntryId);
            return (
              <tr key={m.id}>
                <td>{evLabel(m.eventType)} <span style={{ color: 'var(--ink-soft)', fontSize: 11.5 }}>({areaLabel(m.areaType)}, {ageLabel(m.ageGroup)})</span></td>
                <td>{m.round}</td><td>{participantLabel(eA)}</td><td>{participantLabel(eB)}</td>
                <td style={{ fontWeight: 500 }}>{participantLabel(eW)}</td><td>{m.score}</td><td>₹{(Number(m.prize) || 0).toLocaleString('en-IN')}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="tiny" onClick={() => onEdit(m.id)}>Edit</button>{' '}
                  <button className="tiny danger" onClick={() => onDelete(m.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function EarningsTab({ entries, matches, personName, entryById, teamPlayerIds }) {
  const totals = {};
  const matchCounts = {};
  matches.forEach((m) => {
    const eA = entryById(m.entryAId), eB = entryById(m.entryBId), eW = entryById(m.winnerEntryId);
    [eA, eB].forEach((e) => {
      if (!e || !e.participantId) return;
      const ids = e.participantType === 'TEAM' ? teamPlayerIds(e.participantId) : [e.participantId];
      ids.forEach((pid) => { matchCounts[pid] = (matchCounts[pid] || 0) + 1; });
    });
    if (eW && eW.participantId) {
      const winIds = eW.participantType === 'TEAM' ? teamPlayerIds(eW.participantId) : [eW.participantId];
      const prize = Number(m.prize) || 0;
      const share = winIds.length ? prize / winIds.length : 0;
      winIds.forEach((pid) => {
        if (!totals[pid]) totals[pid] = { prize: 0, wins: 0 };
        totals[pid].prize += share;
        totals[pid].wins += 1;
      });
    }
  });
  const rows = Object.keys(matchCounts).map((pid) => ({
    name: personName(pid), matches: matchCounts[pid], wins: totals[pid]?.wins || 0, prize: totals[pid]?.prize || 0,
  })).sort((a, b) => b.prize - a.prize);
  const grandTotal = rows.reduce((s, r) => s + r.prize, 0);

  return (
    <div className="card">
      <div style={{ fontWeight: 500, marginBottom: 10 }}>Who earns what</div>
      <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 12 }}>Team prizes are split evenly between the two players. Log matches in the Matches tab to populate this.</div>
      <table>
        <tbody>
          <tr><th>Person</th><th>Matches played</th><th>Wins</th><th>Prize earned</th></tr>
          {!rows.length && <tr><td colSpan={4} style={{ color: 'var(--ink-soft)' }}>No matches logged yet.</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}><td>{r.name}</td><td>{r.matches}</td><td>{r.wins}</td><td style={{ fontWeight: 500 }}>₹{Math.round(r.prize).toLocaleString('en-IN')}</td></tr>
          ))}
          {rows.length > 0 && (
            <tr><td style={{ fontWeight: 500 }}>Total</td><td></td><td></td><td style={{ fontWeight: 600 }}>₹{Math.round(grandTotal).toLocaleString('en-IN')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
