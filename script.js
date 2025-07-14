const splashScreen = document.getElementById('splash-screen');
const startBtn = document.getElementById('start-btn');
const gameUI = document.getElementById('game-ui');
const waterCountSpan = document.getElementById('water-count');
const buildBtn = document.getElementById('build-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const villageArea = document.getElementById('village-area');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');

let waterDrops = 1000;
let buildings = [];
let villagers = [];
let selectedBuilding = null;
let wellCooldowns = {};


// 1. Map of difficulty levels to villager reward values
const villagerRewards = {
  easy: 20,
  normal: 10,
  hard: 5
};

// 2. Global variable to store the current difficulty
let currentDifficulty = 'normal'; // Default to normal

// Show the rules modal when Start is clicked
startBtn.onclick = () => {
  // Hide all main elements except the rules modal
  splashScreen.style.display = 'none';
  gameUI.style.display = 'none';
  document.getElementById('river-container').style.display = 'none';
  document.querySelectorAll('.cloud').forEach(cloud => cloud.style.display = 'none');
  document.getElementById('rules-modal').style.display = 'flex';
  // Hide the footer when starting the game
  const footer = document.getElementById('cw-footer');
  if (footer) footer.style.display = 'none';

  // Focus input for accessibility
  setTimeout(() => {
    document.getElementById('difficulty-input').focus();
  }, 200);
};

