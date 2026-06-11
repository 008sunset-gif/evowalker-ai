import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { LoadingScreen } from './components/LoadingScreen';
import TopPage from './pages/TopPage';
import ScenarioPage from './pages/ScenarioPage';
import ConfigPage from './pages/ConfigPage';
import SimulationPage from './pages/SimulationPage';
import AnalysisPage from './pages/AnalysisPage';
import ResultPage from './pages/ResultPage';

function App() {
  // アプリ起動時に1回だけブート演出を表示する
  const [booting, setBooting] = useState(true);

  return (
    <SimulationProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<TopPage />} />
            <Route path="/scenario" element={<ScenarioPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </Layout>
      </Router>
      {booting && <LoadingScreen onDone={() => setBooting(false)} />}
    </SimulationProvider>
  );
}

export default App;
