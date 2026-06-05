import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  ScenarioType,
  PersonalityType,
  SpeedType,
  PopulationType,
  GenerationOptionType,
  SimulationStatusType,
  AIConfig,
  MockFinalResult,
  GenerationResult,
} from '../types/simulation';

interface SimulationContextType {
  // 1. 管理する状態 (State)
  selectedScenarioId: ScenarioType;
  aiPersonality: PersonalityType;
  learningSpeed: SpeedType;
  carCount: PopulationType;
  maxGenerations: GenerationOptionType;
  currentGeneration: number;
  simulationStatus: SimulationStatusType;
  mockEvolutionHistory: GenerationResult[];
  mockFinalResult: MockFinalResult | null;
  isSimulationCompleted: boolean;

  // 2. 操作関数
  selectScenario: (scenarioId: ScenarioType) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  completeSimulation: (mockResult: MockFinalResult) => void;
  goToAnalysis: () => void;
  resetSimulation: () => void;
  setCurrentGeneration: (gen: number) => void;
  setMockEvolutionHistory: (history: GenerationResult[]) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
  // 状態の定義
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioType>('');
  const [aiPersonality, setAiPersonality] = useState<PersonalityType>('');
  const [learningSpeed, setLearningSpeed] = useState<SpeedType>('normal');
  const [carCount, setCarCount] = useState<PopulationType>('normal');
  const [maxGenerations, setMaxGenerations] = useState<GenerationOptionType>(30);
  const [currentGeneration, setCurrentGeneration] = useState<number>(1);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatusType>('idle');
  const [mockEvolutionHistory, setMockEvolutionHistory] = useState<GenerationResult[]>([]);
  const [mockFinalResult, setMockFinalResult] = useState<MockFinalResult | null>(null);
  const [isSimulationCompleted, setIsSimulationCompleted] = useState<boolean>(false);

  // コース選択
  const selectScenario = (scenarioId: ScenarioType) => {
    setSelectedScenarioId(scenarioId);
    console.log(`[Context] selectScenario: ${scenarioId}`);
  };

  // AI設定値の更新
  const updateAIConfig = (config: Partial<AIConfig>) => {
    if (config.aiPersonality !== undefined) setAiPersonality(config.aiPersonality);
    if (config.learningSpeed !== undefined) setLearningSpeed(config.learningSpeed);
    if (config.carCount !== undefined) setCarCount(config.carCount);
    if (config.maxGenerations !== undefined) setMaxGenerations(config.maxGenerations);
    console.log('[Context] updateAIConfig:', config);
  };

  // シミュレーションの開始・再開
  const startSimulation = () => {
    setSimulationStatus('running');
    console.log('[Context] startSimulation');
  };

  // シミュレーションの一時停止
  const pauseSimulation = () => {
    setSimulationStatus('paused');
    console.log('[Context] pauseSimulation');
  };

  // シミュレーション走行完了
  const completeSimulation = (mockResult: MockFinalResult) => {
    setSimulationStatus('completed');
    setIsSimulationCompleted(true);
    setMockFinalResult(mockResult);
    console.log('[Context] completeSimulation:', mockResult);
  };

  // 世代分析画面への移行処理
  const goToAnalysis = () => {
    if (simulationStatus !== 'completed') {
      setSimulationStatus('completed');
    }
    setIsSimulationCompleted(true);
    console.log('[Context] goToAnalysis');
  };

  // すべての状態の初期化（リセット）
  const resetSimulation = () => {
    setSelectedScenarioId('');
    setAiPersonality('');
    setLearningSpeed('normal');
    setCarCount('normal');
    setMaxGenerations(30);
    setCurrentGeneration(1);
    setSimulationStatus('idle');
    setMockEvolutionHistory([]);
    setMockFinalResult(null);
    setIsSimulationCompleted(false);
    console.log('[Context] resetSimulation - All states initialized.');
  };

  return (
    <SimulationContext.Provider
      value={{
        selectedScenarioId,
        aiPersonality,
        learningSpeed,
        carCount,
        maxGenerations,
        currentGeneration,
        simulationStatus,
        mockEvolutionHistory,
        mockFinalResult,
        isSimulationCompleted,
        selectScenario,
        updateAIConfig,
        startSimulation,
        pauseSimulation,
        completeSimulation,
        goToAnalysis,
        resetSimulation,
        setCurrentGeneration,
        setMockEvolutionHistory,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
