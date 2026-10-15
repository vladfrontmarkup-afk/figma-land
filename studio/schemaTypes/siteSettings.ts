import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Site settings', type: 'document', icon: CogIcon,
  fields: [
    defineField({name: 'title', title: 'Site title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'SEO description', type: 'text', rows: 3,
      validation: (rule) => rule.required()}),
    defineField({name: 'navigation', type: 'array', of: [defineArrayMember({type: 'link'})]}),
    defineField({name: 'headerAction', type: 'link'}),
    defineField({name: 'portfolioLink', type: 'link'}),
    defineField({name: 'footerCaption', type: 'string'}),
    defineField({name: 'address', type: 'string'}),
    defineField({name: 'phone', type: 'string'}),
    defineField({name: 'phoneLink', type: 'string', description: 'International format, e.g. +12395550108.'}),
    defineField({name: 'mapLocation', type: 'string', description: 'Place name used in Google Maps.'}),
    defineField({name: 'socialLinks', type: 'array', of: [defineArrayMember({type: 'link'})]}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
