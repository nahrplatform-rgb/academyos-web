import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth">
      <h1>Page not found · الصفحة غير موجودة</h1>
      <Link href="/en">AcademyOS</Link>
    </main>
  );
}
