import { RequireAuth } from "../../components/RequireAuth";
import { StudentLayout } from "../../layouts/StudentLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

function PrivateStudentShell() {
  return (
    <RequireAuth>
      <LazyQueryProvider>
        <StudentLayout />
      </LazyQueryProvider>
    </RequireAuth>
  );
}

export function Component() {
  return <PrivateStudentShell />;
}
