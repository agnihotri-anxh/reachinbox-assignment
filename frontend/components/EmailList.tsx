'use client'

import { EmailJob } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

interface EmailListProps {
  emails: EmailJob[]
  loading: boolean
  type: 'scheduled' | 'sent'
  onSelect: (email: EmailJob) => void
}

export function EmailList({ emails, loading, type, onSelect }: EmailListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No {type} emails found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onSelect(email)}
          className="group hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center py-3 px-4 gap-4">
            {/* To: Name */}
            <div className="w-1/4 min-w-[200px]">
              <span className="text-gray-900 font-bold text-sm">To: {email.email.split('@')[0].replace('.', ' ')}</span>
            </div>

            {/* Pill + Subject + body */}
            <div className="flex-1 flex items-center min-w-0 gap-3">
              {/* Date/Status Pill */}
              {type === 'scheduled' ? (
                <span className="shrink-0 px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-medium rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {email.scheduledTime ? formatDateTime(email.scheduledTime) : 'Scheduled'}
                </span>
              ) : (
                <span className="shrink-0 px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                  Sent
                </span>
              )}

              {/* Subject - Body */}
              <div className="flex items-center text-sm truncate">
                <span className="font-semibold text-gray-900 mr-1">{email.subject}</span>
                <span className="text-gray-400">-</span>
                <span className="text-gray-500 ml-1 truncate">
                  {/* Mock body text since we don't have it in the type assume some content */}
                  Hi {email.email.split('@')[0]}, just wanted to follow up on our meeting...
                </span>
              </div>
            </div>

            {/* Star Action */}
            <button className="text-gray-300 hover:text-yellow-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}