// Handle difficulty selection and start game
document.getElementById('rules-modal-btn').onclick = () => {
  // Get the difficulty from the input box
  const diffInput = document.getElementById('difficulty-input').value.trim().toLowerCase();
  // Accept only easy, normal, or hard
  if (diffInput === 'easy' || diffInput === 'normal' || diffInput === 'hard') {
    currentDifficulty = diffInput;
    // Hide the rules modal
    document.getElementById('rules-modal').style.display = 'none';
    // Show all main elements for the game
    splashScreen.style.display = 'flex';
    document.getElementById('river-container').style.display = 'flex';
    document.querySelectorAll('.cloud').forEach(cloud => cloud.style.display = '');
    // Instantly show the game UI under the splash screen
    gameUI.style.display = 'flex';
    initGame();

    // Fix: get dropletOverlay before using it
    const dropletOverlay = document.getElementById('droplet-transition');

    // Charity: Water blue color from guidelines
    const dropletBlue = '#005baa';
    const dropletCount = 18;
    for (let i = 0; i < dropletCount; i++) {
      const droplet = document.createElement('div');
      droplet.className = 'droplet';
      droplet.style.left = (10 + Math.random() * 80) + 'vw';
      droplet.style.animationDelay = (Math.random() * 0.5) + 's';
      droplet.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 6C32 6 12 30 12 44C12 54.4934 21.5066 62 32 62C42.4934 62 52 54.4934 52 44C52 30 32 6 32 6Z" fill="${dropletBlue}" stroke="#003366" stroke-width="2"/>
          <ellipse cx="38" cy="26" rx="4" ry="8" fill="#fff" fill-opacity="0.4"/>
        </svg>
      `;
      dropletOverlay.appendChild(droplet);
    }

    dropletOverlay.style.display = 'block';

    // Fade out the splash screen as droplets fall
    splashScreen.style.transition = 'opacity 0.7s';
    splashScreen.style.opacity = '1';
    setTimeout(() => {
      splashScreen.style.opacity = '0';
    }, 200); // Start fading after droplets begin

    // Remove splash from layout after fade
    setTimeout(() => {
      splashScreen.style.display = 'none';
      dropletOverlay.innerHTML = '';
      dropletOverlay.style.display = 'none';
    }, 1200); // Match droplet animation
  } else {
    // Show feedback if invalid
    showFeedback("Please type 'Easy', 'Normal', or 'Hard' to begin.");
    document.getElementById('difficulty-input').focus();
  }
};

function updateWaterUI() {
  waterCountSpan.textContent = waterDrops;
}

// Place a building. If draggable is true, allow the user to drag and place it once.
function placeBuilding(type, x, y, upgraded = false, draggable = false) {
  const div = document.createElement('div');
  div.classList.add('building');
  div.style.left = x + 'px';
  div.style.top = y + 'px';
  div.style.backgroundImage = `url('img/${type}${upgraded ? '-upgraded' : ''}.png')`;

  const buildingData = { type, x, y, upgraded };
  buildings.push(buildingData);

  div.onclick = (e) => {
    e.stopPropagation();
    selectedBuilding = buildingData;

    if (type === 'well') {
      // Use a unique key for each well based on its position
      const wellKey = `${x},${y}`;
      const now = Date.now();
      if (!wellCooldowns[wellKey] || now - wellCooldowns[wellKey] >= 120000) {
        // 2 minutes = 120000 ms
        const amt = upgraded ? 10 : 5;
        waterDrops += amt;
        updateWaterUI();
        showFeedback(`+${amt} Water Drops!`);
        checkWinCondition();
        wellCooldowns[wellKey] = now;
      } else {
        showFeedback("Water can only be pumped every 2 minutes!");
      }
    } else {
      showFeedback(`Selected ${type}`);
    }
  };

  // Only allow dragging if draggable is true (for newly built huts/wells)
  if (draggable && (type === 'hut' || type === 'well')) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    const onMouseDown = (e) => {
      e.preventDefault();
      isDragging = true;
      offsetX = e.offsetX;
      offsetY = e.offsetY;
      selectedBuilding = buildingData;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const rect = villageArea.getBoundingClientRect();
      const newX = e.clientX - rect.left - offsetX;
      const newY = e.clientY - rect.top - offsetY;
      div.style.left = newX + 'px';
      div.style.top = newY + 'px';
      buildingData.x = newX;
      buildingData.y = newY;
    };
    const onMouseUp = () => {
      isDragging = false;
      // After first placement, remove drag listeners so it can't be moved again
      div.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      div.style.cursor = '';
    };
    div.addEventListener('mousedown', onMouseDown);
    div.style.cursor = 'grab';
  }

  villageArea.appendChild(div);
}

// Helper function: check if a grid tile is occupied by any structure
function isOccupied(x, y) {
  // Look for any building or tree at the same grid position
  const existing = document.querySelectorAll('#village-area .building, #village-area .tree');
  for (let el of existing) {
    // Get the left/top position of the element
    const tileX = parseInt(el.style.left);
    const tileY = parseInt(el.style.top);
    if (tileX === x && tileY === y) {
      return true; // This spot is taken
    }
  }
  return false;
}

function moveVillagerTo(x, y) {
  if (!controllableVillager) return;
  controllableVillager.style.transition = 'left 0.12s, top 0.12s';
  controllableVillager.style.left = x + 'px';
  controllableVillager.style.top = y + 'px';
  controllableVillagerPos.x = x;
  controllableVillagerPos.y = y;
  setTimeout(() => {
    if (controllableVillager) controllableVillager.style.transition = '';
  }, 130);
}

// Track the controllable villager and its position
let controllableVillager = null;
let controllableVillagerPos = { x: 0, y: 0 };

// For arrow key movement
let moveDirection = null; // 'left', 'right', 'up', 'down'
let moveAnimationFrame = null;

// Helper function to check for collisions
function isCollision(newX, newY, villagerSize = 64) {
  // Get the bounding rect for the proposed position
  const villageRect = villageArea.getBoundingClientRect();
  const proposedRect = {
    left: villageRect.left + newX,
    top: villageRect.top + newY,
    right: villageRect.left + newX + villagerSize,
    bottom: villageRect.top + newY + villagerSize
  };

  // Check obstacles
  const obstacles = document.querySelectorAll('.tree, .building, #river-container');
  for (const obs of obstacles) {
    // Don't block river if crossing at bridge
    if (obs.id === 'river-container' && isCrossingBridge(newX, newY, villagerSize)) {
      continue;
    }
    const obsRect = obs.getBoundingClientRect();
    // Check for overlap
    if (
      proposedRect.right > obsRect.left &&
      proposedRect.left < obsRect.right &&
      proposedRect.bottom > obsRect.top &&
      proposedRect.top < obsRect.bottom
    ) {
      return true;
    }
  }
  // Check bounds of village area
  if (
    newX < 0 ||
    newY < 0 ||
    newX + villagerSize > villageArea.offsetWidth ||
    newY + villagerSize > villageArea.offsetHeight
  ) {
    return true;
  }
  return false;
}

// Helper function to check collision between two rectangles
function rectsOverlap(r1, r2) {
  return (
    r1.left < r2.right &&
    r1.right > r2.left &&
    r1.top < r2.bottom &&
    r1.bottom > r2.top
  );
}

// Move the villager smoothly to a new position
function moveVillagerTo(x, y) {
  if (!controllableVillager) return;
  controllableVillager.style.transition = 'left 0.12s, top 0.12s';
  controllableVillager.style.left = x + 'px';
  controllableVillager.style.top = y + 'px';
  controllableVillagerPos.x = x;
  controllableVillagerPos.y = y;

  // --- BEGINNER: Check for collectible drop collision after moving ---
  // Get villager's bounding rectangle
  const villagerRect = controllableVillager.getBoundingClientRect();
  // Get all collectible drops
  const drops = document.querySelectorAll('.collectible-drop');
  drops.forEach(drop => {
    const dropRect = drop.getBoundingClientRect();
    if (rectsOverlap(villagerRect, dropRect)) {
      // Remove the drop and add water
      drop.remove();
      waterDrops += 10;
      updateWaterUI();
      showFeedback('+10 Water Drops!');
      checkWinCondition();
    }
  });

  setTimeout(() => {
    if (controllableVillager) controllableVillager.style.transition = '';
  }, 130);
}

// Arrow key movement logic
function moveVillagerStep() {
  if (!controllableVillager || !moveDirection) return;
  let { x, y } = controllableVillagerPos;
  const step = 6; // Move slower (was 10)

  // Figure out the new position based on direction
  if (moveDirection === 'left') x -= step;
  else if (moveDirection === 'right') x += step;
  else if (moveDirection === 'up') y -= step;
  else if (moveDirection === 'down') y += step;

  // Only move if no collision
  if (!isCollision(x, y)) {
    moveVillagerTo(x, y);
  }
  // Keep moving while key is held
  moveAnimationFrame = requestAnimationFrame(moveVillagerStep);
}

// Listen for keydown to start movement
document.addEventListener('keydown', (e) => {
  if (!controllableVillager) return;
  // Only set direction if not already moving
  if (!moveDirection) {
    if (e.key === 'ArrowLeft') moveDirection = 'left';
    else if (e.key === 'ArrowRight') moveDirection = 'right';
    else if (e.key === 'ArrowUp') moveDirection = 'up';
    else if (e.key === 'ArrowDown') moveDirection = 'down';
    if (moveDirection) {
      moveVillagerStep();
    }
  }
});

// Listen for keyup to stop movement
document.addEventListener('keyup', (e) => {
  if (!controllableVillager) return;
  // Stop movement if the released key matches the current direction
  if (
    (e.key === 'ArrowLeft' && moveDirection === 'left') ||
    (e.key === 'ArrowRight' && moveDirection === 'right') ||
    (e.key === 'ArrowUp' && moveDirection === 'up') ||
    (e.key === 'ArrowDown' && moveDirection === 'down')
  ) {
    moveDirection = null;
    if (moveAnimationFrame) {
      cancelAnimationFrame(moveAnimationFrame);
      moveAnimationFrame = null;
    }
  }
});

// Modified placeVillager to support controllable villager
function placeVillager(x, y) {
  const v = document.createElement('div');
  v.classList.add('villager');
  v.style.left = x + 'px';
  v.style.top = y + 'px';
  v.style.backgroundImage = "url('img/villager.png')";
  v.onclick = () => {
    // 4. Give water drops based on selected difficulty
    const reward = villagerRewards[currentDifficulty] || villagerRewards['normal'];
    waterDrops += reward;
    updateWaterUI();
    showFeedback(`+${reward} Water Drops!`);
    checkWinCondition();
  };
  villageArea.appendChild(v);
  villagers.push(v);

  // If this is the first villager, make it controllable
  if (!controllableVillager) {
    controllableVillager = v;
    controllableVillagerPos = { x, y };
    v.classList.add('controllable'); // Add highlight class
  }
}

function initGame() {
  waterDrops = 1000;
  buildings = [];
  villagers = [];
  selectedBuilding = null;
  villageArea.innerHTML = '';
  updateWaterUI();
  wellCooldowns = {}; // Reset well cooldowns on new game

  const treePositions = [
    {x: 30, y: 50}, {x: 60, y: 300}, {x: 80, y: 200}, {x: 110, y: 110}, {x: 110, y: 320},
    {x: 350, y: 500}, {x: 570, y: 30}, {x: 200, y: 520}, {x: 350, y: 600}, {x: 470, y: 520}, {x: 570, y: 570},
    {x: 800, y: 60}, {x: 950, y: 110}, {x: 840, y: 160}, {x: 900, y: 200}, {x: 1200, y: 50}, {x: 1300, y: 300},
    {x: 1200, y: 400}, {x: 520, y: 350}, {x: 830, y: 500}, {x: 800, y: 400}, {x: 1000, y: 300}
  ];
  treePositions.forEach(pos => placeTree(pos.x, pos.y));

  // Initial hut, well, and villager are NOT draggable
  placeBuilding('hut', 250, 80, false, false);
  placeBuilding('well', 400, 80, false, false);
  placeVillager(345, 150);

  // Place a few collectible water drops at game start
  for (let i = 0; i < 3; i++) {
    placeCollectibleDrop();
  }
}

// Helper function to place a collectible water drop
function placeCollectibleDrop() {
  // Create a new drop element
  const drop = document.createElement('div');
  drop.className = 'collectible-drop';
  // Random position inside village area (avoid edges)
  const areaWidth = villageArea.offsetWidth || 1200;
  const areaHeight = villageArea.offsetHeight || 700;
  const x = Math.floor(Math.random() * (areaWidth - 64));
  const y = Math.floor(Math.random() * (areaHeight - 64));
  drop.style.left = x + 'px';
  drop.style.top = y + 'px';
  drop.style.position = 'absolute';
  drop.style.width = '48px';
  drop.style.height = '48px';
  drop.style.backgroundImage = "url('img/drop-icon.png')";
  drop.style.backgroundSize = 'contain';
  drop.style.backgroundRepeat = 'no-repeat';
  drop.style.cursor = 'pointer';
  drop.title = 'Collect Water Drop';

  // When clicked, add water and remove drop
  drop.onclick = () => {
    waterDrops += 10;
    updateWaterUI();
    showFeedback('+10 Water Drops!');
    drop.remove();
    checkWinCondition();
  };
  villageArea.appendChild(drop);
}

function placeTree(x, y) {
  const existing = document.querySelector(
    `.tree[data-x='${x}'][data-y='${y}']`
  );
  if (existing) return;
  const tree = document.createElement('div');
  tree.classList.add('tree');
  tree.style.left = x + 'px';
  tree.style.top = y + 'px';
  tree.style.backgroundImage = "url('img/tree.png')";
  tree.style.position = 'absolute';
  tree.style.width = '64px';
  tree.style.height = '64px';
  tree.style.backgroundSize = 'contain';
  tree.style.backgroundRepeat = 'no-repeat';
  tree.style.pointerEvents = 'none';
  tree.setAttribute('data-x', x);
  tree.setAttribute('data-y', y);
  villageArea.appendChild(tree);
}

// Helper to show a custom modal prompt for build/upgrade
function showCustomPrompt(options) {
  // options: { title, message, choices, callback }
  let modal = document.getElementById('custom-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.innerHTML = `
      <div class="custom-modal-content">
        <div class="custom-modal-title"></div>
        <div class="custom-modal-message"></div>
        <div class="custom-modal-buttons"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  modal.querySelector('.custom-modal-title').textContent = options.title;
  modal.querySelector('.custom-modal-message').textContent = options.message;
  const btns = modal.querySelector('.custom-modal-buttons');
  btns.innerHTML = '';
  options.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.label;
    btn.className = 'custom-modal-btn';
    btn.onclick = () => {
      modal.style.display = 'none';
      options.callback(choice.value);
    };
    btns.appendChild(btn);
  });
}

