'use client';

import Link from 'next/link';
import {
  CheckIcon,
  XCircleIcon,
  UserCircleIcon,
  InboxIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
//import { Button } from '@/app/ui/button';
import { createUser } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { Button } from '../button';

export default async function CreateUser() {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createUser, initialState);
  console.log('state', state);

  /*  const handleSubmit = (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    console.log(formData);
    dispatch(formData); // Make sure this is how your useFormState hook works
  }; */

  return (
    <form action={dispatch}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* User Name */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Enter your name
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                required
                aria-describedby="name-error"
                aria-live="polite"
                placeholder="Enter your name"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
              <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Enter your email
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                aria-describedby="email-error"
                aria-live="polite"
                placeholder="Enter your email"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
              <InboxIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Password  */}
        <div className="mb-6 flex justify-between">
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <div className="text-sm">
            <input
              id="password"
              name="password"
              type="password"
              required
              aria-describedby="email-error"
              aria-live="polite"
              placeholder="Choose a Stong password"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            />
            <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Admin */}
        <fieldset className="mb-8">
          <legend className="font-medium text-gray-900">Account Type</legend>
          <div className="rounded-md border border-gray-200 bg-white px-[14px]    py-3">
            <div className="flex items-center gap-4">
              <input
                id="admin"
                type="radio"
                name="isadmin"
                value="true"
                className="h-4 w-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="admin"
                className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
              >
                Yes <CheckIcon className="h-4 w-4" />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="user"
                type="radio"
                name="isadmin"
                value="false"
                className="h-4 w-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="user"
                className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
              >
                No <XCircleIcon className="h-4 w-4" />
              </label>
            </div>
          </div>
          <div id="status-error" aria-live="polite" aria-atomic="true">
            {state.errors?.status &&
              state.errors.status.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </fieldset>

        <div aria-live="polite" aria-atomic="true">
          {state.message ? (
            <p className="mt-2 text-sm text-red-500">{state.message}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create User</Button>
      </div>

      <input type="submit" value="Create User" />
    </form>
  );
}
