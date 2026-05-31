import { redirect } from 'next/navigation';
export default function LegacyRoot() {
  redirect('/dashboard');
}
