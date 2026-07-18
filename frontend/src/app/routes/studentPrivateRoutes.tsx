import { RequireAuth } from "../../components/RequireAuth";
import { StudentLayout } from "../../layouts/StudentLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

export function Component() {
  return (
    <RequireAuth>
      <LazyQueryProvider>
        <StudentLayout />
      </LazyQueryProvider>
    </RequireAuth>
  );
}
