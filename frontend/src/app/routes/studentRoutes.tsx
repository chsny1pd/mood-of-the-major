import { StudentLayout } from "../../layouts/StudentLayout";
import { LazyQueryProvider } from "../LazyQueryProvider";

export function Component() {
  return (
    <LazyQueryProvider>
      <StudentLayout />
    </LazyQueryProvider>
  );
}
