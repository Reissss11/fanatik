/* ==========================================================================
   FANATIKJERSEY THEME JAVASCRIPT
   ========================================================================== */

// ==========================================================================
// CONFIGURAÇÃO DE TAXAS DE PERSONALIZAÇÃO E PATCHES (Opção Híbrida)
// Crie estes dois produtos no seu Shopify Admin e insira os respetivos IDs de Variante abaixo.
// ==========================================================================
const CUSTOM_SURCHARGE_CONFIG = {
  personalizationVariantId: '54006710763861', // ID Real da Variante de Personalização (3.00€)
  patchVariantId: '54006710829397'          // ID Real da Variante de Patch (2.00€)
};

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggler();
  initQuantitySelectors();
  initSlideshows();
  initPredictiveSearch();
  initCartDrawer();
  initProductPage();
  initCollectionFilters();
});

/* --------------------------------------------------------------------------
   1. Theme Toggler (Light & Dark Mode)
   -------------------------------------------------------------------------- */
function initThemeToggler() {
  const toggleBtn = document.getElementById('ThemeToggleBtn');
  if (!toggleBtn) return;

  const sunIcon = toggleBtn.querySelector('.sun-icon');
  const moonIcon = toggleBtn.querySelector('.moon-icon');

  // Update icons on load
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcons(currentTheme, sunIcon, moonIcon);

  toggleBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme, sunIcon, moonIcon);
  });
}

function updateThemeIcons(theme, sunIcon, moonIcon) {
  if (!sunIcon || !moonIcon) return;
  if (theme === 'dark') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

/* --------------------------------------------------------------------------
   2. Hero Banner Slideshow
   -------------------------------------------------------------------------- */
function initSlideshows() {
  const slideshows = document.querySelectorAll('.slideshow-section');
  
  slideshows.forEach(slideshow => {
    const container = slideshow.querySelector('.slideshow-container');
    const slides = slideshow.querySelectorAll('.slide');
    const dots = slideshow.querySelectorAll('.slide-dot');
    const prevBtn = slideshow.querySelector('.prev-arrow');
    const nextBtn = slideshow.querySelector('.next-arrow');
    
    if (slides.length <= 1) return;

    let currentIndex = 0;
    let autoplayTimer = null;
    const isAutoplay = slideshow.getAttribute('data-autoplay') === 'true';
    const speed = parseInt(slideshow.getAttribute('data-speed')) || 5000;

    function goToSlide(index) {
      slides[currentIndex].classList.remove('active');
      if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
      
      currentIndex = (index + slides.length) % slides.length;
      
      slides[currentIndex].classList.add('active');
      if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startAutoplay() {
      if (isAutoplay) {
        stopAutoplay();
        autoplayTimer = setInterval(nextSlide, speed);
      }
    }

    function stopAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
    }

    // Controls
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoplay(); });

    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        goToSlide(index);
        startAutoplay();
      });
    });

    // Start
    startAutoplay();
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
  });
}

/* --------------------------------------------------------------------------
   3. Live Predictive Search
   -------------------------------------------------------------------------- */
