import {defineArrayMember, defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons/Tag'

export const pricingPlan = defineType({
  name: 'pricingPlan', title: 'Pricing plan', type: 'document', icon: TagIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', type: 'string'}),
    defineField({name: 'image', type: 'contentImage'}),
    defineField({name: 'amount', type: 'number', validation: (rule) => rule.required().min(0)}),
    defineField({name: 'currency', type: 'string', initialValue: '$', validation: (rule) => rule.required()}),
    defineField({name: 'period', type: 'string', initialValue: 'Per/ month', validation: (rule) => rule.required()}),
    defineField({name: 'features', type: 'array', of: [defineArrayMember({
      name: 'planFeature', type: 'object', icon: TagIcon,
      fields: [
        defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'included', type: 'boolean', initialValue: true}),
      ],
      preview: {select: {title: 'label', included: 'included'},
        prepare: ({title, included}) => ({title, subtitle: included ? 'Included' : 'Not included'})},
    })]}),
    defineField({name: 'action', type: 'link'}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})
