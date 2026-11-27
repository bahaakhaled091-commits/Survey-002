import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Building2, Camera, CloudUpload, FolderKanban, Ruler, ScanLine, ShieldCheck } from 'lucide-react';
import './style.css';

type Project = { id: string; name: string; survey_type: string; status: string; images: {id:string;filename:string}[]; accuracy: {classification:string}; };
const API = 'http://localhost:8000/api';
function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('interior');
  const [distance, setDistance] = useState('');
  const [selected, setSelected] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  async function refresh() { try { const r = await fetch(`${API}/projects`); setProjects(await r.json()); } catch { setMessage('API not connected. Start the backend first.'); } }
  useEffect(() => { refresh(); }, []);
  async function create() {
    if (name.trim().length < 2) return setMessage('Enter a project name.');
    const r = await fetch(`${API}/projects`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,survey_type:type,known_distance_m:distance ? Number(distance) : null,control_method:'scale_reference'})});
    if (!r.ok) return setMessage('Could not create project.');
    const p = await r.json(); setSelected(p.id); setName(''); setMessage('Project created. Upload at least 3 overlapping images.'); refresh();
  }
  async function upload() {
    if (!selected || !files?.length) return setMessage('Select a project and image files first.');
    const form = new FormData(); Array.from(files).forEach(f => form.append('files', f));
    const r = await fetch(`${API}/projects/${selected}/images`, {method:'POST',body:form});
    const data = await r.json(); setMessage(r.ok ? `${data.count} image(s) uploaded.` : (data.detail || 'Upload failed.')); setFiles(null); refresh();
  }
  async function process() {
    if (!selected) return setMessage('Select a project first.');
    const r = await fetch(`${API}/projects/${selected}/process`, {method:'POST'}); const data = await r.json();
    setMessage(r.ok ? data.message : data.detail); refresh();
  }
  return <div className="app"><aside><div className="brand"><ScanLine size={27}/><span>AI SURVEY<span className="muted"> STUDIO</span></span></div><div className="nav active"><FolderKanban/> Projects</div><div className="nav"><Camera/> Capture sessions</div><div className="nav"><Ruler/> Engineering outputs</div><div className="nav"><ShieldCheck/> Accuracy & QA</div><div className="side-note">SURVEY INTELLIGENCE<br/><small>Photogrammetry · CAD · BOQ</small></div></aside><main><header><div><div className="eyebrow">ENGINEERING WORKSPACE</div><h1>Project dashboard</h1><p>Turn field imagery into measurable engineering data.</p></div><div className="status"><span/> SYSTEM PREVIEW</div></header><section className="stats"><div><Building2/><b>{projects.length}</b><small>Projects</small></div><div><Camera/><b>{projects.reduce((n,p)=>n+p.images.length,0)}</b><small>Images uploaded</small></div><div><CloudUpload/><b>0</b><small>3D jobs completed</small></div></section><section className="panel"><div className="panel-title"><div><h2>Create survey project</h2><p>Start with a room, building, or external facade.</p></div><span className="tag">MVP · 0.1</span></div><div className="form"><label>Project name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Villa 07 - As Built Survey"/></label><label>Survey scope<select value={type} onChange={e=>setType(e.target.value)}><option value="interior">Interior</option><option value="exterior">Exterior</option><option value="both">Interior + Exterior</option></select></label><label>Known reference distance (m)<input value={distance} onChange={e=>setDistance(e.target.value)} type="number" min="0" step="0.001" placeholder="e.g. 1.000"/></label><button onClick={create}>Create project</button></div></section><section className="panel"><div className="panel-title"><div><h2>Image capture & reconstruction</h2><p>Upload overlapping photos from different viewpoints.</p></div></div><div className="upload-row"><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setFiles(e.target.files)}/><button className="secondary" onClick={upload}>Upload images</button><button onClick={process}>Queue 3D reconstruction</button></div><p className="hint">Capture guidance: use 70–80% image overlap, avoid motion blur, maintain consistent exposure, and include scale/control references. A minimum of 3 images is enforced in this prototype; robust reconstruction normally needs many more.</p>{message && <div className="message">{message}</div>}</section><section className="panel"><div className="panel-title"><div><h2>Recent projects</h2><p>Your survey jobs and current processing state.</p></div><button className="text-button" onClick={refresh}>Refresh</button></div><div className="project-list">{projects.length===0 ? <div className="empty">No projects yet. Create your first survey project above.</div> : projects.map(p=><div className="project" key={p.id}><div className="project-icon"><Building2/></div><div className="project-info"><b>{p.name}</b><small>{p.survey_type} · {p.images.length} images · Accuracy: {p.accuracy.classification}</small></div><span className="tag">{p.status}</span></div>)}</div></section><footer>AI Survey Studio · Prototype build 0.1 · Engineering results require field validation before contractual use.</footer></main></div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
