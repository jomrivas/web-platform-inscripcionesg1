// app/api/export/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función para convertir array a CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

function generateExcelCSV(data: any[], sheetName: string): string {
  return convertToCSV(data);
}

function generatePDFHTML(data: any[], title: string): string {
  const rows = data
    .map(
      (row, idx) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row.nombre_completo || row.nombre || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row.dui || row.dui_numero || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row.email || row.madre_email || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row.inscription_year}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row.type === 'adulto' ? 'Adulto' : 'Beneficiario'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row.status}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          .info { background: #f0f7ff; padding: 10px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #004b87; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="info">
          <p><strong>Generado:</strong> ${new Date().toLocaleString('es-SV')}</p>
          <p><strong>Total registros:</strong> ${data.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>DUI</th>
              <th>Email</th>
              <th>Año</th>
              <th>Tipo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          <p>Grupo Scout No. 1 "Los Intrépidos"</p>
        </div>
      </body>
    </html>
  `;
}

function generateSQLBackup(data: any[], tableName: string): string {
  const lines = [
    `-- Backup de ${tableName}`,
    `-- Generado: ${new Date().toISOString()}`,
    `-- Total registros: ${data.length}`,
    '',
  ];

  data.forEach((row) => {
    const columns = Object.keys(row);
    const values = columns
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string')
          return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'object') return `'${JSON.stringify(val)}'`;
        return String(val);
      })
      .join(', ');

    lines.push(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`
    );
  });

  lines.push('');
  lines.push('-- Fin del backup');

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const params = request.nextUrl.searchParams;
    const format = params.get('format') || 'csv';
    const type = params.get('type');
    const year = params.get('year') || new Date().getFullYear().toString();
    const status = params.get('status');

    let query = supabase.from('inscriptions_summary').select('*');

    if (year && year !== 'all') {
      query = query.eq('inscription_year', parseInt(year));
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener datos: ' + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No hay registros para exportar' },
        { status: 404 }
      );
    }

    let content: string;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'excel':
        content = generateExcelCSV(data, 'Inscripciones');
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `gs1-inscripciones-${year}-${timestamp}.csv`;
        break;

      case 'pdf':
        content = generatePDFHTML(
          data,
          `Inscripciones Grupo Scout No. 1 - Año ${year}`
        );
        contentType = 'text/html';
        filename = `gs1-inscripciones-${year}-${timestamp}.html`;
        break;

      case 'sql':
        content = generateSQLBackup(data, 'inscriptions_summary');
        contentType = 'text/plain';
        filename = `gs1-backup-${year}-${timestamp}.sql`;
        break;

      case 'csv':
      default:
        content = convertToCSV(data);
        contentType = 'text/csv';
        filename = `gs1-inscripciones-${year}-${timestamp}.csv`;
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error en GET /api/export:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
