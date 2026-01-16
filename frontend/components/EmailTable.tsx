'use client'

import { EmailJob } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

interface EmailTableProps {
  emails: EmailJob[]
  loading: boolean
  type: 'scheduled' | 'sent'
}

export function EmailTable({ emails, loading, type }: EmailTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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

  const getStatusBadge = (status: string) => {
    const colors = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SENT: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            {type === 'scheduled' ? (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled Time
              </th>
            ) : (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent Time
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {emails.map((email) => (
            <tr key={email.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {email.email}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {email.subject}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {type === 'scheduled' && email.scheduledTime
                  ? formatDateTime(email.scheduledTime)
                  : email.sentTime
                  ? formatDateTime(email.sentTime)
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(email.status)}
                {email.errorMessage && (
                  <p className="mt-1 text-xs text-red-600">{email.errorMessage}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}