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

// Time filters 
const timeFilters = {};

let currentTimeFilter = null;

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

// List of terms that indicate a dessert or sweet
const DESSERT_TERMS = [
    'cake', 'cookie', 'cookies', 'pudding', 'sweet', 'dessert', 
    'chocolate', 'ice cream', 'brownie', 'candy', 'sugar', 'pastry', 'pastries',
    'muffin', 'cupcake', 'frosting', 'icing', 'caramel', 'toffee',
    'donut', 'doughnut', 'custard', 'tart', 'cobbler'
];

// List of dessert-specific pie types
const DESSERT_PIES = [
    'apple pie',
    'cherry pie',
    'blueberry pie',
    'peach pie',
    'banana pie',
    'cream pie',
    'custard pie',
    'fruit pie',
    'pecan pie',
    'pumpkin pie',
    'sugar pie',
    'sweet pie'
];

// Function to check if a recipe is a dessert
function isDessert(recipe) {
    const titleLower = recipe.strMeal.toLowerCase();
    const categoryLower = recipe.strCategory.toLowerCase();
    
    // If the category is explicitly "Dessert"
    if (categoryLower === 'dessert') return true;
    
    // Check if any dessert terms appear in the title
    if (DESSERT_TERMS.some(term => titleLower.includes(term.toLowerCase()))) {
        return true;
    }

    // Check specifically for dessert pies, but allow savory pies to pass through
    if (titleLower.includes('pie')) {
        return DESSERT_PIES.some(pie => titleLower.includes(pie.toLowerCase()));
    }

    return false;
}

// Function to get a random recipe
async function getRandomRecipe() {
    try {
        let attempts = 0;
        const maxAttempts = 10;
        let selectedMeal;

        while (attempts < maxAttempts) {
            // Fetch a random meal from the API
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/random.php`);
            const data = await response.json();
            
            if (!data.meals || data.meals.length === 0) {
                throw new Error('No recipes found');
            }
            
            selectedMeal = data.meals[0];
            
            // If it's not a dessert, we can use this recipe
            if (!isDessert(selectedMeal)) {
                break;
            }
            
            attempts++;
        }

        // If we couldn't find a non-dessert recipe after max attempts, use the last recipe anyway
        displayRecipe(selectedMeal);
    } catch (error) {
        console.error('Error fetching recipe:', error);
        setFallbackRecipe();
    }
}

// Function to display a recipe
function displayRecipe(recipe) {
    // Set current recipe
    currentRecipe = recipe;

    // Log full recipe details for inspection
    console.log('Full Recipe Details:', recipe);

    // Update the UI with the recipe details
    recipeImage.src = recipe.strMealThumb;
    recipeName.textContent = recipe.strMeal.toUpperCase();
    
    // Remove cooking time estimation
    cookTime.textContent = '';
    
    // Remove difficulty level estimation
    difficulty.textContent = '';
    
    // Update bookmark button state
    const isBookmarked = bookmarks.some(bookmark => bookmark.idMeal === recipe.idMeal);
    bookmarkBtn.classList.toggle('active', isBookmarked);
    bookmarkBtn.innerHTML = isBookmarked ? 
        '<i class="fa-solid fa-heart"></i>' : 
        '<i class="fa-regular fa-heart"></i>';
    
    // Remove servings estimation
    servings.textContent = '';
    
    // Set up recipe link to open modal
    recipeLink.onclick = (e) => {
        e.preventDefault();
        showRecipeDetailsModal(recipe);
    };

    // Make recipe image clickable to open modal
    recipeImage.onclick = () => {
        showRecipeDetailsModal(recipe);
    };
    
    // Ensure bookmarks list is preserved
    updateBookmarksList();
}

// Function to create and display recipe details modal
function showRecipeDetailsModal(recipe) {
    // Collect ingredients and measurements
    const ingredientsList = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measurement = recipe[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredientsList.push(`${measurement || ''} ${ingredient}`.trim());
        }
    }

    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'recipe-modal';
    modal.innerHTML = `
        <div class="recipe-modal-content">
            <button class="recipe-modal-close" aria-label="Close modal">
                <span class="close-icon">×</span>
            </button>
            
            <div class="recipe-modal-header">
                <div class="recipe-modal-image">
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
                    ${recipe.strSource ? `
                        <a href="${recipe.strSource}" target="_blank" class="recipe-image-source-btn">
                            Source
                        </a>
                    ` : ''}
                </div>
                <h2>${recipe.strMeal}</h2>
            </div>
            
            <div class="recipe-modal-sections">
                <div class="recipe-modal-ingredients">
                    <h3>Ingredients</h3>
                    <ul>
                        ${ingredientsList.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="recipe-modal-instructions">
                    <h3>Instructions</h3>
                    <div class="instructions-text">
                        ${recipe.strInstructions.split('\n').map(line => `<p>${line}</p>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="recipe-modal-links">
                ${recipe.strYoutube ? `<a href="${recipe.strYoutube}" target="_blank" class="recipe-youtube-link">Watch on YouTube</a>` : ''}
            </div>
        </div>
    `;

    // Add to body
    document.body.appendChild(modal);

    // Close modal when clicking close button
    const closeBtn = modal.querySelector('.recipe-modal-close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Close modal when clicking outside of content
    modal.addEventListener('click', (event) => {
        // Check if the click is directly on the modal (not on its content)
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Prevent clicks inside the modal content from closing the modal
    const modalContent = modal.querySelector('.recipe-modal-content');
    modalContent.addEventListener('click', (event) => {
        event.stopPropagation();
    });
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

// Remove time filter event listeners
timeButtons.forEach(button => {
    button.removeEventListener('click', () => {
        timeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTimeFilter = button.dataset.time;
        getRandomRecipe();
    });
});

// Initial recipe load
getRandomRecipe();