// Build button logic using custom modal
buildBtn.onclick = () => {
  showCustomPrompt({
    title: 'Build Something',
    message: 'Choose what to build. Each costs water drops.',
    choices: [
      { label: '🏠 House (30 drops)', value: 'house' },
      { label: '🟨 Walls (40 drops)', value: 'wall' }
    ],
    callback: (choice) => {
      let cost = 0;
      let type = '';
      if (choice === 'house') { cost = 30; type = 'hut'; }
      else if (choice === 'wall') { cost = 40; type = 'wall'; }
      else return;

      if (waterDrops < cost) {
        showFeedback("Not enough water drops!");
        return;
      }

      showFeedback('Click anywhere to place your ' + (choice === 'house' ? 'house' : 'walls') + '!');
      const onPlace = (e) => {
        const rect = villageArea.getBoundingClientRect();
        let x = e.clientX - rect.left - 32;
        let y = e.clientY - rect.top - 32;
        x = Math.floor(x / 64) * 64;
        y = Math.floor(y / 64) * 64;
        if (x < 0 || y < 0 || x > rect.width - 64 || y > rect.height - 64) {
          showFeedback('Place inside the village area!');
          return;
        }
        if (isOccupied(x, y)) {
          showFeedback("Can't build here!");
          return;
        }
        waterDrops -= cost;
        updateWaterUI();
        placeBuilding(type, x, y, false, true);
        showFeedback(`Built ${choice === 'house' ? 'house' : 'walls'}!`);
        checkWinCondition();
        villageArea.removeEventListener('click', onPlace);
      };
      villageArea.addEventListener('click', onPlace);
    }
  });
};

