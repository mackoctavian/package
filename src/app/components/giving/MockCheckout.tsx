'use client'

/**
 * DEMO PAYMENT SCREEN
 * -------------------
 * DMRC has not chosen a payment provider yet, so this component only simulates
 * a checkout. Nothing typed here is sent to the server or stored anywhere, and
 * no money moves. Replace `simulatePayment` with the provider's hosted checkout
 * (e.g. Pesapal, AzamPay or Selcom) when one is chosen.
 */

import { useState } from 'react'
import { Building2, CheckCircle2, CreditCard, Info, Loader2, Lock, Smartphone } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { Field, inputClass } from '@/app/components/site/FormFields'
import { cn } from '@/lib/utils'

type Method = 'mobile' | 'card' | 'bank'

const networks = ['M-Pesa (Vodacom)', 'Mixx by Yas (Tigo Pesa)', 'Airtel Money', 'HaloPesa'] as const

type MockCheckoutProps = {
  amount: number
  currency?: string
  reference: string
  description: string
  defaultPhone?: string
  defaultMethod?: Method
  onPaid: (result: { method: Method; reference: string }) => void
  onBack?: () => void
}

const simulatePayment = () => new Promise<void>((resolve) => setTimeout(resolve, 1800))

export default function MockCheckout({
  amount,
  currency = 'TZS',
  reference,
  description,
  defaultPhone = '',
  defaultMethod = 'mobile',
  onPaid,
  onBack,
}: MockCheckoutProps) {
  const [method, setMethod] = useState<Method>(defaultMethod)
  const [network, setNetwork] = useState<string>(networks[0])
  const [phone, setPhone] = useState(defaultPhone)
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' })
  const [stage, setStage] = useState<'form' | 'processing'>('form')
  const [error, setError] = useState<string | null>(null)

  const formatted = `${currency} ${amount.toLocaleString('en-US')}`

  const pay = async () => {
    setError(null)
    if (method === 'mobile' && !/^[0-9+\s-]{9,16}$/.test(phone)) {
      setError('Enter the mobile money number to charge.')
      return
    }
    if (method === 'card' && (card.number.replace(/\D/g, '').length < 12 || !card.expiry || card.cvc.length < 3)) {
      setError('Enter the card details to continue.')
      return
    }
    setStage('processing')
    await simulatePayment()
    // Clear demo card fields immediately; they never leave the browser.
    setCard({ name: '', number: '', expiry: '', cvc: '' })
    onPaid({ method, reference })
  }

  const tabs: { id: Method; label: string; icon: typeof Smartphone }[] = [
    { id: 'mobile', label: 'Mobile money', icon: Smartphone },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'bank', label: 'Bank transfer', icon: Building2 },
  ]

  if (stage === 'processing') {
    return (
      <div className='flex flex-col items-center py-14 text-center' role='status'>
        <Loader2 className='h-10 w-10 animate-spin text-gold-500' />
        <p className='mt-5 font-display text-3xl text-navy-900'>
          {method === 'mobile' ? 'Check your phone' : method === 'card' ? 'Authorising payment' : 'Recording your transfer'}
        </p>
        <p className='mt-2 max-w-sm text-muted-foreground'>
          {method === 'mobile'
            ? `Approve the ${formatted} request on ${phone} with your PIN.`
            : 'This only takes a moment. Please don’t close this page.'}
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-start gap-3 rounded-2xl border border-dashed border-gold-300 bg-gold-50 px-4 py-3 text-sm text-gold-800'>
        <Info className='mt-0.5 h-4 w-4 shrink-0' />
        <p>
          <strong>Demo checkout.</strong> Online payments are not live yet, so no money will be charged and nothing you type here is sent
          or saved.
        </p>
      </div>

      <div className='flex items-center justify-between rounded-2xl bg-navy-900 px-5 py-4 text-white'>
        <div>
          <p className='text-xs uppercase tracking-wider text-navy-200'>{description}</p>
          <p className='mt-0.5 font-mono text-xs text-navy-300'>Ref {reference}</p>
        </div>
        <p className='font-display text-3xl font-semibold'>{formatted}</p>
      </div>

      <div role='tablist' aria-label='Payment method' className='grid grid-cols-3 gap-2'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={method === tab.id}
            onClick={() => {
              setMethod(tab.id)
              setError(null)
            }}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-sm font-medium transition',
              method === tab.id ? 'border-navy-900 bg-navy-50 text-navy-900' : 'border-border bg-white text-navy-600 hover:border-navy-200',
            )}
          >
            <tab.icon className='h-5 w-5' />
            {tab.label}
          </button>
        ))}
      </div>

      {method === 'mobile' && (
        <div className='grid gap-5 sm:grid-cols-2'>
          <Field label='Network' htmlFor='mc-network'>
            <select id='mc-network' className={inputClass} value={network} onChange={(e) => setNetwork(e.target.value)}>
              {networks.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label='Mobile number' htmlFor='mc-phone' hint='You will get a prompt to enter your PIN.'>
            <input
              id='mc-phone'
              type='tel'
              autoComplete='tel'
              placeholder='07XX XXX XXX'
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
        </div>
      )}

      {method === 'card' && (
        <div className='grid gap-5 sm:grid-cols-2'>
          <Field label='Name on card' htmlFor='mc-name' className='sm:col-span-2'>
            <input id='mc-name' autoComplete='off' className={inputClass} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
          </Field>
          <Field label='Card number' htmlFor='mc-number' className='sm:col-span-2'>
            <input
              id='mc-number'
              inputMode='numeric'
              autoComplete='off'
              placeholder='4242 4242 4242 4242'
              className={cn(inputClass, 'font-mono')}
              value={card.number}
              onChange={(e) =>
                setCard({
                  ...card,
                  number: e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 16)
                    .replace(/(.{4})/g, '$1 ')
                    .trim(),
                })
              }
            />
          </Field>
          <Field label='Expiry' htmlFor='mc-expiry'>
            <input
              id='mc-expiry'
              autoComplete='off'
              placeholder='MM / YY'
              className={inputClass}
              value={card.expiry}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                setCard({ ...card, expiry: digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits })
              }}
            />
          </Field>
          <Field label='CVC' htmlFor='mc-cvc'>
            <input
              id='mc-cvc'
              type='password'
              inputMode='numeric'
              autoComplete='off'
              className={inputClass}
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            />
          </Field>
        </div>
      )}

      {method === 'bank' && (
        <dl className='divide-y divide-border rounded-2xl border border-border text-sm'>
          {[
            ['Bank', 'To be confirmed'],
            ['Account name', 'Divine Mercy Retreat Center'],
            ['Account number', 'Shared after launch'],
            ['Reference', reference],
          ].map(([label, value]) => (
            <div key={label} className='flex justify-between gap-4 px-5 py-3'>
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className={cn('text-right font-medium text-navy-900', label === 'Reference' && 'font-mono')}>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {error && (
        <p role='alert' className='rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </p>
      )}

      <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
        {onBack ? (
          <Button type='button' variant='ghost' onClick={onBack}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type='button' size='xl' onClick={pay}>
          <Lock className='mr-2 h-4 w-4' />
          {method === 'bank' ? 'I have made the transfer' : `Pay ${formatted}`}
        </Button>
      </div>

      <p className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
        <CheckCircle2 className='h-3.5 w-3.5' /> Secured checkout will be provided by a licensed payment partner.
      </p>
    </div>
  )
}
