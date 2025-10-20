import { useMemo } from 'react'
import { useBusiness } from '../contexts/BusinessContext'

export const useCurrencyFormatter = () => {
  const { currentBusiness } = useBusiness()
  const currency = currentBusiness?.settings?.currency || 'TZS'

  const locale = currency === 'TZS' ? 'sw-TZ' : 'en-US'

  const formatter = useMemo(() => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }), [locale, currency])

  return (value: number) => formatter.format(value || 0)
}







