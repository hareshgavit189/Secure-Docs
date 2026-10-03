import { Route, Switch, Redirect } from 'wouter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import NewCase from './pages/NewCase';
import Documents from './pages/Documents';
import DocumentUpload from './pages/DocumentUpload';
import DocumentDetail from './pages/DocumentDetail';
import IntegrityVerify from './pages/IntegrityVerify';
import AuditLogs from './pages/AuditLogs';
import NotFound from './pages/NotFound';

function ProtectedRoute({ component: Component, allowedRoles }) {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-bold text-slate-400">
        Loading session...
      </div>
    );
  }

  if (!user || !token) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        {/* Public Authentication */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* Protected Application Routes */}
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} allowedRoles={['Admin', 'Officer', 'Legal Reviewer', 'Auditor']} />
        </Route>
        <Route path="/cases/new">
          <ProtectedRoute component={NewCase} allowedRoles={['Admin', 'Officer']} />
        </Route>
        <Route path="/cases/:id">
          <ProtectedRoute component={CaseDetail} allowedRoles={['Admin', 'Officer', 'Legal Reviewer', 'Auditor']} />
        </Route>
        <Route path="/cases">
          <ProtectedRoute component={Cases} allowedRoles={['Admin', 'Officer', 'Legal Reviewer', 'Auditor']} />
        </Route>
        <Route path="/upload">
          <ProtectedRoute component={DocumentUpload} allowedRoles={['Admin', 'Officer']} />
        </Route>
        <Route path="/documents/:id">
          <ProtectedRoute component={DocumentDetail} allowedRoles={['Admin', 'Officer', 'Legal Reviewer', 'Auditor']} />
        </Route>
        <Route path="/documents">
          <ProtectedRoute component={Documents} allowedRoles={['Admin', 'Officer', 'Legal Reviewer', 'Auditor']} />
        </Route>
        <Route path="/integrity">
          <ProtectedRoute component={IntegrityVerify} allowedRoles={['Admin', 'Officer', 'Legal Reviewer', 'Auditor']} />
        </Route>
        <Route path="/audit">
          <ProtectedRoute component={AuditLogs} allowedRoles={['Admin', 'Auditor']} />
        </Route>

        {/* Fallback 404 */}
        <Route>
          <Layout>
            <NotFound />
          </Layout>
        </Route>
      </Switch>
    </AuthProvider>
  );
}
