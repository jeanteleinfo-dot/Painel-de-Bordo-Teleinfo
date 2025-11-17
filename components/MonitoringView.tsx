import React, { useState, useEffect, useMemo } from 'react';
import type { DetailedProject, DetailedProjectStep } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Save, FilePlus, Trash2 } from 'lucide-react';

// FIX: Added statusColors constant to resolve "Cannot find name 'statusColors'" error.
const statusColors: { [key: string]: { pill: string; chart: string } } = {
    'FINALIZADO': { pill: 'bg-green-500/10 text-green-400', chart: '#22c55e' },
    'EM ANDAMENTO': { pill: 'bg-blue-500/10 text-blue-400', chart: '#3b82f6' },
    'PARALIZADO': { pill: 'bg-red-500/10 text-red-400', chart: '#ef4444' },
    'NÃO INICIADO': { pill: 'bg-yellow-500/10 text-yellow-400', chart: '#eab308' },
    'DEFAULT': { pill: 'bg-gray-500/10 text-gray-400', chart: '#6b7280' },
};

// Custom hook for localStorage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
};

const MonitoringView: React.FC = () => {
    const [projects, setProjects] = useLocalStorage<DetailedProject[]>('teleinfo_detailed_projects', []);
    const [selectedProjectId, setSelectedProjectId] = useState<string | 'new'>('new');
    
    const [currentProject, setCurrentProject] = useState<Omit<DetailedProject, 'id'>>({
        name: '',
        start: '',
        end: '',
        steps: [
            { name: 'Planejamento', perc: 0 },
            { name: 'Execução', perc: 0 },
            { name: 'Entrega', perc: 0 },
        ],
    });

    useEffect(() => {
        if (selectedProjectId === 'new') {
            handleNewProject();
        } else {
            const project = projects.find(p => p.id === selectedProjectId);
            if (project) {
                setCurrentProject({
                    name: project.name,
                    start: project.start,
                    end: project.end,
                    steps: project.steps,
                });
            }
        }
    }, [selectedProjectId, projects]);

    const handleInputChange = (field: keyof Omit<DetailedProject, 'id' | 'steps'>, value: string) => {
        setCurrentProject(prev => ({ ...prev, [field]: value }));
    };

    // FIX: Changed value type from `string | number` to `string` to fix type error.
    // Input onChange event values are always strings.
    const handleStepChange = (index: number, field: keyof DetailedProjectStep, value: string) => {
        const newSteps = [...currentProject.steps];
        if (field === 'perc') {
            const percValue = Math.max(0, Math.min(100, Number(value)));
            newSteps[index] = { ...newSteps[index], [field]: percValue };
        } else {
            newSteps[index] = { ...newSteps[index], [field]: value };
        }
        setCurrentProject(prev => ({ ...prev, steps: newSteps }));
    };

    const addStep = () => {
        setCurrentProject(prev => ({
            ...prev,
            steps: [...prev.steps, { name: 'Nova Etapa', perc: 0 }],
        }));
    };

    const removeStep = (index: number) => {
        setCurrentProject(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
    };

    const handleSave = () => {
        if (!currentProject.name.trim()) {
            alert('O nome do projeto é obrigatório.');
            return;
        }
        if (selectedProjectId === 'new') {
            const newProject = { ...currentProject, id: Date.now().toString() };
            setProjects([...projects, newProject]);
            setSelectedProjectId(newProject.id);
        } else {
            setProjects(projects.map(p => p.id === selectedProjectId ? { ...currentProject, id: selectedProjectId } : p));
        }
        alert('Projeto salvo!');
    };
    
    const handleNewProject = () => {
        setSelectedProjectId('new');
        setCurrentProject({
            name: '',
            start: '',
            end: '',
            steps: [
                { name: 'Planejamento', perc: 0 },
                { name: 'Execução', perc: 0 },
                { name: 'Entrega', perc: 0 },
            ],
        });
    };

    const overallProgress = useMemo(() => {
        const validSteps = currentProject.steps.filter(s => s.name.trim() !== '');
        if (validSteps.length === 0) return 0;
        const total = validSteps.reduce((acc, step) => acc + step.perc, 0);
        return total / validSteps.length;
    }, [currentProject.steps]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Monitoramento Detalhado</h1>

            {/* Controls */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-5 flex flex-wrap items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="projectSelect" className="text-sm font-medium text-dark-text-secondary block mb-1">Projeto Salvo</label>
                    <select id="projectSelect" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teleinfo-blue">
                        <option value="new">(Novo Projeto)</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex-grow">
                    <label htmlFor="projectName" className="text-sm font-medium text-dark-text-secondary block mb-1">Nome do Projeto</label>
                    <input type="text" id="projectName" value={currentProject.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Nome do projeto" className="w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teleinfo-blue" />
                </div>
                <div>
                    <label htmlFor="startDate" className="text-sm font-medium text-dark-text-secondary block mb-1">Início</label>
                    <input type="date" id="startDate" value={currentProject.start} onChange={(e) => handleInputChange('start', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teleinfo-blue" />
                </div>
                <div>
                    <label htmlFor="endDate" className="text-sm font-medium text-dark-text-secondary block mb-1">Término</label>
                    <input type="date" id="endDate" value={currentProject.end} onChange={(e) => handleInputChange('end', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teleinfo-blue" />
                </div>
                <button onClick={handleSave} className="bg-teleinfo-blue hover:bg-teleinfo-blue/90 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                    <Save size={16} /> Salvar
                </button>
                 <button onClick={handleNewProject} className="bg-dark-border hover:bg-dark-border/80 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                    <FilePlus size={16} /> Novo
                </button>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Status and Steps */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-dark-card border border-teleinfo-orange rounded-lg p-6 text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">Status Geral</h3>
                        <p className="text-5xl font-bold text-teleinfo-orange mb-2">{overallProgress.toFixed(1)}%</p>
                        <p className="text-sm text-dark-text-secondary">
                            {currentProject.start && currentProject.end
                                ? `De ${currentProject.start} até ${currentProject.end}`
                                : "Por favor, defina as datas de início e término"}
                        </p>
                    </div>

                    <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Etapas do Projeto</h3>
                        <div className="space-y-3">
                            {currentProject.steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={step.name} onChange={(e) => handleStepChange(index, 'name', e.target.value)} placeholder="Nome da Etapa" className="flex-grow bg-dark-bg border border-dark-border rounded-md py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-teleinfo-blue"/>
                                    <input type="number" min="0" max="100" value={step.perc} onChange={(e) => handleStepChange(index, 'perc', e.target.value)} className="w-20 bg-dark-bg border border-dark-border rounded-md py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-teleinfo-blue"/>
                                    <button onClick={() => removeStep(index)} className="text-red-500 hover:text-red-400 p-1 rounded-full bg-red-500/10">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addStep} className="mt-4 w-full bg-dark-border hover:bg-dark-border/80 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <Plus size={16} /> Adicionar Etapa
                        </button>
                    </div>
                </div>

                {/* Right side: Chart */}
                <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-white mb-4">Status por Etapa</h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={currentProject.steps} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={statusColors.DEFAULT.chart} strokeOpacity={0.2} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 12 }} unit="%" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#c9d1d9', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(139, 148, 158, 0.1)' }}
                                    contentStyle={{
                                        backgroundColor: '#161b22',
                                        borderColor: '#30363d',
                                        borderRadius: '0.5rem',
                                    }}
                                />
                                <Bar dataKey="perc" name="Progresso" barSize={20}>
                                    {currentProject.steps.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.perc === 100 ? '#22c55e' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringView;