'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, Clock, ArrowUpRight } from 'lucide-react'

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phnumber: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    const isValid = Object.values(formData).every((value) => value.trim() !== '')
    setIsFormValid(isValid)
  }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    
    // Simulate network request
    setTimeout(() => {
        setStatus('success')
        setFormData({ firstname: '', lastname: '', email: '', phnumber: '', message: '' })
        setTimeout(() => setStatus('idle'), 5000)
    }, 2000)
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      lines: [
        'Divine Mercy Retreat Center, Vikindu',
        'Jesus Town, Vikindu',
        'P.O. Box 14189, Dar es Salaam',
        'Tanzania, East Africa'
      ],
      action: { label: 'Get Directions', href: 'https://maps.google.com/?q=Divine+Mercy+Retreat+Center+Vikindu' }
    },
    {
      icon: Mail,
      title: 'Email Us',
      lines: ['dmrc.vikindu@gmail.com'],
      action: { label: 'Send Email', href: 'mailto:dmrc.vikindu@gmail.com' }
    },
    {
      icon: Phone,
      title: 'Call Us',
      lines: ['+255 765 572 679', '0713 840 018'],
      action: { label: 'Call Now', href: 'tel:+255765572679' }
    },
    {
      icon: Clock,
      title: 'Office Hours',
      lines: ['Mon - Fri: 9am - 5pm', 'Sat: 10am - 2pm'],
      action: null
    },
  ]

  return (
    <section id='contact' className='py-24 bg-slate-50 relative overflow-hidden'>
      {/* Decorative Elements */}
      <div className='absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-50 to-transparent rounded-full blur-3xl opacity-60 -z-10' />
      <div className='absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-indigo-50 to-transparent rounded-full blur-3xl opacity-60 -z-10' />

      <div className='container mx-auto'>
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-16'
        >
          <span className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4'>
            <Mail className='w-3 h-3' />
            Get in Touch
          </span>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
            We'd Love to Hear From You
          </h2>
          <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
            Have questions about retreats, ministries, or how to get involved? Reach out and we'll get back to you soon.
          </p>
        </motion.div>

        <div className='grid lg:grid-cols-5 gap-8 lg:gap-12'>
          
          {/* Contact Info Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className='lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4'
          >
            {contactInfo.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300'
              >
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20'>
                    <item.icon className='w-5 h-5' />
                  </div>
                  <div className='flex-grow'>
                    <h3 className='font-bold text-slate-900 mb-1'>{item.title}</h3>
                    {item.lines.map((line, i) => (
                      <p key={i} className='text-sm text-slate-600'>{line}</p>
                    ))}
                    {item.action && (
                      <a 
                        href={item.action.href}
                        className='inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors'
                      >
                        {item.action.label}
                        <ArrowUpRight className='w-3 h-3' />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='lg:col-span-3 bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-slate-100'
          >
            <div className='flex items-center gap-3 mb-8'>
              <div className='p-2 rounded-lg bg-blue-50'>
                <Send className='w-5 h-5 text-blue-600' />
              </div>
              <h3 className='text-xl font-bold text-slate-900'>Send a Message</h3>
            </div>
            
            <form onSubmit={handleSubmit} className='space-y-5'>
              <div className='grid md:grid-cols-2 gap-5'>
                <div>
                  <label htmlFor='firstname' className='block text-sm font-medium text-slate-700 mb-1.5'>First Name</label>
                  <input
                    id='firstname'
                    name='firstname'
                    type='text'
                    value={formData.firstname}
                    onChange={handleChange}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none'
                    placeholder='John'
                  />
                </div>
                <div>
                  <label htmlFor='lastname' className='block text-sm font-medium text-slate-700 mb-1.5'>Last Name</label>
                  <input
                    id='lastname'
                    name='lastname'
                    type='text'
                    value={formData.lastname}
                    onChange={handleChange}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none'
                    placeholder='Doe'
                  />
                </div>
              </div>

              <div className='grid md:grid-cols-2 gap-5'>
                <div>
                  <label htmlFor='email' className='block text-sm font-medium text-slate-700 mb-1.5'>Email Address</label>
                  <input
                    id='email'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleChange}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none'
                    placeholder='john@example.com'
                  />
                </div>
                <div>
                  <label htmlFor='phnumber' className='block text-sm font-medium text-slate-700 mb-1.5'>Phone Number</label>
                  <input
                    id='phnumber'
                    name='phnumber'
                    type='tel'
                    value={formData.phnumber}
                    onChange={handleChange}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none'
                    placeholder='+1 (555) 000-0000'
                  />
                </div>
              </div>

              <div>
                <label htmlFor='message' className='block text-sm font-medium text-slate-700 mb-1.5'>Your Message</label>
                <textarea
                  id='message'
                  name='message'
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className='w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none resize-none'
                  placeholder='How can we help you?'
                />
              </div>

              <button
                type='submit'
                disabled={!isFormValid || status === 'submitting' || status === 'success'}
                className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                  !isFormValid
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : status === 'success'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]'
                }`}
              >
                {status === 'submitting' ? (
                  <Loader2 className='w-5 h-5 animate-spin' />
                ) : status === 'success' ? (
                  <>
                    Message Sent! <CheckCircle className='w-5 h-5' />
                  </>
                ) : (
                  <>
                    Send Message <Send className='w-4 h-4' />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default ContactForm
