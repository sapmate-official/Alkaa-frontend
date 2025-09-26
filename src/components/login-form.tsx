import { MultiTenantLoginForm } from "@/components/auth/MultiTenantLoginForm";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <MultiTenantLoginForm className={className} {...props} />;
}
