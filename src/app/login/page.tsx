import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-felt-bg px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-brass text-2xl text-brass">
          ♠
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-felt-ink">
          Card Guy Archive
        </h1>
        <p className="text-sm text-felt-sub">Enter the password to continue.</p>
      </div>
      <LoginForm redirectTo={from ?? "/collection"} />
    </div>
  );
}
