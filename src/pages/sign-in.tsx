import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn appearance={{ elements: { card: 'shadow-lg' } }} routing="path" path="/sign-in" signUpUrl="/sign-in" afterSignInUrl="/dashboard" />
    </div>
  )
} 