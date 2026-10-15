import type {StructureResolver} from 'sanity/structure'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'

export const singletonTypes = new Set(['siteSettings', 'landingPage'])

export const structure: StructureResolver = (S) => S.list().title('Website content').items([
  S.listItem().title('Site settings').icon(CogIcon).child(
    S.document().schemaType('siteSettings').documentId('siteSettings')),
  S.listItem().title('Landing page').icon(DocumentIcon).child(
    S.document().schemaType('landingPage').documentId('landingPage')),
  S.divider(),
  S.documentTypeListItem('pricingPlan').title('Pricing plans'),
])
