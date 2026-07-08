import { RequireAdmin } from "../../components/RequireAdmin";
import { AuthProvider } from "../../contexts/AuthContext";
import { AdminLayout } from "../../layouts/AdminLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

function AdminShell() {
  return (
    <AuthProvider>
      <RequireAdmin>
        <LazyQueryProvider>
          <AdminLayout />
        </LazyQueryProvider>
      </RequireAdmin>
    </AuthProvider>
  );
}

export function Component() {
  return <AdminShell />;
}
