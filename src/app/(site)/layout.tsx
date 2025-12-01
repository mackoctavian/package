import Header from '@/app/components/Layout/Header'
import Footer from '@/app/components/Layout/Footer'
import ScrollToTop from '@/app/components/ScrollToTop'
import Aoscompo from '@/utils/aos'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Aoscompo>
      <div className='relative min-h-screen bg-slate-50'>
        <Header />
        <main className='w-full'>{children}</main>
        <Footer />
        <ScrollToTop />
      </div>
    </Aoscompo>
  )
}
