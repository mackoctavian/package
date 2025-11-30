'use client'

import { useState } from 'react'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      setStatus('loading')
      // Simulate API call
      setTimeout(() => {
          setStatus('success')
          setEmail('')
      }, 1500)
  }

  return (
    <section className='py-24 bg-white'>
      <div className='container mx-auto'>
        <div className='relative overflow-hidden rounded-3xl bg-primary px-6 py-16 sm:px-12 sm:py-20 isolate'>
            {/* Abstract Background Shapes */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl mix-blend-overlay" />
            
            <div className='mx-auto max-w-2xl text-center relative z-10'>
                <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4'>
                Join Our Faithful Community
                </h2>
                <p className='text-lg leading-8 text-blue-100 mb-8'>
                Subscribe to receive weekly reflections, upcoming retreat announcements, and community news directly to your inbox.
                </p>
                
                <form onSubmit={handleSubmit} className='mx-auto mt-6 flex max-w-md gap-x-4 flex-col sm:flex-row gap-y-4'>
                <label htmlFor='email-address' className='sr-only'>
                    Email address
                </label>
                <div className='relative flex-auto'>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-5 w-5" />
                    </div>
                <input
                        id='email-address'
                        name='email'
                        type='email'
                        autoComplete='email'
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='min-w-0 w-full flex-auto rounded-full border-0 bg-white/10 px-3.5 py-3.5 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/20 placeholder:text-blue-200 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 backdrop-blur-sm transition-all'
                  placeholder='Enter your email'
                        disabled={status === 'success' || status === 'loading'}
                    />
                </div>
                <button
                    type='submit'
                    disabled={status === 'success' || status === 'loading'}
                    className='flex-none rounded-full bg-white px-6 py-3.5 text-sm font-bold text-primary shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed min-w-[140px]'
                >
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.span
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                Subscribe <ArrowRight className="w-4 h-4" />
                            </motion.span>
                        )}
                        {status === 'loading' && (
                            <motion.span
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Sending...
                            </motion.span>
                        )}
                         {status === 'success' && (
                            <motion.span
                                key="success"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                Joined <CheckCircle2 className="w-4 h-4" />
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
                </form>
                
                <p className="mt-4 text-xs text-blue-200 opacity-80">
                    We respect your privacy. Unsubscribe at any time.
                </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
