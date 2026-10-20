import { BuyOrRentCalculator } from '@/components/BuyOrRentCalculator'

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Buy or Rent',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    description:
      'A transparent calculator for comparing the long-term financial impact of buying a home versus renting and investing.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BuyOrRentCalculator />
    </>
  )
}
