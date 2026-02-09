// PLACEHOLDER Header component for testing 
export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200">
      {/* Left side - logo / title */}
      <div className="flex items-center gap-3">
        <div className="text-blue-600 font-bold text-lg">KMSPlus</div>
        <nav className="hidden md:flex gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-blue-600">Dashboard</a>
          <a href="#" className="hover:text-blue-600">Questions</a>
          <a href="#" className="hover:text-blue-600">Reports</a>
        </nav>
      </div>

      {/* Right side - mock user/profile */}
      <div className="flex items-center gap-4">
        <div className="text-gray-600 text-sm cursor-pointer hover:text-blue-600">Notifications</div>
        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
      </div>
    </header>
  );
}
