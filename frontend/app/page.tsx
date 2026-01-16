'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { ComposeModal } from '@/components/ComposeModal'
import { EmailList } from '@/components/EmailList'
import { EmailDetail } from '@/components/EmailDetail'
import { getScheduledEmails, getSentEmails, createOrGetUser, EmailJob } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL routing state
  const activeTab = (searchParams?.get('tab') as 'scheduled' | 'sent') || 'sent'
  const isComposeOpen = searchParams?.get('compose') === 'true'

  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([])
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null)

  const handleTabChange = (tab: 'scheduled' | 'sent') => {
    setSelectedEmail(null)
    const params = new URLSearchParams(searchParams?.toString())
    params.set('tab', tab)
    router.replace(`/?${params.toString()}`)
  }

  const handleComposeOpen = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('compose', 'true')
    router.replace(`/?${params.toString()}`)
  }

  const handleComposeClose = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('compose')
    router.replace(`/?${params.toString()}`)
  }

  const loadEmails = async () => {
    if (!userId) return

    setLoading(true)
    try {
      if (activeTab === 'scheduled') {
        const emails = await getScheduledEmails(userId)
        setScheduledEmails(emails)
      } else {
        const emails = await getSentEmails(userId)
        setSentEmails(emails)
      }
    } catch (error) {
      console.error('Error loading emails:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && !userId) {
      // Create or get user in backend
      createOrGetUser({
        email: session.user.email!,
        name: session.user.name!,
        avatar: session.user.image || undefined,
      })
        .then((user) => {
          setUserId(user.id)
        })
        .catch((error) => {
          console.error('Error creating/getting user:', error)
        })
    }
  }, [session, userId])

  useEffect(() => {
    if (userId) {
      loadEmails()
      // Refresh every 5 seconds
      const interval = setInterval(loadEmails, 5000)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Login</h1>
            
            <button
              onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors mb-6 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Login with Google</span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or sign up through email</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onComposeClick={handleComposeOpen}
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-white">
          {isComposeOpen && userId && session?.user?.email ? (
            <ComposeModal
              isOpen={true}
              onClose={handleComposeClose}
              userId={userId}
              userEmail={session.user.email}
              onSuccess={loadEmails}
            />
          ) : selectedEmail ? (
            <EmailDetail email={selectedEmail} onBack={() => setSelectedEmail(null)} />
          ) : (
            <div className="p-6">
              <EmailList
                emails={activeTab === 'scheduled' ? scheduledEmails : sentEmails}
                loading={loading}
                type={activeTab}
                onSelect={(email) => setSelectedEmail(email)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}