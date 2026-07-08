import { AuthProvider } from "../../contexts/AuthContext";
import { StudentLayout } from "../../layouts/StudentLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

function StudentShell() {
  return (
    <AuthProvider>
      <LazyQueryProvider>
        <StudentLayout />
      </LazyQueryProvider>
    </AuthProvider>
  );
}

export function Component() {
  return <StudentShell />;
}
