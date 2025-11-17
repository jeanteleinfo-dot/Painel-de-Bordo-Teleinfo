import React, { useState, useMemo } from 'react';
import type { Project, KeyFact, NextStep, DetailedProject } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const statusColors: { [key: string]: { pill: string; chart: string } } = {
    'FINALIZADO': { pill: 'bg-green-500/10 text-green-400', chart: '#22c55e' },
    'EM ANDAMENTO': { pill: 'bg-blue-500/10 text-blue-400', chart: '#3b82f6' },
    'PARALIZADO': { pill: 'bg-red-500/10 text-red-400', chart: '#ef4444' },
    'NÃO INICIADO': { pill: 'bg-yellow-500/10 text-yellow-400', chart: '#eab308' },
    'DEFAULT': { pill: 'bg-gray-500/10 text-gray-400', chart: '#6b7280' },
};

const normalizeStatus = (status: any): string => {
    if (!status) return "";
    return status.toString().trim().toUpperCase();
};

const getStatusChartColor = (status: string) => {
    const normalized = normalizeStatus(status);
    if (normalized.startsWith("FINALIZADO")) return statusColors['FINALIZADO'].chart;
    if (normalized.startsWith("EM ANDAMENTO")) return statusColors['EM ANDAMENTO'].chart;
    if (normalized.startsWith("PARALIZADO")) return statusColors['PARALIZADO'].chart;
    if (normalized.startsWith("NÃO INICIADO")) return statusColors['NÃO INICIADO'].chart;
    return statusColors['DEFAULT'].chart;
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

const Slide: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white text-gray-800 p-10 mb-10 rounded-lg shadow-2xl print-slide ${className || ''}`}>{children}</div>
);

interface PresentationViewProps {
    allProjects: Project[];
}

const PresentationView: React.FC<PresentationViewProps> = ({ allProjects }) => {
    const [keyFacts, setKeyFacts] = useLocalStorage<KeyFact[]>('teleinfo_keyfacts', []);
    const [nextSteps, setNextSteps] = useLocalStorage<NextStep[]>('teleinfo_nextsteps', []);
    const [detailedProjects] = useLocalStorage<DetailedProject[]>('teleinfo_detailed_projects', []);
    const [newFactText, setNewFactText] = useState('');
    const [newFactLogo, setNewFactLogo] = useState('');
    const [newNextStepProject, setNewNextStepProject] = useState('');
    const [newNextStepDesc, setNewNextStepDesc] = useState('');

    const portfolioSummary = useMemo(() => {
        const data = allProjects;
        let finished = 0, inProgress = 0, paralyzed = 0, notStarted = 0;
        const statusCounts: { [key: string]: number } = {};
        const buCounts: { [key: string]: number } = {};
        
        data.forEach(p => {
            const s = p.STATUS;
            if (s.startsWith("FINALIZADO")) finished++;
            else if (s.startsWith("EM ANDAMENTO")) inProgress++;
            else if (s.startsWith("PARALIZADO")) paralyzed++;
            else if (s.startsWith("NÃO INICIADO")) notStarted++;

            const status = s || "N/A";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            const bu = p.BUs || "N/A";
            buCounts[bu] = (buCounts[bu] || 0) + 1;
        });

        const percValues = data.map(p => p.perc).filter((v): v is number => typeof v === 'number');
        const avg = percValues.length ? percValues.reduce((a, b) => a + b, 0) / percValues.length : 0;
        
        return {
            total: data.length, avgPercent: `${avg.toFixed(1)}%`, finished, inProgress, paralyzed, notStarted,
            statusChartData: Object.entries(statusCounts).map(([name, value]) => ({ name, Projetos: value, color: getStatusChartColor(name) })),
            buChartData: Object.entries(buCounts).map(([name, value]) => ({ name, Projetos: value, color: '#f97316' })),
        };
    }, [allProjects]);

    const addKeyFact = () => {
        if (!newFactText.trim()) return;
        setKeyFacts([...keyFacts, { id: Date.now().toString(), text: newFactText, logoUrl: newFactLogo }]);
        setNewFactText('');
        setNewFactLogo('');
    };
    const removeKeyFact = (id: string) => setKeyFacts(keyFacts.filter(f => f.id !== id));

    const addNextStep = () => {
        if (!newNextStepProject.trim() || !newNextStepDesc.trim()) return;
        setNextSteps([...nextSteps, { id: Date.now().toString(), project: newNextStepProject, description: newNextStepDesc }]);
        setNewNextStepProject('');
        setNewNextStepDesc('');
    };
    const removeNextStep = (id: string) => setNextSteps(nextSteps.filter(s => s.id !== id));
    
    const generatePdf = () => {
        const element = document.getElementById('presentation-content');
        const opt = {
            margin: 0,
            filename: 'Relatorio_De_Status_Teleinfo.pdf',
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' as const }
        };
        html2pdf().from(element).set(opt).save();
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Gerador de Apresentação</h1>
                <button onClick={generatePdf} className="bg-teleinfo-green hover:bg-teleinfo-green/90 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                    <Download size={16} /> Gerar PDF
                </button>
            </div>

            <div id="presentation-content">
                {/* Cover Slide */}
                <Slide className="text-center flex flex-col items-center justify-center h-[500px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-teleinfo-blue">
                       <path d="M12 2.25a.75.75 0 01.75.75v11.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z" />
                       <path fillRule="evenodd" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-1.5a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" clipRule="evenodd" />
                    </svg>
                    <h1 className="text-5xl font-bold text-teleinfo-blue mt-4">Status Report</h1>
                    <p className="text-xl text-gray-500 mt-2">Apresentação em {new Date().toLocaleDateString('pt-BR')}</p>
                    <div className="w-48 h-1.5 bg-teleinfo-blue mt-6 rounded-full"></div>
                </Slide>
                
                {/* Key Facts Slide */}
                <Slide>
                    <h2 className="text-3xl font-bold text-teleinfo-blue mb-6">Fatos Relevantes do Período</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            {keyFacts.length > 0 ? (
                                <ul className="space-y-4">
                                    {keyFacts.map(fact => (
                                        <li key={fact.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                            {fact.logoUrl && <img src={fact.logoUrl} alt="logo" className="w-10 h-10 object-contain"/>}
                                            <span className="flex-grow">{fact.text}</span>
                                            <button onClick={() => removeKeyFact(fact.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Nenhum fato relevante adicionado.</p>
                            )}
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Adicionar Fato Relevante</h3>
                            <input type="text" value={newFactText} onChange={e => setNewFactText(e.target.value)} placeholder="Descrição do fato" className="w-full border-gray-300 rounded-md p-2 mb-2"/>
                            <input type="text" value={newFactLogo} onChange={e => setNewFactLogo(e.target.value)} placeholder="URL do logo (opcional)" className="w-full border-gray-300 rounded-md p-2 mb-2"/>
                            <button onClick={addKeyFact} className="bg-teleinfo-blue text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-colors w-full justify-center">
                                <Plus size={16}/> Adicionar
                            </button>
                        </div>
                    </div>
                </Slide>
                
                 {/* Portfolio Summary Slide */}
                <Slide>
                    <h2 className="text-3xl font-bold text-teleinfo-blue mb-6">Visão Geral do Portfólio</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-500">Projetos Totais</p><p className="text-2xl font-bold">{portfolioSummary.total}</p></div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-500">Média Conclusão</p><p className="text-2xl font-bold">{portfolioSummary.avgPercent}</p></div>
                        <div className="bg-green-100 p-4 rounded-lg text-center"><p className="text-sm text-green-700">Finalizados</p><p className="text-2xl font-bold text-green-800">{portfolioSummary.finished}</p></div>
                        <div className="bg-blue-100 p-4 rounded-lg text-center"><p className="text-sm text-blue-700">Em Andamento</p><p className="text-2xl font-bold text-blue-800">{portfolioSummary.inProgress}</p></div>
                        <div className="bg-red-100 p-4 rounded-lg text-center"><p className="text-sm text-red-700">Paralisados</p><p className="text-2xl font-bold text-red-800">{portfolioSummary.paralyzed}</p></div>
                        <div className="bg-yellow-100 p-4 rounded-lg text-center"><p className="text-sm text-yellow-700">Não Iniciados</p><p className="text-2xl font-bold text-yellow-800">{portfolioSummary.notStarted}</p></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-80">
                         <div>
                            <h3 className="font-semibold text-center mb-2">Projetos por Status</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={portfolioSummary.statusChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="Projetos">
                                        {portfolioSummary.statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <h3 className="font-semibold text-center mb-2">Projetos por Unidade de Negócio</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={portfolioSummary.buChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="Projetos" fill="#f97316" />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                </Slide>

                {/* Detailed Projects Slides */}
                {detailedProjects.map(proj => (
                    <Slide key={proj.id}>
                        <h2 className="text-3xl font-bold text-teleinfo-blue mb-4">Projeto Detalhado: {proj.name}</h2>
                        <div className="flex justify-between items-center text-gray-600 mb-6">
                            <span>Início: {proj.start || 'N/A'}</span>
                            <span>Término: {proj.end || 'N/A'}</span>
                        </div>
                        <ul className="space-y-2">
                           {proj.steps.map((step, i) => (
                               <li key={i}>
                                   <div className="flex justify-between items-center mb-1">
                                       <span>{step.name}</span>
                                       <span className="font-semibold">{step.perc}%</span>
                                   </div>
                                   <div className="w-full bg-gray-200 rounded-full h-2.5">
                                       <div className="bg-teleinfo-blue h-2.5 rounded-full" style={{ width: `${step.perc}%` }}></div>
                                   </div>
                               </li>
                           ))}
                        </ul>
                    </Slide>
                ))}

                 {/* Next Steps Slide */}
                <Slide>
                    <h2 className="text-3xl font-bold text-teleinfo-blue mb-6">Próximos Passos</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            {nextSteps.length > 0 ? (
                                <ul className="space-y-4">
                                    {nextSteps.map(step => (
                                        <li key={step.id} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold">{step.project}</p>
                                                    <p className="text-gray-600">{step.description}</p>
                                                </div>
                                                <button onClick={() => removeNextStep(step.id)} className="text-red-500 hover:text-red-400 ml-4"><Trash2 size={16}/></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Nenhum próximo passo adicionado.</p>
                            )}
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                             <h3 className="font-semibold mb-2">Adicionar Próximo Passo</h3>
                            <input type="text" value={newNextStepProject} onChange={e => setNewNextStepProject(e.target.value)} placeholder="Nome do Projeto" className="w-full border-gray-300 rounded-md p-2 mb-2"/>
                            <textarea value={newNextStepDesc} onChange={e => setNewNextStepDesc(e.target.value)} placeholder="Descrição da ação/entrega" rows={3} className="w-full border-gray-300 rounded-md p-2 mb-2"/>
                            <button onClick={addNextStep} className="bg-teleinfo-blue text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-colors w-full justify-center">
                                <Plus size={16}/> Adicionar
                            </button>
                        </div>
                    </div>
                </Slide>
            </div>
        </div>
    );
};

export default PresentationView;
