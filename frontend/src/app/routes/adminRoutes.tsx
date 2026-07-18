import { RequireAdmin } from "../../components/RequireAdmin";
import { AdminLayout } from "../../layouts/AdminLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

export function Component() {
  return (
    <RequireAdmin>
      <LazyQueryProvider>
        <AdminLayout />
      </LazyQueryProvider>
    </RequireAdmin>
  );
}
