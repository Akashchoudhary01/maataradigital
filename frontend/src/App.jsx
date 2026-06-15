import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/dashboard/Dashboard';
import BorrowersPage from './pages/borrowers/BorrowersPage';
import BorrowerForm from './pages/borrowers/BorrowerForm';
import BorrowerProfile from './pages/borrowers/BorrowerProfile';
import LoansPage from './pages/loans/LoansPage';
import LoanForm from './pages/loans/LoanForm';
import LoanDetail from './pages/loans/LoanDetail';
import RepaymentsPage from './pages/repayments/RepaymentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="borrowers" element={<BorrowersPage />} />
          <Route path="borrowers/new" element={<BorrowerForm />} />
          <Route path="borrowers/:id" element={<BorrowerProfile />} />
          <Route path="borrowers/:id/edit" element={<BorrowerForm />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="loans/new" element={<LoanForm />} />
          <Route path="loans/:id" element={<LoanDetail />} />
          <Route path="repayments" element={<RepaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
