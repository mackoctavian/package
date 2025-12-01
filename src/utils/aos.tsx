'use client'
import { useEffect } from "react";
import AOS from "aos"
import 'aos/dist/aos.css';

const Aoscompo = ({children}:any) => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true, // Only trigger once to prevent reloading
            offset: 100, // Trigger when element is 100px from viewport
            easing: 'ease-out-cubic',
        })
        
        // Refresh AOS on route changes
        return () => {
            AOS.refresh()
        }
    }, [])
  return (
    <div>
      {children}
    </div>
  )
}

export default Aoscompo
