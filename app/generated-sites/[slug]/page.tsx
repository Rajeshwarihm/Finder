import { notFound } from 'next/navigation'
import { getGeneratedSiteBySlug } from '@/lib/storage'
import GeneratedWebsiteRenderer from '@/components/GeneratedWebsiteRenderer'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const site = getGeneratedSiteBySlug(slug)

  if (!site) {
    return { title: 'Site Not Found | NammaSpot' }
  }

  return {
    title: `${site.businessName} - ${site.category} in ${site.location.split(',')[0]}`,
    description: site.content?.heroSubheadline || `Official generated presence for ${site.businessName} on NammaSpot.`,
    openGraph: {
      title: site.businessName,
      description: site.content?.tagline,
      images: site.images?.[0]?.url ? [site.images[0].url] : []
    }
  }
}

export default async function PublishedWebsitePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const site = getGeneratedSiteBySlug(slug)

  if (!site) {
    notFound()
  }

  return <GeneratedWebsiteRenderer site={site} isPreview={false} />
}
