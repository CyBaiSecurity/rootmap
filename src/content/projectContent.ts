import graphql from '../../content/methodologies/web/graphql.yaml?raw'
import wstg from '../../content/methodologies/web/wstg-v42.yaml?raw'
import resources from '../../content/resources/web.yaml?raw'
import tools from '../../content/tools/web.yaml?raw'
import { createGraph } from './graph'
import { loadContent } from './loadContent'

export const projectContent = loadContent({
  methodologies: [wstg, graphql],
  tools: [tools],
  resources: [resources],
})

export const projectGraph = createGraph(projectContent)
