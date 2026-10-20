import { AuthCard } from "@/features/auth/components/auth-card";

export default function RecoveryLayout({ children }: LayoutProps<"/recover">) {
  return <AuthCard>{children}</AuthCard>;
}
