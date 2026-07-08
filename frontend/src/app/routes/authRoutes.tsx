import { AuthProvider } from "../../contexts/AuthContext";
import { AuthLayout } from "../../layouts/AuthLayout";

function AuthShell() {
  return (
    <AuthProvider>
      <AuthLayout />
    </AuthProvider>
  );
}

export function Component() {
  return <AuthShell />;
}
