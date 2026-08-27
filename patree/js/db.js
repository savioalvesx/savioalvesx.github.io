/**
 * PATree - Database & LocalStorage Persistence Layer
 */

const PATREE_STORAGE_KEYS = {
  USERS: 'patree_users_v1',
  SECTORS: 'patree_sectors_v1',
  ASSETS: 'patree_assets_v1',
  MOVEMENTS: 'patree_movements_v1',
  CURRENT_USER: 'patree_current_user_v1',
  SETTINGS: 'patree_settings_v1'
};

// Default Categories with Icons & Expected Lifespans in years
const ASSET_CATEGORIES = [
  { id: 'ti', name: 'Informática & TI', usefulLife: 5, icon: 'laptop' },
  { id: 'mob', name: 'Mobiliário Corporativo', usefulLife: 10, icon: 'armchair' },
  { id: 'ind', name: 'Equipamentos Industriais', usefulLife: 10, icon: 'cogs' },
  { id: 'veic', name: 'Veículos & Frotas', usefulLife: 5, icon: 'truck' },
  { id: 'eletro', name: 'Eletrônicos & Áudio', usefulLife: 5, icon: 'tv' },
  { id: 'clima', name: 'Climatização & Facilities', usefulLife: 8, icon: 'fan' },
  { id: 'outros', name: 'Outros Bens', usefulLife: 5, icon: 'box' }
];

// Realistic Sample Data Seeds
const SEED_USERS = [
  {
    id: 'usr_admin',
    name: 'Carlos Henrique Silva',
    email: 'carlos.silva@patree.com',
    role: 'admin', // admin, manager, auditor
    roleTitle: 'Administrador Geral',
    sectorId: 'sec_ti',
    sectorName: 'Tecnologia da Informação',
    avatar: 'CS',
    phone: '(11) 98765-4321'
  },
  {
    id: 'usr_ana',
    name: 'Ana Carolina Mendes',
    email: 'ana.mendes@patree.com',
    role: 'manager',
    roleTitle: 'Gerente Administrativa',
    sectorId: 'sec_adm',
    sectorName: 'Administrativo & RH',
    avatar: 'AM',
    phone: '(11) 97654-3210'
  },
  {
    id: 'usr_lucas',
    name: 'Lucas Roberto Prado',
    email: 'lucas.prado@patree.com',
    role: 'auditor',
    roleTitle: 'Auditor de Patrimônio',
    sectorId: 'sec_aud',
    sectorName: 'Auditoria e Controladoria',
    avatar: 'LP',
    phone: '(11) 96543-2109'
  }
];

const SEED_SECTORS = [
  {
    id: 'sec_ti',
    code: 'SET-TI',
    name: 'Tecnologia da Informação',
    managerId: 'usr_admin',
    managerName: 'Carlos Silva',
    location: 'Bloco B - 3º Andar',
    budget: 150000.00,
    color: '#10b981',
    description: 'Data Center, infraestrutura, desenvolvimento e suporte aos usuários.'
  },
  {
    id: 'sec_adm',
    code: 'SET-ADM',
    name: 'Administrativo & RH',
    managerId: 'usr_ana',
    managerName: 'Ana Carolina',
    location: 'Bloco A - 2º Andar',
    budget: 80000.00,
    color: '#06b6d4',
    description: 'Gestão de pessoas, suprimentos corporativos e diretoria.'
  },
  {
    id: 'sec_fab',
    code: 'SET-OP',
    name: 'Operações & Logística',
    managerId: 'usr_lucas',
    managerName: 'Lucas Prado',
    location: 'Galpão 01 - Térreo',
    budget: 250000.00,
    color: '#8b5cf6',
    description: 'Linha de produção, estoque central e frotas de distribuição.'
  },
  {
    id: 'sec_mkt',
    code: 'SET-MKT',
    name: 'Marketing & Criação',
    managerId: 'usr_ana',
    managerName: 'Ana Carolina',
    location: 'Bloco A - 1º Andar',
    budget: 60000.00,
    color: '#f59e0b',
    description: 'Estúdio de gravação, redação, design e eventos.'
  }
];

