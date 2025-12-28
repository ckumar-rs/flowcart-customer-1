export interface ErrorDetails {
  message: string;
  title: string;
  suggestion?: string;
}

export const getErrorMessage = (error: any): ErrorDetails => {
  // Network errors
  if (!error.response) {
    if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        suggestion: 'Please check your internet connection and try again.',
      };
    }
    if (error.message?.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete.',
        suggestion: 'Please try again. If the problem persists, the server may be busy.',
      };
    }
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // HTTP status code errors
  switch (status) {
    case 400:
      return {
        title: 'Invalid Request',
        message: data?.message || 'The request was invalid. Please check your input.',
        suggestion: 'Please review the information you entered and try again.',
      };

    case 401:
      return {
        title: 'Authentication Required',
        message: data?.message || 'Please log in to continue.',
        suggestion: 'Your session may have expired. Please log in again.',
      };

    case 403:
      return {
        title: 'Access Denied',
        message: data?.message || 'You do not have permission to perform this action.',
        suggestion: 'Please contact support if you believe this is an error.',
      };

    case 404:
      return {
        title: 'Not Found',
        message: data?.message || 'The requested resource was not found.',
        suggestion: 'The item you are looking for may have been removed or does not exist.',
      };

    case 409:
      return {
        title: 'Conflict',
        message: data?.message || 'This action conflicts with the current state.',
        suggestion: 'Please refresh the page and try again.',
      };

    case 422:
      return {
        title: 'Validation Error',
        message: data?.message || 'Please check your input and try again.',
        suggestion: Array.isArray(data?.errors)
          ? data.errors.join(', ')
          : 'Please review the form and correct any errors.',
      };

    case 429:
      return {
        title: 'Too Many Requests',
        message: 'You have made too many requests. Please wait a moment.',
        suggestion: 'Please wait a few seconds before trying again.',
      };

    case 500:
      return {
        title: 'Server Error',
        message: 'An error occurred on the server. Please try again later.',
        suggestion: 'Our team has been notified. Please try again in a few minutes.',
      };

    case 502:
    case 503:
    case 504:
      return {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable.',
        suggestion: 'Please try again in a few moments. We are working to restore service.',
      };

    default:
      // Try to extract message from response
      if (data?.message) {
        return {
          title: 'Error',
          message: data.message,
          suggestion: 'Please try again. If the problem persists, contact support.',
        };
      }

      if (typeof data === 'string') {
        return {
          title: 'Error',
          message: data,
          suggestion: 'Please try again.',
        };
      }

      // Generic error
      return {
        title: 'Something Went Wrong',
        message: error.message || 'An unexpected error occurred.',
        suggestion: 'Please try again. If the problem persists, contact support.',
      };
  }
};

export const formatValidationErrors = (errors: any): string => {
  if (typeof errors === 'string') {
    return errors;
  }

  if (Array.isArray(errors)) {
    return errors.join(', ');
  }

  if (typeof errors === 'object') {
    return Object.values(errors)
      .flat()
      .filter(Boolean)
      .join(', ');
  }

  return 'Please check your input and try again.';
};

