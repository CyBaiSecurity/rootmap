import { useCallback, useEffect, useState } from 'react'

import { readProgress, toggleNode, writeProgress, type ProgressState } from './progress'

export function useProgress(storage: Storage = window.localStorage) {
  const [progress, setProgress] = useState<ProgressState>(() => readProgress(storage))

  useEffect(() => {
    writeProgress(storage, progress)
  }, [progress, storage])

  const toggle = useCallback((nodeId: string) => {
    setProgress((current) => toggleNode(current, nodeId))
  }, [])

  return { progress, toggle }
}

