import { redirect } from 'next/navigation';

/**
 * /admin root → redirect to dashboard.
 * The dashboard is the entry point for the admin portal.
 */
export default function AdminRoot() {
  redirect('/admin/dashboard');
}
