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