'use client'

import RetreatsGallery from '../../Retreats/RetreatsGallery'
import { motion } from 'framer-motion'

const NamesList = () => {
  return (
    <section id='retreats-section' className='py-20 relative overflow-hidden'>
       <div className="absolute top-0 left-0 w-full h-full bg-slate-50 -z-10" />
       <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
       <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
       
      <div className='container mx-auto relative'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
        <RetreatsGallery
          title='Upcoming Retreats'
          action={{ label: 'View Retreat Schedule', href: '/retreats' }}
          showFilters
        />
        </motion.div>
      </div>
    </section>
  )
}

export default NamesList
