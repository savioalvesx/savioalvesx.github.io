/**
 * PATree - Export & Print Engine (CSV, Printable QR Labels, Inventory Reports)
 */

const PATreeExporter = {
  /**
   * Export all or filtered assets to CSV with UTF-8 BOM
   */
  exportToCSV(assets = null) {
    const data = assets || window.db.getAssets();
    if (!data || data.length === 0) {
      alert('Nenhum ativo disponível para exportação.');
      return;
    }

    const headers = [
      'Tombamento',
      'Nome do Ativo',
      'Setor',
      'Categoria',
      'Responsavel',
      'Estado',
      'Status',
      'Valor Aquisicao (R$)',
      'Data Aquisicao',
      'Valor Atual Depreciado (R$)',
      'Depreciacao (%)',
      'Marca',
      'Modelo',
      'Numero de Serie',
      'Nota Fiscal'
    ];

    const rows = data.map(asset => {
      const dep = window.db.calculateDepreciation(asset);
      const cat = (window.ASSET_CATEGORIES.find(c => c.id === asset.category) || {}).name || asset.category;
      return [
        `"${asset.tagNumber || ''}"`,
        `"${(asset.name || '').replace(/"/g, '""')}"`,
        `"${(asset.sectorName || '').replace(/"/g, '""')}"`,
        `"${cat}"`,
        `"${(asset.manager || '').replace(/"/g, '""')}"`,
        `"${asset.condition || ''}"`,
        `"${asset.status || ''}"`,
        (parseFloat(asset.purchaseValue) || 0).toFixed(2).replace('.', ','),
        `"${asset.purchaseDate || ''}"`,
        dep.currentValue.toFixed(2).replace('.', ','),
        dep.depreciationPercentage.toFixed(1).replace('.', ',') + '%',
        `"${(asset.brand || '').replace(/"/g, '""')}"`,
        `"${(asset.model || '').replace(/"/g, '""')}"`,
        `"${(asset.serialNumber || '').replace(/"/g, '""')}"`,
        `"${(asset.invoiceNumber || '').replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PATree_Relatorio_Patrimonio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Open Print Window for Asset Tag Labels
   */
  printAssetTag(asset) {
    if (!asset) return;

    const tempCanvas = document.createElement('canvas');
    window.PATreeQR.drawToCanvas(tempCanvas, asset.tagNumber, { size: 160, padding: 4 });
    const qrDataUrl = tempCanvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta de Patrimônio - ${asset.tagNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f8fafc;
          }
          .tag-sheet {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
          }
          .patree-label {
            width: 290px;
            height: 140px;
            background: #fff;
            border: 2px solid #000;
            border-radius: 6px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .label-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #000;
            padding-bottom: 4px;
          }
          .label-brand {
            font-weight: 900;
            font-size: 14px;
            letter-spacing: 0.5px;
          }
          .label-type {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .label-body {
            display: flex;
            gap: 10px;
            align-items: center;
            margin: 6px 0;
          }
          .label-qr {
            width: 75px;
            height: 75px;
            flex-shrink: 0;
          }
          .label-details {
            flex: 1;
            font-size: 11px;
            overflow: hidden;
          }
          .label-tag-number {
            font-size: 16px;
            font-weight: 900;
            font-family: monospace;
            letter-spacing: 1px;
          }
          .label-title {
            font-weight: 700;
            margin: 2px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 170px;
          }
          .label-sector {
            font-size: 10px;
            color: #333;
          }
          .label-footer {
            border-top: 1px dashed #666;
            padding-top: 3px;
            font-size: 8px;
            text-align: center;
            color: #555;
          }
          @media print {
            body { background: #fff; margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="tag-sheet">
          <div class="patree-label">
            <div class="label-header">
              <div class="label-brand">🌿 PATree</div>
              <div class="label-type">Controle Patrimonial</div>
            </div>
            <div class="label-body">
              <img class="label-qr" src="${qrDataUrl}" alt="QR Code" />
              <div class="label-details">
                <div class="label-tag-number">${asset.tagNumber}</div>
                <div class="label-title">${asset.name}</div>
                <div class="label-sector">Setor: <b>${asset.sectorName || 'Geral'}</b></div>
                <div class="label-sector">S/N: ${asset.serialNumber || 'N/A'}</div>
              </div>
            </div>
            <div class="label-footer">
              PATree Asset Management • Não remover ou violar esta etiqueta
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  },

  /**
   * Print Complete Inventory Summary Report
   */
  printInventoryReport() {
    const assets = window.db.getAssets();
    const stats = window.db.getStats();

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PATree - Relatório Geral de Inventário</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #111; }
          h1 { color: #064e3b; margin-bottom: 4px; }
          .header-sub { color: #555; margin-bottom: 20px; font-size: 13px; }
          .kpi-row { display: flex; gap: 15px; margin-bottom: 25px; }
          .kpi-box { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 6px; background: #fdfdfd; }
          .kpi-title { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; }
          .kpi-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #f8fafc; }
          .tag-code { font-family: monospace; font-weight: bold; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>🌿 PATree - Relatório de Inventário & Patrimônio</h1>
        <div class="header-sub">Emitido em: ${new Date().toLocaleString('pt-BR')} • Total de Ativos: ${stats.totalAssets}</div>
        
        <div class="kpi-row">
          <div class="kpi-box">
            <div class="kpi-title">Valor Histórico de Aquisição</div>
            <div class="kpi-val">${formatCurrency(stats.totalOriginalValue)}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Valor Contábil Atual (Líquido)</div>
            <div class="kpi-val">${formatCurrency(stats.totalCurrentValue)}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Depreciação Acumulada</div>
            <div class="kpi-val">${formatCurrency(stats.totalAccumulatedDepreciation)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tombamento</th>
              <th>Descrição do Ativo</th>
              <th>Setor</th>
              <th>Responsável</th>
              <th>Estado</th>
              <th>Status</th>
              <th>Valor Original</th>
              <th>Valor Atual</th>
            </tr>
          </thead>
          <tbody>
            ${assets.map(a => {
              const dep = window.db.calculateDepreciation(a);
              return `
                <tr>
                  <td class="tag-code">${a.tagNumber}</td>
                  <td><b>${a.name}</b><br><small style="color:#666">${a.brand || ''} ${a.model || ''}</small></td>
                  <td>${a.sectorName || '-'}</td>
                  <td>${a.manager || '-'}</td>
                  <td>${a.condition}</td>
                  <td>${a.status}</td>
                  <td>${formatCurrency(a.purchaseValue)}</td>
                  <td><b>${formatCurrency(dep.currentValue)}</b></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
};

window.PATreeExporter = PATreeExporter;
