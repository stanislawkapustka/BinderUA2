import { useEffect, useState } from 'react';
import api from '../lib/api';
import { showMessage, showError, showConfirm } from '../components/MessageDialog';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';

interface Project {
  id?: number;
  name: string;
  number?: string;
  description?: string;
  managerId?: number;
  active?: boolean;
}

interface Task {
  id?: number;
  title: string;
  description?: string;
  projectId?: number;
}

export default function Projects() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{ name: string; number: string; managerMggp: string; managerUaId?: number | null; description: string; tasks: Task[]; active: boolean }>({ name: '', number: '', managerMggp: '', managerUaId: null, description: '', tasks: [], active: false });
  const [managers, setManagers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [originalTaskIds, setOriginalTaskIds] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    setCurrentUser(u ? JSON.parse(u) : null);
    fetchProjects();
    fetchManagers();
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data } = await api.get<{ content: User[] }>('/users');
      setUsers(data?.content || []);
    } catch (e) {
      console.error('Error fetching users', e);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data } = await api.get<{ content: User[] }>('/users');
      const users = data?.content || [];
      setManagers(users.filter(u => u.role === 'MANAGER'));
    } catch (e) {
      console.error('Error fetching users for managers', e);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Project[]>('/projects');
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProjectId(null);
    setOriginalTaskIds([]);
    setForm({ name: '', number: '', managerMggp: '', managerUaId: null, description: '', tasks: [], active: false });
    setSelectedMemberIds([]);
    setShowModal(true);
  };

  const openEdit = async (p: Project) => {
    setEditingProjectId(p.id || null);
    setForm({ name: p.name, number: (p as any).number || '', managerMggp: (p as any).managerMggp || '', managerUaId: (p as any).managerUaId || null, description: p.description || '', tasks: [], active: !!p.active });
    setShowModal(true);
    try {
      const { data } = await api.get<Task[]>(`/tasks/project/${p.id}`);
      setForm(f => ({ ...f, tasks: data || [] }));
      setOriginalTaskIds((data || []).filter((d: any) => d.id).map((d: any) => d.id));
      // fetch current members
      const { data: members } = await api.get<User[]>(`/projects/${p.id}/members`);
      setSelectedMemberIds((members || []).map(m => m.id));
    } catch (e) {
      console.error('Error loading tasks for edit', e);
    }
  };

  const addTaskRow = () => setForm(f => ({ ...f, tasks: [...f.tasks, { title: '', description: '' }] }));
  const removeTaskRow = (idx: number) => setForm(f => ({ ...f, tasks: f.tasks.filter((_,i)=>i!==idx) }));

  const handleSave = async () => {
    if (!form.name) {
      await showError('Project name required');
      return;
    }
    if (!form.number || form.number.trim().length === 0) {
      await showError('Project number required (max 12 chars)');
      return;
    }
    if (form.number.length > 12) {
      await showError('Project number must be at most 12 characters');
      return;
    }
    // no longer require tasks when marking project active
    try {
      const payload: Project = { name: form.name, description: form.description, managerId: currentUser?.id, active: form.active, number: form.number } as any;
      // attach new manager fields
      (payload as any).managerMggp = form.managerMggp;
      (payload as any).managerUaId = form.managerUaId;
      if (!editingProjectId) {
        const { data: created } = await api.post<Project>('/projects', payload);
        // create tasks
        for (const tsk of form.tasks) {
          await api.post(`/tasks/project/${created.id}`, tsk);
        }
        // save members if any
        if (selectedMemberIds.length > 0) {
          await api.put(`/projects/${created.id}/members`, { userIds: selectedMemberIds });
        }
      } else {
        // update project
        await api.put(`/projects/${editingProjectId}`, payload);
        // determine deleted tasks
        const currentIds = form.tasks.filter(t => t.id).map(t => t.id) as number[];
        const toDelete = originalTaskIds.filter(id => !currentIds.includes(id));
        for (const id of toDelete) {
          await api.delete(`/tasks/${id}`);
        }
        // update or create tasks
        for (const tsk of form.tasks) {
          if (tsk.id) {
            await api.put(`/tasks/${tsk.id}`, tsk);
          } else {
            await api.post(`/tasks/project/${editingProjectId}`, tsk);
          }
        }
        // replace members
        await api.put(`/projects/${editingProjectId}/members`, { userIds: selectedMemberIds });
      }
      setShowModal(false);
      fetchProjects();
    } catch (err: any) {
      console.error('Error saving project', err);
      await showError(err.response?.data?.message || 'Error saving project');
    }
  };

  const handleDeleteProject = async (p: Project) => {
    const ok = await showConfirm('Czy na pewno chcesz usunąć projekt?');
    if (!ok) return;
    try {
      await api.delete(`/projects/${p.id}`);
      fetchProjects();
    } catch (e: any) {
      console.error('Error deleting project', e);
      await showError(e.response?.data?.message || 'Error deleting project');
    }
  };

  const handleDeleteTask = async (task: Task, idx: number) => {
    if (task.id) {
      const ok = await showConfirm('Usuń zadanie?');
      if (!ok) return;
      try {
        await api.delete(`/tasks/${task.id}`);
        setForm(f => ({ ...f, tasks: f.tasks.filter((_,i)=>i!==idx) }));
      } catch (e) { console.error(e); await showError('Error deleting task'); }
    } else {
      setForm(f => ({ ...f, tasks: f.tasks.filter((_,i)=>i!==idx) }));
    }
  };

  const toggleActive = async (p: Project) => {
    try {
      const newActive = !p.active;
      await api.put(`/projects/${p.id}`, { ...p, active: newActive });
      fetchProjects();
    } catch (err: any) {
      console.error('Error toggling project', err);
      await showError(err.response?.data?.message || 'Error updating project');
    }
  };

  const filteredMembers = users
    .filter(u => {
      const q = memberSearch.trim().toLowerCase();
      if (!q) return true;
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      return name.includes(q) || u.email.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projekty</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-accent-500 text-white rounded-md">+ Dodaj projekt</button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? <div>Ładowanie...</div> : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2">#</th>
                <th className="pb-2">Numer</th>
                <th className="pb-2">Kierownik UA</th>
                <th className="pb-2">Nazwa</th>
                <th className="pb-2">Opis</th>
                <th className="pb-2">Zadania</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, idx) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2">{p.id}</td>
                  <td className="py-2">{(p as any).number || '-'}</td>
                  <td className="py-2">{(p as any).managerUaId ? (managers.find(m=>m.id=== (p as any).managerUaId)?.firstName + ' ' + managers.find(m=>m.id=== (p as any).managerUaId)?.lastName) : '-'}</td>
                  <td className="py-2">{p.name}</td>
                  <td className="py-2">{p.description || '-'}</td>
                  <td className="py-2">
                    <TasksCount projectId={p.id!} />
                  </td>
                  <td className="py-2">
                    <span className="text-sm font-medium">{p.active ? 'Aktywny' : 'Nieaktywny'}</span>
                  </td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => openEdit(p)} className="px-2 py-1 bg-primary-600 text-white rounded-md text-sm">Edytuj</button>
                    <button onClick={() => handleDeleteProject(p)} className="px-2 py-1 bg-red-600 text-white rounded-md text-sm">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-4 max-h-[80vh] mx-auto">
            <h3 className="text-lg font-semibold mb-2">Nowy projekt</h3>
            <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-2">
              <input className="w-60 p-2 border rounded" placeholder="Numer projektu" maxLength={12} value={form.number} onChange={e=>setForm({...form, number: e.target.value})} />
              <input className="w-full p-2 border rounded" placeholder="Nazwa projektu" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              <input className="w-72 p-2 border rounded" placeholder="Kierownik MGGP (opcjonalnie)" maxLength={30} value={form.managerMggp} onChange={e=>setForm({...form, managerMggp: e.target.value})} />
              <div>
                <label className="text-sm block mb-1">Kierownik UA (opcjonalnie)</label>
                <select className="w-72 p-2 border rounded" value={form.managerUaId || ''} onChange={e=>setForm({...form, managerUaId: e.target.value? Number(e.target.value): null})}>
                  <option value="">— wybierz —</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>
              <textarea className="w-full p-2 border rounded" placeholder="Opis (opcjonalny)" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-6 w-6 md:h-7 md:w-7 text-accent-600 rounded border-gray-300 focus:ring-3 focus:ring-accent-200"
                  checked={form.active}
                  onChange={e=>setForm({...form, active: e.target.checked})}
                />
                <label className="text-sm font-medium">{form.active ? 'Aktywny' : 'Nieaktywny'}</label>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Zadania</h4>
                  <button onClick={addTaskRow} className="px-2 py-1 bg-primary-600 text-white rounded text-sm">Dodaj zadanie</button>
                </div>
                <div className="space-y-2 mt-2">
                  {form.tasks.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1 p-2 border rounded" placeholder="Tytuł" value={t.title} onChange={e=>{
                        const tasks = [...form.tasks]; tasks[i].title = e.target.value; setForm({...form, tasks});
                      }} />
                      <input className="w-48 p-2 border rounded" placeholder="Opis" value={t.description} onChange={e=>{
                        const tasks = [...form.tasks]; tasks[i].description = e.target.value; setForm({...form, tasks});
                      }} />
                      <button onClick={()=>removeTaskRow(i)} className="px-2 py-1 bg-red-600 text-white rounded">Usuń</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Członkowie projektu</h4>
                <input placeholder="Szukaj użytkownika..." className="w-full p-2 border rounded mb-2" value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} />
                <div className="h-44 overflow-y-auto border rounded p-2 bg-gray-50" tabIndex={0}>
                  {filteredMembers.map(u=> (
                    <label key={u.id} className="flex items-center gap-2 h-11 px-2 rounded cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={selectedMemberIds.includes(u.id)} onChange={()=>{
                        setSelectedMemberIds(s=> s.includes(u.id) ? s.filter(x=>x!==u.id) : [...s, u.id]);
                      }} />
                      <div className="text-sm">{u.firstName} {u.lastName} <span className="text-xs text-gray-500">({u.email})</span></div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setShowModal(false)} className="px-3 py-1 bg-dark-200 rounded">Anuluj</button>
              <button onClick={handleSave} className="px-3 py-1 bg-accent-500 text-white rounded">Zapisz</button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

function TasksCount({ projectId }: { projectId: number }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    api.get(`/tasks/project/${projectId}`)
      .then(({ data }) => setCount((data || []).length))
      .catch(() => setCount(0));
  }, [projectId]);
  return <span>{count === null ? '...' : count}</span>;
}
