import { RequireAdmin } from "../../components/RequireAdmin";
import { AdminLayout } from "../../layouts/AdminLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

function AdminShell() {
  return (
    <RequireAdmin>
      <LazyQueryProvider>
        <AdminLayout />
      </LazyQueryProvider>
    </RequireAdmin>
  );
}

export function Component() {
  return <AdminShell />;
}
