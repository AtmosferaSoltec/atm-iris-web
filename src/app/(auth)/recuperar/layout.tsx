import { AuthCard } from "@/features/auth/components/auth-card";

export default function RecoveryLayout({ children }: LayoutProps<"/recuperar">) {
  return <AuthCard>{children}</AuthCard>;
}
