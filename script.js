// Recipe Roll - Random Recipe Generator
const API_KEY = '';

// DOM Elements
const refreshIcon = document.querySelector('.refresh-icon');
const mobileRefresh = document.querySelector('.mobile-refresh');
const recipeImage = document.getElementById('recipeImage');
const recipeName = document.getElementById('recipeName');
const cookTime = document.getElementById('cookTime');
const difficulty = document.getElementById('difficulty');
const servings = document.getElementById('servings');
const recipeLink = document.getElementById('recipeLink');
const timeButtons = document.querySelectorAll('.price-btn');
const bookmarkBtn = document.querySelector('.bookmark-btn');
const bookmarksBtn = document.querySelector('.bookmarks-btn');
const bookmarksOverlay = document.querySelector('.bookmarks-overlay');
const closeBookmarksBtn = document.querySelector('.close-bookmarks');
const bookmarksList = document.querySelector('.bookmarks-list');

// Add overlay background div
const overlayBg = document.createElement('div');
overlayBg.className = 'overlay-bg';
document.body.appendChild(overlayBg);

// Time filters in minutes
const timeFilters = {
    'quick': 30,
    'medium': 60,
    'long': 120
};

let currentTimeFilter = 'quick';

// Categories for main dishes
const DINNER_CATEGORIES = ['Beef', 'Chicken', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegetarian'];

// Current recipe data
let currentRecipe = null;

// Load bookmarks from localStorage
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

// Function to save bookmarks to localStorage
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// Function to toggle bookmark
function toggleBookmark() {
    if (!currentRecipe) return;

    const isBookmarked = bookmarks.some(bookmark => bookmark.idMeal === currentRecipe.idMeal);
    
    if (isBookmarked) {
        bookmarks = bookmarks.filter(bookmark => bookmark.idMeal !== currentRecipe.idMeal);
        bookmarkBtn.classList.remove('active');
        bookmarkBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    } else {
        bookmarks.push(currentRecipe);
        bookmarkBtn.classList.add('active');
        bookmarkBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    }
    
    saveBookmarks();
    updateBookmarksList();
}

// Function to update bookmarks list
function updateBookmarksList() {
    bookmarksList.innerHTML = '';
    
    bookmarks.forEach((recipe, index) => {
        const bookmarkItem = document.createElement('div');
        bookmarkItem.className = 'bookmark-item';
        bookmarkItem.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <div class="bookmark-item-info">
                <h3>${recipe.strMeal}</h3>
                <p>${recipe.strCategory}</p>
            </div>
            <button class="delete-bookmark" aria-label="Remove bookmark">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        
        // Add click event to load recipe into main window
        const recipeContent = bookmarkItem.querySelector('.bookmark-item-info');
        recipeContent.addEventListener('click', () => {
            // Load the clicked recipe
            currentRecipe = recipe;
            
            // Update UI with bookmarked recipe details
            recipeImage.src = recipe.strMealThumb;
            recipeName.textContent = recipe.strMeal.toUpperCase();
            
            // Estimate cooking time based on number of ingredients
            const ingredientCount = Object.keys(recipe).filter(key => key.startsWith('strIngredient') && recipe[key]).length;
            const estimatedTime = Math.max(20, ingredientCount * 10); // minimum 20 mins
            cookTime.textContent = `🕒 ${estimatedTime} mins`;
            
            // Set difficulty based on number of ingredients and steps
            const steps = recipe.strInstructions.split('.').length;
            const difficultyLevel = steps <= 5 ? 'Easy' : 
                                  steps <= 10 ? 'Medium' : 'Hard';
            difficulty.textContent = `👨‍🍳 ${difficultyLevel}`;
            
            // Mark as bookmarked
            bookmarkBtn.classList.add('active');
            bookmarkBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            
            // Estimate servings (most recipes serve 4)
            servings.textContent = `🍽️ Serves: 4`;
            recipeLink.href = recipe.strSource || recipe.strYoutube || '#';
            
            // Close bookmarks overlay
            toggleBookmarksOverlay();
        });
        
        // Add delete bookmark functionality
        const deleteBtn = bookmarkItem.querySelector('.delete-bookmark');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering recipe load
            
            // Remove the recipe from bookmarks
            bookmarks.splice(index, 1);
            
            // Update localStorage
            saveBookmarks();
            
            // Refresh the bookmarks list
            updateBookmarksList();
            
            // If the deleted recipe was the current recipe, update bookmark button
            if (currentRecipe && currentRecipe.idMeal === recipe.idMeal) {
                bookmarkBtn.classList.remove('active');
                bookmarkBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }
        });
        
        bookmarksList.appendChild(bookmarkItem);
    });
}

