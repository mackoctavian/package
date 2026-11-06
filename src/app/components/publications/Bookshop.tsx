'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'

import MockCheckout from '@/app/components/giving/MockCheckout'
import { Choice, Field, inputClass } from '@/app/components/site/FormFields'
import SmartImage from '@/app/components/site/SmartImage'
import { Button } from '@/app/components/ui/button'
import { DELIVERY_FEE, formatTZS, MAX_QUANTITY, type Publication } from '@/lib/publications/format'
import { cn } from '@/lib/utils'
import { cartActions, useCart } from './cart'

type Step = 'cart' | 'details' | 'payment' | 'done'
const fulfilmentOptions = ['Collect at DMRC', 'Deliver to me'] as const

const BookshopContext = createContext<{ openCart: () => void } | null>(null)

export const useBookshop = () => {
  const context = useContext(BookshopContext)
  if (!context) throw new Error('useBookshop must be used inside <BookshopProvider>')
  return context
}

const makeReference = () => `ORDER-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export function AddToCartButton({ publication, className, size = 'pill' }: { publication: Publication; className?: string; size?: 'pill' | 'xl' }) {
  const { openCart } = useBookshop()
  const cart = useCart()
  const quantity = cart[publication.id] ?? 0
  if (publication.inStock === false) {
    return (
      <Button size={size} variant='outline' disabled className={className}>
        Out of stock
      </Button>
    )
  }
  return (
    <Button
      size={size}
      className={className}
      disabled={quantity >= MAX_QUANTITY}
      onClick={() => {
        cartActions.add(publication.id)
        openCart()
      }}
    >
      <ShoppingBag className='mr-2 h-4 w-4' /> {quantity ? `Add another (${quantity} in bag)` : 'Add to bag'}
    </Button>
  )
}

export function BookshopProvider({ catalogue, children }: { catalogue: Publication[]; children: React.ReactNode }) {
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('cart')
  const [details, setDetails] = useState({ fullName: '', phone: '', email: '', fulfilment: fulfilmentOptions[0] as string, address: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reference, setReference] = useState(makeReference)
  const [receipt, setReceipt] = useState<{ total: number; count: number } | null>(null)

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => ({ publication: catalogue.find((item) => item.id === id), quantity }))
        .filter((line): line is { publication: Publication; quantity: number } => Boolean(line.publication)),
    [cart, catalogue],
  )
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.publication.price, 0)
  const delivery = details.fulfilment === 'Deliver to me' && subtotal > 0 ? DELIVERY_FEE : 0
  const total = subtotal + delivery

  const openCart = useCallback(() => {
    setStep((current) => (current === 'done' ? 'cart' : current))
    setOpen(true)
  }, [])
  const close = useCallback(() => {
    setOpen(false)
    if (step === 'done') setStep('cart')
  }, [step])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const continueFromDetails = () => {
    const next: Record<string, string> = {}
    if (!details.fullName.trim()) next.fullName = 'Please enter your name.'
    if (!/^[0-9+\s-]{7,16}$/.test(details.phone.trim())) next.phone = 'Please enter a valid phone number.'
    if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) next.email = 'Please enter a valid email address.'
    if (details.fulfilment === 'Deliver to me' && !details.address.trim()) next.address = 'Please enter a delivery address.'
    setErrors(next)
    if (!Object.keys(next).length) setStep('payment')
  }

  const contextValue = useMemo(() => ({ openCart }), [openCart])

  return (
    <BookshopContext.Provider value={contextValue}>
      {children}

      {count > 0 && !open && (
        <button
          type='button'
          onClick={openCart}
          className='fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-navy-800'
        >
          <ShoppingBag className='h-5 w-5' /> Bag · {count}
        </button>
      )}

      {open && (
        <div className='fixed inset-0 z-[70]' role='dialog' aria-modal='true' aria-label='Your bag'>
          <div className='absolute inset-0 bg-navy-950/50 backdrop-blur-sm' onClick={close} />
          <div className='absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-lift'>
            <div className='flex items-center justify-between border-b border-border px-6 py-5'>
              <h2 className='font-display text-2xl font-semibold text-navy-900'>
                {step === 'cart' ? 'Your bag' : step === 'details' ? 'Your details' : step === 'payment' ? 'Payment' : 'Order placed'}
              </h2>
              <button type='button' onClick={close} aria-label='Close' className='rounded-full p-2 hover:bg-parchment'>
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto px-6 py-6'>
              {step === 'cart' &&
                (lines.length === 0 ? (
                  <div className='py-16 text-center'>
                    <ShoppingBag className='mx-auto h-10 w-10 text-gold-500' />
                    <p className='mt-4 text-muted-foreground'>Your bag is empty.</p>
                  </div>
                ) : (
                  <ul className='divide-y divide-border'>
                    {lines.map(({ publication, quantity }) => (
                      <li key={publication.id} className='flex gap-4 py-4'>
                        <div className='relative h-24 w-[72px] shrink-0 overflow-hidden rounded-lg bg-parchment'>
                          <SmartImage src={publication.coverImage} alt='' fill sizes='72px' className='object-cover' />
                        </div>
                        <div className='flex flex-1 flex-col'>
                          <Link href={`/publications/${publication.slug}`} onClick={close} className='font-semibold leading-snug text-navy-900 hover:underline'>
                            {publication.title}
                          </Link>
                          <p className='text-xs text-muted-foreground'>{publication.format}</p>
                          <div className='mt-auto flex items-center justify-between pt-2'>
                            <div className='flex items-center rounded-full border border-border'>
                              <button type='button' aria-label='Decrease quantity' onClick={() => cartActions.set(publication.id, quantity - 1)} className='p-2'>
                                <Minus className='h-3.5 w-3.5' />
                              </button>
                              <span className='w-6 text-center text-sm font-medium'>{quantity}</span>
                              <button type='button' aria-label='Increase quantity' disabled={quantity >= MAX_QUANTITY} onClick={() => cartActions.set(publication.id, quantity + 1)} className='p-2 disabled:opacity-40'>
                                <Plus className='h-3.5 w-3.5' />
                              </button>
                            </div>
                            <span className='text-sm font-semibold text-navy-900'>{formatTZS(publication.price * quantity)}</span>
                          </div>
                        </div>
                        <button type='button' aria-label={`Remove ${publication.title}`} onClick={() => cartActions.set(publication.id, 0)} className='self-start p-1 text-muted-foreground hover:text-red-600'>
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </li>
                    ))}
                  </ul>
                ))}

              {step === 'details' && (
                <div className='space-y-5'>
                  <Field label='Full name' htmlFor='o-name' required error={errors.fullName}>
                    <input id='o-name' autoComplete='name' className={inputClass} value={details.fullName} onChange={(e) => setDetails({ ...details, fullName: e.target.value })} />
                  </Field>
                  <Field label='Phone' htmlFor='o-phone' required error={errors.phone}>
                    <input id='o-phone' type='tel' autoComplete='tel' placeholder='+255 7XX XXX XXX' className={inputClass} value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
                  </Field>
                  <Field label='Email' htmlFor='o-email' hint='Optional, for your receipt.' error={errors.email}>
                    <input id='o-email' type='email' autoComplete='email' className={inputClass} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                  </Field>
                  <Field label='How would you like to receive your order?' htmlFor='o-fulfilment'>
                    <Choice name='fulfilment' value={details.fulfilment} options={fulfilmentOptions} onChange={(value) => setDetails({ ...details, fulfilment: value })} />
                  </Field>
                  {details.fulfilment === 'Deliver to me' && (
                    <Field label='Delivery address' htmlFor='o-address' required error={errors.address} hint={`Delivery within Dar es Salaam: ${formatTZS(DELIVERY_FEE)}`}>
                      <textarea id='o-address' rows={3} autoComplete='street-address' className={cn(inputClass, 'resize-none')} value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />
                    </Field>
                  )}
                </div>
              )}

              {step === 'payment' && (
                <MockCheckout
                  amount={total}
                  reference={reference}
                  description={`${count} item${count === 1 ? '' : 's'} from the DMRC bookshop`}
                  defaultPhone={details.phone}
                  onBack={() => setStep('details')}
                  onPaid={() => {
                    setReceipt({ total, count })
                    cartActions.clear()
                    setStep('done')
                  }}
                />
              )}

              {step === 'done' && receipt && (
                <div className='py-8 text-center'>
                  <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
                    <CheckCircle2 className='h-8 w-8' />
                  </span>
                  <p className='mt-5 font-display text-3xl text-navy-900'>Thank you, {details.fullName.split(' ')[0]}</p>
                  <p className='mt-3 text-sm text-muted-foreground'>
                    Your order of {receipt.count} item{receipt.count === 1 ? '' : 's'} ({formatTZS(receipt.total)}) went through the demo checkout. Online
                    orders will be sent to the bookshop once payments go live.
                  </p>
                  <p className='mt-4 font-mono text-xs text-muted-foreground'>Reference {reference}</p>
                </div>
              )}
            </div>

            {(step === 'cart' || step === 'details') && lines.length > 0 && (
              <div className='border-t border-border px-6 py-5'>
                <dl className='space-y-1.5 text-sm'>
                  <div className='flex justify-between'>
                    <dt className='text-muted-foreground'>Subtotal</dt>
                    <dd className='font-medium text-navy-900'>{formatTZS(subtotal)}</dd>
                  </div>
                  <div className='flex justify-between'>
                    <dt className='text-muted-foreground'>Delivery</dt>
                    <dd className='font-medium text-navy-900'>{step === 'cart' ? 'Chosen at checkout' : delivery ? formatTZS(delivery) : 'Free (collect)'}</dd>
                  </div>
                  <div className='flex justify-between border-t border-border pt-2 text-base'>
                    <dt className='font-semibold text-navy-900'>Total</dt>
                    <dd className='font-semibold text-navy-900'>{formatTZS(total)}</dd>
                  </div>
                </dl>
                <div className='mt-4 flex gap-2'>
                  {step === 'details' && (
                    <Button variant='ghost' onClick={() => setStep('cart')}>
                      Back
                    </Button>
                  )}
                  <Button
                    size='xl'
                    className='flex-1'
                    onClick={() => {
                      if (step === 'cart') {
                        setReference(makeReference())
                        setStep('details')
                      } else continueFromDetails()
                    }}
                  >
                    {step === 'cart' ? 'Checkout' : 'Continue to payment'} <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
            {step === 'done' && (
              <div className='border-t border-border px-6 py-5'>
                <Button size='xl' className='w-full' onClick={close}>
                  Continue browsing
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </BookshopContext.Provider>
  )
}
