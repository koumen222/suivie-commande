import { Navigate, Route, Routes } from 'react-router-dom';
import OrdersPage from './routes/OrdersPage';
import { ENABLE_ENHANCED_UI } from './config/featureFlags';
import ReportsPage from './routes/ReportsPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orders" replace />} />
      <Route path="/orders" element={<OrdersPage />} />
      {ENABLE_ENHANCED_UI && <Route path="/rapports" element={<ReportsPage />} />}
    </Routes>
  );
};

export default App;
