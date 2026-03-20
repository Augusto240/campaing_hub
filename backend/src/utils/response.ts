export function success<T>(data: T, message?: string) {
  return {
    status: 'success',
    message,
    data,
  };
}

export function error(message: string, statusCode: number = 500) {
  return {
    status: 'error',
    statusCode,
    message,
  };
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  return {
    status: 'success',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