// Upgrade button logic using custom modal
upgradeBtn.onclick = () => {
  showCustomPrompt({
    title: 'Upgrade',
    message: 'What do you want to upgrade?',
    choices: [
      { label: '🟨 Wall (80 drops)', value: 'wall' },
      { label: '🏠 House (70 drops)', value: 'house' }
    ],
    callback: (choice) => {
      if (choice === 'wall') {
        if (waterDrops < 80) {
          showFeedback("Not enough water drops to upgrade the wall!");
          return;
        }
        waterDrops -= 80;
        updateWaterUI();
        // Replace all wall buildings with upgraded wall image
        Array.from(villageArea.children).forEach(child => {
          if (child.classList.contains('building') && child.style.backgroundImage.includes('wall.png')) {
            child.style.backgroundImage = "url('img/upgradedwall.png')";
          }
        });
        // Also update the main background wall if present
        villageArea.style.backgroundImage =
          "url('img/upgradedwall.png'), url('img/grass-background.png')";
        villageArea.style.outline = '';
        villageArea.style.border = '';
        const wallX = 110, wallY = 0, wallWidth = 520, wallHeight = 320;
        Array.from(villageArea.getElementsByClassName('tree')).forEach(tree => {
          const treeX = parseInt(tree.style.left);
          const treeY = parseInt(tree.style.top);
          const treeW = parseInt(tree.style.width) || 64;
          const treeH = parseInt(tree.style.height) || 64;
          if (
            treeX + treeW > wallX &&
            treeX < wallX + wallWidth &&
            treeY + treeH > wallY &&
            treeY < wallY + wallHeight
          ) {
            tree.remove();
          }
        });
        showFeedback("Wall upgraded!");
        checkWinCondition();
        return;
      }
      if (choice === 'house') {
        const huts = buildings.filter(b => b.type === 'hut' && !b.upgraded);
        if (huts.length === 0) {
          showFeedback("No house to upgrade!");
          return;
        }
        if (waterDrops < 70) {
          showFeedback("Not enough water drops to upgrade the house!");
          return;
        }
        if (huts.length === 1) {
          huts[0].upgraded = true;
          waterDrops -= 70;
          updateWaterUI();
          // Remove all buildings and villagers, not trees
          Array.from(villageArea.children).forEach(child => {
            if (!child.classList.contains('tree')) {
              villageArea.removeChild(child);
            }
          });
          // Re-place all buildings, using upgraded hut image for upgraded huts
          buildings.forEach(b => {
            if (b.type === 'hut') {
              const div = document.createElement('div');
              div.classList.add('building');
              div.style.left = b.x + 'px';
              div.style.top = b.y + 'px';
              if (b.upgraded) {
                div.style.backgroundImage = "url('img/upgradedhut.png')";
                div.style.width = '60px';
                div.style.height = '60px';
              } else {
                div.style.backgroundImage = "url('img/hut.png')";
                div.style.width = '64px';
                div.style.height = '64px';
              }
              villageArea.appendChild(div);
            } else if (b.type === 'wall' && b.upgraded) {
              // If wall is upgraded, use upgraded wall image
              const div = document.createElement('div');
              div.classList.add('building');
              div.style.left = b.x + 'px';
              div.style.top = b.y + 'px';
              div.style.backgroundImage = "url('img/upgradedwall.png')";
              div.style.width = '64px';
              div.style.height = '64px';
              villageArea.appendChild(div);
            } else {
              placeBuilding(b.type, b.x, b.y, b.upgraded);
            }
          });
          villagers.forEach(v => villageArea.appendChild(v));
          selectedBuilding = null;
          showFeedback("House upgraded!");
          checkWinCondition();
          return;
        }
        showFeedback("Click the house you want to upgrade");
        const hutDivs = Array.from(villageArea.children).filter(child => {
          return child.classList.contains('building') && child.style.backgroundImage.includes('hut.png');
        });
        hutDivs.forEach(div => {
          div.style.outline = '3px solid #f9d342';
          div.style.cursor = 'pointer';
        });
        hutDivs.forEach((div, idx) => {
          const handler = () => {
            hutDivs.forEach(d => {
              d.style.outline = '';
              d.style.cursor = '';
              d.onclick = null;
            });
            huts[idx].upgraded = true;
            waterDrops -= 70;
            updateWaterUI();
            Array.from(villageArea.children).forEach(child => {
              if (!child.classList.contains('tree')) {
                villageArea.removeChild(child);
              }
            });
            buildings.forEach(b => {
              if (b.type === 'hut') {
                const div2 = document.createElement('div');
                div2.classList.add('building');
                div2.style.left = b.x + 'px';
                div2.style.top = b.y + 'px';
                if (b.upgraded) {
                  div2.style.backgroundImage = "url('img/upgradedhut.png')";
                  div2.style.width = '55px';
                  div2.style.height = '55px';
                } else {
                  div2.style.backgroundImage = "url('img/hut.png')";
                  div2.style.width = '64px';
                  div2.style.height = '64px';
                }
                villageArea.appendChild(div2);
              } else if (b.type === 'wall' && b.upgraded) {
                // If wall is upgraded, use upgraded wall image
                const div2 = document.createElement('div');
                div2.classList.add('building');
                div2.style.left = b.x + 'px';
                div2.style.top = b.y + 'px';
                div2.style.backgroundImage = "url('img/upgradedwall.png')";
                div2.style.width = '64px';
                div2.style.height = '64px';
                villageArea.appendChild(div2);
              } else {
                placeBuilding(b.type, b.x, b.y, b.upgraded);
              }
            });
            villagers.forEach(v => villageArea.appendChild(v));
            selectedBuilding = null;
            showFeedback("House upgraded!");
            checkWinCondition();
          };
          div.onclick = handler;
        });
        return;
      }
      showFeedback("Please enter 'wall' or 'house'.");
    }
  });
};

function showFeedback(msg) {
  const fm = document.getElementById('feedback-message');
  fm.textContent = msg;
  fm.classList.add('show');
  setTimeout(() => {
    fm.classList.remove('show');
  }, 1500);
}

document.getElementById('reset-btn').onclick = () => {
  if (confirm('Reset your village?')) {
    initGame();
    showFeedback('Village reset!');
  }
};

function checkWinCondition() {
  if (waterDrops >= 1000 && buildings.every(b => b.upgraded)) {
    modal.style.display = 'flex';
  }
}

modalClose.onclick = () => {
  modal.style.display = 'none';
};

// Responsive: Remove river and trees, center main features on small screens
function handleMobileLayout() {
  const isMobile = window.innerWidth <= 700;
  const river = document.getElementById('river-container');
  const trees = document.querySelectorAll('.tree');

  if (isMobile) {
    // Make river horizontal and move it to bottom
    if (river) {
      river.style.top = 'auto';
      river.style.bottom = '0';
      river.style.left = '0';
      river.style.right = '0';
      river.style.width = '100%';
      river.style.height = '80px';
      river.style.transform = 'none';
    }

    // Keep just a few trees for visual balance
    trees.forEach((tree, index) => {
      if (index > 5) tree.remove();
    });

    // Ensure main buildings stay visible and large enough
    document.querySelectorAll('.building, .villager').forEach(el => {
      el.style.width = '56px';
      el.style.height = '56px';
    });
  } else {
    // Reset river to vertical in center
    if (river) {
      river.style.top = '60px';
      river.style.left = '50%';
      river.style.transform = 'translateX(-50%)';
      river.style.width = '120px';
      river.style.height = 'calc(100dvh - 60px)';
    }
    };
  }

