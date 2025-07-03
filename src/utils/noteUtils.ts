// src/utils/noteUtils.ts (Fixed formatDate function)

// FIXED: Proper date formatting that handles timezones correctly
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    
    // Create date objects using local time components to avoid timezone issues
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Extract just the date part from the input date (ignore time)
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Compare dates
    if (inputDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (inputDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (inputDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      // For other dates, use local date formatting
      return inputDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: inputDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Alternative: More robust formatDate with explicit timezone handling
export const formatDateSafe = (dateString: string): string => {
  try {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    
    // Get the date in local timezone by using date components
    const taskYear = date.getFullYear();
    const taskMonth = date.getMonth();
    const taskDay = date.getDate();
    
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();
    
    // Calculate day difference properly
    const taskDate = new Date(taskYear, taskMonth, taskDay);
    const todayDate = new Date(todayYear, todayMonth, todayDay);
    const dayDiff = Math.round((taskDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) {
      return 'Today';
    } else if (dayDiff === 1) {
      return 'Tomorrow';
    } else if (dayDiff === -1) {
      return 'Yesterday';
    } else if (dayDiff > 1 && dayDiff <= 7) {
      return taskDate.toLocaleDateString(undefined, { weekday: 'long' });
    } else {
      return taskDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: taskYear !== todayYear ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting date safely:', error);
    return 'Invalid Date';
  }
};

// Debug version to help identify the issue
export const formatDateDebug = (dateString: string): string => {
  try {
    console.log('formatDate input:', dateString);
    
    const date = new Date(dateString);
    console.log('Parsed date object:', date);
    console.log('Date components:', {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hours: date.getHours(),
      timezone: date.getTimezoneOffset()
    });
    
    const now = new Date();
    console.log('Current date:', now);
    
    const result = formatDateSafe(dateString);
    console.log('Formatted result:', result);
    
    return result;
  } catch (error) {
    console.error('Debug formatDate error:', error);
    return 'Error';
  }
};

// Other utility functions (if they don't exist)
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    case 'medium':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    case 'low':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  }
};

export const getCategoryColor = (category: string): string => {
  const colors = [
    'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    'text-green-600 bg-green-100 dark:bg-green-900/30',
    'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
    'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
  ];
  
  // Simple hash function to consistently assign colors
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};