'use client'

import Image from 'next/image'
import React, { Component, useState, useEffect } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { CompanyType } from '@/app/types/company'

// CAROUSEL SETTINGS
export default class MultipleItems extends Component {
  render() {
    const settings = {
      dots: false,
      infinite: true,
      slidesToShow: 5,
      slidesToScroll: 1,
      arrows: false,
      autoplay: true,
      speed: 2000,
      autoplaySpeed: 2000,
      cssEase: 'linear',
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 4,
            slidesToScroll: 1,
            infinite: true,
            dots: false,
          },
  },
        {
          breakpoint: 700,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1,
            infinite: true,
            dots: false,
          },
        },
        {
          breakpoint: 500,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: true,
            dots: false,
          },
        },
      ],
    }

        return (
      <div className='text-center'>
        <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-7xl lg:px-8'>
          <h2 className='text-primary text-lg my-10 font-semibold uppercase tracking-wider opacity-70'>
            Trusted by over 500+ Companies Worldwide
          </h2>
          <div className='py-14'>
            <Slider {...settings}>
              <div className='px-4'>
                <div className='h-16 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer'>
                  <Image src="/images/slickCompany/airbnb.svg" alt="airbnb" fill className='object-contain' />
          </div>
              </div>
              <div className='px-4'>
                <div className='h-16 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer'>
                  <Image src="/images/slickCompany/hubspot.svg" alt="hubspot" fill className='object-contain' />
                </div>
              </div>
              <div className='px-4'>
                <div className='h-16 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer'>
                  <Image src="/images/slickCompany/microsoft.svg" alt="microsoft" fill className='object-contain' />
                </div>
            </div>
              <div className='px-4'>
                <div className='h-16 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer'>
                  <Image src="/images/slickCompany/google.svg" alt="google" fill className='object-contain' />
                </div>
            </div>
              <div className='px-4'>
                <div className='h-16 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer'>
                  <Image src="/images/slickCompany/walmart.svg" alt="walmart" fill className='object-contain' />
        </div>
              </div>
              <div className='px-4'>
                <div className='h-16 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer'>
                  <Image src="/images/slickCompany/fedex.svg" alt="fedex" fill className='object-contain' />
                </div>
              </div>
            </Slider>
          </div>
          <hr />
        </div>
      </div>
  )
}
}
