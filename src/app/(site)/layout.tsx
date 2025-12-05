import Header from '@/app/components/Layout/Header'
import Footer from '@/app/components/Layout/Footer'
import ScrollToTop from '@/app/components/ScrollToTop'
import Aoscompo from '@/utils/aos'
import RightSidebar from '@/app/components/Layout/RightSidebar'
import FloatingSocialButtons from '@/app/components/Common/FloatingSocialButtons'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Aoscompo>
      <div className='relative min-h-screen bg-slate-50'>
        <Header />
        <div className='w-full flex gap-8 px-2 sm:px-4 lg:px-6 pt-40 lg:pt-36'>
          <main className='w-full lg:w-[70%]'>{children}</main>
          <aside className='hidden w-[30%] lg:block pt-4'>
            <RightSidebar />
          </aside>
        </div>
        <Footer />
        <ScrollToTop />
        <FloatingSocialButtons />
      </div>
    </Aoscompo>
  )
}
