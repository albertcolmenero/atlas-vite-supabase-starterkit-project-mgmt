import { useState } from 'react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { CheckCircle, ShieldCheck, Zap, Users, Star, Mail } from 'lucide-react'

const features = [
  {
    icon: <Zap className="text-primary w-8 h-8" />,
    title: 'Instant Google Auth',
    desc: 'Sign in instantly with Google using Clerk.com integration.'
  },
  {
    icon: <ShieldCheck className="text-primary w-8 h-8" />,
    title: 'Secure Supabase Database',
    desc: 'Real-time CRUD, secure by default, and ready for production.'
  },
  {
    icon: <Users className="text-primary w-8 h-8" />,
    title: 'Team Ready',
    desc: 'Invite collaborators and manage projects together.'
  },
  {
    icon: <Star className="text-primary w-8 h-8" />,
    title: 'Shadcn UI + Tailwind',
    desc: 'Modern, accessible components and beautiful theming out of the box.'
  },
]

export default function MarketingPage() {
  const [form, setForm] = useState({ name: '', email: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    // TODO: Integrate with backend/waitlist
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-purple-100">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-32 px-4 bg-gradient-to-br from-primary to-purple-600 text-white shadow-xl rounded-b-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 animate-fade-in-up drop-shadow-lg">
          Build <span className="bg-white/20 px-2 rounded">Faster</span> with the Ultimate
          <br /> Vite + Supabase Starter Kit
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90 animate-fade-in-up delay-100">
          Launch your next SaaS or product in minutes. Google Auth, beautiful UI, and instant database—all ready to go.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
          <Button size="lg" asChild className="text-lg px-8 py-4 shadow-lg">
            <a href="/projects">Try the Demo</a>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8 py-4 border-white/60 text-white hover:bg-white/10">
            <a href="#waitlist">Join Waitlist</a>
          </Button>
        </div>
        <div className="absolute left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none rounded-b-3xl" />
      </section>
      {/* Trusted By */}
      <section className="py-8 px-4">
        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">Trusted by</h2>
        <div className="flex justify-center gap-8 opacity-80">
          <img src="/logo1.svg" alt="Logo 1" className="h-10 grayscale hover:grayscale-0 transition" />
          <img src="/logo2.svg" alt="Logo 2" className="h-10 grayscale hover:grayscale-0 transition" />
          <img src="/logo3.svg" alt="Logo 3" className="h-10 grayscale hover:grayscale-0 transition" />
        </div>
      </section>
      {/* Features Overview */}
      <section id="features" className="py-16 px-4 bg-white/80 rounded-3xl shadow-xl max-w-5xl mx-auto mt-12 mb-12">
        <h2 className="text-3xl font-bold mb-10 text-center text-primary">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4 p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
              <div className="shrink-0">{f.icon}</div>
              <div>
                <h3 className="font-semibold text-xl mb-1">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 flex justify-center bg-gradient-to-br from-purple-50 to-white">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-primary/10">
          <h2 className="text-3xl font-bold mb-4 text-primary">Pricing</h2>
          <p className="text-lg text-gray-600 mb-6">Everything you need to launch your next project.</p>
          <div className="text-5xl font-extrabold mb-2 text-primary">$0</div>
          <div className="text-md text-gray-500 mb-6">Open source, MIT licensed</div>
          <Button size="lg" asChild className="w-full text-lg">
            <a href="#waitlist">Get Started Free</a>
          </Button>
        </div>
      </section>
      {/* Waitlist Form */}
      <section id="waitlist" className="py-20 px-4 flex justify-center bg-white/90 rounded-3xl shadow-xl max-w-2xl mx-auto mb-16">
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4 text-center text-primary">Join the Waitlist</h2>
          <p className="text-gray-600 mb-6 text-center">Be the first to know when we launch. No spam, ever.</p>
          {submitted ? (
            <div className="text-green-600 font-semibold text-center text-lg flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8" />
              Thank you! We'll be in touch soon.
            </div>
          ) : (
            <form className="flex flex-col gap-4 items-center" onSubmit={handleSubmit}>
              <div className="flex gap-2 w-full">
                <Input
                  required
                  name="name"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleChange}
                  className="max-w-xs"
                />
                <Input
                  required
                  name="email"
                  type="email"
                  placeholder="Your Email"
                  value={form.email}
                  onChange={handleChange}
                  className="max-w-xs"
                />
                <Button type="submit" size="lg" className="px-8">
                  <Mail className="mr-2 w-5 h-5" />Join
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
      {/* Footer */}
      <footer className="w-full bg-gradient-to-t from-primary/10 to-white text-gray-700 py-8 px-4 border-t border-primary/10 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm">&copy; {new Date().getFullYear()} CodeGuide. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="hover:underline text-primary font-medium">GitHub</a>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-500">Made with <span className="text-pink-500">♥</span> by your team</span>
          </div>
        </div>
      </footer>
    </div>
  )
} 