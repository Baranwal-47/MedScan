import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { notificationAPI } from "../../services/notificationApi";
import { Bell, ShoppingCart, User, Menu, X, LogOut, Package } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart();

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const userInitials = user ? getInitials(user.name) : "U";
  const cartItemCount = getCartItemCount();

  // Close profile dropdown on outside click / Escape
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileDropdownOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isProfileDropdownOpen]);

  // Unread notification badge — refresh on navigation and every 60s
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    const fetchCount = () =>
      notificationAPI.getUnreadCount()
        .then(res => { if (!cancelled) setUnreadCount(res.count || 0); })
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthenticated, location]);

  const guestLinks = [
    { name: "Store", href: "/" },
    { name: "Scan Prescription", href: "/scan" },
  ];

  const authedLinks = [
    { name: "Store", href: "/" },
    { name: "My Medicines", href: "/my-medicines" },
    { name: "My Orders", href: "/my-orders" },
    { name: "Scan Prescription", href: "/scan" },
  ];

  const baseLinks = isAuthenticated ? authedLinks : guestLinks;
  const navLinks = user?.role === "admin"
    ? [...baseLinks, { name: "Dashboard", href: "/admin/dashboard" }]
    : baseLinks;

  const isActiveLink = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const badge = (count: number) =>
    count > 0 ? (
      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  const avatar = (size: string) => (
    <div className={`${size} rounded-full bg-blue-600 text-white flex items-center justify-center overflow-hidden`}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-medium text-sm">{userInitials}</span>
      )}
    </div>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Main Nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <span className="text-blue-600 text-2xl font-bold cursor-pointer hover:text-blue-700 transition-colors">
                  MedScan
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`${
                      isActiveLink(link.href)
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer transition-colors`}
                  >
                    {link.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link href={isAuthenticated ? "/cart" : "/login"}>
              <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full transition-colors" aria-label="Cart">
                <ShoppingCart className="h-6 w-6" />
                {isAuthenticated && badge(cartItemCount)}
              </button>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/notifications">
                  <button
                    type="button"
                    className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="h-6 w-6" />
                    {badge(unreadCount)}
                  </button>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    {avatar("h-8 w-8 hover:opacity-90")}
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          <div className="font-medium truncate">{user?.name}</div>
                          <div className="text-gray-500 text-xs truncate">{user?.email}</div>
                        </div>
                        <Link href="/profile">
                          <span
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <User className="mr-3 h-4 w-4" />
                            Your Profile
                          </span>
                        </Link>
                        <Link href="/my-orders">
                          <span
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Package className="mr-3 h-4 w-4" />
                            My Orders
                          </span>
                        </Link>
                        <Link href="/notifications">
                          <span
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Bell className="mr-3 h-4 w-4" />
                            Notifications
                          </span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest actions — no fake avatar */
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <span className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
                    Sign in
                  </span>
                </Link>
                <Link href="/signup">
                  <span className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                    Sign up
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={`mobile-${link.href}`} href={link.href}>
                <span
                  className={`${
                    isActiveLink(link.href)
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer transition-colors`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Mobile User Section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-4 pb-3">
                  <div className="flex-shrink-0">{avatar("h-10 w-10")}</div>
                  <div className="ml-3 min-w-0">
                    <div className="text-base font-medium text-gray-800 truncate">{user?.name}</div>
                    <div className="text-sm font-medium text-gray-500 truncate">{user?.email}</div>
                  </div>
                  <Link href="/cart">
                    <button className="ml-auto flex-shrink-0 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full relative">
                      <ShoppingCart className="h-6 w-6" />
                      {badge(cartItemCount)}
                    </button>
                  </Link>
                </div>
                <div className="space-y-1">
                  <Link href="/profile">
                    <span
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Your Profile
                    </span>
                  </Link>
                  <Link href="/notifications">
                    <span
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1 px-4 pb-2">
                <Link href="/login">
                  <span
                    className="block w-full text-center px-4 py-2 text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </span>
                </Link>
                <Link href="/signup">
                  <span
                    className="block w-full text-center px-4 py-2 text-base font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
