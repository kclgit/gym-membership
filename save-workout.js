const STORAGE_KEY = 'customWorkouts';

function getWorkouts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

