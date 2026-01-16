'use client'

import { useState, useRef } from 'react'
import { parseCSVEmails } from '@/lib/utils'
import { scheduleEmails } from '@/lib/api'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userEmail: string
  onSuccess: () => void
}

export function ComposeModal({ isOpen, onClose, userId, userEmail, onSuccess }: ComposeModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(0)
  const [hourlyLimit, setHourlyLimit] = useState(0)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSendLater, setShowSendLater] = useState(false)
  const [fromEmail, setFromEmail] = useState(userEmail)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    const text = await file.text()
    const parsedEmails = parseCSVEmails(text)
    setEmails(parsedEmails)
  }

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!subject || !body || !scheduledTime || emails.length === 0) {
      setError('Please fill all fields and add at least one recipient')
      return
    }

    setLoading(true)
    try {
      await scheduleEmails(userId, {
        recipientEmails: emails,
        subject,
        body,
        scheduledTime: new Date(scheduledTime).toISOString(),
        delayBetweenEmails: delayBetweenEmails > 0 ? delayBetweenEmails * 1000 : undefined, // Convert to ms
        hourlyLimit: hourlyLimit > 0 ? hourlyLimit : undefined,
      })
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to schedule emails')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSubject('')
    setBody('')
    setScheduledTime('')
    setDelayBetweenEmails(0)
    setHourlyLimit(0)
    setCsvFile(null)
    setEmails([])
    setError(null)
    setShowSendLater(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleSendLater = () => {
    if (!scheduledTime) {
      setShowSendLater(true)
    } else {
      handleSubmit(new Event('submit') as any)
    }
  }

  const setSuggestedTime = (hours: number) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(hours, 0, 0, 0)
    setScheduledTime(tomorrow.toISOString().slice(0, 16))
    setShowSendLater(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-4">
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800">Compose New Email</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Attachment Icon */}
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            {/* Clock Icon */}
            <button onClick={() => setShowSendLater(!showSendLater)} className={`text-gray-400 hover:text-gray-600 ${showSendLater ? 'text-green-600' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Send Later Button */}
            <button
              onClick={handleSendLater}
              className="px-4 py-1.5 border border-green-600 text-green-700 font-medium rounded hover:bg-green-50 transition-colors text-sm"
            >
              Send Later
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-white relative">
          <div className="px-8 py-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center">
              <label className="w-16 text-sm font-medium text-gray-500">From</label>
              <div className="bg-gray-100 px-3 py-1 rounded flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-700 font-medium">{fromEmail}</span>
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* To Field */}
            <div className="flex items-start border-b border-gray-100 pb-2">
              <label className="w-16 text-sm font-medium text-gray-500 mt-2">To</label>
              <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[32px]">
                {emails.map((email, index) => (
                  <span key={index} className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs flex items-center gap-1">
                    {email}
                    <button type="button" onClick={() => removeEmail(index)} className="hover:text-green-900">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={emails.length === 0 ? "recipient@example.com" : ""}
                  className="flex-1 outline-none text-sm text-gray-600 placeholder:text-gray-300 min-w-[150px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                      e.preventDefault()
                      const val = e.currentTarget.value.trim()
                      if (val && !emails.includes(val)) {
                        setEmails([...emails, val])
                        e.currentTarget.value = ''
                      }
                    } else if (e.key === 'Backspace' && e.currentTarget.value === '' && emails.length > 0) {
                      removeEmail(emails.length - 1)
                    }
                  }}
                />
              </div>
              <label className="flex items-center gap-2 text-green-600 text-sm font-medium cursor-pointer hover:text-green-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload List
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {/* Subject */}
            <div className="flex items-center border-b border-gray-100 pb-2">
              <label className="w-16 text-sm font-medium text-gray-500">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 outline-none text-sm text-gray-700 font-medium placeholder:text-gray-300"
              />
            </div>

            {/* Delay & Hourly Limit */}
            <div className="flex items-center gap-8 pt-2">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 font-medium">Delay between 2 emails</label>
                <input
                  type="number"
                  value={delayBetweenEmails}
                  onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                  className="w-12 px-2 py-1 border border-gray-200 rounded text-center text-sm outline-none focus:border-green-500"
                  placeholder="00"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 font-medium">Hourly Limit</label>
                <input
                  type="number"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-12 px-2 py-1 border border-gray-200 rounded text-center text-sm outline-none focus:border-green-500"
                  placeholder="00"
                />
              </div>
            </div>

            {/* Editor */}
            <div className="pt-4">
              <div className="flex items-center gap-4 text-gray-500 mb-4 px-1">
                <span className="text-sm text-gray-300">Type Your Reply...</span>
              </div>

              <div className="rounded-lg p-2 min-h-[300px] relative group">
                {/* Toolbar */}
                <div className="flex items-center gap-4 bg-white/50 px-2 py-2 mb-2">
                  <button type="button" className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                  <button type="button" className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
                  <span className="w-px h-4 bg-gray-200"></span>
                  <button type="button" className="font-serif font-bold text-gray-400 hover:text-gray-600">T</button>
                  <button type="button" className="font-bold text-gray-400 hover:text-gray-600">B</button>
                  <button type="button" className="italic text-gray-400 hover:text-gray-600">I</button>
                  <button type="button" className="underline text-gray-400 hover:text-gray-600">U</button>
                  <span className="w-px h-4 bg-gray-200"></span>
                  <button type="button" className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg></button>
                  <button type="button" className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg></button>
                </div>

                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full h-full min-h-[300px] outline-none p-2 resize-none text-gray-700 bg-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Send Later Dropdown/Modal */}
        {showSendLater && (
          <div className="absolute right-6 top-16 z-20 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 w-80 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Send Later</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Pick date & time</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-100 rounded text-sm outline-none focus:border-green-500 text-gray-600"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1">
                <button onClick={() => setSuggestedTime(10)} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors flex justify-between group">
                  <span>Tomorrow</span>
                  <span className="text-gray-400 group-hover:text-gray-600">10:00 AM</span>
                </button>
                <button onClick={() => setSuggestedTime(11)} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors flex justify-between group">
                  <span>Tomorrow</span>
                  <span className="text-gray-400 group-hover:text-gray-600">11:00 AM</span>
                </button>
                <button onClick={() => setSuggestedTime(15)} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors flex justify-between group">
                  <span>Tomorrow</span>
                  <span className="text-gray-400 group-hover:text-gray-600">3:00 PM</span>
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowSendLater(false)}
                  className="flex-1 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendLater}
                  className="flex-1 py-1.5 text-xs font-bold text-green-600 border border-green-500 rounded hover:bg-green-50"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}