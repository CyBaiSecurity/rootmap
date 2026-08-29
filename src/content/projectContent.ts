import dfirMethodology from '../../content/methodologies/dfir/dfir.yaml?raw'
import graphql from '../../content/methodologies/web/graphql.yaml?raw'
import wstg from '../../content/methodologies/web/wstg-v42.yaml?raw'
import dfirResources from '../../content/resources/dfir.yaml?raw'
import webResources from '../../content/resources/web.yaml?raw'
import dfirTools from '../../content/tools/dfir.yaml?raw'
import webTools from '../../content/tools/web.yaml?raw'
import { createGraph } from './graph'
import { loadContent } from './loadContent'

export const projectContent = loadContent({
  methodologies: [wstg, graphql, dfirMethodology],
  tools: [webTools, dfirTools],
  resources: [webResources, dfirResources],
})

export const projectGraph = createGraph(projectContent)

