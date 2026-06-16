export function getDefaultRouteForUser(user) {
  if (user?.role === 'ADMIN') {
    return '/admin'
  }

  if (user?.role === 'MANAGER') {
    return '/partner'
  }

  return '/'
}
