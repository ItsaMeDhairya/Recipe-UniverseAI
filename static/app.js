(() => {
    // --- APPLICATION STATE & CONFIG ---
    const state = {
        currentUser: null,
        currentPage: 'home',
        currentRecipe: null,
        isLoading: false,
    };

    // --- DOM ELEMENT CACHE ---
    const dom = {};

    // --- API SERVICE ---
    const api = {
        async _request(endpoint, method = 'GET', body = null) {
            const headers = { 'X-User-ID': state.currentUser.id };
            const options = { method, headers };
            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
            const response = await fetch(endpoint, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return response.json();
        },
        get(endpoint) { return this._request(endpoint, 'GET'); },
        post(endpoint, body) { return this._request(endpoint, 'POST', body); },
        delete(endpoint) { return this._request(endpoint, 'DELETE'); }
    };

    // --- ROUTER & PAGE RENDERING ---
    const router = {
        routes: {},
        register(path, renderer) { this.routes[path] = renderer; },
        navigate(path) { if (state.currentPage !== path) window.location.hash = path; },
        handleRouteChange() {
            const path = window.location.hash.substring(1) || 'home';
            if (this.routes[path]) {
                state.currentPage = path;
                dom.navLinks.forEach(link => {
                    const linkPath = link.getAttribute('href').substring(1);
                    link.classList.toggle('bg-indigo-100', linkPath === path);
                    link.classList.toggle('dark:bg-indigo-500/20', linkPath === path);
                    link.classList.toggle('text-indigo-600', linkPath === path);
                    link.classList.toggle('dark:text-indigo-300', linkPath === path);
                });
                this.routes[path]();
            } else {
                dom.mainContent.innerHTML = templates.notFound();
            }
        }
    };

    // --- INITIALIZATION ---
    async function init() {
        // Cache DOM elements directly and reliably
        dom.sidebar = document.getElementById('sidebar');
        dom.sidebarToggle = document.getElementById('sidebar-toggle');
        dom.mainContent = document.getElementById('main-content');
        dom.navLinks = document.querySelectorAll('.nav-item');
        dom.themeToggle = document.getElementById('theme-toggle');
        dom.themeIndicator = document.getElementById('theme-indicator');
        dom.modalContainer = document.getElementById('modal-container');
        dom.toastContainer = document.getElementById('toast-container');

        try {
            let userId = localStorage.getItem('recipeUniverseUserId');
            if (!userId) {
                userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                localStorage.setItem('recipeUniverseUserId', userId);
            }
            state.currentUser = { id: userId };

            const userData = await api.get('/api/user');
            state.currentUser = { ...state.currentUser, ...userData };

            router.register('home', renderHomePage);
            router.register('generate', renderGeneratorPage);
            router.register('cookbook', renderCookbookPage);
            router.register('pantry', renderPantryPage);
            router.register('planner', renderPlannerPage);
            router.register('settings', renderSettingsPage);
            
            setupTheme();
            setupEventListeners();
            router.handleRouteChange();

        } catch (error) {
            console.error("Critical initialization error:", error);
            dom.mainContent.innerHTML = templates.error("Initialization Failed", `Could not connect to the server. Please ensure the backend is running (python app.py) and refresh the page. Details: ${error.message}`);
        }
    }

    // --- SETUP FUNCTIONS ---
    function setupTheme() {
        const theme = state.currentUser.preferences?.theme || 'light';
        applyTheme(theme);
    }

    function setupEventListeners() {
        dom.sidebarToggle.addEventListener('click', () => {
            dom.sidebar.classList.toggle('-translate-x-full');
        });

        dom.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    dom.sidebar.classList.add('-translate-x-full');
                }
            });
        });

        window.addEventListener('hashchange', () => router.handleRouteChange());
        dom.themeToggle.addEventListener('click', handleThemeToggle);
        dom.modalContainer.addEventListener('click', (e) => {
            if (e.target === dom.modalContainer) hideModal();
        });
    }

    // --- PAGE RENDERERS ---
    function renderHomePage() {
        dom.mainContent.innerHTML = templates.home(state.currentUser);
        document.getElementById('go-to-generator-btn').addEventListener('click', () => router.navigate('generate'));
    }

    function renderGeneratorPage() {
        dom.mainContent.innerHTML = templates.generator();
        document.getElementById('generate-btn').addEventListener('click', handleGenerateRecipe);
    }

    async function renderCookbookPage() {
        dom.mainContent.innerHTML = templates.loading("Loading Your Cookbook...");
        try {
            await refreshUserData();
            dom.mainContent.innerHTML = templates.cookbook(state.currentUser.cookbook);
            dom.mainContent.addEventListener('click', handleCookbookActions);
        } catch (error) {
            dom.mainContent.innerHTML = templates.error("Failed to load cookbook.", error.message);
        }
    }
    
    async function renderPantryPage() {
        dom.mainContent.innerHTML = templates.loading("Loading Your Pantry...");
        try {
            await refreshUserData();
            dom.mainContent.innerHTML = templates.pantry(state.currentUser.pantry);
            dom.mainContent.addEventListener('click', handlePantryActions);
        } catch (error) {
            dom.mainContent.innerHTML = templates.error("Failed to load pantry.", error.message);
        }
    }
    
    async function renderPlannerPage() {
        dom.mainContent.innerHTML = templates.loading("Loading Your Meal Plan...");
        try {
            await refreshUserData();
            dom.mainContent.innerHTML = templates.planner(state.currentUser.meal_plan, state.currentUser.cookbook);
            dom.mainContent.addEventListener('change', handlePlannerActions);
        } catch (error) {
            dom.mainContent.innerHTML = templates.error("Failed to load meal planner.", error.message);
        }
    }

    async function renderSettingsPage() {
        dom.mainContent.innerHTML = templates.loading("Loading Settings...");
        try {
             await refreshUserData();
            dom.mainContent.innerHTML = templates.settings(state.currentUser.preferences);
            document.getElementById('save-settings-btn').addEventListener('click', handleSettingsSave);
        } catch (error) {
            dom.mainContent.innerHTML = templates.error("Failed to load settings.", error.message);
        }
    }

    // --- EVENT HANDLERS ---
    async function handleGenerateRecipe() {
        const ingredients = document.getElementById('ingredients-input').value.trim();
        if (!ingredients) return showToast("Please enter at least one ingredient.", "error");

        const outputDiv = document.getElementById('recipe-output');
        outputDiv.innerHTML = templates.loading("The AI is thinking...");
        
        try {
            const payload = {
                ingredients,
                cuisine: document.getElementById('cuisine-select').value,
                diet: document.getElementById('diet-select').value,
                pantry: state.currentUser.pantry
            };
            const recipe = await api.post('/api/generate', payload);
            
            const imageResponse = await api.post('/api/image', { query: recipe.recipeName });
            recipe.imageUrl = imageResponse.imageUrl;
            
            state.currentRecipe = recipe;
            outputDiv.innerHTML = templates.recipeCard(recipe, false);
            addRecipeCardEventListeners(recipe);
        } catch (error) {
            handleApiError("Recipe Generation Failed", error, outputDiv);
        }
    }

    function addRecipeCardEventListeners(recipe) {
        const card = document.getElementById('recipe-output');
        card.querySelector('[data-action="view-recipe"]').addEventListener('click', () => showModal(templates.recipeModal(recipe)));
        card.querySelector('[data-action="save-recipe"]').addEventListener('click', () => handleSaveRecipe(recipe));
        card.querySelectorAll('[data-action="modify-recipe"]').forEach(btn => 
            btn.addEventListener('click', (e) => handleModifyRecipe(recipe, e.currentTarget.dataset.modType))
        );
        card.querySelector('[data-action="get-pairings"]').addEventListener('click', () => handleGetPairings(recipe));
        card.querySelector('[data-action="get-swaps"]').addEventListener('click', () => handleGetSwaps(recipe));
    }
    
    async function handleSaveRecipe(recipe) {
        const saveBtn = document.querySelector('[data-action="save-recipe"]');
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'Saving...';
        try {
            const savedRecipe = await api.post('/api/cookbook', recipe);
            state.currentUser.cookbook.push(savedRecipe);
            showToast("Recipe saved to cookbook!", "success");
            saveBtn.innerHTML = 'Saved!';
            saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            saveBtn.classList.add('bg-green-600', 'cursor-not-allowed');
        } catch (error) {
            handleApiError("Save Failed", error);
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save to Cookbook';
        }
    }

    async function handleModifyRecipe(recipe, modType) {
        const outputDiv = document.getElementById('recipe-output');
        outputDiv.innerHTML = templates.loading(`Making the recipe ${modType}...`);
        try {
            const modifiedRecipe = await api.post('/api/modify', { recipe, mod_type: modType });
            const imageResponse = await api.post('/api/image', { query: modifiedRecipe.recipeName });
            modifiedRecipe.imageUrl = imageResponse.imageUrl;
            state.currentRecipe = modifiedRecipe;
            outputDiv.innerHTML = templates.recipeCard(modifiedRecipe, false);
            addRecipeCardEventListeners(modifiedRecipe);
        } catch (error) {
            handleApiError("Modification Failed", error, outputDiv);
        }
    }

    async function handleGetPairings(recipe) {
        const enhancementDiv = document.getElementById('enhancements-output');
        enhancementDiv.innerHTML = templates.loading();
        try {
            const pairings = await api.post('/api/pairings', recipe);
            enhancementDiv.innerHTML = templates.pairingsResult(pairings);
        } catch (error) {
            handleApiError("Could not get pairings", error, enhancementDiv);
        }
    }

    async function handleGetSwaps(recipe) {
        const enhancementDiv = document.getElementById('enhancements-output');
        const ingredient = document.getElementById('swap-ingredient-input').value.trim();
        if (!ingredient) return showToast("Enter an ingredient to swap.", "error");
        
        enhancementDiv.innerHTML = templates.loading();
        try {
            const swaps = await api.post('/api/swaps', { recipe, ingredient });
            enhancementDiv.innerHTML = templates.swapsResult(swaps);
        } catch (error) {
            handleApiError("Could not get swaps", error, enhancementDiv);
        }
    }
    
    async function handleCookbookActions(e) {
        const target = e.target.closest('button[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        const recipeId = target.dataset.id;
        const recipe = state.currentUser.cookbook.find(r => r.id === recipeId);

        if (action === 'view-recipe') {
            showModal(templates.recipeModal(recipe));
        } else if (action === 'delete-recipe') {
            if (confirm("Are you sure you want to delete this recipe?")) {
                try {
                    await api.delete(`/api/cookbook/${recipeId}`);
                    showToast("Recipe deleted.", "success");
                    renderCookbookPage();
                } catch (error) {
                    handleApiError("Delete Failed", error);
                }
            }
        }
    }

    async function handlePantryActions(e) {
        const target = e.target;
        if (target.id === 'add-pantry-item-btn') {
            const input = document.getElementById('pantry-item-input');
            const item = input.value.trim();
            if (item && !state.currentUser.pantry.find(i => i.toLowerCase() === item.toLowerCase())) {
                state.currentUser.pantry.push(item);
                await updatePantryAndRerender();
                input.value = '';
            } else if (item) {
                showToast("Item already in pantry.", "error");
            }
        } else if (target.dataset.action === 'delete-pantry-item') {
            const item = target.dataset.item;
            state.currentUser.pantry = state.currentUser.pantry.filter(i => i !== item);
            await updatePantryAndRerender();
        }
    }
    
    async function handlePlannerActions(e) {
        if(e.target.matches('select[data-day]')) {
            const select = e.target;
            const day = select.dataset.day;
            const meal = select.dataset.meal;
            const recipeId = select.value;
            state.currentUser.meal_plan[day][meal] = recipeId === 'none' ? null : recipeId;
            try {
                await api.post('/api/planner', state.currentUser.meal_plan);
                showToast(`${day}'s ${meal} updated!`, 'success');
            } catch (error) {
                handleApiError("Update Failed", error);
            }
        }
    }

    async function handleSettingsSave() {
        const diet = document.getElementById('default-diet-select').value;
        state.currentUser.preferences.default_diet = diet;
        try {
            await api.post('/api/preferences', { default_diet: diet });
            showToast("Settings saved!", "success");
        } catch (error) {
            handleApiError("Save Failed", error);
        }
    }

    function applyTheme(theme) {
        document.documentElement.className = theme;
        if (theme === 'dark') {
            dom.themeIndicator.style.transform = 'translateX(100%)';
        } else {
            dom.themeIndicator.style.transform = 'translateX(0)';
        }
    }

    async function handleThemeToggle() {
        const oldTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = oldTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        try {
            if (!state.currentUser.preferences) {
                state.currentUser.preferences = {};
            }
            state.currentUser.preferences.theme = newTheme;
            await api.post('/api/preferences', { theme: newTheme });
        } catch (error) {
            handleApiError("Theme Save Failed", error);
            // Revert UI on failure
            applyTheme(oldTheme);
        }
    }
    
    // --- UTILITIES ---
    async function refreshUserData() {
        const userData = await api.get('/api/user');
        state.currentUser = { ...state.currentUser, ...userData };
    }

    async function updatePantryAndRerender() {
        try {
            await api.post('/api/pantry', { pantry: state.currentUser.pantry });
            renderPantryPage();
        } catch (error) {
            handleApiError("Update Failed", error);
        }
    }

    function handleApiError(title, error, element = null) {
        console.error(`${title}:`, error);
        showToast(error.message, "error");
        if (element) {
            element.innerHTML = templates.error(title, error.message);
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const icons = { info: 'ph-info', success: 'ph-check-circle', error: 'ph-warning-circle' };
        const colors = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500' };
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg animate-fadeIn ${colors[type]}`;
        toast.innerHTML = `<i class="ph-bold ${icons[type]} text-2xl"></i><span>${message}</span>`;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 5000);
    }
    
    function showModal(content) {
        dom.modalContainer.innerHTML = content;
        dom.modalContainer.classList.remove('hidden');
        dom.modalContainer.classList.add('flex');
        dom.modalContainer.querySelector('[data-action="close-modal"]').addEventListener('click', hideModal);
    }
    
    function hideModal() {
        dom.modalContainer.classList.add('hidden');
        dom.modalContainer.classList.remove('flex');
        dom.modalContainer.innerHTML = '';
    }

    // --- TEMPLATES ---
    const templates = {
        loading: (message = "Loading...") => `<div class="flex flex-col items-center justify-center h-full animate-fadeIn"><div class="loader"></div><p class="mt-4 text-lg text-gray-600 dark:text-gray-400">${message}</p></div>`,
        error: (title, message) => `<div class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg animate-fadeIn"><h2 class="text-2xl font-bold text-red-700 dark:text-red-300">${title}</h2><p class="mt-2 text-red-600 dark:text-red-400">${message}</p></div>`,
        notFound: () => `<div class="text-center h-full flex flex-col items-center justify-center"><h1 class="text-6xl font-bold text-indigo-500">404</h1><h2 class="text-3xl font-bold mt-4">Page Not Found</h2><p class="mt-2 text-gray-500">The page you're looking for doesn't exist.</p></div>`,
        home: (user) => `
            <div class="animate-slideInUp h-full flex flex-col justify-center pb-[100px] lg:pb-0">
                <h1 class="text-5xl lg:text-6xl font-extrabold text-gray-800 dark:text-white">Welcome to your <span class="text-indigo-500">Recipe Universe</span></h1>
                <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">Your personal AI-powered culinary assistant. Get started by generating a new recipe, or manage your existing cookbook and pantry.</p>
                <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg glassmorphism">
                        <div class="flex items-center gap-4"><i class="ph-duotone ph-books text-4xl text-green-500"></i><div><p class="text-sm text-gray-500 dark:text-gray-400">Recipes Saved</p><p class="text-2xl font-bold">${user.cookbook.length}</p></div></div>
                    </div>
                    <div class="p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg glassmorphism">
                        <div class="flex items-center gap-4"><i class="ph-duotone ph-potted-plant text-4xl text-yellow-500"></i><div><p class="text-sm text-gray-500 dark:text-gray-400">Pantry Items</p><p class="text-2xl font-bold">${user.pantry.length}</p></div></div>
                    </div>
                </div>
                <div class="mt-10">
                    <button id="go-to-generator-btn" class="bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-indigo-700 transition-transform duration-200 hover:scale-105 shadow-xl"><span class="flex items-center justify-center gap-2"><i class="ph-bold ph-magic-wand"></i>Start Creating</span></button>
                </div>
            </div>`,
        generator: () => `
            <div class="animate-slideInUp pb-[100px] lg:pb-0">
                <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Recipe Generator</h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">Let AI craft your next meal. Your pantry items will be prioritized!</p>
                <div class="mt-8 p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg glassmorphism">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="md:col-span-3"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Ingredients</label><input id="ingredients-input" type="text" class="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500" placeholder="e.g., chicken breast, rice, broccoli"></div>
                        <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuisine</label><select id="cuisine-select" class="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"><option>Any</option><option>Italian</option><option>Mexican</option><option>Indian</option><option>Chinese</option><option>Japanese</option><option>Thai</option><option>French</option><option>Spanish</option><option>Greek</option></select></div>
                        <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Diet</label><select id="diet-select" class="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"><option>None</option><option>Vegetarian</option><option>Vegan</option><option>Gluten-Free</option><option>Keto</option><option>Paleo</option><option>Pescatarian</option></select></div>
                    </div>
                    <button id="generate-btn" class="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-transform duration-200 hover:scale-105 shadow-lg"><span class="flex items-center justify-center gap-2"><i class="ph-bold ph-magic-wand"></i>Generate Recipe</span></button>
                </div>
                <div id="recipe-output" class="mt-8"><p class="text-center text-gray-500 dark:text-gray-400">Your culinary creation awaits...</p></div>
            </div>`,
        recipeCard: (recipe, isSaved) => `
            <div class="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl overflow-hidden glassmorphism animate-fadeIn">
                <img src="${recipe.imageUrl || 'https://placehold.co/600x400'}" alt="${recipe.recipeName}" class="w-full h-64 object-cover">
                <div class="p-6">
                    <div class="flex justify-between items-start"><h2 class="text-3xl font-bold font-serif flex-1 pr-4">${recipe.recipeName}</h2><div class="flex flex-col items-end">${recipe.calorieCount ? `<span class="flex-shrink-0 bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300">🔥 ${recipe.calorieCount} kcal</span>` : ''}${recipe.timeToCook ? `<span class="flex-shrink-0 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 mt-2 rounded-full dark:bg-blue-900 dark:text-blue-300">⏰ ${recipe.timeToCook}</span>` : ''}</div></div>
                    <p class="mt-2 text-gray-600 dark:text-gray-400">${recipe.description}</p>
                    <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
                        <div><h3 class="font-semibold mb-2">Transform this Recipe</h3><div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <button data-action="modify-recipe" data-mod-type="healthier" class="ai-mod-btn w-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-semibold py-2 px-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900">Healthier</button>
                            <button data-action="modify-recipe" data-mod-type="spicy" class="ai-mod-btn w-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold py-2 px-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900">Spicy</button>
                            <button data-action="modify-recipe" data-mod-type="vegetarian" class="ai-mod-btn w-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold py-2 px-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-900">Vegetarian</button>
                            <button data-action="modify-recipe" data-mod-type="gourmet" class="ai-mod-btn w-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold py-2 px-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900">Gourmet</button>
                        </div></div>
                        <div><h3 class="font-semibold mb-2">AI-Powered Tools</h3><div class="flex gap-2">
                            <input id="swap-ingredient-input" type="text" class="flex-grow p-2 border rounded-lg dark:bg-gray-700" placeholder="e.g., 'chicken breast'">
                            <button data-action="get-swaps" class="bg-gray-200 dark:bg-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Find Swaps</button>
                            <button data-action="get-pairings" class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900">Suggest Pairings</button>
                        </div></div>
                        <div id="enhancements-output"></div>
                    </div>
                    <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-2"><button data-action="view-recipe" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg">View Recipe</button><button data-action="save-recipe" class="w-full ${isSaved ? 'bg-green-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-4 rounded-lg" ${isSaved ? 'disabled' : ''}>${isSaved ? 'Saved in Cookbook' : 'Save to Cookbook'}</button></div>
                </div>
            </div>`,
        cookbook: (recipes) => `
            <div class="animate-slideInUp pb-[100px] lg:pb-0">
                <h1 class="text-4xl font-bold text-gray-800 dark:text-white">My Cookbook</h1>
                ${recipes.length === 0 ? `<p class="mt-4 text-gray-600 dark:text-gray-400">Your cookbook is empty. Generate and save a recipe!</p>` : `
                <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${recipes.map(r => `
                    <div class="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg glassmorphism overflow-hidden flex flex-col">
                        <img src="${r.imageUrl}" class="h-40 w-full object-cover">
                        <div class="p-4 flex flex-col flex-grow">
                                                        <h3 class="font-bold truncate flex-grow">${r.recipeName}</h3>
                            <div class="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <span class="flex items-center gap-1"><i class="ph-bold ph-fire"></i> ${r.calorieCount} kcal</span>
                                <span class="flex items-center gap-1"><i class="ph-bold ph-clock"></i> ${r.timeToCook}</span>
                            </div>
                            <div class="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <span class="flex items-center gap-1"><i class="ph-bold ph-fire"></i> ${r.calorieCount} kcal</span>
                                <span class="flex items-center gap-1"><i class="ph-bold ph-clock"></i> ${r.timeToCook}</span>
                            </div>                            <div class="flex gap-2 mt-4">
                                <button data-action="view-recipe" data-id="${r.id}" class="flex-1 bg-indigo-500 text-white text-sm py-2 px-3 rounded-md hover:bg-indigo-600">View</button>
                                <button data-action="delete-recipe" data-id="${r.id}" class="bg-red-500 text-white py-2 px-3 rounded-md hover:bg-red-600"><i class="ph-bold ph-trash"></i></button>
                            </div>
                        </div>
                    </div>`).join('')}
                </div>`}
            </div>`,
        recipeModal: (recipe) => `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideInUp">
                <img src="${recipe.imageUrl}" class="w-full h-72 object-cover rounded-t-2xl">
                <div class="p-8">
                    <div class="flex justify-between items-start"><h2 class="text-4xl font-bold font-serif flex-1 pr-4">${recipe.recipeName}</h2><button data-action="close-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl">&times;</button></div>
                    ${recipe.calorieCount ? `<p class="text-sm text-yellow-600 dark:text-yellow-400 -mt-2 mb-2">🔥 Estimated ${recipe.calorieCount} kcal</p>`: ''}${recipe.timeToCook ? `<p class="text-sm text-blue-600 dark:text-blue-400 -mt-2 mb-2">⏰ ${recipe.timeToCook}</p>`: ''}
                    <p class="text-gray-500 dark:text-gray-400 mt-2 mb-6">${recipe.description}</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div><h3 class="font-semibold text-xl mb-3 border-b pb-2">Ingredients</h3><ul class="list-disc list-inside space-y-2">${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul></div>
                        <div><h3 class="font-semibold text-xl mb-3 border-b pb-2">Instructions</h3><ol class="list-decimal list-inside space-y-3">${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol></div>
                    </div>
                </div>
            </div>`,
        pantry: (items) => `
            <div class="animate-slideInUp pb-[100px] lg:pb-0">
                <h1 class="text-4xl font-bold text-gray-800 dark:text-white">My Pantry</h1>
                <div class="mt-8 p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg glassmorphism">
                    <h2 class="text-xl font-semibold mb-4">Add Item</h2>
                    <div class="flex gap-2"><input id="pantry-item-input" type="text" class="flex-grow p-3 border rounded-lg dark:bg-gray-700" placeholder="e.g., Flour"><button id="add-pantry-item-btn" class="bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700">+</button></div>
                    <h2 class="text-xl font-semibold mt-8 mb-4">Current Items</h2>
                    <div id="pantry-list" class="flex flex-wrap gap-3">
                        ${items.length > 0 ? items.map(item => `
                        <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 animate-fadeIn">
                            <span>${item}</span><button data-action="delete-pantry-item" data-item="${item}" class="ml-3 text-red-500 hover:text-red-700">&times;</button>
                        </div>`).join('') : '<p class="text-gray-500">Your pantry is empty.</p>'}
                    </div>
                </div>
            </div>`,
        planner: (plan, cookbook) => {
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const recipeOptions = `<option value="none">-- Select a Recipe --</option>` + cookbook.map(r => `<option value="${r.id}">${r.recipeName}</option>`).join('');
            return `
            <div class="animate-slideInUp pb-[100px] lg:pb-0">
                <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Meal Planner</h1>
                <div class="mt-8 space-y-6">
                ${days.map(day => `
                    <div class="p-4 bg-white dark:bg-gray-800/50 rounded-xl shadow-lg glassmorphism">
                        <h2 class="text-2xl font-bold font-serif">${day}</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            ${['breakfast', 'lunch', 'dinner'].map(meal => `
                            <div>
                                <label class="block text-sm font-medium capitalize">${meal}</label>
                                <select data-day="${day}" data-meal="${meal}" class="mt-1 w-full p-2 border rounded-lg dark:bg-gray-700">
                                    ${recipeOptions.replace(`value="${plan[day][meal]}"`, `value="${plan[day][meal]}" selected`)}
                                </select>
                            </div>`).join('')}
                        </div>
                    </div>`).join('')}
                </div>
            </div>`;
        },
        settings: (prefs) => `
            <div class="animate-slideInUp pb-[100px] lg:pb-0">
                <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Settings</h1>
                <div class="mt-8 p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg glassmorphism">
                    <h2 class="text-xl font-semibold mb-4">Preferences</h2>
                    <div>
                        <label class="block text-sm font-medium">Default Diet</label>
                        <select id="default-diet-select" class="mt-1 w-full p-3 border rounded-lg dark:bg-gray-700">
                            ${['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto'].map(d => `<option value="${d}" ${prefs.default_diet === d ? 'selected' : ''}>${d}</option>`).join('')}
                        </select>
                    </div>
                    <button id="save-settings-btn" class="mt-6 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700">Save Settings</button>
                </div>
            </div>`,
        pairingsResult: (pairings) => `
            <div class="mt-4 space-y-2 animate-fadeIn">
                ${Object.entries(pairings).map(([type, pairing]) => `
                    <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p class="font-semibold capitalize text-sm">${type.replace('_', ' ')}: <span class="font-normal text-blue-600 dark:text-blue-400">${pairing.name}</span></p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${pairing.reason}</p>
                    </div>`).join('')}
            </div>`,
        swapsResult: (swaps) => `
             <div class="mt-4 space-y-2 animate-fadeIn">
                ${swaps.length > 0 ? swaps.map(swap => `
                    <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p class="font-semibold text-blue-600 dark:text-blue-400">${swap.name}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${swap.reason}</p>
                    </div>`).join('') : '<p class="text-center text-sm text-gray-500">No suitable swaps found.</p>'}
            </div>`
    };

    // --- START THE APP ---
    document.addEventListener('DOMContentLoaded', init);
})();