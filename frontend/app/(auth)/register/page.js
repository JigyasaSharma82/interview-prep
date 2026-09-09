import AppShell from "../../../components/ui/AppShell";
import AuthForm from "../../../components/auth/AuthForm";

export default function RegisterPage() {
  return <AppShell><AuthForm mode="register" /></AppShell>;
}
