/**
 * PATree - Main Application Controller
 * Clean & Minimal Enterprise UI
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

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  navigate(screenId) {
    this.currentScreen = screenId;

    if (screenId !== 'scanner') {
      window.patreeScanner.stopScanning();
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-screen') === screenId);
    });

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

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

    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }

  updateUserHeader() {
    const user = window.db.getCurrentUser();
    const avatarEl = document.getElementById('top-user-avatar');
    const nameEl = document.getElementById('top-user-name');
    if (avatarEl) avatarEl.textContent = user.avatar || 'AD';
    if (nameEl) nameEl.textContent = user.name || 'Admin';
  }

  renderUsersList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;

    const user = window.db.getCurrentUser();

    container.innerHTML = `
      <div class="clean-card" style="padding: 16px; margin-bottom: 12px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div class="user-avatar" style="width: 44px; height: 44px; font-size: 14px; border-radius: var(--radius-sm);">
              ${user.avatar || 'AD'}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 1rem;">${user.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email}</div>
              <div style="display: flex; gap: 6px; margin-top: 6px;">
                <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-xs); background: var(--status-active-bg); color: var(--status-active); font-weight: 600;">
                  ${user.roleTitle || 'Administrador Geral'}
                </span>
                <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-xs); background: var(--bg-surface); color: var(--text-muted); border: 1px solid var(--border-color);">
                  Acesso Total
                </span>
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="app.openEditAdminModal()">
            Editar
          </button>
        </div>
      </div>
    `;
  }

  openEditAdminModal() {
    const user = window.db.getCurrentUser();
    document.getElementById('admin-name-input').value = user.name || 'Administrador';
    document.getElementById('admin-email-input').value = user.email || 'admin@patree.com';
    document.getElementById('admin-phone-input').value = user.phone || '';
    this.openModal('modal-admin-profile');
  }

  handleAdminProfileSubmit(e) {
    e.preventDefault();
    const user = window.db.getCurrentUser();
    user.name = document.getElementById('admin-name-input').value;
    user.email = document.getElementById('admin-email-input').value;
    user.phone = document.getElementById('admin-phone-input').value;
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    user.avatar = initials || 'AD';
    window.db.saveUser(user);
    localStorage.setItem(PATREE_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    
    this.closeModal('modal-admin-profile');
    this.updateUserHeader();
    this.renderUsersList();
    this.showToast('Perfil do Administrador atualizado com sucesso.');
  }

  renderDashboard() {
    const stats = window.db.getStats();
    const assets = window.db.getAssets();
    const movements = window.db.getMovements().slice(0, 4);

    const elTotalVal = document.getElementById('dash-val-total');
    const elCurrentVal = document.getElementById('dash-val-current');
    const elAssetsCount = document.getElementById('dash-count-assets');
    const elMaintCount = document.getElementById('dash-count-maint');

    if (elTotalVal) elTotalVal.textContent = this.formatCurrency(stats.totalOriginalValue);
    if (elCurrentVal) elCurrentVal.textContent = this.formatCurrency(stats.totalCurrentValue);
    if (elAssetsCount) elAssetsCount.textContent = stats.totalAssets;
    if (elMaintCount) elMaintCount.textContent = stats.inMaintenanceCount;

    const sectorBarsContainer = document.getElementById('dash-sectors-breakdown');
    if (sectorBarsContainer) {
      sectorBarsContainer.innerHTML = stats.sectorsBreakdown.map(sec => {
        const pct = Math.round((sec.totalValue / (stats.totalOriginalValue || 1)) * 100);
        return `
          <div style="margin-bottom: 10px; cursor: pointer;" onclick="app.filterAssetsBySector('${sec.id}')">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 3px;">
              <span style="font-weight: 500;">${sec.name} (${sec.count})</span>
              <span style="font-weight: 600; color: var(--text-primary);">${this.formatCurrency(sec.totalValue)} (${pct}%)</span>
            </div>
            <div style="height: 6px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${sec.color}; border-radius: var(--radius-full);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const recentAssetsContainer = document.getElementById('dash-recent-assets');
    if (recentAssetsContainer) {
      const recent = assets.slice().reverse().slice(0, 3);
      if (recent.length === 0) {
        recentAssetsContainer.innerHTML = '<p class="text-muted text-center" style="font-size: 0.82rem; padding: 12px 0;">Nenhum ativo cadastrado.</p>';
      } else {
        recentAssetsContainer.innerHTML = recent.map(a => this.renderAssetCardHTML(a)).join('');
      }
    }

    const timelineContainer = document.getElementById('dash-recent-movements');
    if (timelineContainer) {
      if (movements.length === 0) {
        timelineContainer.innerHTML = '<p class="text-muted" style="padding-left: 10px; font-size: 0.8rem;">Nenhuma movimentação registrada.</p>';
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

  renderAssetsList() {
    const listContainer = document.getElementById('assets-list-container');
    const emptyState = document.getElementById('assets-empty-state');
    if (!listContainer) return;

    let assets = window.db.getAssets();

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

    if (this.assetFilterCategory !== 'all') {
      assets = assets.filter(a => a.category === this.assetFilterCategory);
    }

    if (this.assetFilterStatus !== 'all') {
      assets = assets.filter(a => a.status === this.assetFilterStatus);
    }

    if (this.assetFilterSector !== 'all') {
      assets = assets.filter(a => a.sectorId === this.assetFilterSector);
    }

    const countBadge = document.getElementById('assets-count-badge');
    if (countBadge) countBadge.textContent = `${assets.length} itens`;

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
      <div class="asset-card" onclick="app.openAssetDetail('${asset.id}')">
        <div class="asset-thumb-wrapper">
          ${photo ? `<img src="${photo}" alt="${asset.name}" loading="lazy"/>` : `
            <div class="asset-thumb-placeholder">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
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
            <span>${asset.sectorName || 'Geral'}</span>
            <span>•</span>
            <span>${asset.condition}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Residual: ${this.formatCurrency(dep.currentValue)}</span>
            <span class="asset-valuation">${this.formatCurrency(asset.purchaseValue)}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderSectorsList() {
    const container = document.getElementById('sectors-list-container');
    if (!container) return;

    const sectors = window.db.getSectors();
    const assets = window.db.getAssets();

    container.innerHTML = sectors.map(sec => {
      const sectorAssets = assets.filter(a => a.sectorId === sec.id);
      const totalVal = sectorAssets.reduce((sum, a) => sum + (parseFloat(a.purchaseValue) || 0), 0);

      return `
        <div class="sector-card" onclick="app.filterAssetsBySector('${sec.id}')">
          <div class="sector-card-header">
            <div class="sector-name-group">
              <div class="sector-icon-box" style="border-left: 3px solid ${sec.color};">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 9h6"/><path d="M15 15h6"/></svg>
              </div>
              <div>
                <div class="sector-title">${sec.name}</div>
                <div class="sector-manager">${sec.managerName || 'Sem responsável'} • ${sec.location || 'Local n/d'}</div>
              </div>
            </div>
            <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); app.openEditSectorModal('${sec.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.3;">
            ${sec.description || 'Sem descrição cadastrada.'}
          </div>
          <div class="sector-stats-row">
            <div class="sector-count-badge">${sectorAssets.length} ativos alocados</div>
            <div class="sector-total-val">${this.formatCurrency(totalVal)}</div>
          </div>
        </div>
      `;
    }).join('');
  }



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
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-direction: column; gap: 6px;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <span style="font-size: 0.8rem;">Sem foto cadastrada</span>
          </div>
        `}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span class="asset-tag-badge" style="font-size: 0.8rem; padding: 2px 8px;">${asset.tagNumber}</span>
          <h2 style="font-size: 1.15rem; margin-top: 4px;">${asset.name}</h2>
          <div style="color: var(--text-muted); font-size: 0.8rem;">${cat.name} • ${asset.brand || ''} ${asset.model || ''}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.openQRTagModal('${asset.id}')" title="Ver Etiqueta QR">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Etiqueta
        </button>
      </div>

      <!-- Actions -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 14px;">
        <button class="btn btn-secondary btn-sm" onclick="app.openTransferModal('${asset.id}')">
          Transferir
        </button>
        <button class="btn btn-secondary btn-sm" onclick="app.openEditAssetModal('${asset.id}')">
          Editar
        </button>
        <button class="btn btn-danger btn-sm" onclick="app.confirmDeleteAsset('${asset.id}')">
          Excluir
        </button>
      </div>

      <!-- Financial / Depreciation -->
      <div class="clean-card" style="padding: 12px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Valor Contábil Atual</span>
          <span style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${this.formatCurrency(dep.currentValue)}</span>
        </div>
        <div style="height: 6px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 6px;">
          <div style="width: ${dep.residualPercentage}%; height: 100%; background: var(--primary);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
          <span>Original: ${this.formatCurrency(dep.purchaseValue)}</span>
          <span>Depreciação: ${dep.depreciationPercentage}% (${dep.monthsUsed} meses)</span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="detail-grid-info">
        <div class="detail-info-cell">
          <div class="cell-title">Setor</div>
          <div class="cell-val">${asset.sectorName || 'Não Informado'}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Responsável</div>
          <div class="cell-val">${asset.manager || 'Setor'}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Estado</div>
          <div class="cell-val">${asset.condition}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Status</div>
          <div class="cell-val">${asset.status}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Data Aquisição</div>
          <div class="cell-val">${this.formatDate(asset.purchaseDate)}</div>
        </div>
        <div class="detail-info-cell">
          <div class="cell-title">Nota Fiscal</div>
          <div class="cell-val">${asset.invoiceNumber || '-'}</div>
        </div>
        <div class="detail-info-cell" style="grid-column: span 2;">
          <div class="cell-title">Número de Série</div>
          <div class="cell-val" style="font-family: var(--font-mono);">${asset.serialNumber || 'N/A'}</div>
        </div>
      </div>

      <!-- Description -->
      <div class="clean-card" style="padding: 12px; margin-bottom: 14px;">
        <div style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Observações</div>
        <div style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.4;">
          ${asset.description || 'Nenhuma observação cadastrada.'}
        </div>
      </div>

      <!-- Movements -->
      <div style="margin-top: 16px;">
        <h4 style="margin-bottom: 10px; font-size: 0.9rem;">Histórico de Movimentações</h4>
        <div class="timeline-list">
          ${movements.length > 0 ? movements.map(m => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-date">${this.formatDate(m.date)} • Por ${m.performedBy}</div>
              <div class="timeline-desc"><b>${m.reason}</b></div>
              <div class="timeline-user">De: ${m.fromSector} → Para: <b>${m.toSector}</b></div>
            </div>
          `).join('') : '<p class="text-muted" style="font-size: 0.78rem;">Nenhuma movimentação registrada.</p>'}
        </div>
      </div>
    `;

    this.navigate('asset-detail');
  }

  openNewAssetModal() {
    this.activeAssetDetailId = null;
    this.formPhotos = [];
    document.getElementById('form-asset-title').textContent = 'Novo Ativo';
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
    this.showToast(`Ativo ${saved.tagNumber} salvo com sucesso.`);
    
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

    if (confirm(`Excluir o ativo ${asset.tagNumber} (${asset.name})?`)) {
      window.db.deleteAsset(assetId);
      this.showToast(`Ativo ${asset.tagNumber} excluído.`);
      this.navigate('assets');
      this.renderDashboard();
      this.renderSectorsList();
    }
  }

  openNewSectorModal() {
    document.getElementById('form-sector-title').textContent = 'Novo Setor';
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
    document.getElementById('sector-color-input').value = sec.color || '#059669';
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
    this.showToast(`Setor ${saved.name} salvo.`);
    this.renderSectorsList();
    this.renderDashboard();
  }

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
    const reason = document.getElementById('transfer-reason-input').value || 'Transferência interna';

    const oldSectorName = asset.sectorName || 'Geral';
    const oldManager = asset.manager || 'Geral';

    asset.sectorId = toSectorId;
    asset.sectorName = toSector ? toSector.name : '';
    asset.manager = toUser;
    window.db.saveAsset(asset);

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
    this.showToast(`Ativo transferido para ${asset.sectorName}.`);
    this.openAssetDetail(asset.id);
    this.renderDashboard();
    this.renderSectorsList();
  }

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
      this.showToast('Foto capturada.');
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
      this.showToast('Foto anexada.');
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
      this.showToast(`Código identificado: ${asset.tagNumber}`);
      this.openAssetDetail(asset.id);
    } else {
      this.showToast(`Nenhum ativo para "${code}".`, 'warning');
      const resultBox = document.getElementById('scanner-result-box');
      const resultText = document.getElementById('scanner-result-text');
      if (resultBox && resultText) {
        resultText.textContent = `Código lido: ${code} (Não cadastrado)`;
        resultBox.style.display = 'block';
      }
    }
  }

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

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  bindEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.getAttribute('data-screen');
        if (screen) this.navigate(screen);
      });
    });

    const searchInput = document.getElementById('asset-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.assetSearchQuery = e.target.value;
        this.renderAssetsList();
      });
    }

    document.querySelectorAll('.filter-chip[data-category]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-category]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.assetFilterCategory = chip.getAttribute('data-category');
        this.renderAssetsList();
      });
    });

    const statusSelect = document.getElementById('filter-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.assetFilterStatus = e.target.value;
        this.renderAssetsList();
      });
    }

    const sectorSelect = document.getElementById('filter-sector-select');
    if (sectorSelect) {
      sectorSelect.addEventListener('change', (e) => {
        this.assetFilterSector = e.target.value;
        this.renderAssetsList();
      });
    }

    const photoFileInput = document.getElementById('asset-photo-file-input');
    if (photoFileInput) {
      photoFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handlePhotoFileInput(e.target.files[0]);
        }
      });
    }

    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeToggleBtn.innerHTML = isLight ? `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        ` : `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        `;
      });
    }

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

window.app = new PATreeApp();
