'use client'

import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState } from 'react'

interface SidebarProps {
  activeTab: 'scheduled' | 'sent'
  onTabChange: (tab: 'scheduled' | 'sent') => void
  onComposeClick: () => void
  scheduledCount: number
  sentCount: number
}

export function Sidebar({ activeTab, onTabChange, onComposeClick, scheduledCount, sentCount }: SidebarProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (!session?.user) return null

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col p-4">
      {/* Logo */}
      <div className="mb-6 flex items-center px-2">
        <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs tracking-widest">
          ONB
        </div>
      </div>

      {/* User Profile */}
      <div className="mb-6 bg-gray-50 rounded-lg p-2 flex items-center justify-between cursor-pointer border border-transparent hover:border-gray-200 transition-colors" onClick={() => setShowUserMenu(!showUserMenu)}>
        <div className="flex items-center gap-2 overflow-hidden">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              width={24}
              height={24}
              className="rounded"
              unoptimized
            />
          ) : (
            <div className="w-6 h-6 rounded bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-xs font-medium">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-gray-900 truncate">{session.user.name}</span>
            <span className="text-[10px] text-gray-400 truncate">{session.user.email}</span>
          </div>
        </div>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {showUserMenu && (
        <div className="absolute left-16 top-20 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}

      {/* Compose Button */}
      <div className="mb-8">
        <button
          onClick={onComposeClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-green-500 text-green-600 font-medium rounded-full hover:bg-green-50 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Compose
        </button>
      </div>

      {/* CORE Section */}
      <div className="flex-1">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-2">CORE</h3>
        <nav className="space-y-1">
          <button
            onClick={() => onTabChange('scheduled')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'scheduled'
              ? 'bg-green-50 text-gray-900 font-medium'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Scheduled
            </div>
            <span className="text-xs text-gray-400 font-normal">{scheduledCount}</span>
          </button>
          <button
            onClick={() => onTabChange('sent')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'sent'
              ? 'bg-green-50 text-gray-900 font-medium'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Sent
            </div>
            <span className="text-xs text-gray-400 font-normal">{sentCount}</span>
          </button>
        </nav>
      </div>
    </div>
  )
}