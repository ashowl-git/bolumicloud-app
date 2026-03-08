'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

/**
 * Pipeline Context 팩토리.
 *
 * 4개 분석 모듈(Sunlight, SolarPV, View, Privacy)이 동일한
 * Provider + useContext 패턴을 반복하므로, 공통 로직을 추출한다.
 *
 * @param displayName   디버깅용 이름 (예: 'Sunlight')
 * @param useHookFn     apiUrl을 받아 pipeline 객체를 반환하는 커스텀 훅
 * @param depsSelector  useMemo deps로 사용할 값 배열을 추출하는 함수.
 *                      콜백 함수는 제외하고 데이터 속성만 포함하여
 *                      불필요한 re-render를 방지한다.
 */
export function createPipelineContext<TReturn>(
  displayName: string,
  useHookFn: (apiUrl: string) => TReturn,
  depsSelector: (pipeline: TReturn) => unknown[],
) {
  const Ctx = createContext<TReturn | null>(null)

  function Provider({ children, apiUrl }: { children: ReactNode; apiUrl: string }) {
    const pipeline = useHookFn(apiUrl)

    // depsSelector는 데이터 속성만 추출하여 콜백 함수 변경에 의한
    // 불필요한 re-render를 방지한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const value = useMemo(() => pipeline, depsSelector(pipeline))

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
  }
  Provider.displayName = `${displayName}PipelineProvider`

  function usePipelineContext(): TReturn {
    const ctx = useContext(Ctx)
    if (!ctx) {
      throw new Error(
        `use${displayName}PipelineContext must be used within ${displayName}PipelineProvider`,
      )
    }
    return ctx
  }

  return { Provider, usePipelineContext } as const
}
