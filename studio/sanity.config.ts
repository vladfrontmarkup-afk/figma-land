import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {singletonTypes, structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Figma Land',

  projectId: 'n9ojwqp4',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  document: {
    newDocumentOptions: (items) => items.filter((item) => !singletonTypes.has(item.templateId)),
    actions: (items, context) => singletonTypes.has(context.schemaType)
      ? items.filter(({action}) => action !== 'delete' && action !== 'duplicate' && action !== 'unpublish')
      : items,
  },

  schema: {
    types: schemaTypes,
    templates: (items) => items.filter((item) => !singletonTypes.has(item.schemaType)),
  },
})
