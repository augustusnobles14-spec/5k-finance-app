export let needsBalanceRefresh = false

export const markBalanceNeedsRefresh = () => {
  needsBalanceRefresh = true
}

export const consumeBalanceNeedsRefresh = () => {
  const value = needsBalanceRefresh
  needsBalanceRefresh = false
  return value
}
