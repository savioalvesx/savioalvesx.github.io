/**
 * PATree - Export & Print Engine (CSV, Printable Labels, Reports)
 * Clean Enterprise Standard
 */

const PATreeExporter = {
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
    link.setAttribute('download', `PATree_Inventario_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  printAssetTag(asset) {
    if (!asset) return;

    const tempCanvas = document.createElement('canvas');
    window.PATreeQR.drawToCanvas(tempCanvas, asset.tagNumber, { size: 160, padding: 2 });
    const qrDataUrl = tempCanvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta de Patrimônio - ${asset.tagNumber}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f8fafc;
          }
          .patree-label {
            width: 280px;
            height: 130px;
            background: #fff;
            border: 1.5px solid #000;
            border-radius: 4px;
            padding: 8px 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .label-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
          }
          .label-brand {
            font-weight: 700;
            font-size: 12px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .label-type {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            color: #475569;
          }
          .label-body {
            display: flex;
            gap: 8px;
            align-items: center;
            margin: 4px 0;
          }
          .label-qr {
            width: 68px;
            height: 68px;
            flex-shrink: 0;
          }
          .label-details {
            flex: 1;
            font-size: 10px;
            overflow: hidden;
          }
          .label-tag-number {
            font-size: 14px;
            font-weight: 700;
            font-family: monospace;
          }
          .label-title {
            font-weight: 600;
            margin: 2px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 170px;
          }
          .label-sector {
            font-size: 9px;
            color: #334155;
          }
          .label-footer {
            border-top: 1px dashed #94a3b8;
            padding-top: 2px;
            font-size: 8px;
            text-align: center;
            color: #64748b;
          }
          @media print {
            body { background: #fff; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="patree-label">
          <div class="label-header">
            <div class="label-brand">PATree</div>
            <div class="label-type">Controle Patrimonial</div>
          </div>
          <div class="label-body">
            <img class="label-qr" src="${qrDataUrl}" alt="QR Code" />
            <div class="label-details">
              <div class="label-tag-number">${asset.tagNumber}</div>
              <div class="label-title">${asset.name}</div>
              <div class="label-sector">Setor: ${asset.sectorName || 'Geral'}</div>
              <div class="label-sector">S/N: ${asset.serialNumber || 'N/A'}</div>
            </div>
          </div>
          <div class="label-footer">
            Patrimônio Empresarial - Não remover
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  },

  printInventoryReport() {
    const assets = window.db.getAssets();
    const stats = window.db.getStats();
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PATree - Relatório de Inventário</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 18px; margin-bottom: 2px; font-weight: 700; }
          .header-sub { color: #64748b; margin-bottom: 18px; font-size: 12px; }
          .kpi-row { display: flex; gap: 12px; margin-bottom: 20px; }
          .kpi-box { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 4px; background: #fafafa; }
          .kpi-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .kpi-val { font-size: 16px; font-weight: 700; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #f8fafc; padding: 6px 8px; text-align: left; border-bottom: 1px solid #cbd5e1; font-weight: 600; color: #475569; }
          td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
          .tag-code { font-family: monospace; font-weight: 600; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>PATree - Relatório de Patrimônio e Inventário</h1>
        <div class="header-sub">Emitido em: ${new Date().toLocaleString('pt-BR')} • Total de Ativos: ${stats.totalAssets}</div>
        
        <div class="kpi-row">
          <div class="kpi-box">
            <div class="kpi-title">Valor Histórico de Aquisição</div>
            <div class="kpi-val">${formatCurrency(stats.totalOriginalValue)}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Valor Contábil Atual</div>
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
                  <td><b>${a.name}</b><br><span style="color:#64748b; font-size:10px;">${a.brand || ''} ${a.model || ''}</span></td>
                  <td>${a.sectorName || '-'}</td>
                  <td>${a.manager || '-'}</td>
                  <td>${a.condition}</td>
                  <td>${a.status}</td>
                  <td>${formatCurrency(a.purchaseValue)}</td>
                  <td>${formatCurrency(dep.currentValue)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
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
