import {defineArrayMember, defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'
import {ImageIcon} from '@sanity/icons/Image'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'

export const link = defineType({
  name: 'link', title: 'Link', type: 'object', icon: LinkIcon,
  fields: [
    defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'href', title: 'Destination', type: 'string',
      description: 'Use a page anchor (e.g. #pricing), an https URL, or a tel/mailto link.',
      validation: (rule) => rule.required().custom((value) =>
        !value || /^(#[\w-]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d()-]+)$/.test(value)
          ? true : 'Enter a page anchor, http(s), mailto, or tel link.')}),
  ],
  preview: {select: {title: 'label', subtitle: 'href'}},
})

export const contentImage = defineType({
  name: 'contentImage', title: 'Image', type: 'image', icon: ImageIcon,
  options: {hotspot: true},
  fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string',
    description: 'Describe meaningful images. Leave empty for decorative illustrations.'})],
})

export const contentSection = defineType({
  name: 'contentSection', title: 'Content section', type: 'object', icon: DocumentTextIcon,
  fields: [
    defineField({name: 'anchor', type: 'string', options: {list: ['workflow', 'operations', 'business']},
      validation: (rule) => rule.required()}),
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'mobileTitle', type: 'string', description: 'Optional mobile wording.'}),
    defineField({name: 'description', type: 'text', rows: 3, validation: (rule) => rule.required()}),
    defineField({name: 'mobileDescription', type: 'text', rows: 3}),
    defineField({name: 'image', type: 'contentImage'}),
    defineField({name: 'mobileImage', type: 'contentImage'}),
    defineField({name: 'actions', type: 'array', of: [defineArrayMember({type: 'link'})],
      validation: (rule) => rule.max(2)}),
  ],
  preview: {select: {title: 'title', subtitle: 'anchor', media: 'image'}},
})
