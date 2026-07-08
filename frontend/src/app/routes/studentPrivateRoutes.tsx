import { RequireAuth } from "../../components/RequireAuth";
import { AuthProvider } from "../../contexts/AuthContext";
import { StudentLayout } from "../../layouts/StudentLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

function PrivateStudentShell() {
  return (
    <AuthProvider>
      <RequireAuth>
        <LazyQueryProvider>
          <StudentLayout />
        </LazyQueryProvider>
      </RequireAuth>
    </AuthProvider>
  );
}

export function Component() {
  return <PrivateStudentShell />;
}