window.addEventListener('resize', handleMobileLayout);
window.addEventListener('DOMContentLoaded', handleMobileLayout);

// Add bridge position (centered horizontally over river)
const bridgeY = 220; // adjust as needed for your map layout
let bridgeRect = null;

// Helper to show/hide the bridge
function showBridge(show) {
  let bridge = document.getElementById('bridge');
  if (bridge) {
    bridge.style.display = show ? 'block' : 'none';
    if (show) {
      // Update bridgeRect when showing
      bridgeRect = bridge.getBoundingClientRect();
    }
  }
}

// Place the bridge over the river after DOM is ready, but keep it hidden initially
window.addEventListener('DOMContentLoaded', () => {
  const river = document.getElementById('river-container');
  if (river) {
    // Create bridge element if not present
    let bridge = document.getElementById('bridge');
    if (!bridge) {
      bridge = document.createElement('div');
      bridge.id = 'bridge';
      bridge.style.position = 'absolute';
      // Center bridge horizontally over river
      bridge.style.left = (window.innerWidth / 2 - 20) + 'px'; // 40px width, so -20
      bridge.style.top = bridgeY + 'px';
      bridge.style.width = '40px';
      bridge.style.height = '58px';
      bridge.style.backgroundImage = "url('img/bridge.png')";
      bridge.style.backgroundSize = 'contain';
      bridge.style.backgroundRepeat = 'no-repeat';
      bridge.style.zIndex = '10';
      bridge.style.display = 'none'; // hidden by default
      document.body.appendChild(bridge);
    }
    bridgeRect = bridge.getBoundingClientRect();
  }
});

// Helper function to check if villager is crossing the river at the bridge
function isCrossingBridge(newX, newY, villagerSize = 64) {
  // Get bridge rect if available
  if (!bridgeRect) {
    const bridgeElem = document.getElementById('bridge');
    if (bridgeElem) bridgeRect = bridgeElem.getBoundingClientRect();
    else return false;
  }
  // Get villager's proposed rect
  const villageRect = villageArea.getBoundingClientRect();
  const villagerRect = {
    left: villageRect.left + newX,
    top: villageRect.top + newY,
    right: villageRect.left + newX + villagerSize,
    bottom: villageRect.top + newY + villagerSize
  };
  // Check for overlap with bridge
  return (
    villagerRect.right > bridgeRect.left &&
    villagerRect.left < bridgeRect.right &&
    villagerRect.bottom > bridgeRect.top &&
    villagerRect.top < bridgeRect.bottom
  );
}
