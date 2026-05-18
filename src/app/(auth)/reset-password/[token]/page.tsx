import ResetPasswordClient from "./reset-password-client";

export function generateStaticParams() {
  return [{ token: "__dynamic__" }];
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
