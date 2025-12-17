import React, { useEffect, useState } from 'react';
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
  number?: string;
  billingType?: 'HOURLY' | 'UNIT';
  unitPrice?: number | null;
  unitName?: string | null;
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

  // New task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskProject, setTaskProject] = useState<Project | null>(null);
  const [taskDraft, setTaskDraft] = useState<Task>({ title: '', description: '', number: '', billingType: 'HOURLY', unitPrice: null, unitName: null });

  // Accordion state
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [projectTasks, setProjectTasks] = useState<Map<number, Task[]>>(new Map());

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
      // Fetch task counts for all projects
      const taskPromises = (data || []).map(async (p) => {
        try {
          const { data: tasks } = await api.get<Task[]>(`/tasks/project/${p.id}`);
          return { projectId: p.id!, tasks: tasks || [] };
        } catch (e) {
          console.error(`Error fetching tasks for project ${p.id}`, e);
          return { projectId: p.id!, tasks: [] };
        }
      });
      const results = await Promise.all(taskPromises);
      const newTaskMap = new Map<number, Task[]>();
      results.forEach(r => newTaskMap.set(r.projectId, r.tasks));
      setProjectTasks(newTaskMap);
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

  const openTaskModal = (p: Project) => {
    setTaskProject(p);
    const projectNumber = (p as any).number || '';
    const firstDash = projectNumber.indexOf('-');
    const prefix = firstDash > 0 ? `${projectNumber.substring(0, firstDash)}-` : `${projectNumber}-`;
    setTaskDraft({ title: '', description: '', number: prefix, billingType: 'HOURLY', unitPrice: null, unitName: null });
    setTaskModalOpen(true);
  };

  const openTaskEditModal = (project: Project, task: Task) => {
    setTaskProject(project);
    setTaskDraft(task);
    setTaskModalOpen(true);
  };

  const deleteTask = async (taskId: number) => {
    const ok = await showConfirm('Usunąć to zadanie?');
    if (!ok) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      if (taskProject) {
        const { data } = await api.get<Task[]>(`/tasks/project/${taskProject.id}`);
        setProjectTasks(prev => new Map(prev).set(taskProject.id!, data || []));
      }
      await showMessage('Zadanie usunięte');
    } catch (e: any) {
      console.error('Error deleting task', e);
      await showError(e.response?.data?.message || 'Błąd usuwania zadania');
    }
  };

  const saveTask = async () => {
    if (!taskProject) return;
    const projectNumber = (taskProject as any).number || '';
    const firstDash = projectNumber.indexOf('-');
    const prefix = firstDash > 0 ? `${projectNumber.substring(0, firstDash)}-` : `${projectNumber}-`;
    if (!taskDraft.title || !taskDraft.title.trim()) {
      await showError('Tytuł zadania jest wymagany');
      return;
    }
    if (!taskDraft.number || !taskDraft.number.trim()) {
      await showError('Numer zadania jest wymagany');
      return;
    }
    if (prefix && !taskDraft.number.startsWith(prefix)) {
      await showError(`Numer zadania musi zaczynać się od ${prefix}`);
      return;
    }
    const suffix = taskDraft.number.slice(prefix.length);
    if (!suffix) {
      await showError(`Dodaj sufiks po prefiksie ${prefix}`);
      return;
    }
    if (suffix.length > 5) {
      await showError('Sufiks numeru zadania może mieć maksymalnie 5 znaków');
      return;
    }
    if ((taskDraft.billingType || 'HOURLY') === 'UNIT') {
      if (taskDraft.unitPrice == null || Number.isNaN(taskDraft.unitPrice)) {
        await showError('Cena za jednostkę jest wymagana dla rozliczenia jednostkowego');
        return;
      }
      if (!taskDraft.unitName || !taskDraft.unitName.trim()) {
        await showError('Rodzaj jednostki jest wymagany dla rozliczenia jednostkowego');
        return;
      }
    }
    try {
      if (taskDraft.id) {
        // Update existing task
        await api.put(`/tasks/${taskDraft.id}`, taskDraft);
        await showMessage('Zadanie zaktualizowane');
      } else {
        // Create new task
        await api.post(`/tasks/project/${taskProject.id}`, taskDraft);
        await showMessage('Zadanie dodane');
      }
      setTaskModalOpen(false);
      setTaskDraft({ title: '', description: '', number: '', billingType: 'HOURLY', unitPrice: null, unitName: null });
      // Refresh task list for this project in accordion
      const { data } = await api.get<Task[]>(`/tasks/project/${taskProject.id}`);
      setProjectTasks(prev => new Map(prev).set(taskProject.id!, data || []));
      // Optionally refresh tasks if editing same project
      if (editingProjectId === taskProject.id) {
        setForm(f => ({ ...f, tasks: data || [] }));
      }
    } catch (e: any) {
      console.error('Error saving task', e);
      await showError(e.response?.data?.message || 'Błąd zapisywania zadania');
    }
  };

  const addTaskRow = () => setForm(f => ({ ...f, tasks: [...f.tasks, { title: '', description: '', number: '', billingType: 'HOURLY', unitPrice: null, unitName: null }] }));
  const removeTaskRow = (idx: number) => setForm(f => ({ ...f, tasks: f.tasks.filter((_, i) => i !== idx) }));

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
    // Validate tasks
    const prefix = (form.number || '').trim() ? `${form.number.trim()}-` : '';
    for (const tsk of form.tasks) {
      if (!tsk.title || !tsk.title.trim()) {
        await showError('Tytuł zadania jest wymagany');
        return;
      }
      if (!tsk.number || !tsk.number.trim()) {
        await showError('Numer zadania jest wymagany');
        return;
      }
      if (prefix && !tsk.number.startsWith(prefix)) {
        await showError(`Numer zadania musi zaczynać się od ${prefix}`);
        return;
      }
      const suffix = tsk.number.slice(prefix.length);
      if (!suffix) {
        await showError(`Dodaj sufiks po prefiksie ${prefix}`);
        return;
      }
      if (suffix.length > 5) {
        await showError('Sufiks numeru zadania może mieć maksymalnie 5 znaków');
        return;
      }
      if ((tsk.billingType || 'HOURLY') === 'UNIT') {
        if (tsk.unitPrice == null || Number.isNaN(tsk.unitPrice)) {
          await showError('Cena za jednostkę jest wymagana dla rozliczenia jednostkowego');
          return;
        }
        if (!tsk.unitName || !tsk.unitName.trim()) {
          await showError('Rodzaj jednostki jest wymagany dla rozliczenia jednostkowego');
          return;
        }
      }
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
        setForm(f => ({ ...f, tasks: f.tasks.filter((_, i) => i !== idx) }));
      } catch (e) { console.error(e); await showError('Error deleting task'); }
    } else {
      setForm(f => ({ ...f, tasks: f.tasks.filter((_, i) => i !== idx) }));
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

  const toggleProjectTasks = async (projectId: number) => {
    if (expandedProjects.has(projectId)) {
      // Collapse
      setExpandedProjects(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    } else {
      // Expand - fetch tasks if not already loaded
      setExpandedProjects(prev => new Set(prev).add(projectId));
      if (!projectTasks.has(projectId)) {
        try {
          const { data } = await api.get<Task[]>(`/tasks/project/${projectId}`);
          setProjectTasks(prev => new Map(prev).set(projectId, data || []));
        } catch (e) {
          console.error('Error loading tasks', e);
          await showError('Błąd wczytywania zadań');
        }
      }
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

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setExpandedProjects(new Set(projects.map(p => p.id!)))}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Rozwiń wszystkie
        </button>
        <button
          onClick={() => setExpandedProjects(new Set())}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
        >
          Zwiń wszystkie
        </button>
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
              {projects.map((p, idx) => {
                const isExpanded = expandedProjects.has(p.id!);
                const tasks = projectTasks.get(p.id!) || [];
                return (
                  <React.Fragment key={p.id}>
                    <tr className="border-t">
                      <td className="py-2">{p.id}</td>
                      <td className="py-2">{(p as any).number || '-'}</td>
                      <td className="py-2">{(p as any).managerUaId ? (managers.find(m => m.id === (p as any).managerUaId)?.firstName + ' ' + managers.find(m => m.id === (p as any).managerUaId)?.lastName) : '-'}</td>
                      <td className="py-2">{p.name}</td>
                      <td className="py-2">{p.description || '-'}</td>
                      <td className="py-2">
                        <button
                          onClick={() => toggleProjectTasks(p.id!)}
                          className="px-2 py-1 bg-accent-500 hover:bg-accent-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                        >
                          <span>{isExpanded ? '▼' : '▶'}</span>
                          <span>Zadania ({tasks.length})</span>
                        </button>
                      </td>
                      <td className="py-2">
                        <span className="text-sm font-medium">{p.active ? 'Aktywny' : 'Nieaktywny'}</span>
                      </td>
                      <td className="py-2 flex gap-2">
                        <button onClick={() => openEdit(p)} className="px-2 py-1 bg-primary-600 text-white rounded-md text-sm">Edytuj</button>
                        <button onClick={() => handleDeleteProject(p)} className="px-2 py-1 bg-red-600 text-white rounded-md text-sm">Usuń</button>
                        <button onClick={() => openTaskModal(p)} className="px-2 py-1 bg-accent-500 text-white rounded-md text-sm">Dodaj zadanie</button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${p.id}-tasks`} className="border-t bg-gray-50">
                        <td colSpan={8} className="py-3 px-4">
                          {tasks.length === 0 ? (
                            <div className="text-gray-500 text-sm italic">Brak zadań w tym projekcie</div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-gray-700 mb-2">Lista zadań:</div>
                              {tasks.map(task => (
                                <div key={task.id} className="bg-white border rounded-md p-3 shadow-sm">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {task.number && <span className="text-accent-600 mr-2">[{task.number}]</span>}
                                        {task.title}
                                      </div>
                                      {task.description && <div className="text-sm text-gray-600 mt-1">{task.description}</div>}
                                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                        <span className="font-medium">
                                          Rozliczenie: {task.billingType === 'UNIT' ? 'Jednostkowe' : 'Godzinowe'}
                                        </span>
                                        {task.billingType === 'UNIT' && task.unitPrice && (
                                          <span>Cena: {task.unitPrice} ₴ / {task.unitName || 'szt.'}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2 ml-2">
                                      <button
                                        onClick={() => openTaskEditModal(p, task)}
                                        className="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs transition-colors"
                                      >
                                        Edytuj
                                      </button>
                                      <button
                                        onClick={() => deleteTask(task.id!)}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                                      >
                                        Usuń
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {
        showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-4 max-h-[80vh] mx-auto">
                <h3 className="text-lg font-semibold mb-2">Nowy projekt</h3>
                <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-2">
                  <input className="w-60 p-2 border rounded" placeholder="Numer projektu" maxLength={12} value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
                  <input className="w-full p-2 border rounded" placeholder="Nazwa projektu" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input className="w-72 p-2 border rounded" placeholder="Kierownik MGGP (opcjonalnie)" maxLength={30} value={form.managerMggp} onChange={e => setForm({ ...form, managerMggp: e.target.value })} />
                  <div>
                    <label className="text-sm block mb-1">Kierownik UA (opcjonalnie)</label>
                    <select className="w-72 p-2 border rounded" value={form.managerUaId || ''} onChange={e => setForm({ ...form, managerUaId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">— wybierz —</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <textarea className="w-full p-2 border rounded" placeholder="Opis (opcjonalny)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-6 w-6 md:h-7 md:w-7 text-accent-600 rounded border-gray-300 focus:ring-3 focus:ring-accent-200"
                      checked={form.active}
                      onChange={e => setForm({ ...form, active: e.target.checked })}
                    />
                    <label className="text-sm font-medium">{form.active ? 'Aktywny' : 'Nieaktywny'}</label>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Członkowie projektu</h4>
                    <input placeholder="Szukaj użytkownika..." className="w-full p-2 border rounded mb-2" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                    <div className="h-44 overflow-y-auto border rounded p-2 bg-gray-50" tabIndex={0}>
                      {filteredMembers.map(u => (
                        <label key={u.id} className="flex items-center gap-2 h-11 px-2 rounded cursor-pointer hover:bg-gray-100">
                          <input type="checkbox" checked={selectedMemberIds.includes(u.id)} onChange={() => {
                            setSelectedMemberIds(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id]);
                          }} />
                          <div className="text-sm">{u.firstName} {u.lastName} <span className="text-xs text-gray-500">({u.email})</span></div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-dark-200 rounded">Anuluj</button>
                  <button onClick={handleSave} className="px-3 py-1 bg-accent-500 text-white rounded">Zapisz</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        taskModalOpen && taskProject && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4 mx-auto">
                <h3 className="text-lg font-semibold mb-2">{taskDraft.id ? 'Edytuj zadanie' : 'Nowe zadanie'}</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Projekt</label>
                      <input className="w-full p-2 border rounded bg-gray-100" readOnly value={`${(taskProject as any).number || '-'} — ${taskProject.name}`} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Numer zadania</label>
                      <input
                        className="w-full p-2 border rounded"
                        placeholder="np. 20031-T01"
                        value={taskDraft.number || ''}
                        onChange={e => {
                          if (!taskProject) return;
                          const projectNumber = (taskProject as any).number || '';
                          const firstDash = projectNumber.indexOf('-');
                          const prefix = firstDash > 0 ? `${projectNumber.substring(0, firstDash)}-` : `${projectNumber}-`;
                          const raw = e.target.value;
                          let value = raw.startsWith(prefix) ? raw : `${prefix}${raw.replace(prefix, '')}`;
                          const suffix = value.slice(prefix.length);
                          if (suffix.length > 5) {
                            value = `${prefix}${suffix.slice(0, 5)}`;
                          }
                          setTaskDraft({ ...taskDraft, number: value });
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Numer musi zaczynać się od {(() => {
                        const pn = (taskProject as any)?.number || '';
                        const fd = pn.indexOf('-');
                        return fd > 0 ? pn.substring(0, fd) : pn;
                      })()}- i mieć do 5 znaków po prefiksie.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Tytuł</label>
                      <input className="w-full p-2 border rounded" value={taskDraft.title} onChange={e => setTaskDraft({ ...taskDraft, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Opis</label>
                      <input className="w-full p-2 border rounded" value={taskDraft.description || ''} onChange={e => setTaskDraft({ ...taskDraft, description: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-1">
                      <label className="text-xs text-gray-600">Rozliczenie</label>
                      <select className="w-full p-2 border rounded" value={taskDraft.billingType || 'HOURLY'} onChange={e => {
                        const bt = e.target.value as 'HOURLY' | 'UNIT';
                        setTaskDraft({ ...taskDraft, billingType: bt, unitPrice: bt === 'HOURLY' ? null : (taskDraft.unitPrice ?? null), unitName: bt === 'HOURLY' ? null : (taskDraft.unitName ?? null) });
                      }}>
                        <option value="HOURLY">Godzinowe</option>
                        <option value="UNIT">Jednostkowe</option>
                      </select>
                    </div>
                    {(taskDraft.billingType || 'HOURLY') === 'UNIT' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-600">Cena/jedn. (₴)</label>
                          <input type="number" step="0.01" className="w-full p-2 border rounded" value={(taskDraft.unitPrice ?? '') as any} onChange={e => setTaskDraft({ ...taskDraft, unitPrice: e.target.value ? Number(e.target.value) : null })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-600">Jednostka</label>
                          <input className="w-full p-2 border rounded" placeholder="np. szt., km" value={taskDraft.unitName || ''} onChange={e => setTaskDraft({ ...taskDraft, unitName: e.target.value })} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setTaskModalOpen(false)} className="px-3 py-1 bg-dark-200 rounded">Anuluj</button>
                  <button onClick={saveTask} className="px-3 py-1 bg-accent-500 text-white rounded">Zapisz</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}


