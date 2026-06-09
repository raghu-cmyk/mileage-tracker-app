'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { registerAction, type ActionResult } from '@/app/actions/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

const initialState: ActionResult = { ok: true };

export default function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, initialState);

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-semibold text-text-primary">Create your organization</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Start a new workspace. You&apos;ll be the organization administrator and can invite
            teammates later.
          </p>

          {state.error && <div className="alert-error mt-4">{state.error}</div>}

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="organization_name" className="form-label">
                Organization name
              </label>
              <input
                id="organization_name"
                name="organization_name"
                type="text"
                required
                autoComplete="organization"
                placeholder="Acme Logistics"
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className="form-label">
                Confirm password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="form-input"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Create organization
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
