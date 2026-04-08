import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DojoEntrance from './pages/DojoEntrance';
import NewWarrior from './pages/NewWarrior';
import PlacementQuiz from './pages/PlacementQuiz';
import WarriorsPath from './pages/WarriorsPath';
import TrainingSession from './pages/TrainingSession';
import BeltCeremony from './pages/BeltCeremony';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DojoEntrance />} />
        <Route path="/new-warrior" element={<NewWarrior />} />
        <Route path="/placement" element={<PlacementQuiz />} />
        <Route path="/path" element={<WarriorsPath />} />
        <Route path="/train/:unitId" element={<TrainingSession />} />
        <Route path="/belt-test/:dojoId" element={<BeltCeremony />} />
      </Routes>
    </BrowserRouter>
  );
}
