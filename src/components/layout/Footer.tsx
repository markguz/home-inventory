export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Home Inventory System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
