import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, GanttChartSquare, Presentation } from 'lucide-react';
import DashboardView from './components/DashboardView';
import MonitoringView from './components/MonitoringView';
import PresentationView from './components/PresentationView';
import type { Project } from './types';

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [fileName, setFileName] = useState<string>('');

    const handleDataLoaded = useCallback((data: Project[], name: string) => {
        setProjects(data);
        setFileName(name);
    }, []);

    const NavButton: React.FC<{ to: string; icon: React.ReactNode; children: React.ReactNode }> = ({ to, icon, children }) => {
        const location = useLocation();
        const isActive = location.pathname === to;
        return (
            <NavLink
                to={to}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${
                    isActive
                        ? 'text-teleinfo-blue border-teleinfo-blue'
                        : 'text-dark-text-secondary border-transparent hover:text-white hover:border-teleinfo-blue/50'
                }`}
            >
                {icon}
                {children}
            </NavLink>
        );
    };

    return (
        <HashRouter>
            <div className="min-h-screen bg-dark-bg text-dark-text font-sans">
                <header className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
                    <nav className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                           <div className="flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-teleinfo-blue">
                               <path d="M12 2.25a.75.75 0 01.75.75v11.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z" />
                               <path fillRule="evenodd" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-1.5a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" clipRule="evenodd" />
                             </svg>
                             <span className="text-xl font-bold text-white">Teleinfo AI</span>
                           </div>
                           <div className="flex items-center space-x-2">
                                <NavButton to="/" icon={<LayoutDashboard size={18}/>}>Painel</NavButton>
                                <NavButton to="/monitoring" icon={<GanttChartSquare size={18}/>}>Monitoramento</NavButton>
                                <NavButton to="/presentation" icon={<Presentation size={18}/>}>Apresentação</NavButton>
                           </div>
                        </div>
                    </nav>
                </header>
                <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                    <Routes>
                        <Route path="/" element={<DashboardView projects={projects} onDataLoaded={handleDataLoaded} fileName={fileName} />} />
                        <Route path="/monitoring" element={<MonitoringView />} />
                        <Route path="/presentation" element={<PresentationView allProjects={projects} />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
};

export default App;