import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { CheckSquare, Clock, AlertTriangle, FolderKanban, TrendingUp, ArrowRight } from 'lucide-react';
import { format, isPast } from 'date-fns';

const STATUS_COLORS  = { todo: '#636366', 'in-progress': '#0a84ff', review: '#bf5af2', done: '#30d158' };
const STATUS_LABELS  = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLORS = { low: '#30d158', medium: '#ffd60a', high: '#ff9f0a', critical: '#ff453a' };

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-icon" style={{ background: `${color}18` }}>
        <Icon size={20} color={color} strokeWidth={2} />
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* Custom tooltip that uses CSS variables */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-3)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '8px 14px', color: 'var(--text-1)', fontSize: 13,
      boxShadow: 'var(--shadow)',
    }}>
      {label && <div style={{ color: 'var(--text-2)', marginBottom: 4, fontWeight: 500 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setStats(res.data.stats))
      .catch(err => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (error) return (
    <div className="empty-state">
      <div className="empty-state-icon">⚠️</div>
      <h3>Could not load dashboard</h3>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statusData = (stats?.statusBreakdown || []).map(s => ({
    name: STATUS_LABELS[s._id] || s._id,
    value: s.count,
    fill: STATUS_COLORS[s._id] || '#636366',
    key: s._id,
  }));

  const priorityData = (stats?.priorityBreakdown || []).map(p => ({
    name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
    value: p.count,
    fill: PRIORITY_COLORS[p._id] || 'var(--accent)',
  }));

  const hasStats   = (stats?.totalTasks || 0) > 0;
  const hasProjects = (stats?.totalProjects || 0) > 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's an overview of your team's progress.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <FolderKanban size={15} /> {hasProjects ? 'View Projects' : 'Create a Project'}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard icon={FolderKanban} label="Total Projects"    value={stats?.totalProjects ?? 0} color="#0a84ff" delay={0} />
        <StatCard icon={CheckSquare}  label="My Active Tasks"   value={stats?.myTasks ?? 0}       color="#30d158" delay={60} />
        <StatCard icon={AlertTriangle}label="Overdue Tasks"     value={stats?.overdueTasks ?? 0}  color="#ff453a" delay={120} />
        <StatCard icon={TrendingUp}   label="Done This Week"    value={stats?.completedThisWeek ?? 0} color="#bf5af2" delay={180} />
      </div>

      {/* Charts — only render if there are tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Task Status Pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Task Status</h2>
              <p className="card-subtitle">Distribution across all statuses</p>
            </div>
          </div>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={statusData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={76}
                    paddingAngle={3} dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
                {statusData.map(s => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: s.fill, display: 'inline-block' }} />
                    {s.name} <span style={{ color: 'var(--text-1)', fontWeight: 600, marginLeft: 2 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
              <p>No tasks yet — create a task to see status breakdown</p>
            </div>
          )}
        </div>

        {/* Priority Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Priority Breakdown</h2>
              <p className="card-subtitle">Open tasks by priority level</p>
            </div>
          </div>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={32} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-3)', fontSize: 12, fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-3)', fontSize: 12, fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false} allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                  {priorityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📈</div>
              <p>No open tasks — all done or no tasks yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="card-title">Recent Activity</h2>
            <p className="card-subtitle">Latest task updates across your projects</p>
          </div>
          <Link to="/tasks" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {(stats?.recentTasks?.length || 0) > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTasks.map(task => {
                  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                  return (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>{task.title}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: task.project?.color || 'var(--accent)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{task.project?.name || '—'}</span>
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>
                        {task.assignedTo?.name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}
                      </td>
                      <td>
                        <span className={`badge badge-${task.status}`}>
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                      </td>
                      <td>
                        {task.dueDate ? (
                          <span className={`due-date ${overdue ? 'overdue' : 'ok'}`}>
                            <Clock size={11} />{format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        ) : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No activity yet</h3>
            <p>
              {hasProjects
                ? 'Open a project and create your first task'
                : 'Create a project, then add tasks to see them here'}
            </p>
            <Link to="/projects" className="btn btn-primary" style={{ marginTop: 4 }}>
              <FolderKanban size={15} /> Go to Projects
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
