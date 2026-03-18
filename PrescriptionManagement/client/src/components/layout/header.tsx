import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { Bell, ShoppingCart, User, Menu, X, LogOut, Settings } from "lucide-react";


export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart();
 
  // Get initials for avatar
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
 
  // Debug logging to check authentication state
  console.log('Auth state:', { isAuthenticated, user: !!user, cartItemCount });
 
  // Navigation links
const baseLinks = [
  { name: "Store",        href: "/" },
  { name: "My Medicines", href: "/my-medicines" },
  { name: "My Orders",    href: "/my-orders" },
  { name: "Scan Prescription",  href: "/scan" },

];

/* show dashboard only for admins */
const navLinks = user?.role === "admin"
  ? [...baseLinks, { name: "Dashboard", href: "/admin/dashboard" }]
  : baseLinks;
 
  // Check if link is active
  const isActiveLink = (path: string) => {
    if (path === "/" && (location === "/" || location === "/")) return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };


  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };
 
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
          <div className="flex items-center space-x-4">
            {/* Cart Icon - ✅ Fixed implementation */}
            <Link href={isAuthenticated ? "/cart" : "/login"}>
              <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full transition-colors">
                <ShoppingCart className="h-6 w-6" />
                {isAuthenticated && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
            </Link>


            {/* Notifications - ✅ Fixed implementation */}
            {isAuthenticated && (
              <Link href="/notifications">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {/* Add notification count badge here if needed */}
                </button>
              </Link>
            )}
           
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <span className="font-medium text-sm">{userInitials}</span>
                </div>
              </button>


              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          <div className="font-medium">{user?.name}</div>
                          {/* <div className="text-gray-500">{user?.email}</div> */}
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
                            <Settings className="mr-3 h-4 w-4" />
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
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login">
                          <span
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <User className="mr-3 h-4 w-4" />
                            Sign In
                          </span>
                        </Link>
                        <Link href="/signup">
                          <span
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Sign Up
                          </span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
           
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
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
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <span className="font-medium">{userInitials}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.name}</div>
                    {/* <div className="text-sm font-medium text-gray-500">{user?.email}</div> */}
                  </div>
                  <Link href="/cart">
                    <button className="ml-auto flex-shrink-0 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full relative">
                      <ShoppingCart className="h-6 w-6" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
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
                      Notifications
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
              <div className="space-y-1">
                <Link href="/login">
                  <span
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </span>
                </Link>
                <Link href="/signup">
                  <span
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
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