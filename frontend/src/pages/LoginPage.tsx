import { LoginForm } from "../features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">Sign in</h1>
      <LoginForm />
    </div>
  );
}