function initPredictiveSearch() {
  const input = document.getElementById('HeaderSearchInput');
  const resultsDiv = document.getElementById('HeaderSearchResults');
  if (!input || !resultsDiv) return;

  let debounceTimer = null;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      resultsDiv.style.display = 'none';
      resultsDiv.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
      fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`)
        .then(response => response.json())
        .then(data => {
          const products = data.resources.results.products;
          if (products && products.length > 0) {
            let html = '';
            products.forEach(prod => {
              html += `
                <a href="${prod.url}" class="search-result-item">
                  <div class="result-image">
                    <img src="${prod.image || 'https://cdn.shopify.com/s/files/1/0000/0000/assets/no-image.gif'}" alt="${prod.title}">
                  </div>
                  <div class="result-info">
                    <span class="result-name">${prod.title}</span>
                    <span class="result-meta">${prod.vendor || ''}</span>
                  </div>
                  <span class="result-price">${prod.price || ''}</span>
                </a>
              `;
            });
            
            html += `
              <a href="/search?q=${encodeURIComponent(query)}" class="view-all-results">
                Ver todos os resultados
              </a>
            `;

            resultsDiv.innerHTML = html;
            resultsDiv.style.display = 'block';
          } else {
            resultsDiv.innerHTML = `<div class="view-all-results">Nenhum artigo encontrado</div>`;
            resultsDiv.style.display = 'block';
          }
        })
        .catch(err => {
          console.error("Predictive search error:", err);
        });
    }, 300);
  });

  // Close search results dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = 'none';
    }
  });

  // Clear button logic
  const clearBtn = document.getElementById('HeaderSearchClearBtn');
  
  function updateClearBtn() {
    if (clearBtn) {
      clearBtn.style.display = input.value.trim().length > 0 ? 'flex' : 'none';
    }
  }

  updateClearBtn();
  input.addEventListener('input', updateClearBtn);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      updateClearBtn();
      resultsDiv.style.display = 'none';
      resultsDiv.innerHTML = '';
      
      if (window.location.pathname.includes('/search')) {
        window.location.href = '/collections/all';
      } else {
        input.focus();
      }
    });
  }
}

/* --------------------------------------------------------------------------
   4. Slideout Cart Drawer (Shopify AJAX API Integration)
   -------------------------------------------------------------------------- */
function initCartDrawer() {
  const overlay = document.getElementById('CartDrawerOverlay');
  const cartBtn = document.getElementById('HeaderCartBtn');
  const closeBtn = document.getElementById('CartDrawerCloseBtn');
  const startShopping = document.getElementById('CartDrawerStartShoppingBtn');
  const itemsContainer = document.getElementById('CartDrawerItems');

  if (!overlay) return;

  function openDrawer() {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    overlay.style.display = 'none';
    document.body.style.overflow = 'unset';
  }

  if (cartBtn) cartBtn.addEventListener('click', openDrawer);
  const mobileCartTrigger = document.getElementById('MobileCartTrigger');
  if (mobileCartTrigger) mobileCartTrigger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (startShopping) startShopping.addEventListener('click', closeDrawer);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDrawer();
  });

  // Handle deletions / removals using AJAX inside Drawer
  if (itemsContainer) {
    itemsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-btn');
      if (removeBtn) {
        const key = removeBtn.getAttribute('data-key');
        updateCartItemQuantity(key, 0);
      }
    });
  }

  // Intercept standard Add-to-Cart form submit to do AJAX and slide open the drawer
  const productForm = document.getElementById('ProductForm');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const variantId = document.getElementById('ProductVariantId').value;
      const customName = document.getElementById('CustomNameInput') ? document.getElementById('CustomNameInput').value.trim() : '';
      const customNumber = document.getElementById('CustomNumberInput') ? document.getElementById('CustomNumberInput').value.trim() : '';
      const patchText = document.getElementById('PatchTextInput') ? document.getElementById('PatchTextInput').value.trim() : '';
      
      console.log('Form submit. Name:', customName, 'Number:', customNumber, 'Patches:', patchText);
      
      const properties = {};
      if (customName) properties['Nome'] = customName;
      if (customNumber) properties['Número'] = customNumber;
      if (patchText) properties['Patches'] = patchText;
      
      const items = [];
      
      // 1. Add main Jersey product
      const mainItem = {
        id: parseInt(variantId),
        quantity: 1
      };
      if (Object.keys(properties).length > 0) {
        mainItem.properties = properties;
      }
      items.push(mainItem);
      
      console.log('Sending items payload to cart/add.js:', items);
      
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: items })
      })
      .then(response => response.json())
      .then(data => {
        // Success: reload cart stats and open drawer
        reloadCartAndRender();
        openDrawer();
        
        // Reset form inputs after adding
        if (document.getElementById('CustomNameInput')) document.getElementById('CustomNameInput').value = '';
        if (document.getElementById('CustomNumberInput')) document.getElementById('CustomNumberInput').value = '';
        if (document.getElementById('PatchTextInput')) document.getElementById('PatchTextInput').value = '';
        calculateProductPriceSurcharge(); // reset price displays
      })
      .catch(error => {
        console.error('AJAX add-to-cart error:', error);
      });
    });
  }
}

// Reload Cart details, perform auto-reconciliation, and redraw HTML in drawer
function reloadCartAndRender() {
  fetch('/cart.js?v=' + Date.now())
    .then(response => response.json())
    .then(cart => {
      renderCartData(cart);
    });
}

// Helper to render the cart drawer dynamically
function renderCartData(cart) {
  // 1. Calculate and update visible item count badges
  let visibleItemCount = 0;
  cart.items.forEach(item => {
    visibleItemCount += item.quantity;
  });

  const badge = document.getElementById('CartBadge');
  const mobileBadge = document.getElementById('MobileCartBadge');
  const drawerCount = document.getElementById('CartDrawerCount');
  
  if (badge) {
    badge.innerText = visibleItemCount;
    if (visibleItemCount > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  
  if (mobileBadge) {
    mobileBadge.innerText = visibleItemCount;
    if (visibleItemCount > 0) {
      mobileBadge.classList.remove('hidden');
    } else {
      mobileBadge.classList.add('hidden');
    }
  }
  
  if (drawerCount) drawerCount.innerText = visibleItemCount;

  // 2. Redraw Cart Drawer Items list
  const itemsContainer = document.getElementById('CartDrawerItems');
  const footer = document.getElementById('CartDrawerFooter');
  
  if (visibleItemCount === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-cart">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p>O seu carrinho está vazio</p>
        <button class="start-shopping-btn" id="CartDrawerStartShoppingBtn">Começar a comprar</button>
      </div>
    `;
    // Setup the close button click on the new start shopping button
    const startShopping = document.getElementById('CartDrawerStartShoppingBtn');
    if (startShopping) {
      startShopping.addEventListener('click', () => {
        const overlay = document.getElementById('CartDrawerOverlay');
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = 'unset';
      });
    }
    if (footer) footer.style.display = 'none';
  } else {
    let itemsHtml = '';
    
    cart.items.forEach(item => {
      // Format line-item properties
      let propsHtml = '';
      const customName = item.properties ? item.properties['Nome'] : null;
      const customNumber = item.properties ? item.properties['Número'] : null;
      
      if (customName || customNumber) {
        propsHtml += `<p class="item-customization">Personalização: ${customName || ''} ${customNumber || ''}</p>`;
      }

      let patchesHtml = '';
      const patchesVal = item.properties ? (item.properties['Patches'] || item.properties['Patch']) : null;
      if (patchesVal) {
        patchesHtml = `<div class="item-patches-list"><span class="item-patch">Patches: ${patchesVal}</span></div>`;
      }

      const baseLinePrice = parseInt(item.final_line_price) || 0;
      const customizedItemPrice = baseLinePrice;

      itemsHtml += `
        <div class="cart-item" data-key="${item.key}">
          <div class="cart-item-image">
            <img src="${item.image || ''}" alt="${item.product_title}">
          </div>
          <div class="cart-item-info">
            <h4>${item.product_title}</h4>
            <p class="item-meta">Tamanho: ${item.variant_title || ''}</p>
            ${propsHtml}
            ${patchesHtml}
            <div class="item-price-row">
              <span class="item-price">${formatShopCurrency(customizedItemPrice)}</span>
              <div class="qty-selector">
                <button type="button" class="qty-btn minus" data-qty-change="-1">-</button>
                <input
                  type="number"
                  value="${item.quantity}"
                  min="0"
                  class="qty-input"
                  data-key="${item.key}"
                >
                <button type="button" class="qty-btn plus" data-qty-change="1">+</button>
              </div>
            </div>
          </div>
          <button class="remove-btn" data-key="${item.key}" aria-label="Remover artigo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    });
    
    itemsContainer.innerHTML = itemsHtml;
    
    // 3. Update Footer Subtotals & totals
    const subtotalSpan = document.getElementById('CartDrawerSubtotal');
    const totalSpan = document.getElementById('CartDrawerTotal');
    const discountMsg = document.getElementById('CartDrawerDiscountMessage');
    const discountsContainer = document.getElementById('CartDrawerDiscountsContainer');

    if (subtotalSpan) subtotalSpan.innerText = formatShopCurrency(cart.total_price);
    if (totalSpan) totalSpan.innerText = formatShopCurrency(cart.total_price);
    
    if (visibleItemCount >= 3) {
      if (discountMsg) discountMsg.style.display = 'block';
    } else {
      if (discountMsg) discountMsg.style.display = 'none';
    }
    
    if (footer) footer.style.display = 'block';
  }
}

function updateCartItemQuantity(key, quantity) {
  fetch('/cart/change.js', {
    method: 'POST',
    body: JSON.stringify({ id: key, quantity: quantity }),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
  .then(response => response.json())
  .then(() => {
    reloadCartAndRender();
    // If full-page cart exists, reload the browser tab
    if (document.getElementById('MainCartContent')) {
      window.location.reload();
    }
  })
  .catch(err => {
    console.error('Cart quantity update error:', err);
  });
}

function formatShopCurrency(cents) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100.0);
}

/* --------------------------------------------------------------------------
   4b. Dynamic Quantity Selector Event Listeners
   -------------------------------------------------------------------------- */
function initQuantitySelectors() {
  // 1. Handle Plus and Minus click events (Event Delegation)
  document.body.addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('.qty-btn');
    if (!qtyBtn) return;

    const parent = qtyBtn.closest('.qty-selector');
    const input = parent ? parent.querySelector('.qty-input') : null;
    if (!input) return;

    const currentVal = parseInt(input.value) || 0;
    const change = parseInt(qtyBtn.getAttribute('data-qty-change')) || 0;
    const newVal = Math.max(0, currentVal + change);

    input.value = newVal;

    const key = input.getAttribute('data-key');
    updateCartItemQuantity(key, newVal);
  });

  // 2. Handle manual number inputs/typing (Event Delegation)
  document.body.addEventListener('change', (e) => {
    const input = e.target.closest('.qty-input');
    if (!input) return;

    const val = parseInt(input.value);
    if (isNaN(val) || val < 0) {
      // Revert or default to 0 if invalid
      input.value = 0;
      return;
    }

    const key = input.getAttribute('data-key');
    updateCartItemQuantity(key, val);
  });
}

/* --------------------------------------------------------------------------
   5. Product Page Actions (Gallery Selector, Magnifier Zoom & Calculated Surcharges)
   -------------------------------------------------------------------------- */
function initProductPage() {
  const container = document.querySelector('.jersey-details-container');
  if (!container) return;

  // Thumbnail Image swaps
  const thumbs = container.querySelectorAll('.thumbnail');
  const mainImg = document.getElementById('ProductMainImage');
  const mainImageWrapper = document.getElementById('MainImageWrapper');
  const mainImageColumn = document.getElementById('MainImageColumn');
  const zoomBtn = document.getElementById('ZoomToggleBtn');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      
      const newUrl = thumb.getAttribute('data-image-url');
      if (mainImg) mainImg.src = newUrl;
    });
  });

  // Magnifier Zoom coordinates Calculation on Hover
  let isZoomActive = false;
  
  if (mainImageColumn) {
    mainImageColumn.addEventListener('mousemove', (e) => {
      if (!isZoomActive) return;
      const { left, top, width, height } = mainImageColumn.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      
      if (mainImageWrapper) {
        mainImageWrapper.style.transformOrigin = `${x}% ${y}%`;
      }
    });

    mainImageColumn.addEventListener('mouseleave', () => {
      if (mainImageWrapper) {
        mainImageWrapper.style.transformOrigin = 'center center';
      }
    });

    // Zoom Toggle click
    if (zoomBtn) {
      zoomBtn.addEventListener('click', () => {
        isZoomActive = !isZoomActive;
        if (isZoomActive) {
          mainImageColumn.classList.add('zoom-active');
          zoomBtn.innerText = '➖';
          zoomBtn.title = 'Desativar Zoom';
        } else {
          mainImageColumn.classList.remove('zoom-active');
          zoomBtn.innerText = '🔍';
          zoomBtn.title = 'Ativar Zoom';
          if (mainImageWrapper) mainImageWrapper.style.transformOrigin = 'center center';
        }
      });
    }
  }

  // Seletor de Tamanho, Toggles e Atualizações de Variante
  const sizeBoxBtns = document.querySelectorAll('.size-box-btn');
  const variantInput = document.getElementById('ProductVariantId');
  const priceDisplay = document.getElementById('ProductPrice');
  const comparePriceDisplay = document.getElementById('ComparePrice');
  const addToCartBtn = document.getElementById('AddToCartBtn');

  sizeBoxBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBoxBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calculateProductPriceSurcharge();
    });
  });

  // Toggles de Patches e Personalização
  const patchesRadios = document.querySelectorAll('input[name="patches_toggle"]');
  const personalizationRadios = document.querySelectorAll('input[name="personalization_toggle"]');
  
  const patchesContainer = document.getElementById('PatchesInputContainer');
  const personalizationContainer = document.getElementById('PersonalizationInputContainer');

  const customName = document.getElementById('CustomNameInput');
  const customNumber = document.getElementById('CustomNumberInput');
  const patchText = document.getElementById('PatchTextInput');

  patchesRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Sim') {
        if (patchesContainer) patchesContainer.style.display = 'block';
      } else {
        if (patchesContainer) patchesContainer.style.display = 'none';
        if (patchText) patchText.value = '';
      }
      calculateProductPriceSurcharge();
    });
  });

  personalizationRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Sim') {
        if (personalizationContainer) personalizationContainer.style.display = 'flex';
      } else {
        if (personalizationContainer) personalizationContainer.style.display = 'none';
        if (customName) customName.value = '';
        if (customNumber) customNumber.value = '';
      }
      calculateProductPriceSurcharge();
    });
  });

  if (customName) customName.addEventListener('input', calculateProductPriceSurcharge);
  if (customNumber) customNumber.addEventListener('input', calculateProductPriceSurcharge);
  if (patchText) patchText.addEventListener('input', calculateProductPriceSurcharge);

  // Verificar se algum toggle já está pré-selecionado (ex: retroceder na navegação)
  patchesRadios.forEach(radio => {
    if (radio.checked && radio.value === 'Sim') {
      if (patchesContainer) patchesContainer.style.display = 'block';
    }
  });

  personalizationRadios.forEach(radio => {
    if (radio.checked && radio.value === 'Sim') {
      if (personalizationContainer) personalizationContainer.style.display = 'flex';
    }
  });

  // Executa o cálculo inicial para sincronizar a variante correta com base no estado atual do formulário
  calculateProductPriceSurcharge();

  function calculateProductPriceSurcharge() {
    const activeSizeBtn = document.querySelector('.size-box-btn.active');
    if (!activeSizeBtn) return;
    
    const sizeVal = activeSizeBtn.getAttribute('data-size');
    
    // Get patches value (first Yes/No)
    const activePatchesRadio = document.querySelector('input[name="patches_toggle"]:checked');
    const patchesVal = activePatchesRadio ? activePatchesRadio.value : 'Não';

    // Get personalization value (second Yes/No)
    const activePersRadio = document.querySelector('input[name="personalization_toggle"]:checked');
    const personalizationVal = activePersRadio ? activePersRadio.value : 'Não';

    const matchedVariant = findMatchingVariant(sizeVal, patchesVal, personalizationVal);
    
    if (matchedVariant) {
      if (variantInput) variantInput.value = matchedVariant.id;
      
      // Update Price display
      if (priceDisplay) {
        priceDisplay.innerText = formatShopCurrency(matchedVariant.price * 100);
      }
      
      // Update Compare Price
      if (comparePriceDisplay) {
        if (matchedVariant.compare_at_price) {
          comparePriceDisplay.innerText = formatShopCurrency(matchedVariant.compare_at_price * 100);
          comparePriceDisplay.style.display = 'inline';
        } else {
          comparePriceDisplay.style.display = 'none';
        }
      }

      // Update Add to Cart Button state
      if (addToCartBtn) {
        if (matchedVariant.available) {
          addToCartBtn.disabled = false;
          addToCartBtn.querySelector('span').innerText = 'Adicionar ao Carrinho';
        } else {
          addToCartBtn.disabled = true;
          addToCartBtn.querySelector('span').innerText = 'Esgotado';
        }
      }
    }
  }

  // Smart Matching algorithm to find the correct variant matching Selected Size + Customization Level
  function findMatchingVariant(size, patches, personalization) {
    const variantsJson = document.getElementById('ProductVariantsJson');
    if (!variantsJson) return null;
    
    try {
      const variants = JSON.parse(variantsJson.textContent);
      
      // Look for a variant matching option1 (size), option2 (patches "Sim"/"Não"), option3 (personalization "Sim"/"Não")
      return variants.find(v => {
        const opt1 = v.option1 ? v.option1.trim().toUpperCase() : '';
        const opt2 = v.option2 ? v.option2.trim().toUpperCase() : 'NÃO';
        const opt3 = v.option3 ? v.option3.trim().toUpperCase() : 'NÃO';
        
        return opt1 === size.toUpperCase() && 
               opt2 === patches.toUpperCase() && 
               opt3 === personalization.toUpperCase();
      }) || variants.find(v => v.option1.trim().toUpperCase() === size.toUpperCase()) || variants[0];
    } catch (e) {
      console.error('Error parsing product variants JSON:', e);
      return null;
    }
  }
}

/* --------------------------------------------------------------------------
   6. Collection / Catalog Sidebar Filters Accordions & Page Options
   -------------------------------------------------------------------------- */
function initCollectionFilters() {
  const container = document.getElementById('MainCollectionContainer');
  if (!container) return;

  const accordions = container.querySelectorAll('.filter-dropdown');
  const mobileToggle = document.getElementById('MobileFilterToggleBtn');
  const sidebar = document.getElementById('CatalogSidebar');
  const closeBtn = document.getElementById('CloseFiltersBtn');

  // Client-Side Pagination state
  let currentPage = 1;
  const limitSelect = document.getElementById('CatalogLimitSelector');
  let itemsPerPage = limitSelect ? parseInt(limitSelect.value) : 12;

  // Accordion triggers
  accordions.forEach(drop => {
    const trigger = drop.querySelector('.dropdown-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all other open dropdowns first
        accordions.forEach(other => {
          if (other !== drop) {
            other.classList.remove('open');
          }
        });
        // Toggle active
        drop.classList.toggle('open');
      });
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    accordions.forEach(drop => {
      if (!drop.contains(e.target)) {
        drop.classList.remove('open');
      }
    });
  });

  // Mobile Filter Side overlays
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      document.body.style.overflow = 'unset';
    });
  }

  // Intercept Clubes checkbox-link clicks
  const clubLinks = container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link');
  clubLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle active class
      link.classList.toggle('active');
      const indicator = link.querySelector('.custom-checkbox-indicator');
      if (indicator) {
        if (link.classList.contains('active')) {
          indicator.innerText = '✓';
          indicator.style.background = 'var(--color-text)';
        } else {
          indicator.innerText = '';
          indicator.style.background = 'transparent';
        }
      }
      
      // Update badge, query param, filter products, and update active chips
      updateClubeQueryParamAndFilter();
    });
  });

  // Intercept Opções checkbox-link clicks
  const optionLinks = container.querySelectorAll('.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link');
  optionLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle active class
      link.classList.toggle('active');
      const indicator = link.querySelector('.custom-checkbox-indicator');
      if (indicator) {
        if (link.classList.contains('active')) {
          indicator.innerText = '✓';
          indicator.style.background = 'var(--color-text)';
        } else {
          indicator.innerText = '';
          indicator.style.background = 'transparent';
        }
      }
      
      updateOpcoesQueryParamAndFilter();
    });
  });

  // Intercept Épocas checkbox-link clicks
  const epocaLinks = container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link');
  epocaLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle active class
      link.classList.toggle('active');
      const indicator = link.querySelector('.custom-checkbox-indicator');
      if (indicator) {
        if (link.classList.contains('active')) {
          indicator.innerText = '✓';
          indicator.style.background = 'var(--color-text)';
        } else {
          indicator.innerText = '';
          indicator.style.background = 'transparent';
        }
      }
      
      updateEpocasQueryParamAndFilter();
    });
  });

  // Listen for clicks on active filter chips to remove them
  container.addEventListener('click', (e) => {
    const clubChip = e.target.closest('.active-filter-chip.club-filter-chip');
    if (clubChip) {
      e.preventDefault();
      e.stopPropagation();
      const handle = clubChip.getAttribute('data-club-handle');
      const itemLink = container.querySelector(`.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link[data-club-handle="${handle}"]`);
      if (itemLink) {
        itemLink.click();
      }
    }

    const opChip = e.target.closest('.active-filter-chip.opcao-filter-chip');
    if (opChip) {
      e.preventDefault();
      e.stopPropagation();
      const handle = opChip.getAttribute('data-opcao-handle');
      const itemLink = container.querySelector(`.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link[data-opcao-handle="${handle}"]`);
      if (itemLink) {
        itemLink.click();
      }
    }

    const epChip = e.target.closest('.active-filter-chip.epoca-filter-chip');
    if (epChip) {
      e.preventDefault();
      e.stopPropagation();
      const handle = epChip.getAttribute('data-epoca-handle');
      const itemLink = container.querySelector(`.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link[data-epoca-handle="${handle}"]`);
      if (itemLink) {
        itemLink.click();
      }
    }
  });

  function updateClubeQueryParamAndFilter() {
    currentPage = 1; // Reset to first page on filter update
    const activeLinks = Array.from(container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link.active'));
    const activeHandles = activeLinks.map(link => link.getAttribute('data-club-handle'));
    
    // Update badge count in trigger
    const dropdown = container.querySelector('.filter-dropdown[data-dropdown-name="clubes"]');
    if (dropdown) {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      if (trigger) {
        let badgeSpan = trigger.querySelector('.active-count-badge');
        if (activeHandles.length > 0) {
          if (!badgeSpan) {
            badgeSpan = document.createElement('span');
            badgeSpan.className = 'active-count-badge';
            const arrow = trigger.querySelector('.dropdown-arrow');
            trigger.insertBefore(badgeSpan, arrow);
          }
          badgeSpan.innerText = `(${activeHandles.length})`;
        } else {
          if (badgeSpan) badgeSpan.remove();
        }
      }
    }

    // Update URL query parameters without reloading
    const url = new URL(window.location.href);
    if (activeHandles.length > 0) {
      url.searchParams.set('clubes', activeHandles.join(','));
    } else {
      url.searchParams.delete('clubes');
    }
    window.history.replaceState(null, '', url.toString());

    // Apply visibility filters to the product card elements
    applyClubeFiltering();

    // Update the dynamic active filter chips
    updateActiveFilterChips();

    // Show or hide the global Clear All Filters button dynamically
    const clearFiltersBtn = container.querySelector('#ClearAllFiltersBtn');
    if (clearFiltersBtn) {
      const activeClubes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link.active');
      const activeOpcoes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link.active');
      const activeEpocas = container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link.active');
      const standardChips = container.querySelectorAll('.active-filters-summary .active-filter-chip:not(.club-filter-chip):not(.opcao-filter-chip):not(.epoca-filter-chip)');
      
      if (activeClubes.length > 0 || activeOpcoes.length > 0 || activeEpocas.length > 0 || standardChips.length > 0) {
        clearFiltersBtn.style.setProperty('display', 'inline-flex', 'important');
      } else {
        clearFiltersBtn.style.setProperty('display', 'none', 'important');
      }
    }
  }

  function updateOpcoesQueryParamAndFilter() {
    currentPage = 1; // Reset to first page on filter update
    const activeLinks = Array.from(container.querySelectorAll('.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link.active'));
    const activeHandles = activeLinks.map(link => link.getAttribute('data-opcao-handle'));
    
    // Update badge count in trigger
    const dropdown = container.querySelector('.filter-dropdown[data-dropdown-name="opcoes"]');
    if (dropdown) {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      if (trigger) {
        let badgeSpan = trigger.querySelector('.active-count-badge');
        if (activeHandles.length > 0) {
          if (!badgeSpan) {
            badgeSpan = document.createElement('span');
            badgeSpan.className = 'active-count-badge';
            const arrow = trigger.querySelector('.dropdown-arrow');
            trigger.insertBefore(badgeSpan, arrow);
          }
          badgeSpan.innerText = `(${activeHandles.length})`;
        } else {
          if (badgeSpan) badgeSpan.remove();
        }
      }
    }

    // Update URL query parameters without reloading
    const url = new URL(window.location.href);
    if (activeHandles.length > 0) {
      url.searchParams.set('opcoes', activeHandles.join(','));
    } else {
      url.searchParams.delete('opcoes');
    }
    window.history.replaceState(null, '', url.toString());

    // Apply visibility filters to the product card elements
    applyClubeFiltering();

    // Update the dynamic active filter chips
    updateActiveFilterChips();

    // Show or hide the global Clear All Filters button dynamically
    const clearFiltersBtn = container.querySelector('#ClearAllFiltersBtn');
    if (clearFiltersBtn) {
      const activeClubes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link.active');
      const activeOpcoes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link.active');
      const activeEpocas = container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link.active');
      const standardChips = container.querySelectorAll('.active-filters-summary .active-filter-chip:not(.club-filter-chip):not(.opcao-filter-chip):not(.epoca-filter-chip)');
      
      if (activeClubes.length > 0 || activeOpcoes.length > 0 || activeEpocas.length > 0 || standardChips.length > 0) {
        clearFiltersBtn.style.setProperty('display', 'inline-flex', 'important');
      } else {
        clearFiltersBtn.style.setProperty('display', 'none', 'important');
      }
    }
  }

  function updateEpocasQueryParamAndFilter() {
    currentPage = 1; // Reset to first page on filter update
    const activeLinks = Array.from(container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link.active'));
    const activeHandles = activeLinks.map(link => link.getAttribute('data-epoca-handle'));
    
    // Update badge count in trigger
    const dropdown = container.querySelector('.filter-dropdown[data-dropdown-name="epocas"]');
    if (dropdown) {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      if (trigger) {
        let badgeSpan = trigger.querySelector('.active-count-badge');
        if (activeHandles.length > 0) {
          if (!badgeSpan) {
            badgeSpan = document.createElement('span');
            badgeSpan.className = 'active-count-badge';
            const arrow = trigger.querySelector('.dropdown-arrow');
            trigger.insertBefore(badgeSpan, arrow);
          }
          badgeSpan.innerText = `(${activeHandles.length})`;
        } else {
          if (badgeSpan) badgeSpan.remove();
        }
      }
    }

    // Update URL query parameters without reloading
    const url = new URL(window.location.href);
    if (activeHandles.length > 0) {
      url.searchParams.set('epocas', activeHandles.join(','));
    } else {
      url.searchParams.delete('epocas');
    }
    window.history.replaceState(null, '', url.toString());

    // Apply visibility filters to the product card elements
    applyClubeFiltering();

    // Update the dynamic active filter chips
    updateActiveFilterChips();

    // Show or hide the global Clear All Filters button dynamically
    const clearFiltersBtn = container.querySelector('#ClearAllFiltersBtn');
    if (clearFiltersBtn) {
      const activeClubes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link.active');
      const activeOpcoes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link.active');
      const activeEpocas = container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link.active');
      const standardChips = container.querySelectorAll('.active-filters-summary .active-filter-chip:not(.club-filter-chip):not(.opcao-filter-chip):not(.epoca-filter-chip)');
      
      if (activeClubes.length > 0 || activeOpcoes.length > 0 || activeEpocas.length > 0 || standardChips.length > 0) {
        clearFiltersBtn.style.setProperty('display', 'inline-flex', 'important');
      } else {
        clearFiltersBtn.style.setProperty('display', 'none', 'important');
      }
    }
  }

  function applyClubeFiltering() {
    const activeClubLinks = Array.from(container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link.active'));
    const activeClubHandles = activeClubLinks.map(link => link.getAttribute('data-club-handle'));

    const activeOpLinks = Array.from(container.querySelectorAll('.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link.active'));
    const activeOpHandles = activeOpLinks.map(link => link.getAttribute('data-opcao-handle'));

    const cards = container.querySelectorAll('.jersey-card');
    const grid = container.querySelector('.catalog-grid');
    const noResults = container.querySelector('.no-results');

    const matchingCards = [];

    cards.forEach(card => {
      const cardTagHandlesStr = card.getAttribute('data-tags-handles') || '';
      let tagHandles = [];
      if (cardTagHandlesStr) {
        tagHandles = cardTagHandlesStr.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '');
      } else {
        const cardTagsStr = card.getAttribute('data-tags') || '';
        const cardTags = cardTagsStr.split(',').map(t => t.trim().toLowerCase());
        tagHandles = cardTags.map(tag => {
          return tag.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        });
      }

      // 1. Check Clubes match (logical OR within group)
      let clubMatch = false;
      if (activeClubHandles.length === 0) {
        clubMatch = true;
      } else {
        clubMatch = activeClubHandles.some(handle => tagHandles.includes(handle));
      }

      // 2. Check Opção/Variante match (logical OR within group)
      let opMatch = false;
      if (activeOpHandles.length === 0) {
        opMatch = true;
      } else {
        opMatch = activeOpHandles.some(handle => tagHandles.includes(handle));
      }

      // 3. Check Época match (logical OR within group)
      const activeEpLinks = Array.from(container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link.active'));
      const activeEpHandles = activeEpLinks.map(link => link.getAttribute('data-epoca-handle'));
      let epMatch = false;
      if (activeEpHandles.length === 0) {
        epMatch = true;
      } else {
        epMatch = activeEpHandles.some(handle => tagHandles.includes(handle));
      }

      // Strict logical AND between all groups
      if (clubMatch && opMatch && epMatch) {
        matchingCards.push(card);
      } else {
        card.style.display = 'none';
      }
    });

    const totalMatching = matchingCards.length;
    const totalPages = Math.ceil(totalMatching / itemsPerPage);
    
    // Clamp currentPage
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    if (currentPage < 1) currentPage = 1;

    // Show only products belonging to the current page
    matchingCards.forEach((card, index) => {
      const startIdx = (currentPage - 1) * itemsPerPage;
      const endIdx = currentPage * itemsPerPage - 1;
      if (index >= startIdx && index <= endIdx) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });

    // Render the dynamic pagination bar
    renderPagination(totalPages);

    // Handle empty results display
    if (totalMatching === 0) {
      if (noResults) {
        noResults.style.display = 'block';
      } else {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results dynamic-no-results';
        noResultsDiv.innerHTML = `
          <h3>Não foram encontrados resultados.</h3>
          <a href="${window.location.pathname}" class="clear-filters-link-btn">Limpar Filtros</a>
        `;
        if (grid) grid.parentNode.insertBefore(noResultsDiv, grid.nextSibling);
      }
      if (grid) grid.style.display = 'none';
    } else {
      const dynamicNoResults = container.querySelector('.dynamic-no-results');
      if (dynamicNoResults) dynamicNoResults.remove();
      if (noResults) noResults.style.display = 'none';
      if (grid) grid.style.display = 'grid';
    }
  }

  function renderPagination(totalPages) {
    const pagDiv = document.getElementById('CatalogPagination');
    if (!pagDiv) return;

    if (totalPages <= 1) {
      pagDiv.style.display = 'none';
      pagDiv.innerHTML = '';
      return;
    }

    pagDiv.style.display = 'flex';
    
    const prevText = pagDiv.getAttribute('data-prev-text') || '◀ Anterior';
    const nextText = pagDiv.getAttribute('data-next-text') || 'Seguinte ▶';
    
    let html = '';
    
    // Previous button
    if (currentPage > 1) {
      html += `<a href="#" class="pagination-btn prev-page-btn">${prevText}</a>`;
    } else {
      html += `<button class="pagination-btn" disabled>${prevText}</button>`;
    }
    
    // Page numbers
    html += `<div class="page-numbers">`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="page-number active">${i}</span>`;
      } else {
        html += `<a href="#" class="page-number page-num-btn" data-page="${i}">${i}</a>`;
      }
    }
    html += `</div>`;
    
    // Next button
    if (currentPage < totalPages) {
      html += `<a href="#" class="pagination-btn next-page-btn">${nextText}</a>`;
    } else {
      html += `<button class="pagination-btn" disabled>${nextText}</button>`;
    }
    
    pagDiv.innerHTML = html;
  }

  function updateActiveFilterChips() {
    let summaryDiv = container.querySelector('.active-filters-summary');
    if (!summaryDiv) {
      const sidebar = container.querySelector('#CatalogSidebar');
      if (!sidebar) return;
      summaryDiv = document.createElement('div');
      summaryDiv.className = 'active-filters-summary';
      const staticMenu = sidebar.querySelector('.static-collections-menu');
      if (staticMenu) {
        sidebar.insertBefore(summaryDiv, staticMenu);
      } else {
        sidebar.appendChild(summaryDiv);
      }
    }

    // Clear previous club filter chips
    const existingClubChips = summaryDiv.querySelectorAll('.club-filter-chip');
    existingClubChips.forEach(chip => chip.remove());

    // Clear previous época filter chips
    const existingEpocaChips = summaryDiv.querySelectorAll('.epoca-filter-chip');
    existingEpocaChips.forEach(chip => chip.remove());

    // Render updated club chips
    const activeLinks = container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link.active');
    activeLinks.forEach(link => {
      const handle = link.getAttribute('data-club-handle');
      const name = link.querySelector('span:not(.custom-checkbox-indicator)').innerText.trim();
      
      const chip = document.createElement('a');
      chip.href = '#';
      chip.className = 'active-filter-chip club-filter-chip';
      chip.setAttribute('data-club-handle', handle);
      chip.title = `Remover filtro ${name}`;
      chip.innerHTML = `${name} ✕`;
      
      summaryDiv.appendChild(chip);
    });

    // Render updated época chips
    const activeEpocaLinks = container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link.active');
    activeEpocaLinks.forEach(link => {
      const handle = link.getAttribute('data-epoca-handle');
      const name = link.querySelector('span:not(.custom-checkbox-indicator)').innerText.trim();
      
      const chip = document.createElement('a');
      chip.href = '#';
      chip.className = 'active-filter-chip epoca-filter-chip';
      chip.setAttribute('data-epoca-handle', handle);
      chip.title = `Remover filtro ${name}`;
      chip.innerHTML = `${name} ✕`;
      
      summaryDiv.appendChild(chip);
    });

    // Toggle summary display based on chip presence
    const remainingChips = summaryDiv.querySelectorAll('.active-filter-chip');
    if (remainingChips.length === 0) {
      summaryDiv.style.display = 'none';
    } else {
      summaryDiv.style.display = 'flex';
    }
  }

  // Run filter on initial load to support shared/saved URLs
  applyClubeFiltering();

  // Show or hide the global Clear All Filters button dynamically on initial load
  const clearFiltersBtnOnLoad = container.querySelector('#ClearAllFiltersBtn');
  if (clearFiltersBtnOnLoad) {
    const activeClubes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="clubes"] .filter-item-link.active');
    const activeOpcoes = container.querySelectorAll('.filter-dropdown[data-dropdown-name="opcoes"] .filter-item-link.active');
    const activeEpocas = container.querySelectorAll('.filter-dropdown[data-dropdown-name="epocas"] .filter-item-link.active');
    const standardChips = container.querySelectorAll('.active-filters-summary .active-filter-chip:not(.club-filter-chip):not(.opcao-filter-chip):not(.epoca-filter-chip)');
    if (activeClubes.length > 0 || activeOpcoes.length > 0 || activeEpocas.length > 0 || standardChips.length > 0) {
      clearFiltersBtnOnLoad.style.setProperty('display', 'inline-flex', 'important');
    } else {
      clearFiltersBtnOnLoad.style.setProperty('display', 'none', 'important');
    }
  }

  // Sidebar dynamic form submit on filter change
  const filterForm = document.getElementById('CollectionFiltersForm');
  if (filterForm) {
    const checkboxes = filterForm.querySelectorAll('.filter-checkbox');
    checkboxes.forEach(box => {
      box.addEventListener('change', () => submitFilterForm(filterForm));
    });
    
    // Handle price range inputs (submit on blur or enter)
    const priceInputs = filterForm.querySelectorAll('.price-range-inputs input');
    priceInputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitFilterForm(filterForm);
        }
      });
      input.addEventListener('blur', () => submitFilterForm(filterForm));
    });
    
    // Sidebar search input
    const sidebarSearch = document.getElementById('SidebarSearchInput');
    if (sidebarSearch) {
      sidebarSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitFilterForm(filterForm);
        }
      });
    }
  }

  // Catalog item limits pagination select box (Client-side override)
  if (limitSelect) {
    limitSelect.addEventListener('change', () => {
      const val = limitSelect.value;
      itemsPerPage = parseInt(val);
      currentPage = 1;
      applyClubeFiltering(); // Re-run pagination instantly!
      
      // Update Shopify cart attribute in background to remember choice on reload
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: { pagination_limit: val } })
      });
    });
  }

  // Handle client-side pagination button clicks
  const pagDiv = document.getElementById('CatalogPagination');
  if (pagDiv) {
    pagDiv.addEventListener('click', (e) => {
      const pageBtn = e.target.closest('.page-num-btn');
      const prevBtn = e.target.closest('.prev-page-btn');
      const nextBtn = e.target.closest('.next-page-btn');
      
      if (pageBtn) {
        e.preventDefault();
        currentPage = parseInt(pageBtn.getAttribute('data-page'));
        applyClubeFiltering();
        const grid = container.querySelector('.catalog-grid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (prevBtn) {
        e.preventDefault();
        currentPage--;
        applyClubeFiltering();
        const grid = container.querySelector('.catalog-grid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (nextBtn) {
        e.preventDefault();
        currentPage++;
        applyClubeFiltering();
        const grid = container.querySelector('.catalog-grid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function submitFilterForm(form) {
    const params = new URLSearchParams(new FormData(form));
    const cleanParams = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      if (value.trim().length > 0) {
        cleanParams.append(key, value);
      }
    }
    
    // Preserve dynamic 'clubes' query parameter across standard page reloads
    const currentUrl = new URL(window.location.href);
    const clubes = currentUrl.searchParams.get('clubes');
    if (clubes) {
      cleanParams.append('clubes', clubes);
    }
    const opcoes = currentUrl.searchParams.get('opcoes');
    if (opcoes) {
      cleanParams.append('opcoes', opcoes);
    }
    const epocas = currentUrl.searchParams.get('epocas');
    if (epocas) {
      cleanParams.append('epocas', epocas);
    }
    
    window.location.search = cleanParams.toString();
  }
}
