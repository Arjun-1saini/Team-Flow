import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TeamPage() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (isAdmin ? api.get('/users') : api.get('/users/search?q='))
      .then(res => setUsers(res.data.users || []))
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const toggleStatus = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/toggle-status`);
      setUsers(prev => prev.map(u => u.id === userId ? res.data.user : u));
      toast.success(res.data.message);
    } catch { toast.error('Failed to update'); }
  };

  const updateRole = async (userId, role) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? res.data.user : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{users.length} member{users.length !== 1 ? 's' : ''} in your organization</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th><th>Role</th><th>Status</th><th>Joined</th>{isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="sidebar-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                        {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.name} {u.id === user.id && <span style={{ fontSize: 11, color: 'var(--accent)' }}>(you)</span>}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {isAdmin && u.id !== user.id ? (
                      <select className="form-select" value={u.role} onChange={e => updateRole(u.id, e.target.value)} style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    )}
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.isActive ? 'var(--success)' : 'var(--text-muted)' }} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  {isAdmin && (
                    <td>
                      {u.id !== user.id && (
                        <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggleStatus(u.id)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
