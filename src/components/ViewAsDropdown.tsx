"use client";

import { useState, useEffect, useRef } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
}

interface ViewAsDropdownProps {
  currentUserId: number;
}

export default function ViewAsDropdown({ currentUserId }: ViewAsDropdownProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [viewAsUserId, setViewAsUserId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("viewAsUserId");
    if (stored) {
      setViewAsUserId(parseInt(stored));
    }

    fetch("/api/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("lis_token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(userId: number, userRole: string) {
    if (userId === currentUserId) {
      localStorage.removeItem("viewAsUserId");
      localStorage.removeItem("viewAsUserRole");
      setViewAsUserId(null);
    } else {
      localStorage.setItem("viewAsUserId", userId.toString());
      localStorage.setItem("viewAsUserRole", userRole);
      setViewAsUserId(userId);
    }
    setIsOpen(false);
    window.location.reload();
  }

  function handleReset() {
    localStorage.removeItem("viewAsUserId");
    localStorage.removeItem("viewAsUserRole");
    setViewAsUserId(null);
    setIsOpen(false);
    window.location.reload();
  }

  const viewingUser = users.find((u) => u.id === viewAsUserId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        {viewingUser ? (
          <span className="text-blue-600 font-medium">Lihat sebagai: {viewingUser.name}</span>
        ) : (
          <span>View As</span>
        )}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {viewAsUserId && (
            <button
              onClick={handleReset}
              className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-100 font-medium"
            >
              Kembali ke Akun Saya
            </button>
          )}
          {users.filter((u) => u.id !== currentUserId).map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id, user.role)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 ${
                viewAsUserId === user.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`}
            >
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 capitalize">{user.role}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
