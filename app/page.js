import { redirect } from 'next/navigation';

export default function Home() {
  // Begitu root URL diakses, otomatis tendang ke /login
  redirect('/login');
}