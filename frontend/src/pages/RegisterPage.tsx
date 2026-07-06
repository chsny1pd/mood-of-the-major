import { RegisterForm } from "../features/auth/components/RegisterForm";

export function RegisterPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">Create account</h1>
      <RegisterForm />
    </div>
  );
}
