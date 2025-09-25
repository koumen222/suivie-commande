import { Navigate, Route, Routes } from 'react-router-dom';
import OrdersPage from './routes/OrdersPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orders" replace />} />
      <Route path="/orders" element={<OrdersPage />} />
    </Routes>
  );
};

export default App;
