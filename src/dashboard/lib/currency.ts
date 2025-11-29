export type CurrencyConfig = {
  currencyCode: 'TZS'
  currencySymbol: 'TSh'
  locale: 'sw-TZ'
}

export function getCurrencyConfig(): CurrencyConfig {
  return {
    currencyCode: 'TZS',
    currencySymbol: 'TSh',
    locale: 'sw-TZ',
  }
}

export function createCurrencyFormatter(
  config: CurrencyConfig,
  options: Intl.NumberFormatOptions = {}
): Intl.NumberFormat {
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
}

export function formatCurrencyValue(
  value: number,
  config: CurrencyConfig,
  options?: Intl.NumberFormatOptions
): string {
  return createCurrencyFormatter(config, options).format(Number.isFinite(value) ? value : 0)
}

export function formatAxisTickValue(value: number, config: CurrencyConfig): string {
  const numericValue = Number.isFinite(value) ? Number(value) : 0
  const sign = numericValue < 0 ? '-' : ''
  const suffixes = ['', 'k', 'M', 'B', 'T'] as const

  let absValue = Math.abs(numericValue)
  let suffixIndex = 0

  while (absValue >= 1000 && suffixIndex < suffixes.length - 1) {
    absValue /= 1000
    suffixIndex += 1
  }

  let displayValue = Math.round(absValue * 10) / 10

  while (displayValue >= 1000 && suffixIndex < suffixes.length - 1) {
    displayValue /= 1000
    suffixIndex += 1
    displayValue = Math.round(displayValue * 10) / 10
  }

  const normalizedValue = Number.isInteger(displayValue)
    ? Math.round(displayValue)
    : Number(displayValue.toFixed(1))

  const valueString = normalizedValue.toString()
  const suffix = suffixes[suffixIndex]
  return `${sign}${config.currencySymbol} ${valueString}${suffix}`
}