// Helper Base64 placeholders with stylish SVG representation
function createSVGDataURI(title, iconColor, bgDark) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="100%" height="100%" fill="${bgDark || '#111827'}"/>
    <circle cx="200" cy="180" r="80" fill="${iconColor || '#10b981'}" fill-opacity="0.15" stroke="${iconColor || '#10b981'}" stroke-width="3"/>
    <path d="M160 180 L240 180 M200 140 L200 220" stroke="${iconColor || '#10b981'}" stroke-width="4" stroke-linecap="round"/>
    <text x="50%" y="310" fill="#f8fafc" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle">${title}</text>
    <text x="50%" y="338" fill="#94a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">PATree Ativo Tombado</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const SEED_ASSETS = [
  {
    id: 'ast_1001',
    tagNumber: 'PAT-001042',
    name: 'Notebook Dell Latitude 5440 i7 32GB',
    description: 'Notebook de alto desempenho utilizado pelo líder técnico de desenvolvimento.',
    category: 'ti',
    sectorId: 'sec_ti',
    sectorName: 'Tecnologia da Informação',
    manager: 'Carlos Henrique Silva',
    condition: 'Excelente',
    status: 'Em Uso',
    purchaseValue: 7499.00,
    purchaseDate: '2024-03-15',
    usefulLifeYears: 5,
    serialNumber: 'DL-8849-BR23',
    brand: 'Dell',
    model: 'Latitude 5440',
    invoiceNumber: 'NF-104928',
    photos: [createSVGDataURI('Dell Latitude 5440', '#10b981', '#0f172a')],
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2025-01-10T14:30:00Z'
  },
  {
    id: 'ast_1002',
    tagNumber: 'PAT-001043',
    name: 'Cadeira Ergonômica Herman Miller Aeron',
    description: 'Cadeira executiva com ajuste lombar PostureFit e braços totalmente ajustáveis.',
    category: 'mob',
    sectorId: 'sec_adm',
    sectorName: 'Administrativo & RH',
    manager: 'Ana Carolina Mendes',
    condition: 'Excelente',
    status: 'Em Uso',
    purchaseValue: 10250.00,
    purchaseDate: '2023-11-20',
    usefulLifeYears: 10,
    serialNumber: 'HM-AER-99182',
    brand: 'Herman Miller',
    model: 'Aeron Graphite B',
    invoiceNumber: 'NF-093812',
    photos: [createSVGDataURI('Herman Miller Aeron', '#06b6d4', '#111827')],
    createdAt: '2023-11-20T09:00:00Z',
    updatedAt: '2024-08-01T11:00:00Z'
  },
  {
    id: 'ast_1003',
    tagNumber: 'PAT-001044',
    name: 'Servidor Dell PowerEdge R750xs 2U',
    description: 'Servidor de banco de dados e virtualização do cluster principal.',
    category: 'ti',
    sectorId: 'sec_ti',
    sectorName: 'Tecnologia da Informação',
    manager: 'Carlos Henrique Silva',
    condition: 'Bom',
    status: 'Em Uso',
    purchaseValue: 42900.00,
    purchaseDate: '2023-05-10',
    usefulLifeYears: 5,
    serialNumber: 'PE-R750-88127',
    brand: 'Dell EMC',
    model: 'PowerEdge R750xs',
    invoiceNumber: 'NF-081290',
    photos: [createSVGDataURI('Dell PowerEdge R750', '#8b5cf6', '#090d16')],
    createdAt: '2023-05-10T08:00:00Z',
    updatedAt: '2024-12-05T16:20:00Z'
  },
  {
    id: 'ast_1004',
    tagNumber: 'PAT-001045',
    name: 'Câmera Mirrorless Sony Alpha A7 IV 4K',
    description: 'Corpo de câmera e lente 24-70mm f/2.8 para estúdio e cobertura de eventos corporativos.',
    category: 'eletro',
    sectorId: 'sec_mkt',
    sectorName: 'Marketing & Criação',
    manager: 'Ana Carolina Mendes',
    condition: 'Bom',
    status: 'Em Manutenção',
    purchaseValue: 18500.00,
    purchaseDate: '2024-01-18',
    usefulLifeYears: 5,
    serialNumber: 'SN-A7IV-33019',
    brand: 'Sony',
    model: 'Alpha A7 IV',
    invoiceNumber: 'NF-112049',
    photos: [createSVGDataURI('Sony Alpha A7 IV', '#f59e0b', '#1e1b4b')],
    createdAt: '2024-01-18T15:00:00Z',
    updatedAt: '2025-02-14T09:45:00Z'
  },
  {
    id: 'ast_1005',
    tagNumber: 'PAT-001046',
    name: 'Empilhadeira Elétrica Retrátil Still 2.0T',
    description: 'Empilhadeira para movimentação de pallets no estoque vertical.',
    category: 'ind',
    sectorId: 'sec_fab',
    sectorName: 'Operações & Logística',
    manager: 'Lucas Roberto Prado',
    condition: 'Bom',
    status: 'Em Uso',
    purchaseValue: 125000.00,
    purchaseDate: '2022-08-01',
    usefulLifeYears: 10,
    serialNumber: 'ST-FM-2022-09',
    brand: 'Still',
    model: 'FM-X 20',
    invoiceNumber: 'NF-054921',
    photos: [createSVGDataURI('Empilhadeira Still 2T', '#10b981', '#1f2937')],
    createdAt: '2022-08-01T12:00:00Z',
    updatedAt: '2024-09-10T10:00:00Z'
  },
  {
    id: 'ast_1006',
    tagNumber: 'PAT-001047',
    name: 'Ar Condicionado Split Inverter Daikin 36.000 BTU',
    description: 'Sistema de climatização do auditório principal e sala de treinamento.',
    category: 'clima',
    sectorId: 'sec_adm',
    sectorName: 'Administrativo & RH',
    manager: 'Ana Carolina Mendes',
    condition: 'Regular',
    status: 'Em Uso',
    purchaseValue: 8900.00,
    purchaseDate: '2021-04-12',
    usefulLifeYears: 8,
    serialNumber: 'DK-36K-INV-001',
    brand: 'Daikin',
    model: 'Advance Inverter 36k',
    invoiceNumber: 'NF-039182',
    photos: [createSVGDataURI('Split Daikin 36k', '#06b6d4', '#0f172a')],
    createdAt: '2021-04-12T14:00:00Z',
    updatedAt: '2024-06-15T11:20:00Z'
  }
];

