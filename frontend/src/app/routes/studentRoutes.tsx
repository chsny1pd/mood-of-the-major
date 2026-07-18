import { StudentLayout } from "../../layouts/StudentLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

function StudentShell() {
  return (
    <LazyQueryProvider>
      <StudentLayout />
    </LazyQueryProvider>
  );
}

export function Component() {
  return <StudentShell />;
}
