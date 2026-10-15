import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons/Document'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'

export const landingPage = defineType({
  name: 'landingPage', title: 'Landing page', type: 'document', icon: DocumentIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'features', title: 'Features'},
    {name: 'content', title: 'Content sections'},
    {name: 'pricing', title: 'Pricing'},
    {name: 'subscribe', title: 'Subscription'},
  ],
  fields: [
    defineField({name: 'heroTitle', type: 'string', group: 'hero', validation: (rule) => rule.required()}),
    defineField({name: 'heroDescription', type: 'text', rows: 3, group: 'hero'}),
    defineField({name: 'heroImage', type: 'contentImage', group: 'hero'}),
    defineField({name: 'heroMobileImage', type: 'contentImage', group: 'hero'}),
    defineField({name: 'heroActions', type: 'array', group: 'hero',
      of: [defineArrayMember({type: 'link'})], validation: (rule) => rule.max(2)}),
    defineField({name: 'featuresTitle', type: 'string', group: 'features'}),
    defineField({name: 'features', type: 'array', group: 'features', of: [defineArrayMember({
      name: 'feature', type: 'object', icon: DocumentTextIcon,
      fields: [
        defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'description', type: 'text', rows: 3}),
        defineField({name: 'icon', type: 'string', options: {list: ['management', 'support', 'collaborative']}}),
        defineField({name: 'action', type: 'link'}),
      ], preview: {select: {title: 'title'}},
    })]}),
    defineField({name: 'contentSections', type: 'array', group: 'content',
      of: [defineArrayMember({type: 'contentSection'})], validation: (rule) => rule.max(3)}),
    defineField({name: 'pricingTitle', type: 'string', group: 'pricing'}),
    defineField({name: 'pricingDescription', type: 'text', rows: 2, group: 'pricing'}),
    defineField({name: 'pricingPlans', type: 'array', group: 'pricing',
      of: [defineArrayMember({type: 'reference', to: [{type: 'pricingPlan'}]})],
      validation: (rule) => rule.unique()}),
    defineField({name: 'subscribeTitle', type: 'string', group: 'subscribe'}),
    defineField({name: 'subscribeDescription', type: 'text', rows: 2, group: 'subscribe'}),
    defineField({name: 'subscribePlaceholder', type: 'string', group: 'subscribe'}),
    defineField({name: 'subscribeButtonLabel', type: 'string', group: 'subscribe'}),
  ],
  preview: {prepare: () => ({title: 'Landing page'})},
})
