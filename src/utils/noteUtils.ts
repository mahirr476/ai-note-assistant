// src/utils/noteUtils.ts
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getCategoryColor = (category: string): string => {
  const colors = {
    'Meeting': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Task': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Idea': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Contact': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'Project': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'Finance': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    'General': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };
  return colors[category as keyof typeof colors] || colors.General;
};

export const getPriorityColor = (priority: string): string => {
  const colors = {
    'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };
  return colors[priority as keyof typeof colors] || colors.medium;
};