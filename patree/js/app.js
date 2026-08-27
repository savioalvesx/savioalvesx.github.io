/**
 * PATree - Main Application Controller
 */

class PATreeApp {
  constructor() {
    this.currentScreen = 'dashboard';
    this.activeAssetDetailId = null;
    this.activeSectorDetailId = null;
    this.formPhotos = [];
    this.assetSearchQuery = '';
    this.assetFilterCategory = 'all';
    this.assetFilterStatus = 'all';
    this.assetFilterSector = 'all';

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUserHeader();
    this.renderDashboard();
    this.renderAssetsList();
    this.renderSectorsList();
    this.renderUsersList();
  }

  // --- Formatters ---
  formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch(e) {
      return dateStr;
    }
  }

  // --- Toast Notifications ---
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '✓';
    if (type === 'error') icon = '✕';
    else if (type === 'warning') icon = '⚠';
    else if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `
      <div style="font-weight: 800; font-size: 16px;">${icon}</div>
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Screen Navigation ---
  navigate(screenId) {
    this.currentScreen = screenId;

    // Stop scanner if leaving scanner screen
    if (screenId !== 'scanner') {
      window.patreeScanner.stopScanning();
    }

    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Update bottom nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-screen') === screenId);
    });

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // Re-render specific screen content
    if (screenId === 'dashboard') {
      this.renderDashboard();
    } else if (screenId === 'assets') {
      this.renderAssetsList();
    } else if (screenId === 'sectors') {
      this.renderSectorsList();
    } else if (screenId === 'users') {
      this.renderUsersList();
    } else if (screenId === 'scanner') {
      this.startScannerScreen();
    }

    // Scroll to top
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }

  // --- Header & User Profile ---
  updateUserHeader() {
    const user = window.db.getCurrentUser();
    const avatarEl = document.getElementById('top-user-avatar');
    const nameEl = document.getElementById('top-user-name');
    if (avatarEl) avatarEl.textContent = user.avatar || 'US';
    if (nameEl) nameEl.textContent = user.name.split(' ')[0];
  }

  // --- Dashboard Rendering ---
  renderDashboard() {
    const stats = window.db.getStats();
    const assets = window.db.getAssets();
    const movements = window.db.getMovements().slice(0, 4);

    // Update KPIs
    const elTotalVal = document.getElementById('dash-val-total');
    const elCurrentVal = document.getElementById('dash-val-current');
    const elAssetsCount = document.getElementById('dash-count-assets');
    const elMaintCount = document.getElementById('dash-count-maint');

    if (elTotalVal) elTotalVal.textContent = this.formatCurrency(stats.totalOriginalValue);
    if (elCurrentVal) elCurrentVal.textContent = this.formatCurrency(stats.totalCurrentValue);
    if (elAssetsCount) elAssetsCount.textContent = stats.totalAssets;
    if (elMaintCount) elMaintCount.textContent = stats.inMaintenanceCount;

    // Sector Distribution Visual Bars
    const sectorBarsContainer = document.getElementById('dash-sectors-breakdown');
    if (sectorBarsContainer) {
      const maxVal = Math.max(...stats.sectorsBreakdown.map(s => s.totalValue), 1);
      sectorBarsContainer.innerHTML = stats.sectorsBreakdown.map(sec => {
        const pct = Math.round((sec.totalValue / (stats.totalOriginalValue || 1)) * 100);
        return `
          <div style="margin-bottom: 12px; cursor: pointer;" onclick="app.filterAssetsBySector('${sec.id}')">
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
              <span style="font-weight: 600;">${sec.name} (${sec.count})</span>
              <span style="font-weight: 700; color: ${sec.color};">${this.formatCurrency(sec.totalValue)} (${pct}%)</span>
            </div>
            <div style="height: 8px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${sec.color}; border-radius: var(--radius-full);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Recent Assets Grid
    const recentAssetsContainer = document.getElementById('dash-recent-assets');
    if (recentAssetsContainer) {
      const recent = assets.slice().reverse().slice(0, 3);
      if (recent.length === 0) {
        recentAssetsContainer.innerHTML = '<p class="text-muted text-center">Nenhum ativo cadastrado.</p>';
      } else {
        recentAssetsContainer.innerHTML = recent.map(a => this.renderAssetCardHTML(a)).join('');
      }
    }

    // Recent Movements Timeline
    const timelineContainer = document.getElementById('dash-recent-movements');
    if (timelineContainer) {
      if (movements.length === 0) {
        timelineContainer.innerHTML = '<p class="text-muted" style="padding-left: 10px;">Nenhuma movimentação registrada.</p>';
      } else {
        timelineContainer.innerHTML = movements.map(m => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-date">${this.formatDate(m.date)} • ${m.performedBy}</div>
            <div class="timeline-desc"><b>${m.assetTag}</b>: ${m.reason}</div>
            <div class="timeline-user">${m.fromSector} → <b>${m.toSector}</b></div>
          </div>
        `).join('');
      }
    }
  }

  // --- Assets List Rendering ---
  renderAssetsList() {
    const listContainer = document.getElementById('assets-list-container');
    const emptyState = document.getElementById('assets-empty-state');
    if (!listContainer) return;

    let assets = window.db.getAssets();

    // Text Search
    if (this.assetSearchQuery) {
      const q = this.assetSearchQuery.toLowerCase();
      assets = assets.filter(a => 
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.tagNumber && a.tagNumber.toLowerCase().includes(q)) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
        (a.brand && a.brand.toLowerCase().includes(q)) ||
        (a.manager && a.manager.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (this.assetFilterCategory !== 'all') {
      assets = assets.filter(a => a.category === this.assetFilterCategory);
    }

    // Status Filter
    if (this.assetFilterStatus !== 'all') {
      assets = assets.filter(a => a.status === this.assetFilterStatus);
    }

    // Sector Filter
    if (this.assetFilterSector !== 'all') {
      assets = assets.filter(a => a.sectorId === this.assetFilterSector);
    }

    // Update count display
    const countBadge = document.getElementById('assets-count-badge');
    if (countBadge) countBadge.textContent = `${assets.length} ativos`;

    if (assets.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      listContainer.innerHTML = assets.map(a => this.renderAssetCardHTML(a)).join('');
    }
  }

  renderAssetCardHTML(asset) {
    const photo = (asset.photos && asset.photos.length > 0) ? asset.photos[0] : null;
    const statusClass = 'status-' + (asset.status || 'em-uso').toLowerCase().replace(/\s+/g, '-');
    const dep = window.db.calculateDepreciation(asset);

    return `
      <div class="glass-card asset-card" onclick="app.openAssetDetail('${asset.id}')">
        <div class="asset-thumb-wrapper">
          ${photo ? `<img src="${photo}" alt="${asset.name}" loading="lazy"/>` : `
            <div class="asset-thumb-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
          `}
        </div>
        <div class="asset-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="asset-tag-badge">${asset.tagNumber}</span>
            <span class="asset-status-pill ${statusClass}">${asset.status}</span>
          </div>
          <div class="asset-title">${asset.name}</div>
          <div class="asset-meta-row">
            <span>📍 ${asset.sectorName || 'Geral'}</span>
            <span>•</span>
            <span>⭐ ${asset.condition}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 6px;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Contábil: ${this.formatCurrency(dep.currentValue)}</span>
            <span class="asset-valuation">${this.formatCurrency(asset.purchaseValue)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Sectors List Rendering ---
  renderSectorsList() {
    const container = document.getElementById('sectors-list-container');
    if (!container) return;

    const sectors = window.db.getSectors();
    const assets = window.db.getAssets();

    container.innerHTML = sectors.map(sec => {
      const sectorAssets = assets.filter(a => a.sectorId === sec.id);
      const totalVal = sectorAssets.reduce((sum, a) => sum + (parseFloat(a.purchaseValue) || 0), 0);

      return `
        <div class="glass-card sector-card" onclick="app.filterAssetsBySector('${sec.id}')">
          <div class="sector-card-header">
            <div class="sector-name-group">
              <div class="sector-icon-box" style="background: ${sec.color}1a; color: ${sec.color};">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div>
                <div class="sector-title">${sec.name}</div>
                <div class="sector-manager">👤 ${sec.managerName || 'Sem responsável'} • 📍 ${sec.location || 'Local não definido'}</div>
              </div>
            </div>
            <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); app.openEditSectorModal('${sec.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.3;">
            ${sec.description || 'Sem descrição cadastrada.'}
          </div>
          <div class="sector-stats-row">
            <div class="sector-count-badge">📦 ${sectorAssets.length} Ativos Alocados</div>
            <div class="sector-total-val">${this.formatCurrency(totalVal)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Users List Rendering & Profile Switching ---
  renderUsersList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;

    const users = window.db.getUsers();
    const currentUser = window.db.getCurrentUser();

    container.innerHTML = users.map(u => {
      const isCurrent = (currentUser && currentUser.id === u.id);
      let roleBadgeColor = 'var(--primary)';
      if (u.role === 'admin') roleBadgeColor = '#8b5cf6';
      else if (u.role === 'auditor') roleBadgeColor = '#f59e0b';

      return `
        <div class="glass-card" style="padding: 16px; margin-bottom: 12px; border: ${isCurrent ? '2px solid var(--primary)' : '1px solid var(--border-color)'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div class="user-avatar" style="width: 44px; height: 44px; font-size: 16px;">
                ${u.avatar || 'US'}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem;">${u.name} ${isCurrent ? '⭐ (Você)' : ''}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${u.email}</div>
                <div style="display: flex; gap: 6px; margin-top: 4px;">
                  <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-full); background: ${roleBadgeColor}22; color: ${roleBadgeColor}; font-weight: 700;">
                    ${u.roleTitle || u.role}
                  </span>
                  <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-full); background: var(--bg-surface); color: var(--text-muted);">
                    🏢 ${u.sectorName || 'Geral'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              ${!isCurrent ? `
                <button class="btn btn-secondary btn-sm" onclick="app.switchCurrentUser('${u.id}')">
                  Usar Perfil
                </button>
              ` : `
                <span class="text-success" style="font-size: 0.8rem; font-weight: 700;">Ativo</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  switchCurrentUser(userId) {
    const user = window.db.setCurrentUser(userId);
    if (user) {
      this.updateUserHeader();
      this.renderUsersList();
      this.showToast(`Perfil alterado para ${user.name}`);
    }
  }

  // --- Asset Detail Screen ---
  openAssetDetail(assetId) {
    const asset = window.db.getAssetById(assetId);
    if (!asset) return;

    this.activeAssetDetailId = assetId;
    const container = document.getElementById('asset-detail-content');
    if (!container) return;

    const dep = window.db.calculateDepreciation(asset);
    const cat = window.ASSET_CATEGORIES.find(c => c.id === asset.category) || { name: asset.category || '-' };
    const photo = (asset.photos && asset.photos.length > 0) ? asset.photos[0] : null;
    const movements = window.db.getMovements(asset.id);

    container.innerHTML = `
      <div class="detail-photo-hero">
        ${photo ? `<img src="${photo}" alt="${asset.name}" />` : `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-direction: column; gap: 8px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <span>Sem foto anexada</span>
          </div>
        `}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span class="asset-tag-badge" style="font-size: 0.85rem; padding: 4px 10px;">${asset.tagNumber}</span>
          <h2 style="font-size: 1.35rem; margin-top: 6px;">${asset.name}</h2>
          <div style="color: var(--text-muted); font-size: 0.85rem;">${cat.name} • ${asset.brand || 'Marca n/d'} ${asset.model || ''}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.openQRTagModal('${asset.id}')" title="Ver Etiqueta QR">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Etiqueta
        </button>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 18px;">
        <button class="btn btn-secondary btn-sm" onclick="app.openTransferModal('${asset.id}')">
          🔄 Transferir
        </button>
        <button class="btn btn-secondary btn-sm" onclick="app.openEditAssetModal('${asset.id}')">
          ✏️ Editar
        </button>
        <button class="btn btn-secondary btn-sm text-danger" onclick="app.confirmDeleteAsset('${asset.id}')">
          🗑️ Excluir
        </button>
      </div>

      <!-- Depreciation & Financial Box -->
      <div class="glass-card" style="padding: 16px; margin-bottom: 18px; border-left: 4px solid var(--primary);">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Valor Contábil Residual</span>
          <span style="font-size: 1.35rem; font-weight: 800; color: #34d399;">${this.formatCurrency(dep.currentValue)}</span>
        </div>
        <div style="height: 8px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 8px;">
          <div style="width: ${dep.residualPercentage}%; height: 100%; background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-secondary);">
          <span>Original: ${this.formatCurrency(dep.purchaseValue)}</span>
          <span>Depreciação: ${dep.depreciationPercentage}% (${dep.monthsUsed} meses)</span>
        </div>
      </div>

      <!-- Detail Info Grid -->
      <div class="detail-grid-info">
        <div class="detail-info-cell">
          <div class="cell-title">Setor de Lotação</div>
          <div class="cell-val">🏢 ${asset.sectorName || 'Não Informado'}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Responsável</div>
          <div class="cell-val">👤 ${asset.manager || 'Setor'}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Estado de Conservação</div>
          <div class="cell-val">⭐ ${asset.condition}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Status Operacional</div>
          <div class="cell-val">${asset.status}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Data de Aquisição</div>
          <div class="cell-val">📅 ${this.formatDate(asset.purchaseDate)}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Nota Fiscal</div>
          <div class="cell-val">📄 ${asset.invoiceNumber || 'Não informada'}</div>
        </div>
        <div class="detail-info-cell" style="grid-column: span 2;">
          <div class="cell-title">Número de Série</div>
          <div class="cell-val" style="font-family: var(--font-mono);">${asset.serialNumber || 'N/A'}</div>
        </div>
      </div>

      <!-- Description -->
      <div class="glass-card" style="padding: 14px; margin-bottom: 18px;">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Descrição & Observações</div>
        <div style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.4;">
          ${asset.description || 'Nenhuma observação cadastrada.'}
        </div>
      </div>

      <!-- Movement History -->
      <div style="margin-top: 20px;">
        <h4 style="margin-bottom: 12px; font-size: 1rem;">📜 Histórico de Movimentações</h4>
        <div class="timeline-list">
          ${movements.length > 0 ? movements.map(m => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-date">${this.formatDate(m.date)} • Por ${m.performedBy}</div>
              <div class="timeline-desc"><b>${m.reason}</b></div>
              <div class="timeline-user">De: ${m.fromSector} → Para: <b>${m.toSector}</b></div>
            </div>
          `).join('') : '<p class="text-muted" style="font-size: 0.85rem;">Nenhuma movimentação registrada além do cadastro inicial.</p>'}
        </div>
      </div>
    `;

    this.navigate('asset-detail');
  }

  // --- Modals & Forms ---
  openNewAssetModal() {
    this.activeAssetDetailId = null;
    this.formPhotos = [];
    document.getElementById('form-asset-title').textContent = 'Novo Ativo Patrimonial';
    document.getElementById('form-asset').reset();
    document.getElementById('asset-id-input').value = '';
    document.getElementById('asset-tag-input').value = window.db.generateTagNumber();
    document.getElementById('asset-date-input').value = new Date().toISOString().slice(0, 10);
    
    this.populateSectorSelect('asset-sector-select');
    this.populateCategorySelect('asset-category-select');
    this.renderFormPhotosPreview();

    this.openModal('modal-asset-form');
  }

  openEditAssetModal(assetId) {
    const asset = window.db.getAssetById(assetId);
    if (!asset) return;

    this.activeAssetDetailId = assetId;
    this.formPhotos = asset.photos ? [...asset.photos] : [];
    document.getElementById('form-asset-title').textContent = 'Editar Ativo';
    
    document.getElementById('asset-id-input').value = asset.id;
    document.getElementById('asset-tag-input').value = asset.tagNumber;
    document.getElementById('asset-name-input').value = asset.name;
    document.getElementById('asset-desc-input').value = asset.description || '';
    document.getElementById('asset-brand-input').value = asset.brand || '';
    document.getElementById('asset-model-input').value = asset.model || '';
    document.getElementById('asset-serial-input').value = asset.serialNumber || '';
    document.getElementById('asset-val-input').value = asset.purchaseValue || '';
    document.getElementById('asset-date-input').value = asset.purchaseDate || '';
    document.getElementById('asset-life-input').value = asset.usefulLifeYears || 5;
    document.getElementById('asset-nf-input').value = asset.invoiceNumber || '';
    document.getElementById('asset-manager-input').value = asset.manager || '';
    document.getElementById('asset-condition-select').value = asset.condition || 'Bom';
    document.getElementById('asset-status-select').value = asset.status || 'Em Uso';

    this.populateSectorSelect('asset-sector-select', asset.sectorId);
    this.populateCategorySelect('asset-category-select', asset.category);
    this.renderFormPhotosPreview();

    this.openModal('modal-asset-form');
  }

  handleAssetFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('asset-id-input').value;
    const tagNumber = document.getElementById('asset-tag-input').value;
    const name = document.getElementById('asset-name-input').value;
    const sectorId = document.getElementById('asset-sector-select').value;
    const category = document.getElementById('asset-category-select').value;
    const purchaseValue = parseFloat(document.getElementById('asset-val-input').value) || 0;
    const purchaseDate = document.getElementById('asset-date-input').value;
    const usefulLifeYears = parseInt(document.getElementById('asset-life-input').value, 10) || 5;
    const brand = document.getElementById('asset-brand-input').value;
    const model = document.getElementById('asset-model-input').value;
    const serialNumber = document.getElementById('asset-serial-input').value;
    const invoiceNumber = document.getElementById('asset-nf-input').value;
    const manager = document.getElementById('asset-manager-input').value;
    const condition = document.getElementById('asset-condition-select').value;
    const status = document.getElementById('asset-status-select').value;
    const description = document.getElementById('asset-desc-input').value;

    const assetData = {
      id: id || undefined,
      tagNumber,
      name,
      sectorId,
      category,
      purchaseValue,
      purchaseDate,
      usefulLifeYears,
      brand,
      model,
      serialNumber,
      invoiceNumber,
      manager,
      condition,
      status,
      description,
      photos: this.formPhotos
    };

    const saved = window.db.saveAsset(assetData);
    this.closeModal('modal-asset-form');
    this.showToast(`Ativo ${saved.tagNumber} salvo com sucesso!`);
    
    this.renderAssetsList();
    this.renderDashboard();
    this.renderSectorsList();

    if (this.currentScreen === 'asset-detail') {
      this.openAssetDetail(saved.id);
    }
  }

  confirmDeleteAsset(assetId) {
    const asset = window.db.getAssetById(assetId);
    if (!asset) return;

    if (confirm(`Tem certeza que deseja excluir o ativo ${asset.tagNumber} (${asset.name})?`)) {
      window.db.deleteAsset(assetId);
      this.showToast(`Ativo ${asset.tagNumber} excluído.`);
      this.navigate('assets');
      this.renderDashboard();
      this.renderSectorsList();
    }
  }

  // --- Sector Modals ---
  openNewSectorModal() {
    document.getElementById('form-sector-title').textContent = 'Novo Setor / Departamento';
    document.getElementById('form-sector').reset();
    document.getElementById('sector-id-input').value = '';
    this.openModal('modal-sector-form');
  }

  openEditSectorModal(sectorId) {
    const sec = window.db.getSectorById(sectorId);
    if (!sec) return;

    document.getElementById('form-sector-title').textContent = 'Editar Setor';
    document.getElementById('sector-id-input').value = sec.id;
    document.getElementById('sector-code-input').value = sec.code || '';
    document.getElementById('sector-name-input').value = sec.name || '';
    document.getElementById('sector-manager-input').value = sec.managerName || '';
    document.getElementById('sector-location-input').value = sec.location || '';
    document.getElementById('sector-budget-input').value = sec.budget || '';
    document.getElementById('sector-color-input').value = sec.color || '#10b981';
    document.getElementById('sector-desc-input').value = sec.description || '';

    this.openModal('modal-sector-form');
  }

  handleSectorFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('sector-id-input').value;
    const code = document.getElementById('sector-code-input').value;
    const name = document.getElementById('sector-name-input').value;
    const managerName = document.getElementById('sector-manager-input').value;
    const location = document.getElementById('sector-location-input').value;
    const budget = parseFloat(document.getElementById('sector-budget-input').value) || 0;
    const color = document.getElementById('sector-color-input').value;
    const description = document.getElementById('sector-desc-input').value;

    const sectorData = {
      id: id || undefined,
      code,
      name,
      managerName,
      location,
      budget,
      color,
      description
    };

    const saved = window.db.saveSector(sectorData);
    this.closeModal('modal-sector-form');
    this.showToast(`Setor ${saved.name} salvo com sucesso!`);
    this.renderSectorsList();
    this.renderDashboard();
  }

  // --- Transfer Modal ---
  openTransferModal(assetId) {
    const asset = window.db.getAssetById(assetId);
    if (!asset) return;

    this.activeAssetDetailId = assetId;
    document.getElementById('transfer-asset-title').textContent = `${asset.tagNumber} - ${asset.name}`;
    document.getElementById('transfer-from-sector').textContent = asset.sectorName || 'Não Informado';
    document.getElementById('transfer-from-user').textContent = asset.manager || 'Não Informado';
    
    this.populateSectorSelect('transfer-to-sector-select', asset.sectorId);
    document.getElementById('transfer-reason-input').value = '';

    this.openModal('modal-transfer');
  }

  handleTransferSubmit(e) {
    e.preventDefault();
    const asset = window.db.getAssetById(this.activeAssetDetailId);
    if (!asset) return;

    const toSectorId = document.getElementById('transfer-to-sector-select').value;
    const toSector = window.db.getSectorById(toSectorId);
    const toUser = document.getElementById('transfer-to-user-input').value || (toSector ? toSector.managerName : '');
    const reason = document.getElementById('transfer-reason-input').value || 'Transferência interna de setor';

    const oldSectorName = asset.sectorName || 'Geral';
    const oldManager = asset.manager || 'Geral';

    // Update asset
    asset.sectorId = toSectorId;
    asset.sectorName = toSector ? toSector.name : '';
    asset.manager = toUser;
    window.db.saveAsset(asset);

    // Record movement
    window.db.recordMovement({
      assetId: asset.id,
      assetTag: asset.tagNumber,
      assetName: asset.name,
      fromSector: oldSectorName,
      toSector: asset.sectorName,
      fromUser: oldManager,
      toUser: toUser,
      reason: reason
    });

    this.closeModal('modal-transfer');
    this.showToast(`Ativo transferido para ${asset.sectorName}!`);
    this.openAssetDetail(asset.id);
    this.renderDashboard();
    this.renderSectorsList();
  }

  // --- QR Tag Label Modal ---
  openQRTagModal(assetId) {
    const asset = window.db.getAssetById(assetId);
    if (!asset) return;

    document.getElementById('tag-preview-number').textContent = asset.tagNumber;
    document.getElementById('tag-preview-title').textContent = asset.name;
    document.getElementById('tag-preview-sector').textContent = `Setor: ${asset.sectorName || 'Geral'}`;
    document.getElementById('tag-preview-sn').textContent = `S/N: ${asset.serialNumber || 'N/A'}`;

    const canvas = document.getElementById('tag-preview-qr-canvas');
    if (canvas) {
      window.PATreeQR.drawToCanvas(canvas, asset.tagNumber, { size: 140, padding: 2 });
    }

    document.getElementById('btn-print-tag-action').onclick = () => {
      window.PATreeExporter.printAssetTag(asset);
    };

    this.openModal('modal-qr-tag');
  }

  // --- Photo Capture Handling ---
  openCameraModal() {
    this.openModal('modal-camera');
    const video = document.getElementById('camera-preview-video');
    window.patreeCamera.startCamera(video, 'environment');
  }

  closeCameraModal() {
    window.patreeCamera.stopCamera();
    this.closeModal('modal-camera');
  }

  captureCameraSnapshot() {
    const dataUrl = window.patreeCamera.takeSnapshot(800, 0.85);
    if (dataUrl) {
      this.formPhotos.push(dataUrl);
      this.renderFormPhotosPreview();
      this.closeCameraModal();
      this.showToast('Foto capturada com sucesso!');
    }
  }

  toggleCameraFacing() {
    window.patreeCamera.toggleCamera();
  }

  async handlePhotoFileInput(file) {
    if (!file) return;
    try {
      const dataUrl = await window.patreeCamera.processImageFile(file, 800, 0.85);
      this.formPhotos.push(dataUrl);
      this.renderFormPhotosPreview();
      this.showToast('Foto anexada!');
    } catch(err) {
      this.showToast(err.message, 'error');
    }
  }

  removeFormPhoto(index) {
    this.formPhotos.splice(index, 1);
    this.renderFormPhotosPreview();
  }

  renderFormPhotosPreview() {
    const grid = document.getElementById('form-photo-grid');
    if (!grid) return;

    grid.innerHTML = this.formPhotos.map((photo, idx) => `
      <div class="photo-preview-item">
        <img src="${photo}" alt="Foto ${idx + 1}" />
        <button type="button" class="btn-remove-photo" onclick="app.removeFormPhoto(${idx})">✕</button>
      </div>
    `).join('');
  }

  // --- Scanner Screen ---
  startScannerScreen() {
    const video = document.getElementById('scanner-video-feed');
    const resultBox = document.getElementById('scanner-result-box');
    if (resultBox) resultBox.style.display = 'none';

    window.patreeScanner.startScanning(video, (scannedText) => {
      this.handleScannedCode(scannedText);
    });
  }

  handleScannedCode(code) {
    const asset = window.db.getAssetByTag(code);
    if (asset) {
      this.showToast(`Código identificado: ${asset.tagNumber}!`);
      this.openAssetDetail(asset.id);
    } else {
      this.showToast(`Nenhum ativo encontrado para "${code}".`, 'warning');
      const resultBox = document.getElementById('scanner-result-box');
      const resultText = document.getElementById('scanner-result-text');
      if (resultBox && resultText) {
        resultText.textContent = `Código lido: ${code} (Não cadastrado)`;
        resultBox.style.display = 'block';
      }
    }
  }

  // --- Helpers & UI Select Population ---
  populateSectorSelect(selectId, selectedId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const sectors = window.db.getSectors();
    select.innerHTML = '<option value="">Selecione um setor...</option>' + sectors.map(s => `
      <option value="${s.id}" ${selectedId === s.id ? 'selected' : ''}>${s.name} (${s.code})</option>
    `).join('');
  }

  populateCategorySelect(selectId, selectedId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Selecione uma categoria...</option>' + window.ASSET_CATEGORIES.map(c => `
      <option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${c.name}</option>
    `).join('');
  }

  filterAssetsBySector(sectorId) {
    this.assetFilterSector = sectorId;
    this.navigate('assets');
    const sectorFilterSelect = document.getElementById('filter-sector-select');
    if (sectorFilterSelect) sectorFilterSelect.value = sectorId;
    this.renderAssetsList();
  }

  // --- Modal Helpers ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // --- Bind Event Listeners ---
  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const screen = item.getAttribute('data-screen');
        if (screen) this.navigate(screen);
      });
    });

    // Search Assets Input
    const searchInput = document.getElementById('asset-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.assetSearchQuery = e.target.value;
        this.renderAssetsList();
      });
    }

    // Filter Chips (Categories)
    document.querySelectorAll('.filter-chip[data-category]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-category]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.assetFilterCategory = chip.getAttribute('data-category');
        this.renderAssetsList();
      });
    });

    // Filter Status Select
    const statusSelect = document.getElementById('filter-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.assetFilterStatus = e.target.value;
        this.renderAssetsList();
      });
    }

    // Filter Sector Select
    const sectorSelect = document.getElementById('filter-sector-select');
    if (sectorSelect) {
      sectorSelect.addEventListener('change', (e) => {
        this.assetFilterSector = e.target.value;
        this.renderAssetsList();
      });
    }

    // File input for asset photos
    const photoFileInput = document.getElementById('asset-photo-file-input');
    if (photoFileInput) {
      photoFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handlePhotoFileInput(e.target.files[0]);
        }
      });
    }

    // Theme Toggle
    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeToggleBtn.innerHTML = isLight ? '🌙' : '☀️';
      });
    }

    // Manual Barcode / Tag Search in Scanner
    const scannerManualInput = document.getElementById('scanner-manual-input');
    const scannerManualBtn = document.getElementById('scanner-manual-btn');
    if (scannerManualBtn && scannerManualInput) {
      scannerManualBtn.addEventListener('click', () => {
        if (scannerManualInput.value.trim()) {
          this.handleScannedCode(scannerManualInput.value.trim());
        }
      });
    }
  }
}

// Instantiate Global App
window.app = new PATreeApp();
