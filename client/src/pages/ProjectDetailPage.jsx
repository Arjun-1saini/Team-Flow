import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, UserPlus, Trash2, Search } from 'lucide-react';
import { format, isPast } from 'date-fns';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#94a3b8' },
  { id: 'in-progress', label: 'In Progress',  color: '#60a5fa' },
  { id: 'review',      label: 'In Review',    color: '#c084fc' },
  { id: 'done',        label: 'Done',         color: '#34d399' },
];

/* ── Task Card ─────────────────────────────────────────── */
function TaskCard({ task, onClick }) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  return (
    <div className="kanban-card" onClick={() => onClick(task)}>
      <div className="kanban-card-title">{task.title}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      </div>
      <div className="kanban-card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.assignedTo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="sidebar-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{task.assignedTo.name}</span>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Unassigned</span>
          )}
        </div>
        {task.dueDate && (
          <span style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-3)', fontWeight: 500 }}>
            {overdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Task Modal ────────────────────────────────────────── */
function TaskModal({ task, project, defaultStatus, onClose, onSave, onDelete }) {
  // project.members = User[] with .id, .name via Sequelize belongsToMany
  const memberList = project.members || [];

  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    status:      task?.status      || defaultStatus || 'todo',
    priority:    task?.priority    || 'medium',
    assignedTo:  task?.assignedTo?.id || '',
    dueDate:     task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [comment, setComment]   = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      let res;
      if (task) {
        res = await api.put(`/tasks/${task.id}`, form);
        toast.success('Task updated!');
      } else {
        res = await api.post('/tasks', { ...form, project: project.id });
        toast.success('Task created!');
      }
      onSave(res.data.task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally { setLoading(false); }
  };

  const handleComment = async () => {
    if (!comment.trim() || !task) return;
    try {
      const res = await api.post(`/tasks/${task.id}/comments`, { text: comment });
      setComments(res.data.comments);
      setComment('');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Task deleted');
      onDelete(task.id);
      onClose();
    } catch { toast.error('Failed to delete task'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {task && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="What needs to be done?" required autoFocus />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Add more detail…" />
            </div>

            {/* Status + Priority */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Assign To + Due Date */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={form.assignedTo}
                  onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {/* Sequelize returns members as User objects: m.id, m.name */}
                  {memberList.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            {/* Comments (edit mode only) */}
            {task && (
              <div style={{ marginTop: 8 }}>
                <div className="form-label" style={{ marginBottom: 10 }}>
                  Comments ({comments.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
                  {comments.length === 0
                    ? <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No comments yet</p>
                    : comments.map((c, i) => (
                      <div key={i} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2, color: 'var(--text-1)' }}>
                          {c.user?.name || 'User'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{c.text}</div>
                      </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment…"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleComment())} />
                  <button type="button" className="btn btn-secondary" onClick={handleComment}>Post</button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Add Member Modal ──────────────────────────────────── */
function AddMemberModal({ project, onClose, onAdd }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
    // project.members = User[] with .id (Sequelize belongsToMany)
    const existing = (project.members || []).map(m => m.id);
    setResults(res.data.users.filter(u => !existing.includes(u.id)));
  };

  const addMember = async (userId) => {
    setLoading(true);
    try {
      await api.post(`/projects/${project.id}/members`, { userId, role: 'member' });
      toast.success('Member added!');
      onAdd();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Team Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <Search size={14} />
            <input value={query} onChange={e => search(e.target.value)}
              placeholder="Search by name or email…" autoFocus />
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)',
              }}>
                <div className="sidebar-avatar">{u.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{u.email}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addMember(u.id)} disabled={loading}>
                  + Add
                </button>
              </div>
            ))}
            {query.length >= 2 && results.length === 0 && (
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No users found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject]           = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask]         = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
    } catch { toast.error('Failed to load project'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleTaskSave = (saved) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === saved.id);
      return exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
    });
  };

  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data.task : t));
    } catch { toast.error('Failed to update status'); }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      toast.success('Member removed');
      fetchData();
    } catch { toast.error('Failed to remove member'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  // Sequelize belongsToMany: project.members = User[], project.owner = User
  const isOwner     = project.owner?.id === user?.id;
  // Find current user in members list
  const myMembership = (project.members || []).find(m => m.id === user?.id);
  const myProjectRole = myMembership?.ProjectMember?.role;
  const canManage   = isOwner || myProjectRole === 'admin' || isAdmin;

  const openTask = (task) => { setEditTask(task); setShowTaskModal(true); };
  const openNew  = (status) => { setEditTask(null); setDefaultStatus(status); setShowTaskModal(true); };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/projects" className="btn btn-ghost btn-icon"><ArrowLeft size={18} /></Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color }} />
              <h1 className="page-title">{project.name}</h1>
            </div>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canManage && (
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={15} /> Add Member
            </button>
          )}
          <button className="btn btn-primary" onClick={() => openNew('todo')}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title">Team Members</h2>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {(project.members || []).length} member{(project.members || []).length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Owner */}
          {project.owner && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-3)', borderRadius: 9, padding: '7px 12px',
              border: '1px solid rgba(10,132,255,0.2)',
            }}>
              <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                {project.owner.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{project.owner.name}</div>
                <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>Owner</div>
              </div>
            </div>
          )}
          {/* Other members (exclude owner to avoid duplication) */}
          {(project.members || [])
            .filter(m => m.id !== project.owner?.id)
            .map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-3)', borderRadius: 9, padding: '7px 12px',
                border: '1px solid var(--border)',
              }}>
                <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'capitalize' }}>
                    {m.ProjectMember?.role || 'member'}
                  </div>
                </div>
                {canManage && (
                  <button className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => removeMember(m.id)}
                    style={{ color: 'var(--danger)', marginLeft: 2 }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  {col.label}
                </span>
                <span className="kanban-column-count">{colTasks.length}</span>
              </div>

              {colTasks.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>
                  No tasks
                </div>
              ) : (
                colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={openTask} />
                ))
              )}

              <button className="kanban-add" onClick={() => openNew(col.id)}>
                <Plus size={14} /> Add task
              </button>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          project={project}
          defaultStatus={defaultStatus}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          project={project}
          onClose={() => setShowMemberModal(false)}
          onAdd={fetchData}
        />
      )}
    </div>
  );
}
