import React from "react";
import NavLink from "@/Components/NavLink";
import { route } from "ziggy-js"; // ✅ use named import

function Links() {
  return (
    <nav className="p-4 space-y-2">
      <NavLink href={route("admin.dashboard")} active={route().current("admin.dashboard")}>
        <i className="fa-solid fa-tachometer-alt fa-fw w-5"></i>
        <span>Dashboard</span>
      </NavLink>

      <NavLink href={route("admin.announcement")} active={route().current("admin.announcement")}>
        <i className="fa-solid fa-bullhorn fa-fw w-5"></i>
        <span>Announcements</span>
      </NavLink>

      <NavLink href={route("admin.documents")} active={route().current("admin.documents")}>
        <i className="fa-solid fa-file-alt fa-fw w-5"></i>
        <span>Documents</span>
      </NavLink>

      <NavLink href={route("admin.request")} active={route().current("admin.request")}>
        <i className="fa-solid fa-folder-open fa-fw w-5"></i>
        <span>Requests</span>
      </NavLink>

      <NavLink href={route("admin.history")} active={route().current("admin.history")}>
        <i className="fa-solid fa-history fa-fw w-5"></i>
        <span>History</span>
      </NavLink>

      <NavLink href={route("admin.messages")} active={route().current("admin.messages")}>
        <i className="fa-solid fa-comments fa-fw w-5"></i>
        <span>Messages</span>
      </NavLink>

      <NavLink href={route("admin.payment")} active={route().current("admin.payment")}>
        <i className="fa-solid fa-credit-card fa-fw w-5"></i>
        <span>Payments</span>
      </NavLink>
    </nav>
  );
}

export default Links;
