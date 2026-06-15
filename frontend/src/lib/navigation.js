export function getDefaultRouteForUser(user) {
  return user?.role === 'ADMIN' ? '/admin' : '/'
}
