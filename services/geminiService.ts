import { GoogleGenAI } from "@google/genai";
import type { Project } from '../types';

let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const generateDashboardSummary = async (projectStats: {
  total: number;
  finished: number;
  inProgress: number;
  paralyzed: number;
  notStarted: number;
  buDistribution: string;
}): Promise<string> => {
  try {
    const prompt = `
      Você é um analista especialista em gerenciamento de projetos para a "Teleinfo".
      Com base nos seguintes dados do portfólio de projetos, forneça um resumo executivo conciso (2-3 parágrafos).
      Seu tom deve ser profissional e perspicaz.
      Destaque as principais conquistas (ex: número de projetos concluídos), riscos potenciais (ex: projetos paralisados) e a saúde geral do portfólio.
      Conclua com uma recomendação estratégica.
      A saída deve ser em formato Markdown.

      Dados:
      - Total de Projetos: ${projectStats.total}
      - Finalizados: ${projectStats.finished}
      - Em Andamento: ${projectStats.inProgress}
      - Paralisados: ${projectStats.paralyzed}
      - Não Iniciados: ${projectStats.notStarted}
      - Os projetos estão distribuídos nestas Unidades de Negócio: ${projectStats.buDistribution}.
    `;
    
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating dashboard summary:", error);
    return "Ocorreu um erro ao gerar o resumo da IA. Por favor, verifique o console para mais detalhes.";
  }
};

export const generateProjectRiskAnalysis = async (project: Project): Promise<string> => {
  try {
    const prompt = `
      Analise o projeto a seguir, identifique riscos potenciais e sugira uma estratégia de mitigação para cada um.
      Seja conciso e liste até 3 pontos em formato Markdown.
      Cada ponto deve estar no formato: "**Risco:** [descrição] - **Mitigação:** [sugestão]".
      
      Detalhes do Projeto:
      - Cliente: ${project.CLIENTE}
      - Tipo de Projeto: ${project['TIPO DE PROJETO']}
      - Status: ${project.STATUS}
      - Progresso: ${project.perc ?? 'N/A'}%
    `;
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating project risk analysis:", error);
    return "Erro ao gerar a análise de risco.";
  }
};