const SEED_MOVEMENTS = [
  {
    id: 'mov_1',
    assetId: 'ast_1004',
    assetTag: 'PAT-001045',
    assetName: 'Câmera Mirrorless Sony Alpha A7 IV 4K',
    fromSector: 'Marketing & Criação',
    toSector: 'Laboratório Técnico (Assistência)',
    fromUser: 'Ana Carolina Mendes',
    toUser: 'Técnico Especializado',
    date: '2025-02-14T09:45:00Z',
    reason: 'Envio para calibração de sensor e troca de obturador preventivo.',
    performedBy: 'Lucas Roberto Prado'
  },
  {
    id: 'mov_2',
    assetId: 'ast_1001',
    assetTag: 'PAT-001042',
    assetName: 'Notebook Dell Latitude 5440 i7 32GB',
    fromSector: 'Almoxarifado Central',
    toSector: 'Tecnologia da Informação',
    fromUser: 'Ana Carolina Mendes',
    toUser: 'Carlos Henrique Silva',
    date: '2024-03-15T10:30:00Z',
    reason: 'Atribuição inicial de equipamento novo para liderança de TI.',
    performedBy: 'Carlos Henrique Silva'
  }
];

class PATreeDatabase {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    if (!localStorage.getItem(PATREE_STORAGE_KEYS.USERS)) {
      localStorage.setItem(PATREE_STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(PATREE_STORAGE_KEYS.SECTORS)) {
      localStorage.setItem(PATREE_STORAGE_KEYS.SECTORS, JSON.stringify(SEED_SECTORS));
    }
    if (!localStorage.getItem(PATREE_STORAGE_KEYS.ASSETS)) {
      localStorage.setItem(PATREE_STORAGE_KEYS.ASSETS, JSON.stringify(SEED_ASSETS));
    }
    if (!localStorage.getItem(PATREE_STORAGE_KEYS.MOVEMENTS)) {
      localStorage.setItem(PATREE_STORAGE_KEYS.MOVEMENTS, JSON.stringify(SEED_MOVEMENTS));
    }
    if (!localStorage.getItem(PATREE_STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(PATREE_STORAGE_KEYS.CURRENT_USER, JSON.stringify(SEED_USERS[0]));
    }
  }

