import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";

// Component Imports
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";   
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";

// Toast Notification Imports
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AuthenticatedLayout({ header, children }) {
  const { user } = usePage().props.auth;
  const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
            <img className="w-10 h-10 rounded-full" src="/images/logo1.jpg" alt="" />
              <span className="font-bold text-lg text-blue-900 dark:text-white">
                Doconnect
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-6">
              <NavLink href={route("dashboard")} active={route().current("dashboard")}>
                Dashboard
              </NavLink>
              <NavLink href={route("residents.home")} active={route().current("residents.home")}>
                Home
              </NavLink>
              <NavLink href={route("residents.about")} active={route().current("residents.about")}>
                About
              </NavLink>
              <NavLink href={route("residents.contact")} active={route().current("residents.contact")}>
                Contact
              </NavLink>
              <NavLink href={route("residents.faq")} active={route().current("residents.faq")}>
                FAQ
              </NavLink>

              {(user.role === "admin" || user.role === "super_admin") && (
                <NavLink href={route("admin.dashboard")} active={route().current("admin.dashboard")}>
                  Admin
                </NavLink>
              )}

              {user.role === "super_admin" && (
                <NavLink
                  href={route("superadmin.users.index")}
                  active={route().current("superadmin.users.index")}
                >
                  Users
                </NavLink>
              )}
            </div>

            {/* User Dropdown */}
            <div className="hidden md:flex items-center gap-3">
              <Dropdown>
                <Dropdown.Trigger>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
                    <i class="fa-solid fa-circle-user fa-xl text-blue-800"></i>
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Content>
                  <Dropdown.Link href={route("profile.edit")}>Profile</Dropdown.Link>
                  <Dropdown.Link href={route("logout")} method="post" as="button">
                    Log Out
                  </Dropdown.Link>
                </Dropdown.Content>
              </Dropdown>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {!showingNavigationDropdown ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showingNavigationDropdown && (
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <ResponsiveNavLink href={route("dashboard")} active={route().current("dashboard")}>
                Dashboard
              </ResponsiveNavLink>
              <ResponsiveNavLink href={route("residents.home")} active={route().current("residents.home")}>
                Home
              </ResponsiveNavLink>
              <ResponsiveNavLink href={route("residents.about")} active={route().current("residents.about")}>
                About
              </ResponsiveNavLink>
              <ResponsiveNavLink href={route("residents.contact")} active={route().current("residents.contact")}>
                Contact
              </ResponsiveNavLink>
              <ResponsiveNavLink href={route("residents.faq")} active={route().current("residents.faq")}>
                FAQ
              </ResponsiveNavLink>

              {(user.role === "admin" || user.role === "super_admin") && (
                <ResponsiveNavLink href={route("admin.dashboard")} active={route().current("admin.dashboard")}>
                  Admin
                </ResponsiveNavLink>
              )}

              {user.role === "super_admin" && (
                <ResponsiveNavLink href={route("superadmin.users.index")} active={route().current("superadmin.users.index")}>
                  Users
                </ResponsiveNavLink>
              )}

              {/* Profile & Logout */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                <ResponsiveNavLink href={route("profile.edit")}>Profile</ResponsiveNavLink>
                <ResponsiveNavLink method="post" href={route("logout")} as="button">
                  Log Out
                </ResponsiveNavLink>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      {header && (
        <header className="bg-gray-50 dark:bg-gray-800 mt-16 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">{header}</div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 mt-6">{children}</main>

      {/* Toast Notifications */}
      <ToastContainer position="bottom-right" autoClose={5000} theme="colored" />
    </div>
  );
}
