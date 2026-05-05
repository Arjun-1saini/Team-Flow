import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, Calendar, Users, UserPlus, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

const PROJECT_COLORS = ['#6366f1','#a855f7','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4'];

/* ── Project Create/Edit Modal ───────────────────────── */
function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '', description: project?.description || '',
    status: project?.status || 'planning', priority: project?.priority || 'medium',
    color: project?.color || '#6366f1', dueDate: project?.dueDate ? project.dueDate.slice(0,10) : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = project
        ? await api.put(`/projects/${project.id}`, form)
        : await api.post('/projects', form);
      toast.success(project ? 'Project updated!' : 'Project created!');
      onSave(res.data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Website Redesign" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief project description..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {PROJECT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                      style={{ width: 26, height: 26, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                        outline: form.color === c ? '2px solid var(--accent)' : '2px solid transparent',
                        outlineOffset: 2, transition: 'transform 0.15s ease', transform: form.color === c ? 'scale(1.15)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Add Members Modal ───────────────────────────────── */
function AddMembersModal({ project, onClose, onMemberAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [members, setMembers] = useState(project.members || []);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null); // userId being added

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      // Filter out already-members
      const memberIds = members.map(m => m.id || m.userId);
      setResults(res.data.users.filter(u => !memberIds.includes(u.id)));
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const addMember = async (user) => {
    setAdding(user.id);
    try {
      await api.post(`/projects/${project.id}/members`, { userId: user.id, role: 'member' });
      toast.success(`${user.name} added!`);
      // Update local members list
      const newMember = { id: user.id, name: user.name, email: user.email, role: 'member' };
      setMembers(prev => [...prev, newMember]);
      setResults(prev => prev.filter(u => u.id !== user.id));
      onMemberAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally { setAdding(null); }
  };

  const removeMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this project?`)) return;
    try {
      await api.delete(`/projects/${project.id}/members/${memberId}`);
      toast.success(`${memberName} removed`);
      setMembers(prev => prev.filter(m => (m.id || m.userId) !== memberId));
      onMemberAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Manage Members</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{project.name}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Search to add */}
          <div>
            <label className="form-label">Add a member</label>
            <div className="search-bar" style={{ maxWidth: '100%' }}>
              <Search size={14} />
              <input
                value={query}
                onChange={e => search(e.target.value)}
                placeholder="Search by name or email…"
                autoFocus
              />
              {searching && <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
            </div>

            {results.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)',
                  }}>
                    <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => addMember(u)}
                      disabled={adding === u.id}
                      style={{ flexShrink: 0 }}
                    >
                      {adding === u.id ? '…' : '+ Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {query.length >= 2 && results.length === 0 && !searching && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>No users found matching "{query}"</p>
            )}
          </div>

          {/* Current members */}
          <div>
            <label className="form-label">Current Members ({members.length})</label>
            {members.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No members yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {members.map(m => {
                  const memberId = m.id || m.userId;
                  const isOwner = project.ownerId === memberId;
                  return (
                    <div key={memberId} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)',
                    }}>
                      <div className="sidebar-avatar" style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
                        {(m.name || m.user?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {m.name || m.user?.name || 'Unknown'}
                          {isOwner && <span style={{ fontSize: 10, background: 'rgba(10,132,255,0.15)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, marginLeft: 6, fontWeight: 700 }}>Owner</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{m.role || m.ProjectMember?.role || 'member'}</div>
                      </div>
                      {!isOwner && (
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => removeMember(memberId, m.name || m.user?.name)}
                          style={{ color: 'var(--danger)', flexShrink: 0 }}
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export default function ProjectsPage() {
  const { isAdmin, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [membersProject, setMembersProject] = useState(null); // project to manage members for

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(res => setProjects(res.data.projects)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSave = (saved) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === saved.id);
      return exists ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev];
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <h3>No projects yet</h3>
          {isAdmin
            ? <><p>Create your first project to get started</p>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Create Project</button></>
            : <p>You haven't been added to any projects yet.<br />Ask your Admin to add you.</p>}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const done = project.taskCounts?.done || 0;
            const total = project.taskCounts?.total || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isProjectOwner = project.ownerId === user?.id || project.owner?.id === user?.id;

            return (
              <div key={project.id} className="project-card">
                {/* Color accent strip */}
                <div className="project-card-accent" style={{ background: project.color }} />

                <div className="project-card-body" style={{ flex: 1 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <Link to={`/projects/${project.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                      className="project-card-name">
                      {project.name}
                    </Link>
                    {(isAdmin || isProjectOwner) && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => { setEditProject(project); setShowModal(true); }}
                          title="Edit project">✏️</button>
                        <button className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleDelete(project.id)}
                          title="Delete project" style={{ color: 'var(--danger)' }}>🗑️</button>
                      </div>
                    )}
                  </div>

                  <p className="project-card-desc">{project.description || 'No description'}</p>

                  {/* Progress */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 5 }}>
                      <span>{done}/{total} tasks done</span><span>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: project.color }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="project-card-footer" style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${project.status}`}>{project.status.replace('-', ' ')}</span>
                      <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
                        <Users size={12} />{project.members?.length || 0}
                      </span>
                      {project.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
                          <Calendar size={12} />{format(new Date(project.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Members button — admin/owner only */}
                  {(isAdmin || isProjectOwner) && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setMembersProject(project)}
                      style={{ width: '100%', marginTop: 12, justifyContent: 'center', gap: 6 }}
                    >
                      <UserPlus size={13} /> Manage Members
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project modal */}
      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={handleSave}
        />
      )}

      {/* Members modal */}
      {membersProject && (
        <AddMembersModal
          project={membersProject}
          onClose={() => setMembersProject(null)}
          onMemberAdded={fetchProjects}
        />
      )}
    </div>
  );
}
