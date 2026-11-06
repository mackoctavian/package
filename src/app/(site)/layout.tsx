import SiteHeader from '@/app/components/site/SiteHeader'
import SiteFooter from '@/app/components/site/SiteFooter'
import ScrollToTop from '@/app/components/ScrollToTop'
import Aoscompo from '@/utils/aos'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Aoscompo>
      <div className='relative flex min-h-screen flex-col bg-ivory text-navy-900'>
        <SiteHeader />
        <div id='main-content' className='flex-1'>
          {children}
        </div>
        <SiteFooter />
        <ScrollToTop />
      </div>
    </Aoscompo>
  )
}