  // Current Logged User
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(PATREE_STORAGE_KEYS.CURRENT_USER)) || SEED_USERS[0];
    } catch(e) {
      return SEED_USERS[0];
    }
  }

  setCurrentUser(userId) {
    const user = this.getUsers().find(u => u.id === userId);
    if (user) {
      localStorage.setItem(PATREE_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  }

  // --- Users CRUD ---
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(PATREE_STORAGE_KEYS.USERS)) || [];
    } catch(e) {
      return [];
    }
  }

  saveUser(userData) {
    const users = this.getUsers();
    if (userData.id) {
      const idx = users.findIndex(u => u.id === userData.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...userData };
      } else {
        users.push(userData);
      }
    } else {
      userData.id = 'usr_' + Date.now();
      const initials = userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      userData.avatar = userData.avatar || initials || 'US';
      users.push(userData);
    }
    localStorage.setItem(PATREE_STORAGE_KEYS.USERS, JSON.stringify(users));
    return userData;
  }

  deleteUser(userId) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(PATREE_STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // --- Sectors CRUD ---
  getSectors() {
    try {
      return JSON.parse(localStorage.getItem(PATREE_STORAGE_KEYS.SECTORS)) || [];
    } catch(e) {
      return [];
    }
  }

  getSectorById(id) {
    return this.getSectors().find(s => s.id === id);
  }

  saveSector(sectorData) {
    const sectors = this.getSectors();
    if (sectorData.id) {
      const idx = sectors.findIndex(s => s.id === sectorData.id);
      if (idx !== -1) {
        sectors[idx] = { ...sectors[idx], ...sectorData };
      } else {
        sectors.push(sectorData);
      }
    } else {
      sectorData.id = 'sec_' + Date.now();
      if (!sectorData.code) {
        sectorData.code = 'SET-' + sectorData.name.substring(0, 3).toUpperCase();
      }
      sectors.push(sectorData);
    }
    localStorage.setItem(PATREE_STORAGE_KEYS.SECTORS, JSON.stringify(sectors));
    return sectorData;
  }

  deleteSector(sectorId) {
    let sectors = this.getSectors();
    sectors = sectors.filter(s => s.id !== sectorId);
    localStorage.setItem(PATREE_STORAGE_KEYS.SECTORS, JSON.stringify(sectors));
  }

  // --- Assets CRUD ---
  getAssets() {
    try {
      return JSON.parse(localStorage.getItem(PATREE_STORAGE_KEYS.ASSETS)) || [];
    } catch(e) {
      return [];
    }
  }

  getAssetById(id) {
    return this.getAssets().find(a => a.id === id);
  }

  getAssetByTag(tag) {
    if (!tag) return null;
    const cleanTag = tag.trim().toUpperCase();
    return this.getAssets().find(a => a.tagNumber.toUpperCase() === cleanTag || a.serialNumber?.toUpperCase() === cleanTag);
  }

  generateTagNumber() {
    const assets = this.getAssets();
    let maxNumber = 1040;
    assets.forEach(a => {
      if (a.tagNumber && a.tagNumber.startsWith('PAT-')) {
        const num = parseInt(a.tagNumber.replace('PAT-', ''), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    const nextNum = maxNumber + 1;
    return `PAT-${String(nextNum).padStart(6, '0')}`;
  }

  saveAsset(assetData) {
    const assets = this.getAssets();
    const now = new Date().toISOString();

    // Map sector name if sectorId provided
    if (assetData.sectorId) {
      const sector = this.getSectorById(assetData.sectorId);
      if (sector) assetData.sectorName = sector.name;
    }

    if (assetData.id) {
      const idx = assets.findIndex(a => a.id === assetData.id);
      if (idx !== -1) {
        const old = assets[idx];
        assetData.updatedAt = now;
        assets[idx] = { ...old, ...assetData };
      } else {
        assetData.createdAt = assetData.createdAt || now;
        assetData.updatedAt = now;
        assets.push(assetData);
      }
    } else {
      assetData.id = 'ast_' + Date.now();
      if (!assetData.tagNumber) {
        assetData.tagNumber = this.generateTagNumber();
      }
      assetData.createdAt = now;
      assetData.updatedAt = now;
      assets.push(assetData);

      // Record initial creation in movements
      this.recordMovement({
        assetId: assetData.id,
        assetTag: assetData.tagNumber,
        assetName: assetData.name,
        fromSector: 'Novo Cadastro',
        toSector: assetData.sectorName || 'Não Informado',
        fromUser: '-',
        toUser: assetData.manager || 'Setor',
        reason: 'Tombamento e cadastro inicial no PATree.'
      });
    }

    localStorage.setItem(PATREE_STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    return assetData;
  }

  deleteAsset(assetId) {
    let assets = this.getAssets();
    assets = assets.filter(a => a.id !== assetId);
    localStorage.setItem(PATREE_STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  }

  // --- Movements & Audit ---
  getMovements(assetId = null) {
    try {
      const movs = JSON.parse(localStorage.getItem(PATREE_STORAGE_KEYS.MOVEMENTS)) || [];
      if (assetId) {
        return movs.filter(m => m.assetId === assetId);
      }
      return movs.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch(e) {
      return [];
    }
  }

  recordMovement(movementData) {
    const movements = this.getMovements();
    const currentUser = this.getCurrentUser();
    const newMovement = {
      id: 'mov_' + Date.now(),
      date: new Date().toISOString(),
      performedBy: currentUser ? currentUser.name : 'Sistema',
      ...movementData
    };
    movements.unshift(newMovement);
    localStorage.setItem(PATREE_STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    return newMovement;
  }

  // --- Depreciation Calculator (Linear Brazilian Accounting Standard) ---
  calculateDepreciation(asset) {
    const purchaseValue = parseFloat(asset.purchaseValue) || 0;
    const usefulLifeYears = parseInt(asset.usefulLifeYears, 10) || 5;
    if (!asset.purchaseDate || purchaseValue <= 0) {
      return {
        purchaseValue,
        currentValue: purchaseValue,
        accumulatedDepreciation: 0,
        depreciationPercentage: 0,
        residualPercentage: 100,
        monthsUsed: 0
      };
    }

    const purchase = new Date(asset.purchaseDate);
    const today = new Date();
    const monthsUsed = Math.max(0, (today.getFullYear() - purchase.getFullYear()) * 12 + (today.getMonth() - purchase.getMonth()));
    const totalMonths = usefulLifeYears * 12;

    const monthlyDepreciation = purchaseValue / totalMonths;
    const accumulatedDepreciation = Math.min(purchaseValue, monthsUsed * monthlyDepreciation);
    const currentValue = Math.max(0, purchaseValue - accumulatedDepreciation);
    const depreciationPercentage = Math.min(100, (accumulatedDepreciation / purchaseValue) * 100);
    const residualPercentage = 100 - depreciationPercentage;

    return {
      purchaseValue,
      currentValue,
      accumulatedDepreciation,
      depreciationPercentage: Math.round(depreciationPercentage * 10) / 10,
      residualPercentage: Math.round(residualPercentage * 10) / 10,
      monthsUsed,
      totalMonths
    };
  }

  // --- Aggregate Statistics for Dashboard ---
  getStats() {
    const assets = this.getAssets();
    const sectors = this.getSectors();

    let totalOriginalValue = 0;
    let totalCurrentValue = 0;
    let inMaintenanceCount = 0;
    let inUseCount = 0;
    let inStockCount = 0;
    let retiredCount = 0;

    const sectorStatsMap = {};
    sectors.forEach(s => {
      sectorStatsMap[s.id] = {
        id: s.id,
        name: s.name,
        color: s.color,
        count: 0,
        totalValue: 0
      };
    });

    assets.forEach(asset => {
      const val = parseFloat(asset.purchaseValue) || 0;
      totalOriginalValue += val;

      const dep = this.calculateDepreciation(asset);
      totalCurrentValue += dep.currentValue;

      if (asset.status === 'Em Manutenção') inMaintenanceCount++;
      else if (asset.status === 'Em Uso') inUseCount++;
      else if (asset.status === 'Em Estoque') inStockCount++;
      else if (asset.status === 'Baixado') retiredCount++;

      if (asset.sectorId && sectorStatsMap[asset.sectorId]) {
        sectorStatsMap[asset.sectorId].count++;
        sectorStatsMap[asset.sectorId].totalValue += val;
      }
    });

    return {
      totalAssets: assets.length,
      totalOriginalValue,
      totalCurrentValue,
      totalAccumulatedDepreciation: totalOriginalValue - totalCurrentValue,
      inMaintenanceCount,
      inUseCount,
      inStockCount,
      retiredCount,
      sectorsBreakdown: Object.values(sectorStatsMap),
      categories: ASSET_CATEGORIES
    };
  }

  // Reset to initial Seed Data
  resetDatabase() {
    localStorage.removeItem(PATREE_STORAGE_KEYS.USERS);
    localStorage.removeItem(PATREE_STORAGE_KEYS.SECTORS);
    localStorage.removeItem(PATREE_STORAGE_KEYS.ASSETS);
    localStorage.removeItem(PATREE_STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(PATREE_STORAGE_KEYS.CURRENT_USER);
    this.initDatabase();
  }
}

// Global DB instance
window.db = new PATreeDatabase();
window.ASSET_CATEGORIES = ASSET_CATEGORIES;
