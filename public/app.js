// ===== 사용자 스펙 정의 및 로드 =====
const USER_SPEC_STORAGE_KEY = 'fiton-user-spec';
let userSpec = loadUserSpec();

function loadUserSpec() {
  try {
    const raw = localStorage.getItem(USER_SPEC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          gender: parsed.gender || '',
          age: parsed.age || '',
          height: parsed.height || '',
          weight: parsed.weight || '',
          topSize: parsed.topSize || '',
          bottomSize: parsed.bottomSize || ''
        };
      }
    }
  } catch (e) {}
  return { gender: '', age: '', height: '', weight: '', topSize: '', bottomSize: '' };
}

function saveUserSpec() {
  localStorage.setItem(USER_SPEC_STORAGE_KEY, JSON.stringify(userSpec));
}

const USER_SPEC_ENABLED_KEY = 'fiton-spec-enabled';
let isSpecEnabled = loadSpecEnabled();

const THEME_MODE_KEY = 'fiton-theme-mode';
let isDarkMode = loadThemeMode();

function loadSpecEnabled() {
  try {
    const raw = localStorage.getItem(USER_SPEC_ENABLED_KEY);
    if (raw !== null) {
      return raw === 'true';
    }
  } catch (e) {}

  return true;
}

function saveSpecEnabled() {
  localStorage.setItem(USER_SPEC_ENABLED_KEY, String(isSpecEnabled));
}

function loadThemeMode() {
  try {
    const raw = localStorage.getItem(THEME_MODE_KEY);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch (e) {}
  return false;
}

function saveThemeMode() {
  localStorage.setItem(THEME_MODE_KEY, isDarkMode ? 'dark' : 'light');
}

function applyThemeMode() {
  document.body.classList.toggle('dark-mode', isDarkMode);
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.textContent = isDarkMode ? '라이트모드' : '다크모드';
  }
}

function toggleThemeMode() {
  isDarkMode = !isDarkMode;
  saveThemeMode();
  applyThemeMode();
}

// ===== 상황별 키워드 매핑 =====
const SITUATION_MAP = {
  '개강룩':       { query: '개강룩 코디 셔츠 블라우스 슬랙스 로퍼 백팩', comment: '🎓 새 학기 첫인상은 이걸로 완성', keywords: ['셔츠', '블라우스', '슬랙스', '로퍼', '백팩'] },
  'MT/수련회':    { query: 'MT 수련회 코디 후드티 조거팬츠 운동화 크로스백', comment: '🎒 편안하고 활동적인 MT/수련회 룩', keywords: ['후드티', '조거팬츠', '운동화', '크로스백'] },
  '체육대회':     { query: '체육대회 트레이닝 세트 반팔 반바지 운동화 스니커즈', comment: '🏃 운동도 스타일도 모두 잡는 체육대회 룩', keywords: ['트레이닝 세트', '반팔', '반바지', '운동화', '스니커즈'] },
  '졸업식':       { query: '졸업식 하객룩 세미포멀 울 자켓 원피스 힐', comment: '🎓 단정하고 품격 있는 졸업식 룩', keywords: ['원피스', '자켓', '힐', '블라우스', '클러치'] },
  '데이트룩':     { query: '데이트룩 니트 스커트 힐 미니백 액세서리', comment: '💕 로맨틱하고 센스 있는 데이트룩', keywords: ['니트', '스커트', '힐', '미니백', '액세서리'] },
  '소개팅':       { query: '소개팅룩 단정한 코디 셔츠 블라우스 니트 스커트', comment: '💌 첫인상에 딱 맞는 소개팅룩', keywords: ['셔츠', '블라우스', '니트', '스커트', '플랫'] },
  '친구 만남':    { query: '친구 만남 데일리 코디 후드티 청바지 스니커즈 백팩', comment: '👯 편안하면서도 꾸민 듯 안 꾸민 듯한 친구 만남 룩', keywords: ['후드티', '청바지', '스니커즈', '백팩', '모자'] },
  '결혼식 하객':  { query: '결혼식 하객룩 원피스 세미포멀 하이힐 클러치', comment: '👗 고급스럽고 세련된 하객룩', keywords: ['원피스', '하이힐', '클러치', '자켓', '귀걸이'] },
  '페스티벌':     { query: '페스티벌 코디 크롭티 와이드팬츠 버킷햇 선글라스', comment: '🎵 인스타 감성 폭발하는 페스티벌 룩', keywords: ['크롭티', '와이드팬츠', '버킷햇', '선글라스', '힙색'] },
  '콘서트':       { query: '콘서트 코디 스트릿 블랙 데님 스니커즈 스냅백', comment: '🎤 무대처럼 멋진 콘서트 룩', keywords: ['데님', '스니커즈', '스냅백', '레더자켓', '체인'] },
  '놀이공원':     { query: '놀이공원 코디 캐주얼 편안한 스니커즈 크로스백', comment: '🎡 오래 걸어도 편한 놀이공원 룩', keywords: ['스니커즈', '크로스백', '후드티', '조거팬츠', '양말'] },
  '한강 피크닉':  { query: '한강 피크닉 봄 가을 캐주얼 니트 스커트 샌들', comment: '🌸 감성 가득 한강 나들이 코디', keywords: ['니트', '스커트', '샌들', '플랫폼', '미니백'] },
};

const STYLE_MAP = {
  '베이직': { query: '베이직 심플 깔끔한', label: '베이직' },
  '스포티': { query: '스포티 활동적인', label: '스포티' },
  '러블리': { query: '러블리 부드러운', label: '러블리' },
  '스트릿': { query: '스트릿 트렌디한', label: '스트릿' },
  '포멀': { query: '포멀 단정한', label: '포멀' },
};

const PRICE_FILTER_MAP = {
  all: { label: '전체', min: 0, max: Infinity },
  under20000: { label: '2만원 이하', min: 0, max: 20000 },
  between20000_50000: { label: '2만~5만원', min: 20000, max: 50000 },
  between50000_100000: { label: '5만~10만원', min: 50000, max: 100000 },
  over100000: { label: '10만원 이상', min: 100000, max: Infinity },
};

const CATEGORY_LABELS = {
  dress: '원피스/셋업',
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
  misc: '기타',
};

const OWNED_CLOTHES_STORAGE_KEY = 'fiton-owned-clothes';

let currentSituation = '개강룩';
let currentSort = 'sim';
let currentPage = 1;
let currentQuery = '';
let currentStyle = '베이직';
let currentBudget = 0;
let currentPriceFilter = 'all';
let currentProductCategory = 'all';
const ITEMS_PER_PAGE = 12;
const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/300x300?text=No+Image';
const CART_STORAGE_KEY = 'fiton-cart-items';
const DEFAULT_CART_ITEMS = [
  {
    id: 'cart-sample-1',
    brand: 'ADER error',
    title: '아더에러 오버핏 로고 티셔츠',
    options: '사이즈 M · 컬러 블랙',
    quantity: 1,
    price: 18600,
    image: 'https://via.placeholder.com/300?text=ADER+error',
    link: 'https://order.pay.naver.com/home?frm=desktop',
    selected: true
  },
  {
    id: 'cart-sample-2',
    brand: 'WOOYOUNGMI',
    title: '우영미 시그니처 스트릿 팬츠',
    options: '사이즈 30 · 컬러 차콜',
    quantity: 1,
    price: 43200,
    image: 'https://via.placeholder.com/300?text=WOOYOUNGMI',
    link: 'https://order.pay.naver.com/home?frm=desktop',
    selected: true
  }
];
let latestRequestId = 0;
let isAppending = false;
let currentRecommendedItems = [];
let cartItems = loadCartItems();
let ownedClothes = loadOwnedClothes();

const CATEGORY_KEYWORDS = {
  dress: ['원피스', '드레스', '점프수트', '셋업'],
  outer: ['자켓', '점퍼', '아우터', '집업', '코트', '가디건', '블레이저'],
  top: ['티셔츠', '티 ', '니트', '셔츠', '맨투맨', '후드', '블라우스', '반팔', '긴팔'],
  bottom: ['바지', '팬츠', '슬랙스', '청바지', '데님', '반바지', '스커트', '치마', '조거'],
  shoes: ['운동화', '신발', '스니커즈', '샌들', '부츠', '로퍼', '구두'],
  bag: ['가방', '백팩', '크로스백', '숄더백', '토트백', '힙색'],
  accessory: ['모자', '캡', '양말', '벨트', '목걸이', '팔찌', '머플러', '선글라스', '클러치'],
};

const POPULAR_KEYWORDS_MAP = {
  '개강룩': ['셔츠', '블라우스', '슬랙스', '로퍼', '백팩'],
  'MT/수련회': ['후드티', '조거팬츠', '운동화', '크로스백', '반바지'],
  '체육대회': ['트레이닝 세트', '반팔', '반바지', '운동화', '스니커즈'],
  '졸업식': ['원피스', '자켓', '힐', '클러치', '블라우스'],
  '데이트룩': ['니트', '스커트', '힐', '미니백', '액세서리'],
  '소개팅': ['셔츠', '블라우스', '니트', '스커트', '플랫'],
  '친구 만남': ['후드티', '청바지', '스니커즈', '백팩', '모자'],
  '결혼식 하객': ['원피스', '하이힐', '클러치', '자켓', '귀걸이'],
  '페스티벌': ['크롭티', '와이드팬츠', '버킷햇', '선글라스', '힙색'],
  '콘서트': ['데님', '스니커즈', '스냅백', '레더자켓', '체인'],
  '놀이공원': ['스니커즈', '크로스백', '후드티', '조거팬츠', '양말'],
  '한강 피크닉': ['니트', '스커트', '샌들', '플랫폼', '미니백'],
};

// ===== 초기 로드 =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAISearch();
  });
  document.getElementById('budgetInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') applyPlannerFilters();
  });
  document.getElementById('ownedName').addEventListener('keydown', e => {
    if (e.key === 'Enter') addOwnedClothing();
  });
  document.getElementById('ownedNote').addEventListener('keydown', e => {
    if (e.key === 'Enter') addOwnedClothing();
  });
  
  // 모달 영역 바깥 클릭 시 닫기
  document.getElementById('specModal').addEventListener('click', (e) => {
    if (e.target.id === 'specModal') {
      closeSpecModal();
    }
  });

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleThemeMode);
  }

  applyThemeMode();
  renderOwnedClothes();
  renderUserSpecSummary();
  renderCart();
  updateRecommendationSummary();
  renderKeywords();
  fetchProducts(currentSituation);
});

function showHomePage() {
  document.getElementById('cartPage').hidden = true;
  document.querySelector('section.hero').hidden = false;
  document.querySelector('main.main').hidden = false;
  document.getElementById('aiBanner').hidden = false;
  document.getElementById('homeNav').classList.add('active');
  document.getElementById('cartNav').classList.remove('active');
}

function showCartPage() {
  document.getElementById('cartPage').hidden = false;
  document.querySelector('section.hero').hidden = true;
  document.querySelector('main.main').hidden = true;
  document.getElementById('aiBanner').hidden = true;
  document.getElementById('homeNav').classList.remove('active');
  document.getElementById('cartNav').classList.add('active');
  renderCart();
}

function loadCartItems() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({ ...item, selected: item.selected !== false }));
      }
    }
  } catch (e) {
    console.warn('카트 로드 실패', e);
  }
  return DEFAULT_CART_ITEMS.slice();
}

function saveCartItems() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

function renderCart() {
  const cartContainer = document.getElementById('cartItems');
  const countLabel = document.getElementById('cartItemCount');
  const selectAllCheckbox = document.getElementById('cartSelectAll');
  cartContainer.innerHTML = '';

  if (!cartItems || cartItems.length === 0) {
    cartContainer.innerHTML = '<p class="cart-empty">장바구니에 담긴 상품이 없습니다. 스타일 페이지에서 상품을 추가해 보세요.</p>';
    countLabel.textContent = '0';
    selectAllCheckbox.checked = false;
    updateCartSummary();
    return;
  }

  cartItems.forEach(item => cartContainer.appendChild(createCartItemRow(item)));
  countLabel.textContent = cartItems.length;
  selectAllCheckbox.checked = cartItems.every(item => item.selected);
  updateCartSummary();
}

function createCartItemRow(item) {
  const row = document.createElement('div');
  row.className = 'cart-item-row';

  const checkboxWrap = document.createElement('label');
  checkboxWrap.className = 'cart-checkbox';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.selected;
  checkbox.addEventListener('change', () => toggleCartItemSelection(item.id, checkbox.checked));
  checkboxWrap.appendChild(checkbox);

  const meta = document.createElement('div');
  meta.className = 'cart-item-meta';
  meta.addEventListener('click', () => openCartItem(item.link));

  const thumb = document.createElement('div');
  thumb.className = 'cart-item-thumb';
  const img = document.createElement('img');
  const cartImageUrl = sanitizeUrl(item.image, '');
  img.src = cartImageUrl ? `/api/image-proxy?url=${encodeURIComponent(cartImageUrl)}` : FALLBACK_IMAGE_URL;
  img.alt = item.title;
  img.loading = 'lazy';
  img.style.opacity = '0';
  img.addEventListener('load', () => { img.style.opacity = '1'; }, { once: true });
  img.addEventListener('error', () => { img.src = FALLBACK_IMAGE_URL; img.style.opacity = '1'; }, { once: true });
  thumb.appendChild(img);

  const info = document.createElement('div');
  info.className = 'cart-item-info';
  const brand = document.createElement('p');
  brand.className = 'cart-item-brand';
  brand.textContent = item.brand;
  const title = document.createElement('p');
  title.className = 'cart-item-name';
  title.textContent = item.title;
  const options = document.createElement('p');
  options.className = 'cart-item-options';
  options.textContent = item.options;

  const quantity = document.createElement('div');
  quantity.className = 'cart-quantity';
  const decrement = document.createElement('button');
  decrement.type = 'button';
  decrement.className = 'cart-qty-btn';
  decrement.textContent = '-';
  decrement.addEventListener('click', (event) => updateCartQuantity(event, item.id, -1));
  const quantityValue = document.createElement('span');
  quantityValue.className = 'quantity-value';
  quantityValue.textContent = item.quantity;
  const increment = document.createElement('button');
  increment.type = 'button';
  increment.className = 'cart-qty-btn';
  increment.textContent = '+';
  increment.addEventListener('click', (event) => updateCartQuantity(event, item.id, 1));
  quantity.appendChild(decrement);
  quantity.appendChild(quantityValue);
  quantity.appendChild(increment);

  info.appendChild(brand);
  info.appendChild(title);
  info.appendChild(options);
  info.appendChild(quantity);

  meta.appendChild(thumb);
  meta.appendChild(info);

  const actions = document.createElement('div');
  actions.className = 'cart-item-actions';
  const price = document.createElement('p');
  price.className = 'cart-item-price';
  price.textContent = `${item.price.toLocaleString()}원`;
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'cart-delete-btn';
  removeBtn.textContent = '삭제';
  removeBtn.addEventListener('click', (event) => removeCartItem(event, item.id));

  actions.appendChild(price);
  actions.appendChild(removeBtn);

  row.appendChild(checkboxWrap);
  row.appendChild(meta);
  row.appendChild(actions);

  return row;
}

