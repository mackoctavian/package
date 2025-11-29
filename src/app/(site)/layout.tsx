import Header from '@/app/components/Layout/Header'
import Footer from '@/app/components/Layout/Footer'
import ScrollToTop from '@/app/components/ScrollToTop'
import Aoscompo from '@/utils/aos'

import RightSidebar from '@/app/components/Layout/RightSidebar'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Aoscompo>
      <div className='relative min-h-screen bg-slate-50'>
        <Header />
        <div className='container mx-auto flex max-w-7xl gap-8 px-4 pt-40 lg:pt-36'>
          <main className='w-full lg:w-[70%]'>{children}</main>
          <aside className='hidden w-[30%] lg:block pt-4'>
            <RightSidebar />
          </aside>
        </div>
        <Footer />
        <ScrollToTop />
      </div>
    </Aoscompo>
  )
}
