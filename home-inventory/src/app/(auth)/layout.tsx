import { Package } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Simple header for auth pages */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Home Inventory
            </span>
          </Link>
        </div>
      </header>

      {/* Centered content area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Home Inventory. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
