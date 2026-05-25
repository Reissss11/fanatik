/* ==========================================================================
   FANATIKJERSEY THEME JAVASCRIPT
   ========================================================================== */

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
      
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(item => {
        // Success: reload cart stats and open drawer
        reloadCartAndRender();
        openDrawer();
      })
      .catch(error => {
        console.error('AJAX add-to-cart error:', error);
      });
    });
  }
}

// Reload Cart details and redraw HTML in drawer
function reloadCartAndRender() {
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      // 1. Update general badges
      const badge = document.getElementById('CartBadge');
      const drawerCount = document.getElementById('CartDrawerCount');
      
      if (badge) {
        badge.innerText = cart.item_count;
        if (cart.item_count > 0) {
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
      
      if (drawerCount) drawerCount.innerText = cart.item_count;

      // 2. Redraw Cart Drawer Items list
      const itemsContainer = document.getElementById('CartDrawerItems');
      const footer = document.getElementById('CartDrawerFooter');
      
      if (cart.item_count === 0) {
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
            propsHtml += `<p class="item-customization">Personalização: ${customName || ''} ${customNumber || ''} (+3.00€)</p>`;
          }

          let patchesHtml = '';
          if (item.properties) {
            let patchesShown = false;
            Object.keys(item.properties).forEach(key => {
              if (key.includes('Patch -') && item.properties[key] === 'Sim') {
                if (!patchesShown) {
                  patchesHtml += '<div class="item-patches-list">';
                  patchesShown = true;
                }
                patchesHtml += `<span class="item-patch">${key.replace('Patch -', '')} (+2.00€)</span>`;
              }
            });
            if (patchesShown) patchesHtml += '</div>';
          }

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
                  <span class="item-price">${formatShopCurrency(item.final_line_price)}</span>
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
        
        if (cart.item_count >= 3) {
          if (discountMsg) discountMsg.style.display = 'block';
        } else {
          if (discountMsg) discountMsg.style.display = 'none';
        }
        
        if (footer) footer.style.display = 'block';
      }
    });
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

  // Variant Size drop sync with dynamic price changing
  const sizeSelect = document.getElementById('SizeSelect');
  const variantInput = document.getElementById('ProductVariantId');
  const priceDisplay = document.getElementById('ProductPrice');
  const comparePriceDisplay = document.getElementById('ComparePrice');

  if (sizeSelect && variantInput) {
    sizeSelect.addEventListener('change', () => {
      const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
      const variantId = selectedOption.getAttribute('data-variant-id');
      const basePrice = parseFloat(selectedOption.getAttribute('data-price'));
      
      variantInput.value = variantId;
      
      if (priceDisplay) {
        priceDisplay.setAttribute('data-base-price', basePrice);
        calculateProductPriceSurcharge(); // recalculate price label with customizations
      }
      
      if (comparePriceDisplay) {
        const comparePrice = selectedOption.getAttribute('data-compare-price');
        if (comparePrice) {
          comparePriceDisplay.innerText = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(parseFloat(comparePrice));
          comparePriceDisplay.style.display = 'inline';
        } else {
          comparePriceDisplay.style.display = 'none';
        }
      }
    });
  }

  // Monitor Customizations changes to dynamic calculate surcharges addition cost
  const customName = document.getElementById('CustomNameInput');
  const customNumber = document.getElementById('CustomNumberInput');
  const patches = container.querySelectorAll('.patch-checkbox-input');

  if (customName) customName.addEventListener('input', calculateProductPriceSurcharge);
  if (customNumber) customNumber.addEventListener('input', calculateProductPriceSurcharge);
  
  patches.forEach(checkbox => {
    checkbox.addEventListener('change', calculateProductPriceSurcharge);
  });

  // Calculate price adding customization fees
  function calculateProductPriceSurcharge() {
    if (!priceDisplay) return;
    
    const basePrice = parseFloat(priceDisplay.getAttribute('data-base-price')) || 0;
    let surcharge = 0;
    
    // Name or Number input yields a fixed +3.00€ personalization surcharge
    const nameVal = customName ? customName.value.trim() : '';
    const numVal = customNumber ? customNumber.value.trim() : '';
    if (nameVal.length > 0 || numVal.length > 0) {
      surcharge += 3.00;
    }

    // Each active checked patch is +2.00€
    patches.forEach(checkbox => {
      if (checkbox.checked) {
        surcharge += 2.00;
      }
    });

    // Update Price Display on Page
    const finalPrice = basePrice + surcharge;
    priceDisplay.innerText = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(finalPrice);

    // Update Add-to-Cart Button surcharge addition text
    const surchargeSpan = document.getElementById('SurchargeText');
    if (surchargeSpan) {
      if (surcharge > 0) {
        surchargeSpan.innerText = `(+${surcharge.toFixed(2)}€)`;
        surchargeSpan.style.display = 'inline';
      } else {
        surchargeSpan.innerText = '';
        surchargeSpan.style.display = 'none';
      }
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

  // Accordion triggers
  accordions.forEach(drop => {
    const trigger = drop.querySelector('.dropdown-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        // Toggle active
        drop.classList.toggle('open');
      });
    }
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

  // Sidebar dynamic form submit on filter change
  const filterForm = document.getElementById('CollectionFiltersForm');
  if (filterForm) {
    // Submit form automatically on filter checkbox toggles
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

  // Catalog item limits pagination select box
  const limitSelect = document.getElementById('CatalogLimitSelector');
  if (limitSelect) {
    limitSelect.addEventListener('change', () => {
      const val = limitSelect.value;
      
      // Save select limit in cart attributes and reload to refresh pagination
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: { pagination_limit: val } })
      })
      .then(() => {
        // Reload page to reflect new paginate limit
        window.location.reload();
      });
    });
  }

  function submitFilterForm(form) {
    const params = new URLSearchParams(new FormData(form));
    // Clean up empty params
    const cleanParams = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      if (value.trim().length > 0) {
        cleanParams.append(key, value);
      }
    }
    
    // Redirect browser to URL with updated filter queries
    window.location.search = cleanParams.toString();
  }
}