// Function to toggle bookmarks overlay
function toggleBookmarksOverlay() {
    bookmarksOverlay.classList.toggle('active');
    overlayBg.classList.toggle('active');
}

// Event listeners for bookmarks
bookmarkBtn.addEventListener('click', toggleBookmark);
bookmarksBtn.addEventListener('click', toggleBookmarksOverlay);
closeBookmarksBtn.addEventListener('click', toggleBookmarksOverlay);
overlayBg.addEventListener('click', toggleBookmarksOverlay);

// Add click events to time filter buttons
timeButtons.forEach(button => {
    button.addEventListener('click', () => {
        timeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTimeFilter = button.dataset.time;
        getRandomRecipe();
    });
});

// Function to get a random recipe
async function getRandomRecipe() {
    try {
        // First get a random dinner category
        const category = DINNER_CATEGORIES[Math.floor(Math.random() * DINNER_CATEGORIES.length)];
        
        // Get all meals in this category
        const categoryResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
        const categoryData = await categoryResponse.json();
        
        if (!categoryData.meals) {
            throw new Error('No meals found in category');
        }

        // Pick a random meal from the category
        const randomMeal = categoryData.meals[Math.floor(Math.random() * categoryData.meals.length)];
        
        // Get full meal details
        const mealResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${randomMeal.idMeal}`);
        const mealData = await mealResponse.json();
        currentRecipe = mealData.meals[0];

        // Update the UI
        recipeImage.src = currentRecipe.strMealThumb;
        recipeName.textContent = currentRecipe.strMeal.toUpperCase();
        
        // Estimate cooking time based on number of ingredients
        const ingredientCount = Object.keys(currentRecipe).filter(key => key.startsWith('strIngredient') && currentRecipe[key]).length;
        const estimatedTime = Math.max(20, ingredientCount * 10); // minimum 20 mins
        cookTime.textContent = `🕒 ${estimatedTime} mins`;
        
        // Set difficulty based on number of ingredients and steps
        const steps = currentRecipe.strInstructions.split('.').length;
        const difficultyLevel = steps <= 5 ? 'Easy' : 
                              steps <= 10 ? 'Medium' : 'Hard';
        difficulty.textContent = `👨‍🍳 ${difficultyLevel}`;
        
        // Update bookmark button state
        const isBookmarked = bookmarks.some(bookmark => bookmark.idMeal === currentRecipe.idMeal);
        bookmarkBtn.classList.toggle('active', isBookmarked);
        bookmarkBtn.innerHTML = isBookmarked ? 
            '<i class="fa-solid fa-heart"></i>' : 
            '<i class="fa-regular fa-heart"></i>';
        
        // Estimate servings (most recipes serve 4)
        servings.textContent = `🍽️ Serves: 4`;
        recipeLink.href = currentRecipe.strSource || currentRecipe.strYoutube || '#';

        // Ensure bookmarks list is preserved
        updateBookmarksList();

    } catch (error) {
        console.error('Error fetching recipe:', error);
        setFallbackRecipe();
    }
}

// Fallback recipe in case API fails
function setFallbackRecipe() {
    recipeImage.src = 'https://spoonacular.com/recipeImages/716429-556x370.jpg';
    recipeName.textContent = 'PASTA CARBONARA';
    cookTime.textContent = '🕒 30 mins';
    difficulty.textContent = '👨‍🍳 Easy';
    servings.textContent = '🍽️ Serves: 4';
    recipeLink.href = '#';
}

// Function to trigger refresh animation and get new recipe
function triggerRefresh(element) {
    element.classList.add('rolling');
    getRandomRecipe();
    setTimeout(() => {
        element.classList.remove('rolling');
    }, 600);
}

// Add click event to refresh icons
refreshIcon.addEventListener('click', () => triggerRefresh(refreshIcon));
mobileRefresh.addEventListener('click', () => triggerRefresh(mobileRefresh));

// Initial recipe load
getRandomRecipe();
