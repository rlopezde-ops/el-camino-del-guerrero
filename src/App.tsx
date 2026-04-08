import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DojoEntrance from './pages/DojoEntrance';
import NewWarrior from './pages/NewWarrior';
import EditWarrior from './pages/EditWarrior';
import PlacementQuiz from './pages/PlacementQuiz';
import WarriorsPath from './pages/WarriorsPath';
import TrainingSession from './pages/TrainingSession';
import BeltCeremony from './pages/BeltCeremony';

function routerBasename(): string | undefined {
  const raw = import.meta.env.BASE_URL
  if (!raw || raw === '/') return undefined
  return raw.replace(/\/$/, '') || undefined
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <Routes>
        <Route path="/" element={<DojoEntrance />} />
        <Route path="/new-warrior" element={<NewWarrior />} />
        <Route path="/edit-warrior/:id" element={<EditWarrior />} />
        <Route path="/placement" element={<PlacementQuiz />} />
        <Route path="/path" element={<WarriorsPath />} />
        <Route path="/train/:unitId" element={<TrainingSession />} />
        <Route path="/belt-test/:dojoId" element={<BeltCeremony />} />
      </Routes>
    </BrowserRouter>
  );
}
