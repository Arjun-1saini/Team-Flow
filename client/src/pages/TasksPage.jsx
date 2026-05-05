import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import { Search, Filter, Clock } from 'lucide-react';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ assignedTo: user.id });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      const res = await api.get(`/tasks?${params}`);
      setTasks(res.data.tasks);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [filters.status, filters.priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const updateStatus = async (taskId, status) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data.task : t));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Tasks assigned to you across all projects</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <form className="search-bar" onSubmit={handleSearch} style={{ flex: 1, maxWidth: 300 }}>
          <Search size={16} />
          <input value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Search tasks..." />
        </form>
        <select className="form-select" style={{ width: 'auto' }} value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="done">Done</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h3>No tasks found</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                  return (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.description.slice(0, 60)}...</div>}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project?.color || 'var(--accent)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13 }}>{task.project?.name || '—'}</span>
                        </span>
                      </td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>
                        <select
                          className="form-select"
                          value={task.status}
                          onChange={e => updateStatus(task.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td>
                        {task.dueDate ? (
                          <span className={`due-date ${overdue ? 'overdue' : 'ok'}`}>
                            <Clock size={12} />{format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No due date</span>}
                      </td>
                      <td>
                        <a href={`/projects/${task.project?.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View Project</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
