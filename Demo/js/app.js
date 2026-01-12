document.addEventListener('DOMContentLoaded', () => {
    const strategyContainer = document.getElementById('strategy-container');
    const searchBtn = document.getElementById('search-btn');
    const randomBtn = document.getElementById('random-btn');
    const resetBtn = document.getElementById('reset-btn');
    const strategyList = document.getElementById('strategy-list');
    const dialogueContent = document.getElementById('dialogue-content');
    const dialogueMetadata = document.getElementById('dialogue-metadata');
    const dialogueImage = document.getElementById('dialogue-image');
    const storyTitle = document.getElementById('story-title');
    const imageContainer = document.querySelector('.image-container');
    const storyTitleContainer = document.querySelector('.story-title-container');
    const leftPanel = document.querySelector('.left-panel');
    const dialogNumber = document.getElementById('dialog-number');
    const totalDialogs = document.getElementById('total-dialogs');
    const prevDialogBtn = document.getElementById('prev-dialog');
    const nextDialogBtn = document.getElementById('next-dialog');
    const taskSelector = document.getElementById('task-selector');
    
    function adjustDialogueHeight() {
        const maxHeight = 600;  
        dialogueContent.style.maxHeight = `${maxHeight}px`;
    }
    
    window.addEventListener('load', adjustDialogueHeight);
    window.addEventListener('resize', adjustDialogueHeight);
    
    let dialogueData = [];
    let uniqueStrategies = new Set();
    let selectedTraits = {};
    let selectedStrategies = new Set();
    let currentDialogIndex = 0;
    let currentTask = 'image';
    let filteredDialogues = [];
    let currentFilteredIndex = -1;
    let moralsData = {};
    
    loadData();
    loadMorals();
    
    searchBtn.addEventListener('click', searchDialogues);
    randomBtn.addEventListener('click', showRandomDialogue);
    resetBtn.addEventListener('click', resetFilters);
    
    prevDialogBtn.addEventListener('click', showPreviousDialogue);
    nextDialogBtn.addEventListener('click', showNextDialogue);
    
    taskSelector.addEventListener('change', function() {
        dialogueContent.innerHTML = '<div class="dialogue-placeholder"><p>Loading dialogue content...</p></div>';
        strategyList.innerHTML = '';
        imageContainer.style.display = 'none';
        storyTitleContainer.style.display = 'none';
        
        currentTask = this.value;
        dialogueData = [];
        
        selectedTraits = {};
        document.querySelectorAll('.trait-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        selectedStrategies.clear();
        document.querySelectorAll('.strategy-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        currentFilteredIndex = -1;
        filteredDialogues = [];
        
        loadData();
    });
    
    dialogNumber.addEventListener('change', function() {
        const newIndex = parseInt(this.value) - 1;
        
        if (currentFilteredIndex >= 0 && filteredDialogues.length > 0) {
            if (!isNaN(newIndex) && newIndex >= 0 && newIndex < filteredDialogues.length) {
                const dialogue = filteredDialogues[newIndex];
                const absoluteIndex = dialogueData.indexOf(dialogue);
                showDialogue(dialogue, absoluteIndex, newIndex);
            } else {
                this.value = currentFilteredIndex + 1;
            }
        } else {
            if (!isNaN(newIndex) && newIndex >= 0 && newIndex < dialogueData.length) {
                showDialogue(dialogueData[newIndex], newIndex);
            } else {
                this.value = currentDialogIndex + 1;
            }
        }
    });
    
    document.querySelectorAll('.trait-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const trait = this.dataset.trait;
            const value = this.dataset.value;
            
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                if (selectedTraits[trait] === value) {
                    delete selectedTraits[trait];
                }
            } else {
                document.querySelectorAll(`.trait-btn[data-trait="${trait}"]`).forEach(b => {
                    b.classList.remove('selected');
                });
                
                this.classList.add('selected');
                selectedTraits[trait] = value;
            }
        });
    });
    
    function capitalizeStrategy(strategy) {
        return strategy.split(/\s+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
    
    async function loadMorals() {
        try {
            const response = await fetch('./morals.json');
            moralsData = await response.json();
            console.log('Loaded morals data:', moralsData);
        } catch (error) {
            console.error('Error loading morals:', error);
        }
    }
    
    async function loadData() {
        try {
            const dataSource = currentTask === 'image' ? './images_L3.json' : './Stories_L3.json';
            console.log(`Loading data from ${dataSource} for task: ${currentTask}`);
            
            const response = await fetch(dataSource);
            dialogueData = await response.json();
            
            totalDialogs.textContent = dialogueData.length;
            
            currentFilteredIndex = -1;
            filteredDialogues = [];
            
            prevDialogBtn.disabled = true;
            nextDialogBtn.disabled = (dialogueData.length <= 1);
            
            const allStrategies = new Set();
            dialogueData.forEach(item => {
                if (item.record && Array.isArray(item.record)) {
                    item.record.forEach(record => {
                        if (record.strategy) {
                            const strategies = record.strategy.split(/,\s*|\s*;\s*|\s+and\s+/);
                            strategies.forEach(s => {
                                if (s.trim()) {
                                    allStrategies.add(capitalizeStrategy(s.trim()));
                                }
                            });
                        }
                    });
                }
            });
            
            populateStrategyFilters(Array.from(allStrategies).sort());
            
            console.log(`Loaded ${dialogueData.length} dialogues with ${allStrategies.size} unique strategies.`);
            
            if (dialogueData.length > 0) {
                const randomIndex = Math.floor(Math.random() * dialogueData.length);
                showDialogue(dialogueData[randomIndex], randomIndex);
            } else {
                console.error('No data loaded');
                dialogueContent.innerHTML = `<div class="error">No data found. Please try refreshing the page.</div>`;
            }
        } catch (error) {
            console.error('Error loading data:', error);
            dialogueContent.innerHTML = `<div class="error">Failed to load data. Please try refreshing the page.</div>`;
        }
    }
    
    function populateStrategyFilters(strategies) {
        strategyContainer.innerHTML = '';
        
        strategies.forEach(strategy => {
            const strategyDiv = document.createElement('div');
            strategyDiv.className = 'strategy-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `strategy-${strategy.replace(/\s+/g, '-').toLowerCase()}`;
            checkbox.value = strategy;
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    selectedStrategies.add(strategy);
                } else {
                    selectedStrategies.delete(strategy);
                }
            });
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = strategy;
            
            strategyDiv.appendChild(checkbox);
            strategyDiv.appendChild(label);
            strategyContainer.appendChild(strategyDiv);
        });
    }
    
    function searchDialogues() {
        const filtered = dialogueData.filter(item => {
            let matchesTraits = true;
            for (const [trait, value] of Object.entries(selectedTraits)) {
                const traitValue = item.personality[trait];
                const boolValue = value.toLowerCase() === 'high';
                
                if (traitValue !== boolValue) {
                    matchesTraits = false;
                    break;
                }
            }
            
            let matchesStrategies = true;
            if (selectedStrategies.size > 0) {
                if (item.record && Array.isArray(item.record)) {
                    const itemStrategiesSet = new Set();
                    item.record.forEach(record => {
                        if (record.strategy) {
                            const strategies = record.strategy.split(/,\s*|\s*;\s*|\s+and\s+/);
                            strategies.forEach(s => {
                                if (s.trim()) {
                                    itemStrategiesSet.add(capitalizeStrategy(s.trim()));
                                }
                            });
                        }
                    });
                    
                    matchesStrategies = Array.from(selectedStrategies).every(strategy => 
                        itemStrategiesSet.has(strategy)
                    );
                } else {
                    matchesStrategies = false;
                }
            }
            
            return matchesTraits && matchesStrategies;
        });
        
        if (filtered.length === 0) {
            dialogueContent.innerHTML = `<div class="dialogue-placeholder"><p>No matching dialogs could be found for the selected personality parameters</p></div>`;
            strategyList.innerHTML = '';
            totalDialogs.textContent = '0';
            dialogNumber.value = '0';
            currentDialogIndex = -1;
            currentFilteredIndex = -1;
            filteredDialogues = [];
            
            prevDialogBtn.disabled = true;
            nextDialogBtn.disabled = true;
        } else {
            console.log(`Found ${filtered.length} matching dialogues.`);
            filteredDialogues = filtered;
            currentFilteredIndex = 0;
            
            totalDialogs.textContent = filtered.length;
            const absoluteIndex = dialogueData.indexOf(filtered[0]);
            showDialogue(filtered[0], absoluteIndex, 0);
        }
    }
    
    function showRandomDialogue() {
        if (dialogueData.length > 0) {
            currentFilteredIndex = -1;
            filteredDialogues = [];
            totalDialogs.textContent = dialogueData.length;
            
            const randomIndex = Math.floor(Math.random() * dialogueData.length);
            showDialogue(dialogueData[randomIndex], randomIndex);
        }
    }
    
    function showDialogue(dialogue, index, relativeIndex) {
        console.log('Showing dialogue for task:', currentTask);
        
        if (index !== undefined) {
            currentDialogIndex = index;
            
            if (currentFilteredIndex >= 0 && filteredDialogues.length > 0) {
                if (relativeIndex !== undefined) {
                    currentFilteredIndex = relativeIndex;
                }
                dialogNumber.value = currentFilteredIndex + 1;
                
                prevDialogBtn.disabled = (currentFilteredIndex <= 0);
                nextDialogBtn.disabled = (currentFilteredIndex >= filteredDialogues.length - 1);
            } else {
                dialogNumber.value = index + 1;
                
                prevDialogBtn.disabled = (currentDialogIndex <= 0);
                nextDialogBtn.disabled = (currentDialogIndex >= dialogueData.length - 1);
            }
        }
        
        if (dialogue.personality) {
            selectedTraits = {};
            document.querySelectorAll('.trait-btn').forEach(btn => {
                btn.classList.remove('selected', 'auto-selected');
            });
            
            for (const [trait, value] of Object.entries(dialogue.personality)) {
                const traitValue = value ? 'high' : 'low';
                const traitBtn = document.querySelector(`.trait-btn[data-trait="${trait}"][data-value="${traitValue}"]`);
                if (traitBtn) {
                    traitBtn.classList.add('selected');
                    selectedTraits[trait] = traitValue;
                }
            }
        }
        
        if (currentTask === 'image') {
            storyTitleContainer.style.display = 'none';
            
            if (dialogueImage) {
                if (dialogue.image_url) {
                    dialogueImage.src = dialogue.image_url.trim();
                    imageContainer.style.display = 'block';
                } else {
                    dialogueImage.src = '';
                    imageContainer.style.display = 'none';
                }
            }
        } else {
            imageContainer.style.display = 'none';
            
            if (dialogue.story_title) {
                storyTitle.textContent = dialogue.story_title;
                
                const existingMoral = storyTitleContainer.querySelector('.story-moral');
                if (existingMoral) {
                    existingMoral.remove();
                }
                
                const moral = moralsData[dialogue.story_title];
                if (moral) {
                    const moralElement = document.createElement('p');
                    moralElement.className = 'story-moral';
                    moralElement.innerHTML = `<strong>Moral:</strong> ${moral}`;
                    storyTitleContainer.appendChild(moralElement);
                }
                
                storyTitleContainer.style.display = 'block';
                console.log('Displaying story title:', dialogue.story_title);
            } else {
                storyTitle.textContent = '';
                const existingMoral = storyTitleContainer.querySelector('.story-moral');
                if (existingMoral) {
                    existingMoral.remove();
                }
                storyTitleContainer.style.display = 'none';
                console.log('No story title available');
            }
        }
        
        strategyList.innerHTML = '';
        if (dialogue.record && Array.isArray(dialogue.record)) {
            const strategiesSet = new Set();
            dialogue.record.forEach(record => {
                if (record.strategy) {
                    const strategies = record.strategy.split(/,\s*|\s*;\s*|\s+and\s+/);
                    strategies.forEach(s => {
                        if (s.trim()) {
                            strategiesSet.add(capitalizeStrategy(s.trim()));
                        }
                    });
                }
            });
            
            Array.from(strategiesSet).sort().forEach(strategy => {
                const li = document.createElement('li');
                li.textContent = strategy;
                strategyList.appendChild(li);
            });
        }
        
        dialogueContent.innerHTML = '';
        if (dialogue.dialogue && Array.isArray(dialogue.dialogue)) {
            dialogue.dialogue.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `dialogue-message ${msg[1].toLowerCase()}`;
                
                const roleDiv = document.createElement('div');
                roleDiv.className = 'dialogue-role';
                roleDiv.textContent = msg[1];
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'dialogue-text';
                contentDiv.textContent = msg[0];
                
                messageDiv.appendChild(roleDiv);
                messageDiv.appendChild(contentDiv);
                dialogueContent.appendChild(messageDiv);
            });
        }
        
        setTimeout(adjustDialogueHeight, 100);
    }
    
    function getPersonalityDescription(personality) {
        if (!personality) return 'Personality information not available';
        
        const traits = [];
        for (const [trait, value] of Object.entries(personality)) {
            traits.push(`${value ? 'High' : 'Low'} ${trait}`);
        }
        
        return traits.join(', ');
    }
    
    function resetFilters() {
        selectedTraits = {};
        document.querySelectorAll('.trait-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        selectedStrategies.clear();
        document.querySelectorAll('.strategy-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        currentFilteredIndex = -1;
        filteredDialogues = [];
        
        if (dialogueData.length > 0) {
            showRandomDialogue();
        } else {
            console.log("No data available yet. Will load data first.");
        }
    }
    
    function showPreviousDialogue() {
        if (currentFilteredIndex >= 0 && filteredDialogues.length > 0) {
            if (currentFilteredIndex > 0) {
                const newRelativeIndex = currentFilteredIndex - 1;
                const dialogue = filteredDialogues[newRelativeIndex];
                const absoluteIndex = dialogueData.indexOf(dialogue);
                showDialogue(dialogue, absoluteIndex, newRelativeIndex);
            }
        } else {
            if (currentDialogIndex > 0) {
                showDialogue(dialogueData[currentDialogIndex - 1], currentDialogIndex - 1);
            }
        }
    }
    
    function showNextDialogue() {
        if (currentFilteredIndex >= 0 && filteredDialogues.length > 0) {
            if (currentFilteredIndex < filteredDialogues.length - 1) {
                const newRelativeIndex = currentFilteredIndex + 1;
                const dialogue = filteredDialogues[newRelativeIndex];
                const absoluteIndex = dialogueData.indexOf(dialogue);
                showDialogue(dialogue, absoluteIndex, newRelativeIndex);
            }
        } else {
            if (currentDialogIndex < dialogueData.length - 1) {
                showDialogue(dialogueData[currentDialogIndex + 1], currentDialogIndex + 1);
            }
        }
    }
}); 