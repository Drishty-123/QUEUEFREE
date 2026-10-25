import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Services from './pages/Services.jsx';
import Queue from './pages/Queue.jsx';
import Counter from './pages/Counter.jsx';
import NotFound from './pages/NotFound.jsx';
import Guide from './pages/Guide.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/services" element={<Services />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/queue/:serviceId" element={<Queue />} />
        <Route path="/counter/:serviceId" element={<Counter />} />
        <Route path="/guide" element={<Guide />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
