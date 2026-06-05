import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import TopPage from './pages/TopPage';
import ScenarioPage from './pages/ScenarioPage';
import ConfigPage from './pages/ConfigPage';
import BriefingPage from './pages/BriefingPage';
import SimulationPage from './pages/SimulationPage';
import AnalysisPage from './pages/AnalysisPage';
import ResultPage from './pages/ResultPage';

function App() {
  return (
    <SimulationProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<TopPage />} />
            <Route path="/scenario" element={<ScenarioPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/briefing" element={<BriefingPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </Layout>
      </Router>
    </SimulationProvider>
  );
}

export default App;
