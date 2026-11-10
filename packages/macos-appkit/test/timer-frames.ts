// Only for existing mocked-native style tests; not display-link evidence.
export const animationNow = () => Date.now()
export const requestAnimationFrame = (callback: (time: number) => void) =>
  setTimeout(() => callback(animationNow()), 16)

export const cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id)
