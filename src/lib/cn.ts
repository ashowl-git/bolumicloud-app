// 조건부 className 합성 유틸.
// falsy 값을 걸러 공백으로 합친다. (clsx 의존성 없이 동일 용도)
//
//   cn('base', isActive && 'active', error ? 'border-red-500' : 'border-gray-200')

export type ClassValue = string | false | null | undefined

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
