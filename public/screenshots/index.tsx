import { useState, useEffect } from 'react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'
import { CheckCircle, ShieldCheck, Zap, Users, Star, Mail, ArrowRight, Code, Database, LineChart, Settings } from 'lucide-react'

const features = [
  {
    icon: <Code className="text-primary w-10 h-10" />,
    title: 'Clean Architecture',
    desc: 'Well-structured codebase with clear integration points for Atlas SDK.'
  },
  {
    icon: <ShieldCheck className="text-primary w-10 h-10" />,
    title: 'Permission Hooks',
    desc: 'Ready-made integration points for Atlas entitlements and permissions.'
  },
  {
    icon: <Database className="text-primary w-10 h-10" />,
    title: 'Usage Tracking',
    desc: 'Pre-built systems for tracking API usage and applying Atlas limits.'
  },
  {
    icon: <LineChart className="text-primary w-10 h-10" />,
    title: 'Analytics Integration',
    desc: 'Connect project metrics and user activity to Atlas analytics.'
  },
]

const integrationPoints = [
  {
    path: 'src/hooks/useProjects.ts',
    description: 'Limit project access based on Atlas entitlements',
    type: 'Permissions'
  },
  {
    path: 'src/pages/dashboard.tsx',
    description: 'Track activity metrics with Atlas events',
    type: 'Analytics'
  },
  {
    path: 'src/components/premium/UpgradeButton.tsx',
    description: 'Trigger Atlas-managed upgrade flows',
    type: 'Monetization'
  },
  {
    path: 'src/pages/pricing.tsx',
    description: 'Connect to Atlas subscription management',
    type: 'Billing'
  }
]

export default function MarketingPage() {
  const [form, setForm] = useState({ name: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(0)
  const titles = ['Projects', 'Tasks', 'Custom Fields', 'Analytics']

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitle((prev) => (prev + 1) % titles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [titles.length])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    // Future integration with mailing list
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl opacity-30 transform -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/20 via-purple-200/20 to-transparent rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-4 flex flex-col items-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-primary font-medium inline-flex items-center border border-primary/20 shadow-sm">
            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full mr-2">NEW</span>
            Atlas SDK Integration Starter Kit
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-center leading-tight max-w-5xl mx-auto mb-6 text-gray-900"
        >
          The Ultimate Starter for <br />
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              Atlas SDK Integration
            </span>
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-600 rounded-full"></span>
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-center max-w-3xl mx-auto mb-10 text-gray-600"
        >
          A beautifully crafted project management application designed to showcase Atlas integration points for permissions, analytics, and monetization.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Button size="lg" asChild className="text-lg px-8 bg-primary hover:bg-primary/90 shadow-lg">
            <a href="/projects">
              Try Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8 border-primary/20 text-primary hover:bg-primary/5">
            <a href="https://github.com/albertcolmenero/atlas-vite-supabase-starterkit-project-mgmt" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
              GitHub Repo
            </a>
          </Button>
        </motion.div>

        {/* App Demo Preview with Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative w-full max-w-5xl mx-auto mb-20"
        >
          <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl border border-gray-200">
            <div className="w-full bg-gradient-to-r from-gray-800 to-gray-900 h-8 flex items-center px-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="bg-white overflow-hidden">
              <div className="flex flex-col h-[400px] relative">
                {titles.map((title, index) => (
                  <motion.div
                    key={title}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: currentTitle === index ? 1 : 0,
                      scale: currentTitle === index ? 1 : 0.95
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <img 
                      src={`/screenshots/${title.toLowerCase()}.png`} 
                      alt={`${title} screenshot`} 
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        // Fallback if image doesn't exist
                        e.currentTarget.src = "https://placehold.co/1200x800/f5f5f5/7C3AED?text=" + title
                      }}
                    />
                  </motion.div>
                ))}
                
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent flex items-center px-6">
                  <div className="text-white font-medium text-xl">
                    {titles.map((title, index) => (
                      <motion.span
                        key={title}
                        className="absolute"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: currentTitle === index ? 1 : 0,
                          y: currentTitle === index ? 0 : 20
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {title}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Shadow effect */}
          <div className="absolute bottom-0 left-10 right-10 h-6 bg-black/10 blur-xl -z-10 transform translate-y-1 rounded-full"></div>
        </motion.div>
      </section>

      {/* Integration Points Section */}
      <section className="relative py-20 px-4 z-10 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">Atlas SDK Integration Points</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The codebase is structured with clear integration points for Atlas's capabilities.
              Here's where you can plug in the Atlas SDK:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {integrationPoints.map((point, index) => (
              <motion.div
                key={point.path}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-gray-500 mb-1">{point.path}</div>
                    <h3 className="font-semibold text-lg mb-1">{point.description}</h3>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {point.type}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">Built for Atlas Integration</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our starter kit provides everything you need to showcase Atlas SDK's capabilities
              in a real-world application context.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="mb-5">
                  <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-primary/80 to-purple-600 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-white rounded-full"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white rounded-full"></div>
          </div>
          
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
            <p className="text-lg text-white/90 mb-8">
              Explore the Atlas SDK integration starter kit and accelerate your development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 bg-white text-primary hover:bg-white/90">
                <a href="/projects">Try Interactive Demo</a>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 border-white text-white hover:bg-white/10">
                <a href="https://github.com/albertcolmenero/atlas-vite-supabase-starterkit-project-mgmt" target="_blank">View GitHub</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Mailing List Section */}
      <section id="waitlist" className="relative py-20 px-4 z-10">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Stay Updated</h2>
            <p className="text-gray-600">
              Get notified about new features and integration examples with Atlas SDK.
            </p>
          </div>
          
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-primary font-semibold text-center text-lg flex flex-col items-center gap-2 p-6"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
              <p>Thank you for subscribing!</p>
              <p className="text-sm text-gray-500 font-normal mt-1">We'll keep you updated on new Atlas SDK integration features.</p>
            </motion.div>
          ) : (
            <form className="flex flex-col sm:flex-row gap-3 items-center justify-center" onSubmit={handleSubmit}>
              <div className="w-full max-w-xs">
                <Input
                  required
                  name="name"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleChange}
                  className="border-gray-300"
                />
              </div>
              <div className="w-full max-w-xs">
                <Input
                  required
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  className="border-gray-300"
                />
              </div>
              <Button type="submit" className="px-8 whitespace-nowrap">
                <Mail className="mr-2 w-4 h-4" />Subscribe
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-4 z-10 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="text-primary font-bold text-xl">Atlas Starter Kit</div>
          </div>
          <div className="text-sm text-gray-500">&copy; {new Date().getFullYear()} | Built with Vite, React, Supabase</div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/albertcolmenero/atlas-vite-supabase-starterkit-project-mgmt" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
} 