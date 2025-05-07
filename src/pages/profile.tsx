import { UserProfile } from '@clerk/clerk-react'

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <UserProfile />
    </div>
  )
} 