function toggleCartItemSelection(itemId, checked) {
  const item = cartItems.find(cart => cart.id === itemId);
  if (!item) return;
  item.selected = checked;
  saveCartItems();
  renderCart();
}

function toggleSelectAll(checked) {
  cartItems = cartItems.map(item => ({ ...item, selected: checked }));
  saveCartItems();
  renderCart();
}

function updateCartQuantity(event, itemId, delta) {
  event.stopPropagation();
  const item = cartItems.find(cart => cart.id === itemId);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  saveCartItems();
  renderCart();
}

function removeCartItem(event, itemId) {
  event.stopPropagation();
  cartItems = cartItems.filter(item => item.id !== itemId);
  saveCartItems();
  renderCart();
}

function openCartItem(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener');
}

function updateCartSummary() {
  const subtotalEl = document.getElementById('summarySubtotal');
  const shippingEl = document.getElementById('summaryShipping');
  const totalEl = document.getElementById('summaryTotal');
  const selectedItems = cartItems.filter(item => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 30000 || subtotal === 0 ? 0 : 3000;
  const total = subtotal + shipping;
  subtotalEl.textContent = `${subtotal.toLocaleString()}원`;
  shippingEl.textContent = shipping === 0 ? '무료' : `${shipping.toLocaleString()}원`;
  totalEl.textContent = `${total.toLocaleString()}원`;
}

function handleOrder() {
  const selectedItems = cartItems.filter(item => item.selected);
  if (selectedItems.length === 0) {
    alert('주문하려면 최소 하나의 상품을 선택해주세요.');
    return;
  }
  const paymentUrl = selectedItems[0].link || 'https://order.pay.naver.com/home?frm=desktop';
  window.open(paymentUrl, '_blank', 'noopener');
}

function getCartItemFromProduct(item) {
  const title = sanitizeText(item.title, '상품명 없음').replace(/<[^>]+>/g, '');
  return {
    id: item.link || title,
    brand: sanitizeText(item.mallName || item.brand, '브랜드'),
    title,
    options: '사이즈 M · 컬러 블랙',
    quantity: 1,
    price: parsePrice(item.lprice) || 0,
    image: sanitizeUrl(item.image, FALLBACK_IMAGE_URL),
    link: sanitizeUrl(item.link, 'https://order.pay.naver.com/home?frm=desktop'),
    selected: true
  };
}

function handleAddToCart(event, item) {
  event.preventDefault();
  event.stopPropagation();
  const newItem = getCartItemFromProduct(item);
  const existing = cartItems.find(cart => cart.id === newItem.id);
  if (existing) {
    existing.quantity += 1;
    existing.selected = true;
  } else {
    cartItems.unshift(newItem);
  }
  saveCartItems();
  renderCart();
}

function getPriceFilterLabel() {
  return PRICE_FILTER_MAP[currentPriceFilter]?.label || '전체';
}
function selectSituation(name, el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentSituation = name;
  currentPage = 1;
  currentQuery = '';
  currentProductCategory = 'all';
  document.querySelectorAll('#productFilterTabs .filter-tab').forEach(c => c.classList.remove('active'));
  document.querySelector('#productFilterTabs .filter-tab[data-category="all"]').classList.add('active');

  const s = SITUATION_MAP[name];
  document.getElementById('resultTitle').textContent = name + ' 인기 코디';
  document.getElementById('searchInput').value = '';
  updateAIComment();
  updateRecommendationSummary();
  renderKeywords();
  fetchProducts(name);
}

function selectStyle(name, el) {
  document.querySelectorAll('#styleChips .planner-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentStyle = name;
  updateAIComment();
  updateRecommendationSummary();
  currentPage = 1;
  const query = currentQuery || SITUATION_MAP[currentSituation]?.query || currentSituation;
  fetchProductsByQuery(query);
}

function setBudgetPreset(value) {
  document.getElementById('budgetInput').value = value > 0 ? String(value) : '';
  currentBudget = value;
  updateAIComment();
  updateRecommendationSummary();
}

function selectPriceFilter(filterKey, el) {
  document.querySelectorAll('#priceFilterChips .planner-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentPriceFilter = filterKey;
  updateAIComment();
  updateRecommendationSummary();
}

function selectProductCategory(category, el) {
  document.querySelectorAll('#productFilterTabs .filter-tab').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentProductCategory = category;
  renderProducts(currentRecommendedItems);
  updateRecommendationSummary(`${getFilteredProducts(currentRecommendedItems).length}개 추천`);
}

function getFilteredProducts(items) {
  if (!items || currentProductCategory === 'all') {
    return items || [];
  }

  return (items || []).filter(item => getItemCategory(sanitizeText(item.title || item.title || item.description || '')) === currentProductCategory);
}

function renderKeywords() {
  const tagContainer = document.getElementById('keywordTags');
  tagContainer.innerHTML = '';
  const keywords = POPULAR_KEYWORDS_MAP[currentSituation] || [];
  if (keywords.length === 0) {
    keywords.push(...(SITUATION_MAP[currentSituation]?.query.split(' ').slice(0, 5) || []));
  }

  keywords.slice(0, 6).forEach((keyword) => {
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = 'keyword-tag';
    tag.textContent = `#${keyword}`;
    tag.addEventListener('click', () => {
      document.getElementById('searchInput').value = `${currentSituation} ${keyword}`;
      handleAISearch();
    });
    tagContainer.appendChild(tag);
  });
}

function applyPlannerFilters() {
  currentBudget = parseBudgetInput();
  currentPage = 1;
  updateAIComment();
  updateRecommendationSummary();

  const query = currentQuery || SITUATION_MAP[currentSituation]?.query || currentSituation;
  fetchProductsByQuery(query);
}

// ===== AI 자연어 검색 =====
function handleAISearch() {
  const val = document.getElementById('searchInput').value.trim();
  if (!val) return;

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.getElementById('resultTitle').textContent = `"${val}" 검색 결과`;
  currentPage = 1;
  currentQuery = val;
  currentBudget = parseBudgetInput();
  updateAIComment();
  updateRecommendationSummary();
  fetchProductsByQuery(val);
}

// ===== 정렬 =====
function sortResults(val) {
  currentSort = val;
  currentPage = 1;
  const query = currentQuery || SITUATION_MAP[currentSituation]?.query || currentSituation;
  fetchProductsByQuery(query, true);
}

// ===== 더보기 =====
function loadMore() {
  if (isAppending) {
    return;
  }

  currentPage++;
  const query = currentQuery || SITUATION_MAP[currentSituation]?.query || currentSituation;
  fetchProductsByQuery(query, false, true);
}

// ===== 상황으로 검색 =====
function fetchProducts(situation) {
  const s = SITUATION_MAP[situation];
  currentQuery = '';
  currentBudget = parseBudgetInput();
  updateAIComment();
  updateRecommendationSummary();
  fetchProductsByQuery(s ? s.query : situation);
}

function parseBudgetInput() {
  const raw = document.getElementById('budgetInput').value.trim();
  const budget = Number.parseInt(raw, 10);

  if (!Number.isFinite(budget) || budget <= 0) {
    return 0;
  }

  return budget;
}

// ===== 사용자 스펙 요약 및 모달 관리 함수 =====
function renderUserSpecSummary() {
  const summaryBar = document.getElementById('userSpecSummaryBar');
  const summaryText = document.getElementById('userSpecSummaryText');
  const specToggleBtn = document.getElementById('specToggleBtn');
  const specSwitch = document.getElementById('specEnabledSwitch');
  const specStateLabel = document.getElementById('specEnabledState');
  
  if (!summaryBar || !summaryText) return;

  const hasSpec = userSpec.gender && userSpec.age && userSpec.height && userSpec.weight;
  const statusText = isSpecEnabled ? '스펙 적용 ON' : '전체 사이즈 보기';
  const statusMode = isSpecEnabled ? '스펙 적용 중' : '전체 사이즈 보기';

  if (hasSpec) {
    summaryBar.classList.add('has-spec');
    const genderKr = userSpec.gender === 'male' ? '남성' : '여성';
    const ageKr = userSpec.age + '대';
    const heightKr = userSpec.height + 'cm';
    const weightKr = userSpec.weight + 'kg';
    const topKr = '상의 ' + userSpec.topSize;
    const bottomKr = '하의 ' + userSpec.bottomSize;
    
    summaryText.textContent = `내 맞춤 정보: ${genderKr} · ${ageKr} · ${heightKr} / ${weightKr} · ${topKr} · ${bottomKr}`;
  } else {
    summaryBar.classList.remove('has-spec');
    summaryText.textContent = '내 스펙을 등록하고 맞춤 추천을 받아보세요.';
  }

  if (specToggleBtn) {
    specToggleBtn.textContent = statusText;
    specToggleBtn.classList.toggle('spec-toggle-on', isSpecEnabled);
    specToggleBtn.classList.toggle('spec-toggle-off', !isSpecEnabled);
  }

  if (specSwitch) {
    specSwitch.checked = isSpecEnabled;
  }

  if (specStateLabel) {
    specStateLabel.textContent = statusMode;
  }
}

function openSpecModal(event) {
  if (event && event.target.closest('.spec-toggle-btn')) {
    return;
  }

  const modal = document.getElementById('specModal');
  if (!modal) return;
  
  // 기존 입력 정보 폼에 채우기
  if (userSpec.gender) {
    const radio = document.querySelector(`input[name="gender"][value="${userSpec.gender}"]`);
    if (radio) radio.checked = true;
  }
  document.getElementById('specAge').value = userSpec.age || '';
  document.getElementById('specHeight').value = userSpec.height || '';
  document.getElementById('specWeight').value = userSpec.weight || '';
  document.getElementById('specTopSize').value = userSpec.topSize || '';
  document.getElementById('specBottomSize').value = userSpec.bottomSize || '';

  const specSwitch = document.getElementById('specEnabledSwitch');
  const specStateLabel = document.getElementById('specEnabledState');
  if (specSwitch) specSwitch.checked = isSpecEnabled;
  if (specStateLabel) specStateLabel.textContent = isSpecEnabled ? 'ON' : 'OFF';
  
  modal.style.display = 'flex';
}

function closeSpecModal() {
  const modal = document.getElementById('specModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function handleSpecSubmit(event) {
  event.preventDefault();
  
  const genderVal = document.querySelector('input[name="gender"]:checked')?.value || '';
  const ageVal = document.getElementById('specAge').value;
  const heightVal = document.getElementById('specHeight').value;
  const weightVal = document.getElementById('specWeight').value;
  const topSizeVal = document.getElementById('specTopSize').value;
  const bottomSizeVal = document.getElementById('specBottomSize').value;
  const enabledSwitch = document.getElementById('specEnabledSwitch');

  userSpec = {
    gender: genderVal,
    age: ageVal,
    height: heightVal,
    weight: weightVal,
    topSize: topSizeVal,
    bottomSize: bottomSizeVal
  };
  
  if (enabledSwitch) {
    isSpecEnabled = enabledSwitch.checked;
    saveSpecEnabled();
  }

  saveUserSpec();
  renderUserSpecSummary();
  closeSpecModal();
  
  // 스펙이 저장되면 현재 검색 결과를 개인화 스펙을 적용하여 새로고침
  currentPage = 1;
  const query = currentQuery || SITUATION_MAP[currentSituation]?.query || currentSituation;
  fetchProductsByQuery(query);
}

function handleSpecAllView() {
  const genderVal = document.querySelector('input[name="gender"]:checked')?.value || '';
  const ageVal = document.getElementById('specAge').value;
  const heightVal = document.getElementById('specHeight').value;
  const weightVal = document.getElementById('specWeight').value;
  const topSizeVal = document.getElementById('specTopSize').value;
  const bottomSizeVal = document.getElementById('specBottomSize').value;

  userSpec = {
    gender: genderVal,
    age: ageVal,
    height: heightVal,
    weight: weightVal,
    topSize: topSizeVal,
    bottomSize: bottomSizeVal
  };
  
  saveUserSpec();
  isSpecEnabled = false;
  saveSpecEnabled();
  renderUserSpecSummary();
  closeSpecModal();
  
  currentPage = 1;
  const query = currentQuery || SITUATION_MAP[currentSituation]?.query || currentSituation;
  fetchProductsByQuery(query);
}

function toggleSpecEnabled(event) {
  if (event && event.target && event.target.type === 'checkbox') {
    isSpecEnabled = event.target.checked;
  } else {
    isSpecEnabled = !isSpecEnabled;
    const switchEl = document.getElementById('specEnabledSwitch');
    if (switchEl) switchEl.checked = isSpecEnabled;
  }

  saveSpecEnabled();
  renderUserSpecSummary();
  updateAIComment();

  const query = currentQuery || SITUATION_MAP[currentSituation]?.query || currentSituation;
  fetchProductsByQuery(query);
}

function buildSearchQuery(query) {
  const styleQuery = STYLE_MAP[currentStyle]?.query || '';
  const baseQuery = sanitizeText(query, currentSituation);
  
  let genderQuery = '';
  let specSizeQuery = '';
  if (isSpecEnabled && userSpec) {
    if (userSpec.gender) {
      genderQuery = userSpec.gender === 'male' ? '남자' : '여자';
    }
    if (userSpec.topSize) {
      specSizeQuery += `상의 ${userSpec.topSize}`;
    }
    if (userSpec.bottomSize) {
      if (specSizeQuery) specSizeQuery += ' ';
      specSizeQuery += `하의 ${userSpec.bottomSize}`;
    }
  }

  return [genderQuery, baseQuery, styleQuery, specSizeQuery].filter(Boolean).join(' ');
}

function getBudgetLabel() {
  return currentBudget > 0 ? `${currentBudget.toLocaleString()}원 이하` : '제한 없음';
}

function getPriceFilterLabel() {
  return PRICE_FILTER_MAP[currentPriceFilter]?.label || '전체';
}

function updateAIComment() {
  const baseComment = currentQuery
    ? `"${currentQuery}"에 맞는 ${currentStyle} 스타일을 찾고 있어요`
    : SITUATION_MAP[currentSituation].comment;
  const budgetComment = currentBudget > 0
    ? ` 예산은 ${currentBudget.toLocaleString()}원 이하로 맞출게요.`
    : ' 예산 제한 없이 넓게 찾아볼게요.';
  const priceFilterComment = currentPriceFilter !== 'all'
    ? ` 상품 가격대는 ${getPriceFilterLabel()}로 좁혀서 볼게요.`
    : '';
  const specComment = userSpec.gender
    ? isSpecEnabled
      ? ' 내 스펙 기준으로 추천 중입니다.'
      : ' 전체 사이즈로 넓게 보여드릴게요.'
    : '';

  document.getElementById('aiComment').textContent = `${baseComment}${budgetComment}${priceFilterComment}${specComment}`;
}

function updateRecommendationSummary(countText = '') {
  const summary = [
    `상황 ${currentSituation}`,
    `스타일 ${currentStyle}`,
    `예산 ${getBudgetLabel()}`,
    `가격대 ${getPriceFilterLabel()}`,
    isSpecEnabled ? '스펙 적용 중' : '전체 사이즈 보기'
  ];

  if (countText) {
    summary.push(countText);
  }

  document.getElementById('recommendationSummary').textContent = summary.join(' · ');
}

function updateVisibleRecommendationCount() {
  const visibleCount = document.querySelectorAll('#productGrid .product-card').length;
  updateRecommendationSummary(`${visibleCount}개 추천`);
}

function getFallbackProducts(situation, minCount = ITEMS_PER_PAGE) {
  const keywords = POPULAR_KEYWORDS_MAP[situation] || [];
  const products = [];
  const brandNames = ['STAY', 'NOVA', 'MUSE', 'LEO', 'CHIC', 'ORION', 'LUNA'];
  for (let i = 0; products.length < minCount; i += 1) {
    const keyword = keywords[i % keywords.length] || '캐주얼';
    const brand = brandNames[i % brandNames.length];
    const title = `${keyword} ${situation} 스타일 ${i + 1}`;
    const category = getItemCategory(keyword);
    const price = 12000 + (i % 5) * 8000;
    products.push({
      title,
      lprice: String(price),
      hprice: String(price + 8000),
      mallName: brand,
      image: `https://via.placeholder.com/400x400?text=${encodeURIComponent(keyword)}`,
      link: '#',
      _fallback: true,
      category,
    });
  }
  return products;
}

function loadOwnedClothes() {
  try {
    const raw = localStorage.getItem(OWNED_CLOTHES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(item => item && typeof item.name === 'string' && typeof item.category === 'string');
  } catch (e) {
    return [];
  }
}

function saveOwnedClothes() {
  localStorage.setItem(OWNED_CLOTHES_STORAGE_KEY, JSON.stringify(ownedClothes));
}

function renderOwnedClothes() {
  const wardrobeList = document.getElementById('wardrobeList');
  wardrobeList.innerHTML = '';

  if (ownedClothes.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'wardrobe-empty';
    empty.textContent = '아직 등록한 옷이 없어요. 자주 입는 옷부터 추가해보세요.';
    wardrobeList.appendChild(empty);
    return;
  }

  ownedClothes.forEach(item => {
    const row = document.createElement('div');
    row.className = 'wardrobe-item';

    const main = document.createElement('div');
    main.className = 'wardrobe-item-main';

    const badge = document.createElement('span');
    badge.className = 'wardrobe-item-badge';
    badge.textContent = CATEGORY_LABELS[item.category] || '기타';

    const name = document.createElement('span');
    name.className = 'wardrobe-item-name';
    name.textContent = item.name;

    main.appendChild(badge);
    main.appendChild(name);

    if (item.note) {
      const note = document.createElement('div');
      note.className = 'wardrobe-item-note';
      note.textContent = item.note;
      main.appendChild(note);
    }

    const removeButton = document.createElement('button');
    removeButton.className = 'wardrobe-remove-btn';
    removeButton.type = 'button';
    removeButton.textContent = '삭제';
    removeButton.addEventListener('click', () => {
      removeOwnedClothing(item.id);
    });

    row.appendChild(main);
    row.appendChild(removeButton);
    wardrobeList.appendChild(row);
  });
}

function addOwnedClothing() {
  const category = document.getElementById('ownedCategory').value;
  const name = document.getElementById('ownedName').value.trim();
  const note = document.getElementById('ownedNote').value.trim();

  if (!name) {
    return;
  }

  ownedClothes.unshift({
    id: `owned-${Date.now()}`,
    category,
    name,
    note,
  });

  saveOwnedClothes();
  renderOwnedClothes();

  document.getElementById('ownedName').value = '';
  document.getElementById('ownedNote').value = '';

  if (currentRecommendedItems.length > 0) {
    renderOutfits(currentRecommendedItems);
  }
}

function removeOwnedClothing(id) {
  ownedClothes = ownedClothes.filter(item => item.id !== id);
  saveOwnedClothes();
  renderOwnedClothes();

  if (currentRecommendedItems.length > 0) {
    renderOutfits(currentRecommendedItems);
  }
}

function getItemCategory(title) {
  const normalizedTitle = sanitizeText(title).toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedTitle.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return 'misc';
}

function normalizeOutfitItems(items) {
  return items.map((item, index) => {
    const cleanTitle = sanitizeText(item.title, '상품명 없음').replace(/<[^>]+>/g, '');
    const currentPrice = parsePrice(item.lprice);
    const originalPrice = parsePrice(item.hprice);
    const discount = getDiscountMetrics(currentPrice, originalPrice);

    return {
      ...item,
      _key: sanitizeText(item.link, '') || `${cleanTitle}-${index}`,
      _title: cleanTitle,
      _price: currentPrice,
      _originalPrice: originalPrice,
      _discountAmount: discount.amount,
      _discountRate: discount.rate,
      _category: getItemCategory(cleanTitle),
    };
  });
}

function normalizeOwnedClothes() {
  return ownedClothes.map(item => ({
    ...item,
    _key: item.id,
    _title: item.name,
    _price: 0,
    _category: item.category,
    _owned: true,
    link: '#',
  }));
}

function compareOutfitCandidates(a, b, remainingBudget) {
  if (a._owned !== b._owned) {
    return a._owned ? -1 : 1;
  }

  if (remainingBudget !== null) {
    const aFitsBudget = a._owned || (a._price !== null && a._price <= remainingBudget);
    const bFitsBudget = b._owned || (b._price !== null && b._price <= remainingBudget);

    if (aFitsBudget !== bFitsBudget) {
      return aFitsBudget ? -1 : 1;
    }
  }

  const aPrice = a._price ?? Number.MAX_SAFE_INTEGER;
  const bPrice = b._price ?? Number.MAX_SAFE_INTEGER;

  if (aPrice !== bPrice) {
    return aPrice - bPrice;
  }

  return 0;
}

function pickOutfitItem(items, selectedKeys, categories, remainingBudget = null) {
  const preferredItems = items.filter(item => !selectedKeys.has(item._key) && categories.includes(item._category));
  const fallbackItems = items.filter(item => !selectedKeys.has(item._key));
  const candidates = preferredItems.length > 0 ? preferredItems : fallbackItems;

  if (candidates.length === 0) {
    return null;
  }

  return candidates.slice().sort((a, b) => compareOutfitCandidates(a, b, remainingBudget))[0];
}

function summarizeOutfitMetrics(items) {
  const totalPrice = items.reduce((sum, item) => sum + (item._price || 0), 0);
  const purchaseCost = items
    .filter(item => !item._owned)
    .reduce((sum, item) => sum + (item._price || 0), 0);
  const ownedCount = items.filter(item => item._owned).length;
  const discountAmount = items
    .filter(item => !item._owned)
    .reduce((sum, item) => sum + (item._discountAmount || 0), 0);
  const discountedItemCount = items
    .filter(item => !item._owned && (item._discountAmount || 0) > 0)
    .length;

  return {
    totalPrice,
    purchaseCost,
    savings: totalPrice - purchaseCost,
    ownedCount,
    discountAmount,
    discountedItemCount,
    budgetFit: currentBudget <= 0 ? true : purchaseCost <= currentBudget,
    budgetRemaining: currentBudget > 0 ? currentBudget - purchaseCost : null,
  };
}

function buildOutfit(items, template, index) {
  const selectedKeys = new Set();
  const selectedItems = [];
  let purchaseCost = 0;

  template.categoryGroups.forEach(group => {
    const remainingBudget = currentBudget > 0 ? Math.max(currentBudget - purchaseCost, 0) : null;
    const item = pickOutfitItem(items, selectedKeys, group, remainingBudget);
    if (!item) {
      return;
    }
    selectedKeys.add(item._key);
    selectedItems.push(item);

    if (!item._owned && item._price) {
      purchaseCost += item._price;
    }
  });

  if (selectedItems.length < 2) {
    return null;
  }

  return {
    id: `outfit-${index + 1}`,
    badge: `LOOK ${index + 1}`,
    title: template.title,
    reason: template.reason(),
    items: selectedItems,
    ...summarizeOutfitMetrics(selectedItems),
  };
}

function generateOutfits(items) {
  const normalizedRecommendedItems = normalizeOutfitItems(items);
  const normalizedOwnedItems = normalizeOwnedClothes();
  const normalizedItems = [...normalizedOwnedItems, ...normalizedRecommendedItems];

  if (normalizedItems.length < 2) {
    return [];
  }

  const templates = [
    {
      title: '메인 코디',
      categoryGroups: [['dress', 'top'], ['bottom', 'shoes'], ['outer', 'bag', 'accessory']],
      reason: () => `상황 ${currentSituation}에 맞춰 ${currentStyle} 무드를 가장 직접적으로 살린 기본 조합`,
    },
    {
      title: '균형 코디',
      categoryGroups: [['top', 'dress'], ['bottom', 'bag', 'shoes'], ['accessory', 'outer']],
      reason: () => currentBudget > 0
        ? `예산 ${getBudgetLabel()} 안에서 맞추기 쉬운 실속형 조합`
        : '활용도와 조합 안정감을 같이 본 실속형 조합',
    },
    {
      title: '포인트 코디',
      categoryGroups: [['outer', 'dress', 'top'], ['top', 'bottom', 'shoes'], ['bag', 'accessory']],
      reason: () => currentPriceFilter !== 'all'
        ? `${getPriceFilterLabel()} 범위 안에서 분위기 포인트를 살리기 좋은 조합`
        : '사진이나 첫인상에서 포인트가 살아나는 조합',
    }
  ];

  const outfits = templates
    .map((template, index) => buildOutfit(normalizedItems, template, index))
    .filter(Boolean);

  if (outfits.length > 0) {
    return outfits.sort((a, b) => {
      if (a.budgetFit !== b.budgetFit) {
        return a.budgetFit ? -1 : 1;
      }

      if (a.purchaseCost !== b.purchaseCost) {
        return a.purchaseCost - b.purchaseCost;
      }

      if (a.ownedCount !== b.ownedCount) {
        return b.ownedCount - a.ownedCount;
      }

      return a.totalPrice - b.totalPrice;
    });
  }

  const fallbackItems = normalizedItems.slice(0, Math.min(3, normalizedItems.length));

  return [{
    id: 'outfit-fallback',
    badge: 'LOOK 1',
    title: '기본 추천 조합',
    reason: '현재 추천 결과에서 바로 같이 보기 좋은 상품을 묶은 조합',
    items: fallbackItems,
    ...summarizeOutfitMetrics(fallbackItems),
  }];
}

function renderOutfits(items) {
  const section = document.getElementById('outfitSection');
  const grid = document.getElementById('outfitGrid');
  const optimizationSummary = document.getElementById('optimizationSummary');
  const outfits = generateOutfits(items);

  grid.innerHTML = '';

  if (outfits.length === 0) {
    section.hidden = true;
    optimizationSummary.textContent = '';
    return;
  }

  section.hidden = false;
  renderOptimizationSummary(outfits[0], optimizationSummary);

  outfits.forEach((outfit, outfitIndex) => {
    const article = document.createElement('article');
    article.className = 'outfit-card';

    const badge = document.createElement('div');
    badge.className = 'outfit-badge';
    badge.textContent = outfitIndex === 0 ? 'BEST VALUE' : outfit.badge;

    const cover = document.createElement('div');
    cover.className = 'outfit-image-wrap';
    const coverImage = document.createElement('img');
    coverImage.className = 'outfit-image';
    const coverSrc = sanitizeUrl(outfit.items[0]?.image, '');
    coverImage.src = coverSrc ? `/api/image-proxy?url=${encodeURIComponent(coverSrc)}` : FALLBACK_IMAGE_URL;
    coverImage.alt = outfit.title;
    coverImage.loading = 'lazy';
    coverImage.style.opacity = '0';
    coverImage.addEventListener('load', () => { coverImage.style.opacity = '1'; }, { once: true });
    coverImage.addEventListener('error', () => { coverImage.src = FALLBACK_IMAGE_URL; coverImage.style.opacity = '1'; }, { once: true });
    cover.appendChild(coverImage);

    const title = document.createElement('h4');
    title.className = 'outfit-title';
    title.textContent = outfit.title;

    const meta = document.createElement('div');
    meta.className = 'outfit-meta';
    const purchaseText = outfit.purchaseCost > 0
      ? `추가 구매 ${outfit.purchaseCost.toLocaleString()}원`
      : '추가 구매 비용 거의 없음';
    const budgetText = currentBudget > 0
      ? outfit.budgetFit
        ? `예산 내 ${Math.max(0, outfit.budgetRemaining).toLocaleString()}원 여유`
        : `예산 초과 ${Math.abs(outfit.budgetRemaining).toLocaleString()}원`
      : `총 조합가 ${outfit.totalPrice.toLocaleString()}원`;
    meta.textContent = outfit.ownedCount > 0
      ? `${outfit.items.length}개 상품 · 보유 의류 ${outfit.ownedCount}개 포함 · ${purchaseText} · ${budgetText}`
      : `${outfit.items.length}개 상품 · ${purchaseText} · ${budgetText}`;

    const totalPrice = document.createElement('div');
    totalPrice.className = 'outfit-total-price';
    totalPrice.textContent = `전체 코디 합계 ${outfit.totalPrice.toLocaleString()}원`;

    const reason = document.createElement('p');
    reason.className = 'outfit-reason';
    reason.textContent = outfit.reason;

    const itemsWrap = document.createElement('div');
    itemsWrap.className = 'outfit-items';

    outfit.items.forEach(item => {
      const itemNode = document.createElement(item._owned ? 'div' : 'a');
      itemNode.className = `outfit-item${item._owned ? ' owned' : ''}`;

      if (!item._owned) {
        itemNode.href = sanitizeUrl(item.link, '#');
        if (itemNode.href !== '#') {
          itemNode.target = '_blank';
          itemNode.rel = 'noopener noreferrer';
        }
      }

      itemNode.textContent = item._owned
        ? `${item._title} · 보유 의류`
        : item._price ? `${item._title} · ${item._price.toLocaleString()}원` : item._title;

      itemsWrap.appendChild(itemNode);
    });

    article.appendChild(badge);
    article.appendChild(cover);
    article.appendChild(title);
    article.appendChild(meta);
    article.appendChild(totalPrice);
    article.appendChild(reason);
    article.appendChild(itemsWrap);
    
    if (userSpec && userSpec.topSize && userSpec.bottomSize) {
      const specGuide = document.createElement('div');
      specGuide.className = 'outfit-spec-guide';
      specGuide.style.cssText = 'margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--gray-200); font-size: 11px; color: var(--accent-green); font-weight: 700;';
      specGuide.textContent = `추천 사이즈: 상의 ${userSpec.topSize} / 하의 ${userSpec.bottomSize} (등록하신 ${userSpec.height}cm / ${userSpec.weight}kg 스펙 기준)`;
      article.appendChild(specGuide);
    }

    grid.appendChild(article);
  });
}

function renderOptimizationSummary(bestOutfit, container) {
  const summaryParts = [];

  summaryParts.push(bestOutfit.purchaseCost > 0
    ? `최소 추가 구매 ${bestOutfit.purchaseCost.toLocaleString()}원`
    : '추가 구매 비용 거의 없음');

  if (bestOutfit.ownedCount > 0) {
    summaryParts.push(`보유 의류 ${bestOutfit.ownedCount}개 활용`);
  }

  if (bestOutfit.savings > 0) {
    summaryParts.push(`절약 효과 ${bestOutfit.savings.toLocaleString()}원`);
  }

  if (bestOutfit.discountAmount > 0) {
    summaryParts.push(`할인 반영 ${bestOutfit.discountAmount.toLocaleString()}원`);
  }

  if (currentBudget > 0) {
    summaryParts.push(bestOutfit.budgetFit
      ? `예산 적합`
      : `예산 초과 ${Math.abs(bestOutfit.budgetRemaining).toLocaleString()}원`);
  }

  container.textContent = `예산 최적화 결과 · ${summaryParts.join(' · ')}`;
}

// ===== 실제 API 호출 =====
async function fetchProductsByQuery(query, replace = true, append = false) {
  if (append && isAppending) {
    return;
  }

  const requestId = ++latestRequestId;

  if (!append) {
    showLoading(true);
    hideError();
  }

  isAppending = append;
  const start = append ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 1;
  const searchQuery = buildSearchQuery(query);

  try {
    const res = await fetch(
      `/api/search?query=${encodeURIComponent(searchQuery)}&sort=${currentSort}&display=${ITEMS_PER_PAGE}&start=${start}`
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || '검색 실패');
    }

    const data = await res.json();
    let filteredItems = filterProductsByBudget(data.items || []);
    if (!filteredItems || filteredItems.length === 0) {
      filteredItems = getFallbackProducts(currentSituation, ITEMS_PER_PAGE);
    }
    if (filteredItems.length < ITEMS_PER_PAGE) {
      filteredItems = filteredItems.concat(getFallbackProducts(currentSituation, ITEMS_PER_PAGE - filteredItems.length));
    }

    if (requestId !== latestRequestId) {
      return;
    }

    showLoading(false);

    if (append) {
      appendProducts(filteredItems);
      currentRecommendedItems = currentRecommendedItems.concat(filteredItems);
    } else {
      renderProducts(filteredItems);
      currentRecommendedItems = filteredItems.slice();
    }

    renderOutfits(currentRecommendedItems);

    // 더보기 버튼
    const total = data.total || 0;
    const shown = currentPage * ITEMS_PER_PAGE;
    document.getElementById('loadMoreWrap').style.display = (shown < total && total > ITEMS_PER_PAGE) ? 'block' : 'none';
    updateVisibleRecommendationCount();

  } catch (err) {
    if (requestId !== latestRequestId) {
      return;
    }

    showLoading(false);
    showError(err.message);
    currentRecommendedItems = [];
    renderOutfits(currentRecommendedItems);
    updateRecommendationSummary();
  } finally {
    if (append) {
      isAppending = false;
    }
  }
}

// ===== 상품 렌더링 =====
function renderProducts(items) {
  const filtered = getFilteredProducts(items);
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  if (!filtered || filtered.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.style.color = '#999';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.padding = '60px 0';
    emptyMessage.style.gridColumn = '1 / -1';
    emptyMessage.textContent = '해당 카테고리에서 상품이 아직 준비되지 않았어요. 전체로 다시 검색해보세요.';
    grid.appendChild(emptyMessage);
    return;
  }
  filtered.forEach((item, i) => grid.appendChild(createCard(item, i)));
}

function filterProductsByBudget(items) {
  return items.filter(item => {
    const price = parsePrice(item.lprice);
    const budgetMatched = currentBudget <= 0 ? true : isWithinBudget(price);
    const priceFilterMatched = matchesPriceFilter(price);

    return budgetMatched && priceFilterMatched;
  });
}

function appendProducts(items) {
  const filtered = getFilteredProducts(items);
  const grid = document.getElementById('productGrid');
  if (!filtered) return;
  filtered.forEach((item, i) => grid.appendChild(createCard(item, i)));
}

function sanitizeUrl(value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  let normalized = value.trim();
  if (normalized.startsWith('//')) {
    normalized = `https:${normalized}`;
  }

  try {
    const url = new URL(normalized);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch (e) {}

  return fallback;
}

function sanitizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim() || fallback;
}

function formatPrice(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed.toLocaleString();
}

function parsePrice(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDiscountMetrics(currentPrice, originalPrice) {
  if (currentPrice === null || originalPrice === null || originalPrice <= currentPrice) {
    return {
      hasDiscount: false,
      amount: 0,
      rate: 0,
    };
  }

  const amount = originalPrice - currentPrice;
  const rate = Math.round((amount / originalPrice) * 100);

  return {
    hasDiscount: true,
    amount,
    rate,
  };
}

function matchesPriceFilter(price) {
  const filter = PRICE_FILTER_MAP[currentPriceFilter] || PRICE_FILTER_MAP.all;

  if (price === null) {
    return currentPriceFilter === 'all';
  }

  if (filter.max === Infinity) {
    return price >= filter.min;
  }

  return price >= filter.min && price <= filter.max;
}

function isWithinBudget(price) {
  if (currentBudget <= 0 || price === null) {
    return currentBudget <= 0;
  }

  return price <= currentBudget;
}

function generateRecommendationReason(item, index) {
  const currentPrice = parsePrice(item.lprice);
  const originalPrice = parsePrice(item.hprice);
  const discount = getDiscountMetrics(currentPrice, originalPrice);
  const reasons = [`${currentSituation}에 어울리는 ${currentStyle} 무드`];

  if (currentBudget > 0 && isWithinBudget(currentPrice)) {
    reasons.push(`예산 ${getBudgetLabel()} 안에서 고르기 쉬움`);
  } else if (currentPriceFilter !== 'all' && matchesPriceFilter(currentPrice)) {
    reasons.push(`${getPriceFilterLabel()} 가격대에 적합`);
  } else if (index < 3) {
    reasons.push('상단 추천 상품');
  }

  if (discount.hasDiscount) {
    reasons.push(`${discount.rate}% 할인 중`);
  }

  return reasons;
}

function createCard(item, index) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.animationDelay = `${index * 0.04}s`;
  card.tabIndex = 0;
  card.addEventListener('click', () => openProductDetail(item));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      openProductDetail(item);
    }
  });

  const title = sanitizeText(item.title, '상품명 없음').replace(/<[^>]+>/g, '');
  const price = formatPrice(item.lprice);
  const originalPrice = formatPrice(item.hprice);
  const currentPriceValue = parsePrice(item.lprice);
  const originalPriceValue = parsePrice(item.hprice);
  const discount = getDiscountMetrics(currentPriceValue, originalPriceValue);
  const imageUrl = sanitizeUrl(item.image, '');
  const img = imageUrl ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}` : FALLBACK_IMAGE_URL;
  const mall = sanitizeText(item.mallName || item.brand, '쇼핑몰');

  const imageWrap = document.createElement('div');
  imageWrap.className = 'card-img-wrap';

  const image = document.createElement('img');
  image.src = img;
  image.style.opacity = '0';
  image.alt = title;
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    image.src = FALLBACK_IMAGE_URL;
    image.style.opacity = '1';
  }, { once: true });
  image.addEventListener('load', () => {
    image.style.opacity = '1';
  }, { once: true });
  imageWrap.appendChild(image);

  if (discount.hasDiscount) {
    const discountBadge = document.createElement('div');
    discountBadge.className = 'card-discount-badge';
    discountBadge.textContent = `${discount.rate}% OFF`;
    imageWrap.appendChild(discountBadge);
  }

  if (index < 3) {
    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.textContent = `BEST ${index + 1}`;
    imageWrap.appendChild(badge);
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  const mallEl = document.createElement('div');
  mallEl.className = 'card-mall';
  mallEl.textContent = mall;

  const titleEl = document.createElement('div');
  titleEl.className = 'card-title';
  titleEl.textContent = title;

  const reasonItems = generateRecommendationReason(item, index);
  const reasonEl = document.createElement('div');
  reasonEl.className = 'card-reason';
  reasonItems.forEach((reasonText) => {
    const reasonTag = document.createElement('span');
    reasonTag.className = 'card-reason-tag';
    reasonTag.textContent = reasonText;
    reasonEl.appendChild(reasonTag);
  });

  const priceWrap = document.createElement('div');
  priceWrap.className = 'card-price-wrap';
  const priceEl = document.createElement('span');
  priceEl.className = 'card-price';
  priceEl.textContent = price ? `${price}원` : '가격 정보 없음';
  priceWrap.appendChild(priceEl);

  if (originalPrice && originalPrice !== price) {
    const originalPriceEl = document.createElement('span');
    originalPriceEl.className = 'card-price-orig';
    originalPriceEl.textContent = `${originalPrice}원`;
    priceWrap.appendChild(originalPriceEl);
  }

  if (discount.hasDiscount) {
    const discountCopy = document.createElement('span');
    discountCopy.className = 'card-discount-copy';
    discountCopy.textContent = `${discount.amount.toLocaleString()}원 절약`;
    priceWrap.appendChild(discountCopy);
  }

  const bottom = document.createElement('div');
  bottom.className = 'card-bottom';

  const review = document.createElement('span');
  review.className = 'card-review';
  review.textContent = discount.hasDiscount ? '할인가 적용' : '네이버쇼핑';
  bottom.appendChild(review);

  const actionWrap = document.createElement('div');
  actionWrap.className = 'card-action-wrap';
  const addCartButton = document.createElement('button');
  addCartButton.type = 'button';
  addCartButton.className = 'card-action-btn';
  addCartButton.textContent = '장바구니 담기';
  addCartButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleAddToCart(event, item);
  });
  const wishButton = document.createElement('button');
  wishButton.type = 'button';
  wishButton.className = 'card-wish-btn';
  wishButton.textContent = '♥ 찜하기';
  wishButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    wishButton.classList.toggle('liked');
  });

  actionWrap.appendChild(addCartButton);
  actionWrap.appendChild(wishButton);

  body.appendChild(mallEl);
  body.appendChild(titleEl);
  body.appendChild(reasonEl);
  body.appendChild(priceWrap);
  body.appendChild(actionWrap);
  body.appendChild(bottom);

  card.appendChild(imageWrap);
  card.appendChild(body);
  return card;
}

// ===== UI 헬퍼 =====
function openProductDetail(item) {
  const detailModal = document.getElementById('productDetailModal');
  if (!detailModal) return;

  const title = sanitizeText(item.title, '상품명 없음').replace(/<[^>]+>/g, '');
  const imageUrl = sanitizeUrl(item.image, '');
  const detailImage = document.getElementById('detailImage');
  detailImage.src = imageUrl ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}` : FALLBACK_IMAGE_URL;
  detailImage.alt = title;

  document.getElementById('detailBrand').textContent = sanitizeText(item.brand || item.mallName || '', '브랜드');
  document.getElementById('detailMall').textContent = sanitizeText(item.mallName || item.brand || '', '쇼핑몰');
  document.getElementById('detailCategory').textContent = sanitizeText(item.category || item.type || '카테고리', '카테고리');
  document.getElementById('detailTitle').textContent = title;
  document.getElementById('detailDescription').textContent = sanitizeText(item.title, '상품명을 확인할 수 없습니다.').replace(/<[^>]+>/g, '');
  document.getElementById('detailReason').textContent = generateRecommendationReason(item, 0).join(' · ');

  const priceText = formatPrice(item.lprice);
  const originalPriceText = formatPrice(item.hprice);
  document.getElementById('detailPrice').textContent = priceText ? `${priceText}원` : '가격 정보 없음';
  const originalPriceEl = document.getElementById('detailOriginalPrice');
  const detailDiscountEl = document.getElementById('detailDiscount');

  if (originalPriceText && originalPriceText !== priceText) {
    originalPriceEl.textContent = `${originalPriceText}원`;
    originalPriceEl.style.display = 'block';
    const discountRate = Math.round((Number(originalPriceText.replace(/,/g, '')) - Number(priceText.replace(/,/g, ''))) / Number(originalPriceText.replace(/,/g, '')) * 100);
    detailDiscountEl.textContent = discountRate > 0 ? `${discountRate}% 할인` : '';
  } else {
    originalPriceEl.style.display = 'none';
    detailDiscountEl.textContent = '';
  }

  const detailLink = document.getElementById('detailLinkBtn');
  const directUrl = sanitizeUrl(item.link, '');
  const productUrl = directUrl || `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(title)}`;

  detailLink.href = productUrl;
  detailLink.textContent = directUrl ? '네이버 쇼핑으로 이동' : '네이버 쇼핑에서 검색';
  detailLink.removeAttribute('disabled');

  detailModal.style.display = 'flex';
}

function closeProductDetail() {
  const detailModal = document.getElementById('productDetailModal');
  if (detailModal) {
    detailModal.style.display = 'none';
  }
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
  document.getElementById('productGrid').style.opacity = show ? '0.3' : '1';
}
function showError(msg) {
  const box = document.getElementById('errorBox');
  document.getElementById('errorMsg').textContent = msg;
  box.style.display = 'block';
}
function hideError() {
  document.getElementById('errorBox').style.display = 'none';
}
